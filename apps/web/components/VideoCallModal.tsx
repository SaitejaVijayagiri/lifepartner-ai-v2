'use client';

import { Mic, MicOff, Video, VideoOff, PhoneOff, Gift, Maximize2, Minimize2, Volume2 } from 'lucide-react';
import GiftModal from './GiftModal';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import ChatWindow from './ChatWindow';
import SimplePeer from 'simple-peer';
import { useSocket } from '@/context/SocketContext';

interface VideoCallModalProps {
    connectionId: string;
    partner: {
        id: string;
        name: string;
        photoUrl: string;
        role?: string;
    };
    onEndCall: () => void;
    incomingCall?: { signal: any, from: string, type?: 'audio' | 'video' };
    mode?: 'audio' | 'video';
}

export default function VideoCallModal({ connectionId, partner, onEndCall, incomingCall, mode = 'video' }: VideoCallModalProps) {
    const { socket } = useSocket() as any;
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [status, setStatus] = useState("Initializing...");
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const isVideo = mode === 'video' || incomingCall?.type === 'video';

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<SimplePeer.Instance | null>(null);

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
            });

        if (socket) {
            socket.on("callAccepted", (signal: any) => {
                setCallAccepted(true);
                setStatus(isVideo ? "Connected" : "Audio Connected");
                connectionRef.current?.signal(signal);
            });
            socket.on("callEnded", () => leaveCall());
            socket.on("callError", (data: any) => { alert(data.message); leaveCall(); });
        }

        return () => {
            leaveCall();
            socket?.off("callError");
        }
    }, [isVideo]);

    const callUser = (currentStream: MediaStream) => {
        setStatus(`Calling ${partner.name}...`);
        const peer = new SimplePeer({ initiator: true, trickle: false, stream: currentStream });

        peer.on("signal", (data) => {
            if (socket) {
                const myId = localStorage.getItem('userId');
                socket.emit("callUser", {
                    userToCall: partner.id,
                    signalData: data,
                    from: myId,
                    name: "Me",
                    type: mode
                });
            }
        });

        peer.on("stream", (currentStream) => {
            if (userVideo.current && isVideo) {
                userVideo.current.srcObject = currentStream;
            }
        });

        connectionRef.current = peer;
    };

    const answerCall = (currentStream: MediaStream) => {
        setCallAccepted(true);
        setStatus("Connected");
        const peer = new SimplePeer({ initiator: false, trickle: false, stream: currentStream });

        peer.on("signal", (data) => {
            if (socket) socket.emit("answerCall", { signal: data, to: incomingCall!.from });
        });

        peer.on("stream", (currentStream) => {
            if (userVideo.current && isVideo) {
                userVideo.current.srcObject = currentStream;
            }
        });

        peer.signal(incomingCall!.signal);
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

    const leaveCall = async () => {
        setCallEnded(true);
        try {
            stream?.getTracks().forEach(track => track.stop());
        } catch (e) { }
        connectionRef.current?.destroy();
        onEndCall();
    };

    const [showGiftModal, setShowGiftModal] = useState(false);

    return (
        <div className="fixed inset-0 z-50 bg-gray-950 flex overflow-hidden animate-in fade-in duration-300">
            {/* Left: Main Area */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-950 to-black flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    src={partner.photoUrl}
                                    className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                                    alt={partner.name}
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-950"></div>
                            </div>
                            <div className="text-white">
                                <h3 className="font-bold">{partner.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                    {callAccepted && !callEnded ? (
                                        <>
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                {formatDuration(callDuration)}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Volume2 size={12} />
                                                {isVideo ? 'Video Call' : 'Audio Call'}
                                            </span>
                                        </>
                                    ) : (
                                        <span>{status}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                    {/* Remote View */}
                    {callAccepted && !callEnded ? (
                        isVideo ? (
                            <video ref={userVideo} playsInline autoPlay className="w-full h-full object-cover" />
                        ) : (
                            // Audio Only UI - Premium Design
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50 animate-pulse scale-110"></div>
                                    <div className="relative w-48 h-48 rounded-full border-4 border-white/20 p-1 bg-gray-900">
                                        <img src={partner.photoUrl} className="w-full h-full rounded-full object-cover" alt={partner.name} />
                                        {/* Audio Waves Animation */}
                                        <div className="absolute -inset-2 rounded-full border-2 border-indigo-500/30 animate-ping"></div>
                                        <div className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                    </div>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">{partner.name}</h2>
                                <p className="text-indigo-400 font-medium flex items-center gap-2">
                                    <Volume2 size={18} />
                                    Audio Call Active • {formatDuration(callDuration)}
                                </p>
                            </div>
                        )
                    ) : (
                        // Connecting UI - Premium Design
                        <div className="text-center text-white">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-2xl opacity-40 animate-pulse scale-125"></div>
                                <div className="relative w-40 h-40 rounded-full border-4 border-indigo-500/50 p-1 animate-pulse">
                                    <img src={partner.photoUrl} className="w-full h-full rounded-full object-cover" alt={partner.name} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">{status}</h2>
                            <div className="flex items-center justify-center gap-1">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Self View (Video Only) */}
                    {isVideo && stream && (
                        <div className="absolute top-20 left-4 w-36 h-48 md:w-44 md:h-60 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-20 group">
                            <video ref={myVideo} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} />
                            {isVideoOff && (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                    <VideoOff className="text-white/50" size={32} />
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded-full">You</div>
                        </div>
                    )}
                </div>

                {/* Controls - Premium Design */}
                <div className="h-28 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-center gap-4 z-20 px-4">
                    {/* Mute Button */}
                    <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 ${isMuted
                                ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                : 'bg-white/10 border border-white/20 hover:bg-white/20'
                            }`}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    {/* Video Toggle (if video call) */}
                    {isVideo && (
                        <button
                            onClick={toggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform hover:scale-105 ${isVideoOff
                                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                    : 'bg-white/10 border border-white/20 hover:bg-white/20'
                                }`}
                        >
                            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                        </button>
                    )}

                    {/* Gift Button */}
                    <button
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105"
                        onClick={() => setShowGiftModal(true)}
                    >
                        <Gift size={22} />
                    </button>

                    {/* End Call Button */}
                    <button
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/40 transform hover:scale-105 transition-all"
                        onClick={leaveCall}
                    >
                        <PhoneOff size={26} />
                    </button>
                </div>
            </div>

            {/* Right: Chat Sidebar */}
            <div className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
                <ChatWindow
                    connectionId={connectionId}
                    partner={partner}
                    className="flex-1 flex flex-col h-full"
                    isCallMode={true}
                />
            </div>

            <GiftModal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} toUserId={partner.id} toUserName={partner.name} />
        </div>
    );
}

