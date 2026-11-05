'use client';

import React, { useState, useMemo } from 'react';
import { Radio, Sparkles, Send, Heart, Flame, MessageCircle, Zap } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface LiveSinglesRadarProps {
    matches: any[];
    currentUserId?: string;
    onViewProfile?: (profile: any) => void;
    onOpenChat?: (conn: any) => void;
}

export default function LiveSinglesRadar({
    matches = [],
    currentUserId,
    onViewProfile,
    onOpenChat
}: LiveSinglesRadarProps) {
    const { onlineUsers = [] } = useSocket() as any;
    const toast = useToast();
    const [wavedIds, setWavedIds] = useState<Set<string>>(new Set());

    // Compute online matches
    const onlineMatches = useMemo(() => {
        if (!Array.isArray(matches) || matches.length === 0) return [];

        const onlineSet = new Set(Array.isArray(onlineUsers) ? onlineUsers : []);

        const onlineList = matches.filter(m => {
            if (!m || m.id === currentUserId) return false;
            return onlineSet.has(m.id) || m.isOnline;
        });

        // If very few users are currently live in the socket, show active verified profiles so the radar is always engaging
        if (onlineList.length < 5) {
            const fallback = matches
                .filter(m => m && m.id !== currentUserId && !onlineList.some(o => o.id === m.id))
                .slice(0, 8 - onlineList.length);
            return [...onlineList, ...fallback];
        }

        return onlineList.slice(0, 12);
    }, [matches, onlineUsers, currentUserId]);

    const handleWave = async (e: React.MouseEvent, match: any) => {
        e.stopPropagation();
        const mId = match.id;
        if (wavedIds.has(mId)) return;

        setWavedIds(prev => new Set(prev).add(mId));
        const name = match.name || match.full_name || 'your match';

        toast.success(`👋 You sent a live wave to ${name}!`);

        try {
            await api.interactions.sendInterest(mId);
        } catch (err) {
            // Soft fail
        }
    };

    if (onlineMatches.length === 0) return null;

    return (
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 shadow-xl overflow-hidden backdrop-blur-md">
            {/* Background glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-1.5 uppercase">
                        <span>Live Radar</span>
                        <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                            {onlineMatches.length} Singles Active
                        </span>
                    </h3>
                </div>

                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                    Tap to wave or view profile
                </span>
            </div>

            {/* Horizontal Scrollable Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1">
                {onlineMatches.map((match, idx) => {
                    const pName = match.name || match.full_name || 'Member';
                    const firstName = pName.split(' ')[0];
                    const photo = match.photoUrl || (Array.isArray(match.photos) ? match.photos[0] : '') || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pName)}`;
                    const isWaved = wavedIds.has(match.id);
                    const age = match.age || 25;

                    return (
                        <div
                            key={match.id || idx}
                            onClick={() => onViewProfile && onViewProfile(match)}
                            className="group flex flex-col items-center shrink-0 w-20 sm:w-24 p-2 rounded-2xl bg-slate-800/60 hover:bg-indigo-950/50 border border-slate-700/60 hover:border-indigo-400/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none"
                        >
                            <div className="relative mb-2">
                                <img
                                    src={photo}
                                    alt={pName}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-400/80 shadow-md group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                />
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm" />
                            </div>

                            <p className="text-xs font-bold text-white text-center truncate w-full">
                                {firstName}
                            </p>
                            <p className="text-[10px] text-gray-400 text-center truncate w-full">
                                {age} yrs
                            </p>

                            <button
                                type="button"
                                onClick={(e) => handleWave(e, match)}
                                className={`mt-2 w-full py-1 rounded-xl text-[10px] font-black tracking-tight transition-all active:scale-90 flex items-center justify-center gap-1 ${
                                    isWaved
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm hover:shadow-indigo-500/25'
                                }`}
                            >
                                <span>{isWaved ? 'Waved' : 'Wave'}</span>
                                <span>{isWaved ? '✨' : '👋'}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
