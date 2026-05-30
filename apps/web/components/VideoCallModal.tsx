'use client';

import { Mic, MicOff, Video, VideoOff, PhoneOff, Gift, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import GiftModal from './GiftModal';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ChatWindow from './ChatWindow';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// Dynamic Import for SimplePeer to avoid Next.js SSR issues
let SimplePeer: any;
if (typeof window !== 'undefined') {
    SimplePeer = require('simple-peer');
    // Polyfills
    if (!(window as any).global) (window as any).global = window;
    if (!(window as any).process) (window as any).process = { env: { DEBUG: undefined }, version: '' };
    if (!(window as any).Buffer) (window as any).Buffer = require('buffer').Buffer;
}

/**
 * Premium Web Audio API Ringtone Synthesizer
 * Generates an elegant, high-fidelity digital chime chord progression (Rhodes / bell style)
 * that repeats every 2.8 seconds and is fully compliant with browser autoplay policies.
 */
class RingtonePlayer {
    private audioCtx: AudioContext | null = null;
    private intervalId: any = null;
    private activeOscillators: { osc: OscillatorNode, gain: GainNode }[] = [];

    start() {
        if (this.audioCtx) return;
        
        try {
            const AudioCtxClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.audioCtx = new AudioCtxClass();
        } catch (e) {
            console.error("Failed to create AudioContext", e);
            return;
        }

        const playChimeSequence = () => {
            if (!this.audioCtx || this.audioCtx.state === 'suspended') return;

            const now = this.audioCtx.currentTime;
            
            // Warm A-major 9th backing pad note (soft humming chord)
            this.playTone(220, 0.05, 2.5, 0.06, 'triangle', now); // A3
            this.playTone(329.63, 0.05, 2.5, 0.04, 'triangle', now); // E4

            // Elegant, clean high celesta chime notes in a beautiful arpeggio
            // E5 (659.25Hz)
            this.playTone(659.25, 0.08, 1.8, 0.12, 'sine', now);
            // A5 (880Hz)
            this.playTone(880, 0.08, 1.8, 0.12, 'sine', now + 0.15);
            // C#6 (1109.73Hz)
            this.playTone(1109.73, 0.08, 2.0, 0.15, 'sine', now + 0.30);
            // E6 (1318.51Hz)
            this.playTone(1318.51, 0.08, 2.2, 0.10, 'sine', now + 0.45);
        };

        // Resume AudioContext on user gesture if suspended
        if (this.audioCtx.state === 'suspended') {
            const resumeHandler = () => {
                this.audioCtx?.resume().then(() => {
                    playChimeSequence();
                    window.removeEventListener('click', resumeHandler);
                    window.removeEventListener('touchstart', resumeHandler);
                });
            };
            window.addEventListener('click', resumeHandler);
            window.addEventListener('touchstart', resumeHandler);
        }

        // Play first sequence immediately
        playChimeSequence();

        // Loop sequence every 2.8 seconds
        this.intervalId = setInterval(playChimeSequence, 2800);
    }

    private playTone(freq: number, attack: number, decay: number, volume: number, type: OscillatorType = 'sine', startTime?: number) {
        if (!this.audioCtx) return;
        
        const now = startTime !== undefined ? startTime : this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        // Low-pass filter to give a warm, rich tone (removing sharp metallic highs)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        // Envelope: soft rise followed by elegant decay
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + attack + decay + 0.1);

        const trackItem = { osc, gain: gainNode };
        this.activeOscillators.push(trackItem);

        setTimeout(() => {
            this.activeOscillators = this.activeOscillators.filter(item => item !== trackItem);
        }, (attack + decay + 0.5) * 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Fast fade-out of active notes to prevent clicks/pops on stop
        const now = this.audioCtx?.currentTime || 0;
        this.activeOscillators.forEach(({ osc, gain }) => {
            try {
                gain.gain.cancelScheduledValues(now);
                gain.gain.linearRampToValueAtTime(0, now + 0.25);
                setTimeout(() => osc.disconnect(), 300);
            } catch (e) {
                // Ignore silent errors on Audio Context shutdown
            }
        });
        this.activeOscillators = [];

        if (this.audioCtx) {
            this.audioCtx.close().catch(console.error);
            this.audioCtx = null;
        }
    }
}

interface VideoCallModalProps {
    connectionId?: string; // Optional if global call
    partner?: {
        id: string;
        name: string;
        photoUrl: string;
        role?: string;
        location?: string;
    };
    onEndCall: () => void;
    incomingCall?: { signal: any, from: string, name: string, type?: 'audio' | 'video' | 'speed_date' };
    mode?: 'audio' | 'video' | 'speed_date';
    isInitiator?: boolean;
}

export default function VideoCallModal({ connectionId, partner: initialPartner, onEndCall, incomingCall, mode = 'video', isInitiator = false }: VideoCallModalProps) {
    const { socket } = useSocket();
    const toast = useToast();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [callAnswered, setCallAnswered] = useState(false); // Valid answer action
    const [status, setStatus] = useState("Initializing...");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMaximized, setIsMaximized] = useState(true);

    // UI Enhancements
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [localPos, setLocalPos] = useState({ x: 16, y: 96 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const [isLocalMinimized, setIsLocalMinimized] = useState(false);
    const ringtonePlayerRef = useRef<RingtonePlayer | null>(null);

    useEffect(() => {
        console.log("VideoCallModal Mounted. Incoming:", !!incomingCall, "Mode:", mode);
    }, []);

    // Determine Call Type and Partner
    const isSpeedDate = mode === 'speed_date';
    const isSpeedDateInitiator = isSpeedDate && !!(initialPartner as any)?._speedDateInitiator;
    const isVideo = (mode === 'video' || incomingCall?.type === 'video') && !isSpeedDate;
    const partner = initialPartner || {
        id: incomingCall?.from || 'unknown',
        name: incomingCall?.name || 'Unknown User',
        photoUrl: 'https://ui-avatars.com/api/?name=' + (incomingCall?.name || 'U'),
    };

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<any>(null); // Type any for SimplePeer instance

    // Call duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (callAccepted && !callEnded) {
            interval = setInterval(() => {
                setCallDuration(prev => {
                    const next = prev + 1;
                    if (isSpeedDate && next >= 180) {
                        leaveCall(true); // Hard cut-off at 3 minutes for speed dating
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callAccepted, callEnded, isSpeedDate]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Initialize premium ringtone player context
    useEffect(() => {
        ringtonePlayerRef.current = new RingtonePlayer();
        return () => {
            ringtonePlayerRef.current?.stop();
        };
    }, []);

    // Control ringtone playback based on call states
    useEffect(() => {
        const player = ringtonePlayerRef.current;
        if (!player) return;

        const shouldRing = !isSpeedDate && !callEnded && !callAccepted && (
            (incomingCall && !callAnswered) || 
            status.includes("Calling") ||
            status.includes("Dialing")
        );

        if (shouldRing) {
            player.start();
        } else {
            player.stop();
        }
    }, [incomingCall, callAnswered, callAccepted, callEnded, status, isSpeedDate]);

    // Initialize Local Stream
    useEffect(() => {
        if (!SimplePeer) return;

        navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current && isVideo) {
                    myVideo.current.srcObject = currentStream;
                }

                const shouldCall = isSpeedDate ? isSpeedDateInitiator : !incomingCall;
                if (shouldCall) {
                    callUser(currentStream);
                }
            })
            .catch(err => {
                console.error("Failed to get media", err);
                setStatus("Microphone/Camera Error: " + err.message);
                toast.error("Camera/Mic access required");
            });
    }, [isVideo]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on("callAccepted", (signal: any) => {
            setCallAccepted(true);
            setStatus(isVideo ? "Connected" : (isSpeedDate ? "Speed Date Connected" : "Audio Connected"));
            try {
                connectionRef.current?.signal(signal);
            } catch (err) {
                console.error("Failed to signal peer in callAccepted:", err);
            }
        });
        
        socket.on("callEnded", () => {
            console.log("Peer ended call");
            leaveCall(false); // Don't emit endCall back
        });
        
        socket.on("callError", (data: any) => { 
            toast.error(data.message); 
            leaveCall(); 
        });

        // Receiver answered — stop the dial/ringing looping sound instantly
        socket.on("callAnsweredByPeer", () => {
            if ((window as any)._ringInterval) {
                clearInterval((window as any)._ringInterval);
                (window as any)._ringInterval = null;
            }
            setStatus("Connecting...");
        });

        return () => {
            socket?.off("callError");
            socket?.off("callAccepted");
            socket?.off("callEnded");
            socket?.off("callAnsweredByPeer");
        }
    }, [socket, isVideo, isSpeedDate]);

    // Attach Remote Stream when ref or stream changes — also force unmute/volume
    useEffect(() => {
        if (userVideo.current && remoteStream) {
            userVideo.current.srcObject = remoteStream;
            userVideo.current.muted = false;
            userVideo.current.volume = 1.0;
            userVideo.current.play().catch(e => console.warn('Remote video autoplay blocked:', e));
        }
    }, [remoteStream, isMaximized, callAccepted]);

    // Attach Local Stream when ref renders (solves React empty box race-condition)
    useEffect(() => {
        if (myVideo.current && stream) {
            myVideo.current.srcObject = stream;
        }
    }, [stream, isMaximized, callAccepted, callAnswered]);

    const { user } = useAuth(); // Access auth context

    const callUser = (currentStream: MediaStream) => {
        setStatus(`Calling ${partner.name}...`);
        const peer = new SimplePeer({ initiator: true, trickle: false, stream: currentStream });

        peer.on("signal", (data: any) => {
            if (socket) {
                const myId = user?.id || localStorage.getItem('userId');
                const myName = user?.name || localStorage.getItem('userName') || "Unknown User";

                const callPayload = {
                    userToCall: partner.id,
                    signalData: data,
                    from: myId,
                    name: myName,
                    type: mode
                };

                // Emit immediately
                socket.emit("callUser", callPayload);

                // Re-emit every 3 seconds for offline users opening via Push notification
                const ringInterval = setInterval(() => {
                    if ((window as any)._callEnded || connectionRef.current?.connected || isSpeedDate) {
                        clearInterval(ringInterval);
                    } else {
                        socket.emit("callUser", callPayload);
                    }
                }, 3000);
                (window as any)._ringInterval = ringInterval;
            }
        });

        peer.on("stream", (currentRemoteStream: MediaStream) => {
            setRemoteStream(currentRemoteStream); // Save to state
        });

        peer.on("connect", () => {
            setStatus(isVideo ? "Connected" : (isSpeedDate ? "Speed Date Connected" : "Audio Connected"));
        });

        peer.on("error", (err: any) => {
            console.error("Peer Error:", err);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAnswered(true);
        setStatus("Connecting...");

        if (socket) {
            socket.emit("answerCall_stop_ringing", { to: incomingCall?.from });
        }

        // Stream race condition fix
        if (!stream) {
            console.warn("[answerCall] Stream not ready yet, waiting...");
            let retries = 0;
            const waitForStream = setInterval(() => {
                retries++;
                if (stream) {
                    clearInterval(waitForStream);
                    doAnswerCall(stream);
                } else if (retries > 20) { // 4 second timeout
                    clearInterval(waitForStream);
                    console.error("[answerCall] Stream never became available after 4s");
                    toast.error("Microphone not ready. Please try calling again.");
                }
            }, 200);
            return;
        }
        doAnswerCall(stream);
    };

    const doAnswerCall = (localStream: MediaStream) => {
        const peer = new SimplePeer({ initiator: false, trickle: false, stream: localStream });

        peer.on("signal", (data: any) => {
            if (socket && (incomingCall || isSpeedDate)) {
                socket.emit("answerCall", { signal: data, to: incomingCall ? incomingCall.from : partner.id });
            }
        });

        peer.on("stream", (currentRemoteStream: MediaStream) => {
            setRemoteStream(currentRemoteStream); // Save to state
        });

        peer.on("connect", () => {
            setCallAccepted(true);
            setStatus(isVideo ? "Connected" : (isSpeedDate ? "Speed Date Connected" : "Audio Connected"));
        });

        peer.on("error", (err: any) => {
            console.error("Peer Error:", err);
        });

        if (incomingCall) {
            try {
                peer.signal(incomingCall.signal);
            } catch (err) {
                console.error("Failed to signal peer inside doAnswerCall:", err);
            }
        }
        connectionRef.current = peer;
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream && isVideo) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const switchCamera = async () => {
        if (!stream || !isVideo) return;
        try {
            const nextMode = facingMode === 'user' ? 'environment' : 'user';
            const currentTrack = stream.getVideoTracks()[0];

            let newStream: MediaStream;
            try {
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: nextMode } 
                });
            } catch (err) {
                console.warn("Attempt 1 failed, stopping old track first (Hardware lock workaround)...");
                currentTrack.enabled = false;
                currentTrack.stop();
                
                try {
                    newStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: nextMode }
                    });
                } catch (fallbackErr) {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoInputs = devices.filter(device => device.kind === 'videoinput');
                    if (videoInputs.length < 2) throw new Error("Only 1 camera found or permission denied");

                    const currentDeviceId = currentTrack.getSettings().deviceId;
                    let currentIndex = videoInputs.findIndex(d => d.deviceId === currentDeviceId);
                    const nextIndex = (currentIndex + 1) % videoInputs.length;
                    const nextDevice = videoInputs[nextIndex];

                    newStream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: nextDevice.deviceId } }
                    });
                }
            }

            const newVideoTrack = newStream.getVideoTracks()[0];

            // Local DOM Update
            if (myVideo.current) {
                myVideo.current.srcObject = newStream;
            }

            // WebRTC Peer Update
            if (connectionRef.current) {
                connectionRef.current.replaceTrack(currentTrack, newVideoTrack, stream);
            }

            // State Update
            const newStreamObj = new MediaStream([...stream.getAudioTracks(), newVideoTrack]);
            setStream(newStreamObj);
            setFacingMode(nextMode);

            if (currentTrack.readyState === 'live') {
                currentTrack.stop();
            }

        } catch (err: any) {
            console.error("Failed to switch camera", err);
            toast.error("Failed to switch camera: " + (err as Error).message);
        }
    };

    // Auto-answer Speed Dates
    useEffect(() => {
        if (incomingCall && isSpeedDate && stream && !callAnswered) {
             console.log("Auto-answering speed date...");
             answerCall();
        }
    }, [incomingCall, isSpeedDate, stream, callAnswered]);

    const leaveCall = (emitEvent = true) => {
        console.log("[VideoCallModal] leaveCall initiated, emitEvent:", emitEvent);
        setCallEnded(true);
        (window as any)._callEnded = true;

        if ((window as any)._ringInterval) {
            try {
                clearInterval((window as any)._ringInterval);
                (window as any)._ringInterval = null;
            } catch (e) {
                console.error("Failed to clear ring interval:", e);
            }
        }
        
        // Ensure Ringtone is aggressively stopped
        try {
            ringtonePlayerRef.current?.stop();
        } catch (e) {
            console.error("Failed to stop ringtone player:", e);
        }

        try {
            // Aggressively stop all tracks in state
            stream?.getTracks().forEach(track => {
                try { track.stop(); } catch (err) { console.error("Error stopping state track:", err); }
            });
            remoteStream?.getTracks().forEach(track => {
                try { track.stop(); } catch (err) { console.error("Error stopping remote state track:", err); }
            });

            // Aggressively stop all tracks bound to the actual video DOM elements
            if (myVideo.current && myVideo.current.srcObject) {
                const domStream = myVideo.current.srcObject as MediaStream;
                domStream.getTracks().forEach(track => {
                    try { track.stop(); } catch (err) { console.error("Error stopping local DOM track:", err); }
                });
                myVideo.current.srcObject = null;
            }
            if (userVideo.current && userVideo.current.srcObject) {
                const domStream = userVideo.current.srcObject as MediaStream;
                domStream.getTracks().forEach(track => {
                    try { track.stop(); } catch (err) { console.error("Error stopping remote DOM track:", err); }
                });
                userVideo.current.srcObject = null;
            }
        } catch (e) {
            console.error("Cleanup error in track stopping:", e);
        }

        // Safely destroy connection Ref
        try {
            if (connectionRef.current) {
                connectionRef.current.destroy();
            }
        } catch (e) {
            console.error("Error destroying connectionRef:", e);
        }
        connectionRef.current = null;

        // Safely emit socket signals and post call log
        try {
            if (emitEvent && socket) {
                const targetId = incomingCall ? incomingCall.from : partner.id;
                if (targetId && targetId !== 'unknown') {
                    console.log("[VideoCallModal] Emitting endCall to:", targetId);
                    socket.emit("endCall", { to: targetId });
                    
                    // Log the call to database history
                    const durationSecs = callDuration || 0;
                    const finalStatus = callAccepted ? 'COMPLETED' : 'MISSED';
                    
                    api.calls?.log({
                        receiverId: targetId,
                        type: isVideo ? 'VIDEO' : 'AUDIO',
                        status: finalStatus,
                        duration: durationSecs
                    }).catch(err => console.error("Failed to log call:", err));
                }
            }
        } catch (e) {
            console.error("Error in leaveCall socket / logging logic:", e);
        }

        // CRITICAL UNCONDITIONAL EXIT GATE:
        // We guarantee that this callback is triggered no matter what exceptions were thrown.
        // This resets React states and closes the modal cleanly.
        try {
            console.log("[VideoCallModal] Invoking onEndCall callback");
            onEndCall();
        } catch (e) {
            console.error("Critical error inside onEndCall callback:", e);
        }
    };

    const [showGiftModal, setShowGiftModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (callEnded || !mounted) return null;

    return createPortal(
        <div className={`fixed z-[150] bg-slate-950 flex overflow-hidden animate-in fade-in duration-300 shadow-2xl transition-all border border-white/5
            ${isMaximized ? 'inset-0' : 'bottom-4 right-4 w-80 h-[500px] rounded-3xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]'}
        `}>
            {/* Custom Animation Keyframes and CSS Classes */}
            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 0.3; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(16px); }
                    50% { transform: scale(1.15); opacity: 0.7; filter: blur(24px); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes audio-wave {
                    0%, 100% { transform: scaleY(0.35); }
                    50% { transform: scaleY(1); }
                }
                .animate-pulse-ring {
                    animation: pulse-ring 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                }
                .animate-pulse-glow {
                    animation: pulse-glow 4s ease-in-out infinite;
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                .animate-audio-wave {
                    animation: audio-wave 1s ease-in-out infinite;
                    transform-origin: bottom;
                }
            `}</style>

            {/* Left: Main Area */}
            <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
                
                {/* 1. IMMERSIVE BLURRED BACKDROP */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none">
                    {partner.photoUrl && (
                        <img 
                            src={partner.photoUrl} 
                            className="w-full h-full object-cover scale-125 blur-[70px] opacity-[0.32] transition-all duration-700" 
                            alt=""
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-indigo-950/20" />
                </div>

                {/* 2. FLOATING PREMIUM HEADER */}
                <div className="absolute top-0 left-0 right-0 z-30 p-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {!isMaximized && (
                            <img src={partner.photoUrl} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md object-cover" />
                        )}
                        <div className="text-white">
                            {isMaximized && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                                        <h3 className="font-extrabold text-lg tracking-tight text-white drop-shadow-md">
                                            {isSpeedDate ? "Mystery Date" : partner.name}
                                        </h3>
                                    </div>
                                    {partner.location && (
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-300 mt-1 font-bold tracking-wider uppercase opacity-90">
                                            <span>📍</span> {partner.location}
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-300/80 mt-1.5 font-mono tracking-wider font-semibold bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/5 w-fit">
                                <span className={callAccepted ? "text-emerald-400" : "text-amber-400"}>
                                    {callAccepted ? (isSpeedDate ? formatDuration(180 - callDuration) + " remaining" : formatDuration(callDuration)) : status}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Toggle Maximize */}
                    <button 
                        onClick={() => setIsMaximized(!isMaximized)} 
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 hover:scale-105 transition-all shadow-lg"
                    >
                        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>

                {/* 3. CENTRAL INTERACTIVE AREA */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center group z-10">
                    
                    {/* E2EE Security Badge */}
                    {callAccepted && !callEnded && (
                        <div className="absolute top-28 left-0 right-0 flex justify-center z-30 pointer-events-none">
                            <div className="bg-emerald-500/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.15)] animate-fade-in">
                                <span className="text-xs text-emerald-400">🛡️</span>
                                <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">End-to-End Secure Call</span>
                            </div>
                        </div>
                    )}
                    
                    {/* INCOMING CALL SCREEN */}
                    {incomingCall && !callAnswered && !isSpeedDate ? (
                        <div className="flex flex-col items-center justify-center space-y-8 z-30 p-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 max-w-sm w-full mx-4 shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-float">
                            <div className="relative flex items-center justify-center">
                                {/* Pulsing rings */}
                                <div className="absolute w-44 h-44 rounded-full border-2 border-indigo-500/20 animate-pulse-ring" />
                                <div className="absolute w-36 h-36 rounded-full border border-pink-500/30 animate-pulse-ring [animation-delay:1s]" />
                                <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500/15 to-pink-500/15 blur-md animate-pulse-glow" />
                                
                                <img 
                                    src={partner.photoUrl} 
                                    className="relative w-28 h-28 rounded-full border-4 border-white/20 shadow-2xl object-cover z-10" 
                                    alt={partner.name} 
                                />
                            </div>
                            
                            <div className="text-center">
                                <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                    Incoming Call
                                </span>
                                <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight drop-shadow-lg">
                                    {partner.name}
                                </h2>
                                {partner.location && (
                                    <p className="text-slate-300/80 text-xs font-semibold mt-1.5 flex justify-center items-center gap-1 tracking-wide uppercase">
                                        <span>📍</span> From {partner.location}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex gap-6 w-full justify-center pt-2">
                                {/* Decline Button */}
                                <button 
                                    onClick={() => leaveCall(true)} 
                                    className="p-4 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-2xl border border-rose-500/30 hover:border-transparent transition-all duration-300 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/30 hover:scale-110 flex items-center justify-center flex-1 max-w-[80px]"
                                >
                                    <PhoneOff size={24} />
                                </button>
                                {/* Accept Button */}
                                <button 
                                    onClick={answerCall} 
                                    className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-110 flex items-center justify-center flex-1 max-w-[80px] animate-bounce"
                                >
                                    <Video size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        // ACTIVE CALL OR DIALING CONNECTING UI
                        <>
                            {callAccepted && !callEnded ? (
                                isVideo ? (
                                    // Remote Video Stream
                                    <video ref={userVideo} playsInline autoPlay className="w-full h-full object-cover z-10" />
                                ) : (
                                    // Premium Audio Call Connected UI with Dynamic Visualizer Waves
                                    <div className="flex flex-col items-center justify-center space-y-8 z-30">
                                        <video
                                            ref={userVideo}
                                            playsInline
                                            autoPlay
                                            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                                        />
                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute w-48 h-48 rounded-full border-2 border-indigo-500/10 animate-pulse-ring" />
                                            <div className="absolute w-38 h-38 rounded-full border border-pink-500/20 animate-pulse-ring [animation-delay:1.2s]" />
                                            <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/15 blur-md animate-pulse-glow" />
                                            
                                            {isSpeedDate ? (
                                                <div className="relative w-28 h-28 rounded-full border-4 border-white/20 bg-slate-900 shadow-2xl flex items-center justify-center z-10 text-4xl">
                                                    🕵️
                                                </div>
                                            ) : (
                                                <img src={partner.photoUrl} className="relative w-28 h-28 rounded-full border-4 border-white/20 shadow-2xl object-cover z-10" alt={partner.name} />
                                            )}
                                        </div>

                                        {/* CSS Animated Audio Waveform */}
                                        <div className="flex items-center gap-1.5 h-10 px-6 justify-center">
                                            {[0.1, 0.4, 0.25, 0.6, 0.3, 0.5, 0.15, 0.45].map((delay, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-1 bg-gradient-to-t from-indigo-400 to-pink-400 rounded-full animate-audio-wave"
                                                    style={{ 
                                                        animationDelay: `${delay}s`,
                                                        height: '100%',
                                                        animationDuration: `${0.7 + delay}s`
                                                    }} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            ) : (
                                // CONNECTING OUTGOING UI (DIALING)
                                <div className="text-center text-white p-6 z-30 max-w-sm w-full mx-4 rounded-3xl bg-slate-900/30 backdrop-blur-md border border-white/5 shadow-2xl py-12 flex flex-col items-center space-y-6 animate-float">
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute w-36 h-36 rounded-full border-2 border-indigo-500/15 animate-pulse-ring" />
                                        <div className="absolute w-28 h-28 rounded-full border border-pink-500/20 animate-pulse-ring [animation-delay:1.2s]" />
                                        
                                        {isSpeedDate ? (
                                            <div className="relative w-24 h-24 rounded-full border-2 border-white/10 bg-slate-800 shadow-xl flex items-center justify-center z-10 text-3xl">
                                                🕵️
                                            </div>
                                        ) : (
                                            <img src={partner.photoUrl} className="relative w-24 h-24 rounded-full border-2 border-white/10 shadow-xl object-cover z-10" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold tracking-widest text-pink-400 uppercase bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 animate-pulse">
                                            Dialing Securely
                                        </span>
                                        <h2 className="text-xl font-bold tracking-tight text-white mt-4">
                                            {status}
                                        </h2>
                                    </div>
                                </div>
                            )}

                            {/* SELF CAMERA VIEW (Draggable Picture-in-Picture) */}
                            {isVideo && stream && (
                                <div
                                    className={`absolute z-20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 bg-slate-900/90 backdrop-blur-md group ${isDragging ? 'cursor-grabbing opacity-90 !transition-none' : 'cursor-grab transition-all duration-300'} ${isLocalMinimized ? 'rounded-full w-16 h-16 overflow-hidden border-indigo-500 shadow-indigo-500/20' : (isMaximized ? 'w-32 h-44 rounded-2xl overflow-hidden' : 'w-24 h-32 rounded-xl overflow-hidden')}`}
                                    style={{ left: localPos.x, top: localPos.y, touchAction: 'none' }}
                                    onPointerDown={(e) => {
                                        if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).closest('button')) return;
                                        setIsDragging(true);
                                        dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: localPos.x, initialY: localPos.y };
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                    }}
                                    onPointerMove={(e) => {
                                        if (!isDragging) return;
                                        const dx = e.clientX - dragRef.current.startX;
                                        const dy = e.clientY - dragRef.current.startY;
                                        setLocalPos({ x: Math.max(0, dragRef.current.initialX + dx), y: Math.max(0, dragRef.current.initialY + dy) });
                                    }}
                                    onPointerUp={(e) => {
                                        setIsDragging(false);
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                    }}
                                    onPointerCancel={() => setIsDragging(false)}
                                >
                                    {isLocalMinimized ? (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-950/80 cursor-pointer hover:bg-indigo-900 transition" onClick={(e) => { e.stopPropagation(); setIsLocalMinimized(false); }}>
                                            <span className="text-[10px] text-indigo-300 font-extrabold tracking-widest uppercase">YOU</span>
                                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/50 animate-pulse pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <video ref={myVideo} autoPlay muted playsInline className={`w-full h-full object-cover transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''} pointer-events-none ${isVideoOff ? 'hidden' : ''}`} />
                                            {isVideoOff && (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-950 pointer-events-none">
                                                    <VideoOff className="text-white/40" size={20} />
                                                </div>
                                            )}

                                            {/* Minimize Control */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsLocalMinimized(true); }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 border border-white/5 transition-opacity z-30 shadow-md"
                                            >
                                                <Minimize2 size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 4. SLEEK FLOATING CAPSULE CONTROLS */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-950/70 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all">
                    {/* Toggle Microphone */}
                    <button 
                        onClick={toggleMute} 
                        className={`p-3.5 rounded-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center shadow-lg ${isMuted ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'}`}
                        title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    {/* Camera Flip */}
                    {isVideo && (
                        <button 
                            onClick={switchCamera} 
                            className="p-3.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/15 hover:scale-110 transition-all"
                            title="Switch Camera"
                        >
                            <RefreshCw size={18} />
                        </button>
                    )}

                    {/* Toggle Video */}
                    {isVideo && (
                        <button 
                            onClick={toggleVideo} 
                            className={`p-3.5 rounded-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center shadow-lg ${isVideoOff ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'}`}
                            title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                        >
                            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                        </button>
                    )}

                    {/* Gift Modal Trigger */}
                    <button 
                        className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-110 hover:shadow-orange-500/40 transition-all animate-pulse" 
                        onClick={() => setShowGiftModal(true)}
                        title="Send a Gift"
                    >
                        <Gift size={18} />
                    </button>

                    {/* Crimson End Call Button */}
                    <button 
                        className="p-4 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-all duration-300 hover:scale-110 hover:bg-rose-700" 
                        onClick={() => leaveCall(true)}
                        title="End Call"
                    >
                        <PhoneOff size={22} />
                    </button>
                </div>
            </div>

            {/* Right Side Chat Panel (Desktop view only, styled in full premium dark style) */}
            {isMaximized && connectionId && (
                <div className="hidden lg:flex w-80 bg-slate-950 border-l border-white/10 flex-col h-full z-20">
                    <ChatWindow
                        connectionId={connectionId}
                        partner={partner}
                        className="flex-1 flex flex-col h-full bg-slate-950 text-white"
                        isCallMode={true}
                    />
                </div>
            )}

            {/* Gift Modal popup */}
            <GiftModal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} toUserId={partner.id} toUserName={partner.name} />
        </div>
        , document.body);
}
