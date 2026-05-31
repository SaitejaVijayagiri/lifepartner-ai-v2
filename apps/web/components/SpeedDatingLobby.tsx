import React, { useEffect, useState } from 'react';
import { Heart, X, Zap } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';

interface SpeedDatingLobbyProps {
    onClose: () => void;
    onMatchFound: (partner: any, initiator: boolean) => void;
}

export default function SpeedDatingLobby({ onClose, onMatchFound }: SpeedDatingLobbyProps) {
    const { socket } = useSocket();
    const toast = useToast();
    const [waitingCount, setWaitingCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!socket) return;

        // Join Lobby
        socket.emit('join_speed_dating_lobby');
        setIsSearching(true);

        const handleJoined = (data: any) => {
            console.log(data.message);
        };

        const handleMatchFound = (data: { partner: any, initiator: boolean }) => {
            setIsSearching(false);
            // Play success sound
            const audio = new Audio('/sounds/match.mp3');
            audio.play().catch(() => {});
            
            toast.success("Speed Match Found!");
            onMatchFound(data.partner, data.initiator);
        };

        const handleStats = (data: { waitingCount: number }) => {
            setWaitingCount(data.waitingCount);
        };

        const handleError = (data: { message: string }) => {
            toast.error(data.message);
            onClose();
        };

        socket.on('speed_date_joined', handleJoined);
        socket.on('speed_date_match_found', handleMatchFound);
        socket.on('speed_date_stats', handleStats);
        socket.on('speed_date_error', handleError);

        return () => {
            socket.emit('leave_speed_dating_lobby');
            socket.off('speed_date_joined', handleJoined);
            socket.off('speed_date_match_found', handleMatchFound);
            socket.off('speed_date_stats', handleStats);
            socket.off('speed_date_error', handleError);
        };
    }, [socket, onClose, onMatchFound, toast]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 active:scale-95 shadow-md"
            >
                <X size={24} />
            </button>

            <div className="max-w-md w-full bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/20 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Background Radar Animation */}
                {isSearching && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                        <div className="w-full h-full border-2 border-indigo-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute w-3/4 h-3/4 border-2 border-purple-500/25 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
                        <div className="absolute w-1/2 h-1/2 border-2 border-pink-500/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                    </div>
                )}

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_35px_rgba(139,92,246,0.6)] border border-white/20">
                        <Zap size={32} className="text-white animate-pulse" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-pink-200 mb-2 tracking-tight">Speed Dating</h2>
                    <p className="text-gray-300 text-sm mb-8 leading-relaxed font-medium">
                        Finding an available partner for a blind 3-minute chat...
                    </p>

                    <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/15 mb-8 backdrop-blur-md">
                        <div className="flex items-center justify-center gap-3 text-emerald-400 mb-1.5">
                            <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                            </span>
                            <span className="font-extrabold text-3xl tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{waitingCount}</span>
                        </div>
                        <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black">Users Online Waiting</p>
                    </div>

                    <p className="text-xs text-indigo-300 dark:text-indigo-400 italic bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                        ⚡ Tip: You will have exactly 180 seconds once matched. Trust your instincts!
                    </p>
                </div>
            </div>
        </div>
    );
}
