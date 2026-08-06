'use client';

import React, { useEffect, useState } from 'react';
import { Video, Users, Sparkles, PlusCircle, Radio, ArrowRight, Eye, Play, Volume2, ShieldCheck, Heart } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import HostSpeedDateModal from './HostSpeedDateModal';
import { useToast } from '@/components/ui/Toast';

interface LiveVideoEventsHubProps {
    onJoinLive: (event?: any) => void;
}

export default function LiveVideoEventsHub({ onJoinLive }: LiveVideoEventsHubProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHostModal, setShowHostModal] = useState(false);
    const [previewEvent, setPreviewEvent] = useState<any | null>(null);

    const toast = useToast();

    const fetchLiveEvents = async () => {
        try {
            const res = await fetchAPI('/dates/events/active');
            if (res.success && res.events) {
                setEvents(res.events);
            }
        } catch {
            // Default fallback rooms
            setEvents([
                {
                    id: 'live_event_1',
                    title: '🎥 Bollywood Night Video Dates',
                    description: '3-Minute Video Matches & Music Vibes with Verified Singles!',
                    host_name: 'Ananya Sharma',
                    host_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                    target_gender: 'all',
                    participant_count: 18,
                    max_participants: 50
                },
                {
                    id: 'live_event_2',
                    title: '🔥 Live Speed Dating Roulette',
                    description: 'Instant 1-on-1 Blind Video & Audio Dates',
                    host_name: 'LifePartner AI Host',
                    target_gender: 'all',
                    participant_count: 24,
                    max_participants: 100
                },
                {
                    id: 'live_event_3',
                    title: '☕ Late Night Coffee & Chit-Chat',
                    description: 'Relaxed evening conversations for serious relationships',
                    host_name: 'Priya Verma',
                    host_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
                    target_gender: 'male',
                    participant_count: 12,
                    max_participants: 30
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveEvents();
        const interval = setInterval(fetchLiveEvents, 12000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-purple-950 to-slate-900 border border-rose-500/30 p-6 rounded-3xl shadow-xl text-white">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <Radio size={14} className="animate-pulse text-rose-400" /> Multi-Host Live Video Hub
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                        <span>Live Video Events & Broadcasts</span>
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-rose-600 text-white animate-pulse">
                            🔴 LIVE NOW
                        </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                        Preview active video rooms hosted by verified singles, join instant 3-minute video speed dates, or launch your own video stream!
                    </p>
                </div>

                <button
                    onClick={() => setShowHostModal(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-xs font-black text-white shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group shrink-0"
                >
                    <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>Host Your Live Video Room</span>
                </button>
            </div>

            {/* Active Live Video Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
                    >
                        {/* Live Video Preview Box */}
                        <div className="relative aspect-[16/9] w-full bg-gray-950 overflow-hidden">
                            {/* Animated Video Stream Simulator */}
                            <img
                                src={event.host_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                                alt={event.host_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
                                onError={(e) => {
                                    (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(event.host_name)}`;
                                }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 pointer-events-none" />

                            {/* Top Badges */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                                    🔴 LIVE STREAM
                                </span>

                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                                    <Users size={12} className="text-emerald-400" /> {event.participant_count || 12} Viewers
                                </span>
                            </div>

                            {/* Watch Preview Button (Centered) */}
                            <button
                                onClick={() => setPreviewEvent(event)}
                                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white backdrop-blur-md flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 group/btn z-10"
                                title="Watch Live Video Preview"
                            >
                                <Play size={22} className="ml-1 fill-white group-hover/btn:scale-110 transition-transform" />
                            </button>

                            {/* Host Info Bar at Bottom of Video Box */}
                            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2.5">
                                <img
                                    src={event.host_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(event.host_name)}`}
                                    alt={event.host_name}
                                    className="w-8 h-8 rounded-full border-2 border-rose-500 object-cover shadow-sm shrink-0"
                                />
                                <div className="min-w-0">
                                    <h4 className="font-extrabold text-xs text-white truncate drop-shadow-sm flex items-center gap-1">
                                        {event.host_name}
                                        <ShieldCheck size={12} className="text-emerald-400" />
                                    </h4>
                                    <p className="text-[10px] text-gray-300 truncate">Host Broadcast</p>
                                </div>
                            </div>
                        </div>

                        {/* Room Info & Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                                <h3 className="font-black text-base text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors line-clamp-1">
                                    {event.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                    {event.description}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex gap-2">
                                <button
                                    onClick={() => setPreviewEvent(event)}
                                    className="flex-1 py-2.5 px-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Eye size={14} /> Preview
                                </button>
                                <button
                                    onClick={() => onJoinLive(event)}
                                    className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1"
                                >
                                    <span>Join Room</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Host Modal */}
            {showHostModal && (
                <HostSpeedDateModal
                    onClose={() => setShowHostModal(false)}
                    onEventCreated={(evt) => {
                        toast.success('🎉 Your Live Video room is now LIVE!');
                        fetchLiveEvents();
                        if (onJoinLive) {
                            onJoinLive(evt);
                        }
                    }}
                />
            )}

            {/* Live Video Preview Modal */}
            {previewEvent && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg bg-gray-950 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl text-white">
                        {/* Simulated Live Video Player */}
                        <div className="relative aspect-video w-full bg-black">
                            <img
                                src={previewEvent.host_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                                alt={previewEvent.host_name}
                                className="w-full h-full object-cover filter brightness-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

                            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                                <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                                    🔴 LIVE PREVIEW
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                                    <Users size={12} className="inline mr-1 text-emerald-400" /> {previewEvent.participant_count || 15} Watching
                                </span>
                            </div>

                            <button
                                onClick={() => setPreviewEvent(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white z-10"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Preview Details */}
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-white">{previewEvent.title}</h3>
                                <p className="text-xs text-gray-400 mt-1">Hosted by <strong className="text-rose-400">{previewEvent.host_name}</strong></p>
                                <p className="text-xs text-gray-300 mt-2">{previewEvent.description}</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setPreviewEvent(null)}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5"
                                >
                                    Close Preview
                                </button>
                                <button
                                    onClick={() => {
                                        const ev = previewEvent;
                                        setPreviewEvent(null);
                                        onJoinLive(ev);
                                    }}
                                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30"
                                >
                                    Join Video Room Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
