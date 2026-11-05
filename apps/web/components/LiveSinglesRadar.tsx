'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Radio, Sparkles, Send, Heart, Flame, MessageCircle, Zap, HelpCircle, X, ShieldCheck, Clock, RefreshCw, Eye } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'live' | 'recent'>('live');
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    // 1. Fetch verified online members directly from /matches/online-now
    const loadOnlineMembers = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const data: any = await api.matches.getOnlineNow();
            if (Array.isArray(data?.onlineMembers)) {
                setFetchedOnlineMembers(data.onlineMembers);
            }
        } catch (e) {
            // Soft fail
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadOnlineMembers();
        // Periodically sync live online list every 45 seconds
        const interval = setInterval(loadOnlineMembers, 45000);
        return () => clearInterval(interval);
    }, [loadOnlineMembers]);

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

    const onlineSet = useMemo(() => {
        return new Set(Array.isArray(onlineUsers) ? onlineUsers : []);
    }, [onlineUsers]);

    // 3. Strictly Genuine Live Singles (Connected to WebSocket right now)
    const liveSingles = useMemo(() => {
        const liveMap = new Map<string, any>();

        // (a) Members confirmed from /matches/online-now
        (Array.isArray(fetchedOnlineMembers) ? fetchedOnlineMembers : []).forEach(m => {
            if (!m) return;
            const mId = m.id || m.userId || m.user_id;
            if (!mId || mId === myId) return;
            // If socket is connected and user list is loaded, verify still present
            if (socket?.connected && onlineSet.size > 0 && !onlineSet.has(mId)) {
                return;
            }
            liveMap.set(mId, { ...m, isLiveNow: true });
        });

        // (b) Candidate matches confirmed in current real-time online set
        (Array.isArray(matches) ? matches : []).forEach(m => {
            if (!m) return;
            const mId = m.id || m.userId || m.user_id;
            if (!mId || mId === myId) return;
            if (onlineSet.has(mId)) {
                liveMap.set(mId, { ...m, isLiveNow: true });
            }
        });

        return Array.from(liveMap.values());
    }, [fetchedOnlineMembers, matches, onlineSet, myId, socket?.connected]);

    // 4. Recently Active Singles (Verified profiles active recently, NEVER labeled as live)
    const recentlyActiveSingles = useMemo(() => {
        const liveIds = new Set(liveSingles.map(m => m.id || m.userId || m.user_id));
        return (Array.isArray(matches) ? matches : []).filter(m => {
            if (!m) return false;
            const mId = m.id || m.userId || m.user_id;
            if (!mId || mId === myId) return false;
            return !liveIds.has(mId);
        }).slice(0, 12);
    }, [matches, liveSingles, myId]);

    const handleWave = async (e: React.MouseEvent, match: any, isLive: boolean) => {
        e.stopPropagation();
        const mId = match.id || match.userId || match.user_id;
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

        if (isLive) {
            toast.success(`👋 Live Wave sent to ${name}! They are online right now.`);
        } else {
            toast.success(`👋 Wave sent to ${name}! They'll see your wave when they check notifications.`);
        }

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

    // If no live users and no matches exist at all, hide component
    if (liveSingles.length === 0 && recentlyActiveSingles.length === 0) return null;

    const hasLiveUsers = liveSingles.length > 0;
    const currentList = activeTab === 'live' ? liveSingles : recentlyActiveSingles;

    return (
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-slate-50/95 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-500/30 p-4 sm:p-5 shadow-xl overflow-hidden backdrop-blur-md">
            {/* Top glowing radar beam line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${hasLiveUsers ? 'via-emerald-400' : 'via-indigo-400'} to-transparent animate-pulse`} />

            {/* Header: Title, Real-Time Presence Badge & Tab Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="relative flex h-3 w-3">
                        {hasLiveUsers ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </>
                        ) : (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </>
                        )}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                        <span>Live Radar</span>
                    </h3>

                    {/* Presence Mode Switcher (Live Now vs Active Today) */}
                    <div className="flex items-center bg-white/70 dark:bg-slate-800/80 border border-indigo-200/80 dark:border-indigo-500/30 rounded-full p-0.5 shadow-sm text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('live')}
                            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'live'
                                    ? hasLiveUsers
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span>⚡ Live Now</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                activeTab === 'live'
                                    ? 'bg-white/20 text-white'
                                    : hasLiveUsers
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                            }`}>
                                {liveSingles.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('recent')}
                            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'recent'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Clock size={11} className={activeTab === 'recent' ? 'text-white' : 'text-amber-500'} />
                            <span>Active Today</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                activeTab === 'recent'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                                {recentlyActiveSingles.length}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                        type="button"
                        onClick={loadOnlineMembers}
                        disabled={isRefreshing}
                        className="text-[11px] text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white bg-white/70 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        title="Rescan radar"
                    >
                        <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-indigo-500' : ''} />
                        <span className="hidden sm:inline">Rescan</span>
                    </button>

                    <button
                        type="button"
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

            {/* View 1: When Live Now Tab is selected but 0 users are currently live */}
            {activeTab === 'live' && liveSingles.length === 0 ? (
                <div className="p-4 sm:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-500/20 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-400/50 dark:border-indigo-500/40 animate-spin" style={{ animationDuration: '8s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Radio size={22} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white">
                            Radar Active & Scanning
                        </h4>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-0.5">
                            No other singles are connected right this second. When someone logs in nearby, their live beacon will pop up here instantly!
                        </p>
                    </div>
                    {recentlyActiveSingles.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('recent')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                                <Clock size={13} />
                                <span>Wave to Singles Active Today ({recentlyActiveSingles.length})</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* View 2: Horizontal Scrollable Carousel (Live Now OR Active Today) */
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1">
                    {currentList.map((match, idx) => {
                        const mId = match.id || match.userId || match.user_id || idx;
                        const pName = match.name || match.full_name || 'Member';
                        const firstName = pName.split(' ')[0];
                        const photo = match.photoUrl || (Array.isArray(match.photos) ? match.photos[0] : '') || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pName)}`;
                        const isWaved = wavedIds.has(mId);
                        const isConnected = Boolean(match.isConnected || match.match_status === 'connected' || match.match_status === 'accepted');
                        const age = match.age || 25;
                        const city = match.city || (typeof match.location === 'string' ? match.location.split(',')[0] : 'Nearby');
                        const isLive = activeTab === 'live';

                        return (
                            <div
                                key={mId}
                                onClick={() => onViewProfile && onViewProfile(match)}
                                className="group flex flex-col items-center shrink-0 w-24 sm:w-28 p-2 rounded-2xl bg-white/95 hover:bg-indigo-50/90 dark:bg-slate-800/60 dark:hover:bg-indigo-950/50 border border-gray-200/90 dark:border-slate-700/60 hover:border-indigo-400/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none shadow-sm"
                            >
                                <div className="relative mb-2">
                                    <img
                                        src={photo}
                                        alt={pName}
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 shadow-md group-hover:scale-105 transition-transform ${
                                            isLive ? 'border-emerald-400/90' : 'border-amber-400/80'
                                        }`}
                                        loading="lazy"
                                    />
                                    {/* Presence Dot: Emerald pulse for Live, Amber clock badge for Active Today */}
                                    {isLive ? (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        </span>
                                    ) : (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm flex items-center justify-center text-[7px] text-white font-black" title="Active today">
                                            🕒
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs font-bold text-gray-900 dark:text-white text-center truncate w-full">
                                    {firstName}
                                </p>
                                
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate w-full">
                                    {age} • {city}
                                </p>

                                <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded-full mt-1 ${
                                    isLive
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}>
                                    {isLive ? 'Live Now' : 'Active Today'}
                                </span>

                                <button
                                    type="button"
                                    onClick={(e) => handleWave(e, match, isLive)}
                                    className={`mt-2 w-full py-1.5 rounded-xl text-[10px] font-black tracking-tight transition-all active:scale-90 flex items-center justify-center gap-1 cursor-pointer ${
                                        isConnected
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                                            : isWaved
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                                                : isLive
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-indigo-500/25'
                                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm'
                                    }`}
                                >
                                    <span>{isConnected ? 'Chat' : isWaved ? 'Waved' : 'Wave'}</span>
                                    <span>{isConnected ? '💬' : isWaved ? '✨' : '👋'}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

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
                                type="button"
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
                                    <span>⚡ Instant Alert to Live Singles</span>
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    When someone is marked <strong>Live Now</strong> with a green beacon, tapping <strong>Wave 👋</strong> delivers an instant real-time ping directly to their screen.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/25 space-y-1">
                                <p className="font-bold text-amber-950 dark:text-white flex items-center gap-1.5">
                                    <span>🕒 Wave to Active Today Members</span>
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    If someone was active earlier today, waving leaves an interest request so they are notified the moment they check back in.
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
                            type="button"
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
