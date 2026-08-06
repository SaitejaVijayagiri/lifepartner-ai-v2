'use client';

import React, { useEffect, useState } from 'react';
import { Video, Users, Sparkles, PlusCircle, Radio, ArrowRight } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

interface LiveEventBannerProps {
    onJoinLive: (event?: any) => void;
    onHostLive: () => void;
}

export default function LiveEventBanner({ onJoinLive, onHostLive }: LiveEventBannerProps) {
    const [activeEvent, setActiveEvent] = useState<any>(null);
    const [participantCount, setParticipantCount] = useState<number>(14);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetchAPI('/dates/events/active');
                if (res.success && res.events && res.events.length > 0) {
                    setActiveEvent(res.events[0]);
                    setParticipantCount(res.events[0].participant_count || 14);
                }
            } catch {
                // Fallback default active event
                setActiveEvent({
                    id: 'live_default',
                    title: '🔥 Live Night Speed Dating Roulette',
                    description: '3-Minute Instant Video & Audio Dates with Singles!',
                    host_name: 'LifePartner Host',
                    participant_count: 14
                });
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const eventTitle = activeEvent?.title || '🔥 Live Night Speed Dating Roulette';
    const hostName = activeEvent?.host_name || 'LifePartner Host';

    return (
        <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-purple-950 to-slate-900 border border-rose-500/30 p-4 sm:p-5 shadow-[0_0_30px_rgba(244,63,94,0.15)] mb-6 text-white animate-in fade-in duration-300">
            {/* Background Decorative Pulsing Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left Section: Live Badge & Title */}
                <div className="flex items-start gap-3.5 min-w-0">
                    <div className="relative shrink-0 mt-0.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                            <Radio size={24} className="text-white animate-pulse" />
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                        </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600/90 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                🔴 LIVE NOW
                            </span>
                            <span className="text-[11px] text-gray-300 font-medium truncate flex items-center gap-1">
                                <Users size={12} className="text-rose-400" /> {participantCount} Singles Queueing
                            </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black tracking-tight truncate text-white">
                            {eventTitle}
                        </h3>

                        <p className="text-xs text-gray-300 truncate">
                            Hosted by <span className="font-bold text-rose-300">{hostName}</span> • 3-Min Instant Dates
                        </p>
                    </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                    <button
                        onClick={onHostLive}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                        <PlusCircle size={15} className="text-rose-400" />
                        <span>Host Event</span>
                    </button>

                    <button
                        onClick={() => onJoinLive(activeEvent)}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-xs font-black text-white shadow-xl shadow-rose-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 group"
                    >
                        <span>Join Live Roulette</span>
                        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
