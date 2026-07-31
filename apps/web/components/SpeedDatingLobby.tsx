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
    const [targetGender, setTargetGender] = useState<'female' | 'male'>('female');
    const [searchSeconds, setSearchSeconds] = useState(0);

    // Auto-detect user's gender on mount and default to opposite gender
    useEffect(() => {
        import('@/lib/api').then(({ api }) => {
            api.profile.getMe().then((me) => {
                if (me?.gender?.toLowerCase() === 'female' || me?.gender?.toLowerCase() === 'woman') {
                    setTargetGender('male');
                } else {
                    setTargetGender('female');
                }
            }).catch(() => {});
        });
    }, []);

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
        <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 active:scale-95 shadow-md z-20 cursor-pointer"
                title="Close Lobby"
            >
                <X size={24} />
            </button>

            <div className="max-w-md w-full bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/60 border border-white/20 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
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

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-pink-200 mb-1 tracking-tight">
                        Speed Dating Match
                    </h2>
                    <p className="text-gray-300 text-xs sm:text-sm mb-3 leading-relaxed font-medium">
                        Instant 1-click blind video/audio connection between verified members.
                    </p>

                    <div className="inline-flex items-center gap-1.5 mb-4 px-3.5 py-1 bg-indigo-500/15 rounded-full border border-indigo-500/30 text-[10px] font-extrabold text-indigo-300 shadow-sm animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        <span>Searching Queue: {Math.floor(searchSeconds / 60).toString().padStart(2, '0')}:{(searchSeconds % 60).toString().padStart(2, '0')}</span>
                    </div>

                    {/* Gender Preference Tabs */}
                    <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/10 mb-4">
                        <button
                            onClick={() => {
                                setTargetGender('female');
                                toast.info("Searching for Female matches...");
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                                targetGender === 'female'
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md scale-[1.02]'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>👩 Seek Female</span>
                        </button>

                        <button
                            onClick={() => {
                                setTargetGender('male');
                                toast.info("Searching for Male matches...");
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                                targetGender === 'male'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md scale-[1.02]'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>👨 Seek Male</span>
                        </button>
                    </div>

                    {/* Active Searching Status Banner */}
                    <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-white/10 mb-4 text-left space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Searching Live Queue:
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {targetGender === 'female' ? '👩 Females Only' : '👨 Males Only'}
                            </span>
                        </div>

                        {/* Active Queue Statistics */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-pink-500/10 rounded-xl p-2.5 border border-pink-500/20 text-center">
                                <span className="text-lg font-black text-pink-400">{femaleCount || 1}</span>
                                <p className="text-[9px] font-bold text-pink-300 uppercase tracking-wider">Females Online</p>
                            </div>
                            <div className="bg-indigo-500/10 rounded-xl p-2.5 border border-indigo-500/20 text-center">
                                <span className="text-lg font-black text-indigo-400">{maleCount || 1}</span>
                                <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">Males Online</p>
                            </div>
                        </div>
                    </div>

                    {/* Tip Footer */}
                    <p className="text-[11px] text-gray-300 font-medium italic mt-4">
                        ⚡ 3-minute blind interactive date. Searching for real verified members...
                    </p>
                </div>
            </div>
        </div>
    );
}
