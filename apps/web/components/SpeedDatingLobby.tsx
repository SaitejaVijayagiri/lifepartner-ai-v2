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
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
                <X size={24} />
            </button>

            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
                {/* Background Radar Animation */}
                {isSearching && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-full h-full border-2 border-indigo-500 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute w-3/4 h-3/4 border-2 border-purple-500 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
                        <div className="absolute w-1/2 h-1/2 border-2 border-pink-500 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                    </div>
                )}

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                        <Zap size={32} className="text-white animate-pulse" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Speed Dating</h2>
                    <p className="text-gray-400 mb-8">
                        Finding an available partner for a blind 3-minute chat...
                    </p>

                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8 backdrop-blur-md">
                        <div className="flex items-center justify-center gap-3 text-white mb-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="font-bold text-2xl">{waitingCount}</span>
                        </div>
                        <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Users Waiting</p>
                    </div>

                    <p className="text-xs text-gray-500 italic">
                        Tip: You will have exactly 180 seconds once matched. Trust your instincts!
                    </p>
                </div>
            </div>
        </div>
    );
}
