import React, { useEffect, useState } from 'react';
import { Heart, X, Zap, Sparkles, UserCheck } from 'lucide-react';
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
    const [maleCount, setMaleCount] = useState(0);
    const [femaleCount, setFemaleCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [targetGender, setTargetGender] = useState<'female' | 'male' | 'any'>('any');
    const [searchSeconds, setSearchSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isSearching) {
            interval = setInterval(() => {
                setSearchSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isSearching]);

    useEffect(() => {
        if (!socket) return;

        // Join Lobby
        socket.emit('join_speed_dating_lobby', { targetGender });
        setIsSearching(true);

        const handleJoined = (data: any) => {
            console.log(data.message);
        };

        const handleMatchFound = (data: { partner: any, initiator: boolean }) => {
            setIsSearching(false);
            const audio = new Audio('/sounds/match.mp3');
            audio.play().catch(() => {});
            
            toast.success("Speed Match Found!");
            onMatchFound(data.partner, data.initiator);
        };

        const handleStats = (data: { waitingCount: number; maleCount?: number; femaleCount?: number }) => {
            setWaitingCount(data.waitingCount);
            if (typeof data.maleCount === 'number') setMaleCount(data.maleCount);
            if (typeof data.femaleCount === 'number') setFemaleCount(data.femaleCount);
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
    }, [socket, targetGender, onClose, onMatchFound, toast]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 active:scale-95 shadow-md z-20"
            >
                <X size={24} />
            </button>

            <div className="max-w-md w-full bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 border border-white/15 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
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
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 via-rose-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_35px_rgba(244,63,94,0.6)] border border-white/20">
                        <Zap size={32} className="text-white animate-pulse" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-pink-200 mb-1 tracking-tight">Instant Speed Match</h2>
                    <p className="text-gray-300 text-xs sm:text-sm mb-3 leading-relaxed font-medium">
                        Instant 1-click blind connection between male & female members.
                    </p>

                    <div className="inline-block mb-5 px-3.5 py-1 bg-indigo-500/15 rounded-full border border-indigo-500/30 text-[10px] font-extrabold text-indigo-300 shadow-sm animate-pulse">
                        ⏱️ Queue Timer: {Math.floor(searchSeconds / 60).toString().padStart(2, '0')}:{(searchSeconds % 60).toString().padStart(2, '0')}
                    </div>

                    {/* Gender Preference Tabs */}
                    <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/10 mb-5">
                        <button
                            onClick={() => setTargetGender('female')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                                targetGender === 'female'
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>👩 Seek Female</span>
                        </button>

                        <button
                            onClick={() => setTargetGender('male')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                                targetGender === 'male'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>👨 Seek Male</span>
                        </button>

                        <button
                            onClick={() => setTargetGender('any')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                                targetGender === 'any'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>💖 Any</span>
                        </button>
                    </div>

                    {/* Active Queue Statistics */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-pink-500/10 rounded-2xl p-3 border border-pink-500/20 backdrop-blur-md text-center">
                            <span className="text-xl font-black text-pink-400">{femaleCount || 1}</span>
                            <p className="text-[10px] font-bold text-pink-300 uppercase tracking-wider mt-0.5">Females Online</p>
                        </div>
                        <div className="bg-indigo-500/10 rounded-2xl p-3 border border-indigo-500/20 backdrop-blur-md text-center">
                            <span className="text-xl font-black text-indigo-400">{maleCount || 1}</span>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mt-0.5">Males Online</p>
                        </div>
                    </div>

                    {/* Instant AI Date Companion Fallback Button */}
                    <button
                        type="button"
                        onClick={() => {
                            const isFemaleTarget = targetGender === 'female';
                            onMatchFound({
                                id: `ai_speed_date_${Date.now()}`,
                                name: isFemaleTarget ? "Aria (AI Speed Match)" : "Alex (AI Speed Match)",
                                photoUrl: isFemaleTarget 
                                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500" 
                                    : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
                                location: "Virtual Match Lounge"
                            }, true);
                        }}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-black text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-white/20 cursor-pointer"
                    >
                        <Sparkles size={16} />
                        <span>Instant Match Now with AI Companion ✨</span>
                    </button>

                    <p className="text-[10px] text-gray-400 italic mt-3">
                        ⚡ Tip: 3-minute blind interactive date. Real-time audio & WebRTC enabled!
                    </p>
                </div>
            </div>
        </div>
    );
}
