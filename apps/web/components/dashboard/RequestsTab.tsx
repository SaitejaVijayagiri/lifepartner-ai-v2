'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Briefcase, X, Check, Bell, MessageCircle, Eye, Sparkles, Phone } from 'lucide-react';
import { Notifications } from '@/lib/notifications';
import { api } from '@/lib/api';

interface RequestsTabProps {
    requests: any[];
    handleAcceptRequest: (requestId: string) => Promise<void>;
    handleDeclineRequest: (requestId: string) => Promise<void>;
    loading: boolean;
    onViewProfile?: (user: any) => void;
    onNavigateTab?: (tab: string) => void;
    connectionsCount?: number;
    onOpenCallHistory?: () => void;
}

export default function RequestsTab({
    requests,
    handleAcceptRequest,
    handleDeclineRequest,
    loading,
    onViewProfile,
    onNavigateTab,
    connectionsCount = 0,
    onOpenCallHistory
}: RequestsTabProps) {
    const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
    const [permissionStatus, setPermissionStatus] = useState<string>('granted');
    const [isEnabling, setIsEnabling] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    // Pre-cache request user profiles so clicking any request opens details instantly in 0ms
    useEffect(() => {
        if (Array.isArray(requests)) {
            requests.forEach((req: any) => {
                if (req?.fromUser?.id) {
                    api.profile.setCachedProfile(req.fromUser);
                }
            });
        }
    }, [requests]);

    const handleEnablePush = async () => {
        setIsEnabling(true);
        try {
            const granted = await Notifications.requestPermission();
            if (granted) {
                setPermissionStatus('granted');
            }
        } catch (_) {
        } finally {
            setIsEnabling(false);
        }
    };

    const handleInspectProfile = (fromUser: any) => {
        if (!onViewProfile || !fromUser) return;
        const photos = Array.isArray(fromUser.photos) && fromUser.photos.length > 0
            ? fromUser.photos
            : (fromUser.photoUrl ? [fromUser.photoUrl] : []);

        // Instant optimistic full-profile dispatch (0ms)
        api.profile.setCachedProfile(fromUser);
        onViewProfile({
            ...fromUser,
            photos
        });

        if (fromUser.id) {
            api.profile.getById(fromUser.id).then((full: any) => {
                if (full) {
                    onViewProfile({
                        ...fromUser,
                        ...full,
                        photos: Array.isArray(full.photos) && full.photos.length > 0 ? full.photos : photos
                    });
                }
            }).catch(() => {});
        }
    };

    const onAccept = async (id: string) => {
        setActioningIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        try {
            await handleAcceptRequest(id);
        } finally {
            setActioningIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const onDecline = async (id: string) => {
        setActioningIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        try {
            await handleDeclineRequest(id);
        } finally {
            setActioningIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-500">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 space-y-4">
            {/* Unified Communication Hub Switcher */}
            {onNavigateTab && (
                <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                    <button
                        onClick={() => onNavigateTab('connections')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all"
                    >
                        <MessageCircle size={16} />
                        <span>Active Chats</span>
                        <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {connectionsCount}
                        </span>
                    </button>
                    <button
                        onClick={() => onNavigateTab('requests')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700 transition-all"
                    >
                        <Heart size={16} className="fill-indigo-600 dark:fill-indigo-400" />
                        <span>Requests</span>
                        <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {requests.length}
                        </span>
                    </button>
                    {onOpenCallHistory && (
                        <button
                            onClick={onOpenCallHistory}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all"
                            title="Call History"
                        >
                            <Phone size={15} />
                            <span className="hidden sm:inline">Calls</span>
                        </button>
                    )}
                </div>
            )}

            {/* Push Notification Opt-in Banner for Offline Friend Requests */}
            {permissionStatus === 'default' && (
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-800/40 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                            <Bell size={18} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Get Instant Friend Request Alerts</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">Receive alerts on your lock screen when someone sends or accepts an interest request.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleEnablePush}
                        disabled={isEnabling}
                        className="shrink-0 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isEnabling ? 'Enabling...' : 'Turn On'}
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Pending Interest Requests
                        <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-0.5 rounded-full text-sm font-extrabold">
                            {requests.length}
                        </span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Tap on any profile photo or name to inspect their full details before accepting
                    </p>
                </div>
            </div>

            {requests.length === 0 && (
                <div className="text-center py-16 px-4 bg-white/80 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
                        <Heart className="w-8 h-8 text-rose-400 dark:text-rose-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-800 dark:text-gray-200 font-bold text-base">No pending requests right now</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            Send interest to profiles you like or join a live video room to spark new connections!
                        </p>
                    </div>
                    {onNavigateTab && (
                        <button
                            onClick={() => onNavigateTab('matches')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            <Sparkles size={14} />
                            <span>Explore Compatible Matches</span>
                        </button>
                    )}
                </div>
            )}

            {requests.map((req: any) => (
                <div key={req.interactionId} className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-300 justify-between group overflow-hidden relative">
                    {/* Decorative gradient blur */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div
                        onClick={() => handleInspectProfile(req.fromUser)}
                        className={`flex items-center gap-4 w-full sm:w-auto relative z-10 ${onViewProfile ? 'cursor-pointer group/profile' : ''}`}
                    >
                        <div className="relative shrink-0">
                            <img 
                                src={req.fromUser.photoUrl || '/avatar-fallback.svg'} 
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg shrink-0 group-hover/profile:ring-2 group-hover/profile:ring-indigo-500 transition-all" 
                                alt={req.fromUser.name || 'User'}
                                onError={(e) => { 
                                    const t = e.target as HTMLImageElement; 
                                    t.onerror = null; 
                                    t.src = '/avatar-fallback.svg'; 
                                }} 
                            />
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-rose-400 to-pink-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                                <Heart size={12} fill="white" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 group-hover/profile:text-indigo-600 dark:group-hover/profile:text-indigo-400 transition-colors">
                                <span className="truncate">{req.fromUser.name || 'Someone'}</span>
                                {req.fromUser.age && <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md shrink-0">{req.fromUser.age} yrs</span>}
                            </h4>
                            <div className="flex flex-col gap-1 mt-1">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-indigo-400 shrink-0" />
                                    <span className="truncate">{typeof req.fromUser.location === 'string' ? req.fromUser.location : (req.fromUser.location?.city || "India")}</span>
                                </p>
                                {req.fromUser.career?.profession && (
                                     <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                         <Briefcase size={14} className="text-indigo-400 shrink-0" /> 
                                         <span className="truncate">{req.fromUser.career.profession}</span>
                                     </p>
                                )}
                                {onViewProfile && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                        <Eye size={12} /> View Full Profile →
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-2.5 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700 relative z-10">
                        <button 
                            onClick={() => onDecline(req.interactionId)} 
                            disabled={actioningIds.has(req.interactionId)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 dark:bg-gray-800 dark:hover:bg-rose-900/20 border border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:hover:text-rose-400 rounded-2xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X size={16} strokeWidth={2.5} /> Decline
                        </button>
                        <button 
                            onClick={() => onAccept(req.interactionId)} 
                            disabled={actioningIds.has(req.interactionId)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={16} strokeWidth={2.5} /> Accept
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
