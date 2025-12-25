'use client';

import { Mic, MicOff, Video, VideoOff, PhoneOff, Gift, Maximize2, Minimize2, Volume2 } from 'lucide-react';
import GiftModal from './GiftModal';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ChatWindow from './ChatWindow';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';

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
    };
    onEndCall: () => void;
    incomingCall?: { signal: any, from: string, name: string, type?: 'audio' | 'video' };
    mode?: 'audio' | 'video';
}

export default function VideoCallModal({ connectionId, partner: initialPartner, onEndCall, incomingCall, mode = 'video' }: VideoCallModalProps) {
    const { socket } = useSocket();
    const toast = useToast();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [status, setStatus] = useState("Initializing...");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isMaximized, setIsMaximized] = useState(true);

    // Determine Call Type and Partner
    const isVideo = mode === 'video' || incomingCall?.type === 'video';
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
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callAccepted, callEnded]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!SimplePeer) return; // Wait for client load

        navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current && isVideo) {
                    myVideo.current.srcObject = currentStream;
                }

                if (incomingCall) {
                    answerCall(currentStream);
                } else {
                    callUser(currentStream);
                }
            })
            .catch(err => {
                console.error("Failed to get media", err);
                setStatus("Microphone/Camera Error: " + err.message);
                toast.error("Camera/Mic access required");
            });

        if (socket) {
            socket.on("callAccepted", (signal: any) => {
                setCallAccepted(true);
                setStatus(isVideo ? "Connected" : "Audio Connected");
                connectionRef.current?.signal(signal);
            });
            socket.on("callEnded", () => leaveCall());
            socket.on("callError", (data: any) => { toast.error(data.message); leaveCall(); });
        }

        return () => {
            leaveCall();
            socket?.off("callError");
            socket?.off("callAccepted");
            socket?.off("callEnded");
        }
    }, [isVideo]); // Run once mostly, or re-run if video mode changes (tricky)

    const callUser = (currentStream: MediaStream) => {
        setStatus(`Calling ${partner.name}...`);
        const peer = new SimplePeer({ initiator: true, trickle: false, stream: currentStream });

        peer.on("signal", (data: any) => {
            if (socket) {
                const myId = localStorage.getItem('userId');
                socket.emit("callUser", {
                    userToCall: partner.id,
                    signalData: data,
                    from: myId,
                    name: localStorage.getItem('userName') || "User",
                    type: mode
                });
            }
        });

        peer.on("stream", (remoteStream: MediaStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on("error", (err: any) => {
            console.error("Peer Error:", err);
            // setStatus("Connection Error"); 
        });

        connectionRef.current = peer;
    };

    const answerCall = (currentStream: MediaStream) => {
        setCallAccepted(true);
        setStatus("Connected");
        const peer = new SimplePeer({ initiator: false, trickle: false, stream: currentStream });

        peer.on("signal", (data: any) => {
            if (socket && incomingCall) {
                socket.emit("answerCall", { signal: data, to: incomingCall.from });
            }
        });

        peer.on("stream", (remoteStream: MediaStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
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

    const leaveCall = () => {
        setCallEnded(true);
        try {
            stream?.getTracks().forEach(track => track.stop());
        } catch (e) { }
        connectionRef.current?.destroy();
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
                            {isMaximized && <h3 className="font-bold">{partner.name}</h3>}
                            <div className="flex items-center gap-2 text-xs text-white/60">
                                <span className={callAccepted ? "text-green-400" : "text-amber-400"}>
                                    {callAccepted ? formatDuration(callDuration) : status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsMaximized(!isMaximized)} className="text-white/80 hover:text-white bg-black/20 p-2 rounded-full backdrop-blur-sm">
                        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>

                <div className="flex-1 relative overflow-hidden flex items-center justify-center group">
                    {/* Remote View */}
                    {callAccepted && !callEnded ? (
                        isVideo ? (
                            <video ref={userVideo} playsInline autoPlay className="w-full h-full object-cover" />
                        ) : (
                            // Audio Only UI
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative mb-6 transform scale-75 md:scale-100">
                                    <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-pulse blur-xl"></div>
                                    <img src={partner.photoUrl} className="relative w-32 h-32 rounded-full border-4 border-gray-800 object-cover z-10" alt={partner.name} />
                                    <div className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-ping"></div>
                                </div>
                            </div>
                        )
                    ) : (
                        // Connecting UI
                        <div className="text-center text-white p-4">
                            <img src={partner.photoUrl} className="w-20 h-20 rounded-full border-4 border-gray-800 mx-auto mb-4 animate-pulse opacity-50" />
                            <h2 className="text-lg font-bold opacity-80">{status}</h2>
                        </div>
                    )}

                    {/* Self View (Video Only) */}
                    {isVideo && stream && (
                        <div className={`absolute z-20 overflow-hidden shadow-2xl border-2 border-white/10 transition-all duration-300 bg-gray-900
                             ${isMaximized ? 'top-20 left-4 w-32 h-44 rounded-xl' : 'top-16 left-4 w-20 h-28 rounded-lg'}
                        `}>
                            <video ref={myVideo} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} />
                            {isVideoOff && (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <VideoOff className="text-white/50" size={20} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className={`flex items-center justify-center gap-3 z-20 transition-all ${isMaximized ? 'h-24 pb-4' : 'h-16 pb-2'} bg-gradient-to-t from-black/90 to-transparent`}>
                    <button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    {isVideo && (
                        <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </button>
                    )}

                    <button className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg" onClick={() => setShowGiftModal(true)}>
                        <Gift size={20} />
                    </button>

                    <button className="p-3 rounded-full bg-red-600 text-white shadow-lg transform hover:scale-105" onClick={leaveCall}>
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

