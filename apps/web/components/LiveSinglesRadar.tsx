'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Radio, Sparkles, Send, Heart, Flame, MessageCircle, Zap, HelpCircle, X, ShieldCheck } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface LiveSinglesRadarProps {
    matches: any[];
    currentUserId?: string;
    currentUser?: any;
    onViewProfile?: (profile: any) => void;
    onOpenChat?: (conn: any) => void;
}

export default function LiveSinglesRadar({
    matches = [],
    currentUserId,
    currentUser,
    onViewProfile,
    onOpenChat
}: LiveSinglesRadarProps) {
    const { socket, onlineUsers = [] } = useSocket() as any;
    const toast = useToast();
    const [wavedIds, setWavedIds] = useState<Set<string>>(new Set());
    const [fetchedOnlineMembers, setFetchedOnlineMembers] = useState<any[]>([]);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    useEffect(() => {
        if (!showHelpModal) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowHelpModal(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showHelpModal]);

    const myId = currentUserId || currentUser?.id;

    // 1. If matches prop is empty or sparse, fetch directly from /matches/online-now
    const loadOnlineMembers = useCallback(async () => {
        try {
            const data: any = await api.matches.getOnlineNow();
            if (Array.isArray(data?.onlineMembers) && data.onlineMembers.length > 0) {
                setFetchedOnlineMembers(data.onlineMembers);
            }
        } catch (e) {
            // Soft fail, will use matches prop
        }
    }, []);

    useEffect(() => {
        if (!Array.isArray(matches) || matches.length < 5) {
            loadOnlineMembers();
        }
    }, [matches, loadOnlineMembers]);

    // 2. Real-time Socket Listener: When another active user waves at ME
    useEffect(() => {
        if (!socket) return;

        const handleIncomingWave = (data: any) => {
            if (data && data.senderName) {
                toast.success(`👋 ${data.senderName} just sent you a Live Wave! They are active right now!`);
            }
        };

        socket.on('live_wave_received', handleIncomingWave);
        return () => {
            socket.off('live_wave_received', handleIncomingWave);
        };
    }, [socket, toast]);

    // 3. Compute active singles for the radar
    const onlineMatches = useMemo(() => {
        const pool = Array.isArray(matches) && matches.length > 0 ? matches : fetchedOnlineMembers;
        if (!pool || pool.length === 0) return [];

        const onlineSet = new Set(Array.isArray(onlineUsers) ? onlineUsers : []);

        // Filter valid candidates, exclude self
        const activeSingles = pool.filter(m => {
            if (!m) return false;
            const mId = m.id || m.userId || m.user_id;
            if (myId && mId === myId) return false;
            return onlineSet.has(mId) || m.isOnline;
        });

        // If fewer than 5 currently connected to socket, fill with verified active profiles
        if (activeSingles.length < 6) {
            const extra = pool.filter(m => {
                if (!m) return false;
                const mId = m.id || m.userId || m.user_id;
                if (myId && mId === myId) return false;
                return !activeSingles.some(a => (a.id || a.userId) === mId);
            }).slice(0, 8 - activeSingles.length);
            return [...activeSingles, ...extra];
        }

        return activeSingles.slice(0, 15);
    }, [matches, fetchedOnlineMembers, onlineUsers, myId]);

    const handleWave = async (e: React.MouseEvent, match: any) => {
        e.stopPropagation();
        const mId = match.id || match.userId;
        if (!mId) return;

        // If already connected, open chat directly instead of sending duplicate request
        const isConnected = Boolean(match.isConnected || match.match_status === 'connected' || match.match_status === 'accepted');
        if (isConnected && onOpenChat) {
            onOpenChat(match);
            return;
        }

        if (wavedIds.has(mId)) return;

        // Optimistically record wave
        setWavedIds(prev => new Set(prev).add(mId));
        const name = match.name || match.full_name || 'your match';

        toast.success(`👋 Wave sent to ${name}! An instant interest ping was delivered.`);

        // 1. Emit live real-time wave over websocket if recipient is online
        try {
            if (socket && socket.connected) {
                socket.emit('live_wave', {
                    toUserId: mId,
                    senderName: currentUser?.full_name || currentUser?.name || 'Someone',
                    senderPhoto: currentUser?.photoUrl || currentUser?.avatar_url || ''
                });
            }
        } catch (sockErr) {
            console.error('[LiveSinglesRadar] socket emit failed', sockErr);
        }

        // 2. Persist interest connect request to DB
        try {
            await api.interactions.sendInterest(mId);
        } catch (err) {
            // Soft fail
        }
    };

    if (onlineMatches.length === 0) return null;

    return (
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-slate-50/95 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-500/30 p-4 sm:p-5 shadow-xl overflow-hidden backdrop-blur-md">
            {/* Background glowing line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

            {/* Header with Info Tooltip */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-wide flex items-center gap-2 uppercase">
                        <span>Live Radar</span>
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30">
                            {onlineMatches.length} Singles Active Now
                        </span>
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHelpModal(true)}
                        className="text-[11px] text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-100/80 dark:bg-indigo-500/15 hover:bg-indigo-200 dark:hover:bg-indigo-500/25 border border-indigo-300 dark:border-indigo-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        title="What is Live Wave?"
                    >
                        <HelpCircle size={12} className="text-indigo-600 dark:text-indigo-400" />
                        <span>What is Wave?</span>
                    </button>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-bold hidden sm:inline shadow-sm">
                        100% Free
                    </span>
                </div>
            </div>

            {/* Horizontal Scrollable Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1">
                {onlineMatches.map((match, idx) => {
                    const mId = match.id || match.userId || idx;
                    const pName = match.name || match.full_name || 'Member';
                    const firstName = pName.split(' ')[0];
                    const photo = match.photoUrl || (Array.isArray(match.photos) ? match.photos[0] : '') || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pName)}`;
                    const isWaved = wavedIds.has(mId);
                    const isConnected = Boolean(match.isConnected || match.match_status === 'connected' || match.match_status === 'accepted');
                    const age = match.age || 25;
                    const city = match.city || (typeof match.location === 'string' ? match.location.split(',')[0] : 'Nearby');

                    return (
                        <div
                            key={mId}
                            onClick={() => onViewProfile && onViewProfile(match)}
                            className="group flex flex-col items-center shrink-0 w-22 sm:w-26 p-2 rounded-2xl bg-white/95 hover:bg-indigo-50/90 dark:bg-slate-800/60 dark:hover:bg-indigo-950/50 border border-gray-200/90 dark:border-slate-700/60 hover:border-indigo-400/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none shadow-sm"
                        >
                            <div className="relative mb-2">
                                <img
                                    src={photo}
                                    alt={pName}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-400/80 shadow-md group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                />
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                            </div>

                            <p className="text-xs font-bold text-gray-900 dark:text-white text-center truncate w-full">
                                {firstName}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate w-full">
                                {age} • {city}
                            </p>

                            <button
                                type="button"
                                onClick={(e) => handleWave(e, match)}
                                className={`mt-2 w-full py-1.5 rounded-xl text-[10px] font-black tracking-tight transition-all active:scale-90 flex items-center justify-center gap-1 cursor-pointer ${
                                    isConnected
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                                        : isWaved
                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-indigo-500/25'
                                }`}
                            >
                                <span>{isConnected ? 'Chat' : isWaved ? 'Waved' : 'Wave'}</span>
                                <span>{isConnected ? '💬' : isWaved ? '✨' : '👋'}</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Helper Info Modal explaining "What is Wave?" — Mounted directly to document.body to prevent parent container clipping */}
            {showHelpModal && mounted && createPortal(
                <div 
                    onClick={() => setShowHelpModal(false)}
                    className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm mx-auto bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-500/40 rounded-3xl p-5 sm:p-6 text-gray-900 dark:text-white shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar space-y-4 animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-md shadow-indigo-500/30 text-white">
                                    👋
                                </div>
                                <div>
                                    <h4 className="font-black text-base text-gray-900 dark:text-white">What is Live Wave?</h4>
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">100% Free • Instant Ping</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/25 space-y-1">
                                <p className="font-bold text-indigo-950 dark:text-white flex items-center gap-1.5">
                                    <span>⚡ Instant Alert to Active Singles</span>
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    When you see someone on Live Radar, tapping <strong>Wave 👋</strong> sends them an instant alert that you are active on the app right now and interested in connecting.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-slate-800/80 border border-purple-200 dark:border-slate-700/60 space-y-1">
                                <p className="font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                                    <span>💖 Zero-Pressure Icebreaker</span>
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    No need to think of a pickup line! If they wave back or accept, an instant private chat unlocks immediately so you can start talking.
                                </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/25 text-center">
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                                    ✓ Waving never spends coins — it is always 100% free!
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowHelpModal(false)}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 active:scale-98 transition-all cursor-pointer"
                        >
                            Got It, Start Waving!
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
