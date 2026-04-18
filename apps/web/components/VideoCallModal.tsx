'use client';

import { Mic, MicOff, Video, VideoOff, PhoneOff, Gift, Maximize2, Minimize2, Volume2, RefreshCw } from 'lucide-react';
import GiftModal from './GiftModal';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ChatWindow from './ChatWindow';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// Dynamic Import for SimplePeer to avoid SSR issues
let SimplePeer: any;
if (typeof window !== 'undefined') {
    SimplePeer = require('simple-peer');
    // Polyfills
    if (!(window as any).global) (window as any).global = window;
    if (!(window as any).process) (window as any).process = { env: { DEBUG: undefined }, version: '' };
    if (!(window as any).Buffer) (window as any).Buffer = require('buffer').Buffer;
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
    const [localPos, setLocalPos] = useState({ x: 16, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const [isLocalMinimized, setIsLocalMinimized] = useState(false);

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

    // For speed dating: show "Mystery Date" instead of real name
    const displayName = isSpeedDate ? 'Mystery Date' : partner.name;

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
                        leaveCall(true); // Hard cut-off at 3 minutes
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

    // Initialize Local Stream
    useEffect(() => {
        if (!SimplePeer) return;

        navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current && isVideo) {
                    myVideo.current.srcObject = currentStream;
                }

                // Initiator logic:
                // - Normal calls: call if no incomingCall (we're the dialer)
                // - Speed date initiator: call immediately 
                // - Speed date receiver (_speedDateInitiator=false): do NOT call; wait for offer via socket
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
            connectionRef.current?.signal(signal);
        });
        socket.on("callEnded", () => {
            console.log("Peer ended call");
            leaveCall(false); // Don't emit endCall back
        });
        socket.on("callError", (data: any) => { toast.error(data.message); leaveCall(); });

        // Receiver answered — stop the ringing sound/loop immediately on caller's side
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

    // Attach Remote Stream when ref or stream changes
    useEffect(() => {
        if (userVideo.current && remoteStream) {
            userVideo.current.srcObject = remoteStream;
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

                // Re-emit every 3 seconds for offline users who are opening the app via Push Notification
                const ringInterval = setInterval(() => {
                    // Stop if we answered, ended, or component unmounted. Also stop looping for speed dates.
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

        if (!stream) {
            console.error("No local stream to answer with");
            return;
        }

        const peer = new SimplePeer({ initiator: false, trickle: false, stream: stream });

        peer.on("signal", (data: any) => {
            if (socket && (incomingCall || isSpeedDate)) {
                socket.emit("answerCall", { signal: data, to: incomingCall ? incomingCall.from : partner.id });
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

        if (incomingCall) {
            peer.signal(incomingCall.signal);
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
                // Attempt 1: Safe request with 'ideal' to prevent OverconstrainedError
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: nextMode } 
                });
            } catch (err) {
                console.warn("Attempt 1 failed, stopping old track first (Hardware lock workaround)...");
                // Attempt 2: Stop old track first (Some Androids require this hardware release)
                currentTrack.enabled = false;
                currentTrack.stop();
                
                try {
                    newStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: nextMode }
                    });
                } catch (fallbackErr) {
                    // Attempt 3: Manually cycle devices if all else fails
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

            // Cleanup old track if it wasn't already stopped
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
        setCallEnded(true);
        (window as any)._callEnded = true;
        if ((window as any)._ringInterval) clearInterval((window as any)._ringInterval);
        try {
            // Aggressively stop all tracks in state
            stream?.getTracks().forEach(track => track.stop());
            remoteStream?.getTracks().forEach(track => track.stop());

            // Aggressively stop all tracks currently bound to the actual video DOM elements
            if (myVideo.current && myVideo.current.srcObject) {
                const domStream = myVideo.current.srcObject as MediaStream;
                domStream.getTracks().forEach(track => track.stop());
                myVideo.current.srcObject = null;
            }
            if (userVideo.current && userVideo.current.srcObject) {
                const domStream = userVideo.current.srcObject as MediaStream;
                domStream.getTracks().forEach(track => track.stop());
                userVideo.current.srcObject = null;
            }
        } catch (e) {
            console.error("Cleanup error", e);
        }
        connectionRef.current?.destroy();

        if (emitEvent && socket && (callAccepted || incomingCall)) {
            // If we are in a call or rejecting an incoming one
            const targetId = incomingCall ? incomingCall.from : partner.id;
            socket.emit("endCall", { to: targetId });
            
            // Log the call to history
            const durationSecs = callDuration || 0;
            const finalStatus = callAccepted ? 'COMPLETED' : (durationSecs === 0 ? 'MISSED' : 'COMPLETED');
            
            api.calls?.log({
                receiverId: targetId,
                type: isVideo ? 'VIDEO' : 'AUDIO',
                status: finalStatus,
                duration: durationSecs
            }).catch(console.error);
        }

        onEndCall();
    };

    const [showGiftModal, setShowGiftModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (callEnded || !mounted) return null;

    return createPortal(
        <div className={`fixed z-[150] bg-gray-950 flex overflow-hidden animate-in fade-in duration-300 shadow-2xl transition-all
            ${isMaximized ? 'inset-0' : 'bottom-4 right-4 w-80 h-[500px] rounded-2xl border border-gray-800'}
        `}>
            {/* Left: Main Area */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-950 to-black flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {!isMaximized && (
                            <img src={partner.photoUrl} className="w-8 h-8 rounded-full border border-white/30" />
                        )}
                        <div className="text-white">
                            {isMaximized && (
                                <>
                                    <h3 className="font-bold">{isSpeedDate ? "Mystery Date" : partner.name}</h3>
                                    {partner.location && (
                                        <div className="flex items-center gap-1 text-xs text-indigo-400 mt-0.5 mb-1 font-semibold">
                                            <span>📍</span> {partner.location}
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="flex items-center gap-2 text-xs text-white/60">
                                <span className={callAccepted ? "text-green-400" : "text-amber-400"}>
                                    {callAccepted ? (isSpeedDate ? formatDuration(180 - callDuration) + " remaining" : formatDuration(callDuration)) : status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsMaximized(!isMaximized)} className="text-white/80 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm">
                        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>

                <div className="flex-1 relative overflow-hidden flex items-center justify-center group">
                    {/* Ringtone Audio */}
                    {((incomingCall && !callAnswered) || status.includes("Calling")) && !callEnded && !isSpeedDate && (
                        <audio src="/sounds/ringtone.wav" autoPlay loop className="hidden" />
                    )}
                    
                    {/* Incoming Call Screen (Hidden for Speed Dates as they auto-answer) */}
                    {incomingCall && !callAnswered && !isSpeedDate ? (
                        <div className="flex flex-col items-center justify-center space-y-8 z-50">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-pulse blur-xl"></div>
                                <img src={partner.photoUrl} className="relative w-32 h-32 rounded-full border-4 border-gray-800 object-cover z-10" alt={partner.name} />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-1">{partner.name}</h2>
                                {partner.location && (
                                    <p className="text-indigo-200 text-sm mb-2 flex justify-center items-center gap-1 font-medium">
                                        <span>📍</span> From {partner.location}
                                    </p>
                                )}
                                <p className="text-indigo-300">Incoming {incomingCall.type || 'Video'} Call...</p>
                            </div>
                            <div className="flex gap-6">
                                <button onClick={() => leaveCall(true)} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-lg hover:scale-105">
                                    <PhoneOff size={32} />
                                </button>
                                <button onClick={answerCall} className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow-lg hover:scale-105 animate-bounce">
                                    <Video size={32} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Active Call or Calling...
                        <>
                            {callAccepted && !callEnded && (
                                <div className="absolute top-16 left-0 right-0 flex justify-center z-30 pointer-events-none">
                                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
                                        <span className="text-[10px] text-green-400">🔒</span>
                                        <span className="text-[10px] font-medium text-white tracking-widest uppercase opacity-90 drop-shadow-sm">End-to-End Encrypted</span>
                                    </div>
                                </div>
                            )}

                            {/* Remote View */}
                            {callAccepted && !callEnded ? (
                                isVideo ? (
                                    <video ref={userVideo} playsInline autoPlay className="w-full h-full object-cover" />
                                ) : (
                                    // Audio Only UI
                                    <div className="flex flex-col items-center justify-center">
                                        <video ref={userVideo} playsInline autoPlay className="hidden" />
                                        <div className="relative mb-6 transform scale-75 md:scale-100">
                                            <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-pulse blur-xl"></div>
                                            {isSpeedDate ? (
                                                <div className="relative w-32 h-32 rounded-full border-4 border-gray-800 object-cover z-10 bg-gray-800 flex items-center justify-center">
                                                    <span className="text-4xl">🕵️</span>
                                                </div>
                                            ) : (
                                                <img src={partner.photoUrl} className="relative w-32 h-32 rounded-full border-4 border-gray-800 object-cover z-10" alt={partner.name} />
                                            )}
                                            <div className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-ping"></div>
                                        </div>
                                        {isSpeedDate && partner.location && (
                                            <div className="mt-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-indigo-200 text-sm font-medium border border-white/10 flex items-center gap-2 animate-fade-in-up">
                                                <span className="animate-bounce">📍</span> Connecting from {partner.location}
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                // Connecting UI (Calling...)
                                <div className="text-center text-white p-4">
                                     {isSpeedDate ? (
                                        <div className="w-20 h-20 rounded-full border-4 border-gray-800 mx-auto mb-4 animate-pulse opacity-50 bg-gray-800 flex items-center justify-center">
                                            <span className="text-2xl">🕵️</span>
                                        </div>
                                    ) : (
                                        <img src={partner.photoUrl} className="w-20 h-20 rounded-full border-4 border-gray-800 mx-auto mb-4 animate-pulse opacity-50" />
                                    )}
                                    <h2 className="text-lg font-bold opacity-80">{status}</h2>
                                </div>
                            )}

                            {/* Self View (Video Only) */}
                            {isVideo && stream && (
                                <div
                                    className={`absolute z-20 shadow-2xl border-2 border-white/10 bg-gray-900 group ${isDragging ? 'cursor-grabbing opacity-90 !transition-none' : 'cursor-grab transition-all duration-300'} ${isLocalMinimized ? 'rounded-full w-14 h-14 overflow-hidden border-indigo-500' : (isMaximized ? 'w-32 h-44 rounded-xl overflow-hidden' : 'w-20 h-28 rounded-lg overflow-hidden')}`}
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
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800 relative cursor-pointer hover:bg-gray-700 transition" onClick={(e) => { e.stopPropagation(); setIsLocalMinimized(false); }}>
                                            <span className="text-xs text-white font-bold tracking-wider">YOU</span>
                                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/50 animate-pulse pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <video ref={myVideo} autoPlay muted playsInline className={`w-full h-full object-cover transform ${facingMode === 'user' ? 'scale-x-[-1]' : ''} pointer-events-none ${isVideoOff ? 'hidden' : ''}`} />
                                            {isVideoOff && (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 pointer-events-none">
                                                    <VideoOff className="text-white/50" size={20} />
                                                </div>
                                            )}

                                            {/* Minimize Control */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsLocalMinimized(true); }}
                                                className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
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

                {/* Controls */}
                <div className={`flex items-center justify-center gap-3 z-20 transition-all ${isMaximized ? 'h-24 pb-4' : 'h-16 pb-2'} bg-gradient-to-t from-black/90 to-transparent`}>
                    <button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    {isVideo && (
                        <button onClick={switchCamera} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                            <RefreshCw size={20} />
                        </button>
                    )}

                    {isVideo && (
                        <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                    )}

                    <button className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg" onClick={() => setShowGiftModal(true)}>
                        <Gift size={20} />
                    </button>

                    <button className="p-3 rounded-full bg-red-600 text-white shadow-lg transform hover:scale-105" onClick={() => leaveCall(true)}>
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>

            {/* Right: Chat Sidebar (Only when maximized and ID available) */}
            {isMaximized && connectionId && (
                <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col h-full z-20">
                    <ChatWindow
                        connectionId={connectionId}
                        partner={partner}
                        className="flex-1 flex flex-col h-full"
                        isCallMode={true}
                    />
                </div>
            )}

            <GiftModal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} toUserId={partner.id} toUserName={partner.name} />
        </div>
        , document.body);
}

