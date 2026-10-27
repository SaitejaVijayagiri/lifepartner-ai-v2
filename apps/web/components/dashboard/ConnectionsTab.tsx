'use client';

import { useState } from 'react';
import { MessageCircle, Trash2, Bell, BellOff, Gamepad2, Search, X, Heart, Eye, Sparkles, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { filterActive24hStories } from '@/lib/utils';

interface ConnectionsTabProps {
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    connections: any[];
    setConnections: React.Dispatch<React.SetStateAction<any[]>>;
    onlineUsers: string[];
    openChat: (conn: any) => void;
    setGameTarget: React.Dispatch<React.SetStateAction<{ id: string; name: string } | null>>;
    setUnreadMessageCount: React.Dispatch<React.SetStateAction<number>>;
    onOpenStory?: (storySet: { user: any; stories: any[] }) => void;
    onViewProfile?: (user: any) => void;
    onNavigateTab?: (tab: string) => void;
    requestsCount?: number;
    onOpenCallHistory?: () => void;
}

export default function ConnectionsTab({
    currentUser,
    setCurrentUser,
    connections,
    setConnections,
    onlineUsers,
    openChat,
    setGameTarget,
    setUnreadMessageCount,
    onOpenStory,
    onViewProfile,
    onNavigateTab,
    requestsCount = 0,
    onOpenCallHistory
}: ConnectionsTabProps) {
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    const isConnOnline = (c: any) => {
        if (!c || !c.partner || !c.partner.id) return false;
        return Array.isArray(onlineUsers)
            ? onlineUsers.includes(c.partner.id)
            : Boolean(c.partner.isOnline);
    };

    // Sort connections so online users appear at the top, preserving recent-message order within groups
    const safeConns = Array.isArray(connections) ? connections : [];
    const onlineConns = safeConns.filter(c => c && c.partner && isConnOnline(c));
    const offlineConns = safeConns.filter(c => c && c.partner && !isConnOnline(c));
    const sortedConnections = [...onlineConns, ...offlineConns];

    // Filter connections based on search query (matches name, role, or location)
    const filteredConnections = sortedConnections.filter((conn: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = (conn.partner?.name || '').toLowerCase();
        const role = (conn.partner?.role || '').toLowerCase();
        const location = (conn.partner?.location || '').toLowerCase();
        return name.includes(q) || role.includes(q) || location.includes(q);
    });

    const currentUserId = currentUser?.id || currentUser?.userId;

    const handleInspectProfile = (e: React.MouseEvent, partner: any) => {
        e.stopPropagation();
        if (!onViewProfile || !partner) return;
        const photos = Array.isArray(partner.photos) && partner.photos.length > 0
            ? partner.photos
            : (partner.photoUrl ? [partner.photoUrl] : []);
        onViewProfile({
            ...partner,
            photos
        });
        if (partner.id) {
            api.profile.getById(partner.id).then((full: any) => {
                if (full) {
                    onViewProfile({
                        ...partner,
                        ...full,
                        photos: Array.isArray(full.photos) && full.photos.length > 0 ? full.photos : photos
                    });
                }
            }).catch(() => {});
        }
    };

    const handleDeleteConnection = async (e: React.MouseEvent, conn: any) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to remove this connection?")) return;
        try {
            await api.interactions.deleteConnection(conn.interactionId);
            setConnections(prev => {
                const updated = prev.filter((c: any) => c.interactionId !== conn.interactionId);
                // Update global unread message count
                const totalUnread = updated.reduce((acc: number, curr: any) => acc + (curr.unreadCount || 0), 0);
                setUnreadMessageCount(totalUnread);
                return updated;
            });
            toast.success("Connection removed");
        } catch (err) {
            toast.error("Failed to remove");
        }
    };

    const handleToggleMute = async (e: React.MouseEvent, conn: any) => {
        e.stopPropagation();
        try {
            const res = await api.profile.toggleMute(conn.partner.id);
            if (res.isMuted !== undefined) {
                const currentMuted: string[] = currentUser?.muted_users || [];
                const newMuted = res.isMuted
                    ? [...currentMuted, conn.partner.id]
                    : currentMuted.filter((id: string) => id !== conn.partner.id);
                setCurrentUser((prev: any) => ({ ...prev, muted_users: newMuted }));
                toast.success(res.isMuted ? `${conn.partner.name} muted` : `${conn.partner.name} unmuted`);
            }
        } catch (err) {
            toast.error("Failed to update mute");
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-2 sm:py-6 space-y-4">
            {/* Unified Communication Hub Switcher */}
            {onNavigateTab && (
                <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                    <button
                        onClick={() => onNavigateTab('connections')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700 transition-all"
                    >
                        <MessageCircle size={16} className="fill-indigo-600/10" />
                        <span>Active Chats</span>
                        <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {sortedConnections.length}
                        </span>
                    </button>
                    <button
                        onClick={() => onNavigateTab('requests')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all relative"
                    >
                        <Heart size={16} className={requestsCount > 0 ? 'text-rose-500 fill-rose-500 animate-pulse' : ''} />
                        <span>Requests</span>
                        <span className={`px-1.5 py-0.5 text-[11px] rounded-full ${requestsCount > 0 ? 'bg-rose-500 text-white font-extrabold' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                            {requestsCount}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Your Connections
                        <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-0.5 rounded-full text-sm font-extrabold">
                            {sortedConnections.length}
                        </span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {onlineConns.length > 0 ? `${onlineConns.length} connection${onlineConns.length > 1 ? 's' : ''} online right now` : 'Tap any connection to start chatting or play an icebreaker game'}
                    </p>
                </div>
            </div>

            {/* Friend List Search Input */}
            {sortedConnections.length > 0 && (
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search connections by name, location, or role..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {sortedConnections.length === 0 && (
                <div className="text-center py-16 px-4 bg-white/80 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/40">
                        <MessageCircle className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-800 dark:text-gray-200 font-bold text-base">No active connections yet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            Once you or a match accept an interest request, your private chat and voice call room will appear here.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                        {onNavigateTab && (
                            <button
                                onClick={() => onNavigateTab('matches')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                <Sparkles size={14} />
                                <span>Browse Compatible Matches</span>
                            </button>
                        )}
                        {onNavigateTab && requestsCount > 0 && (
                            <button
                                onClick={() => onNavigateTab('requests')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all active:scale-95"
                            >
                                <Heart size={14} className="fill-rose-500 text-rose-500" />
                                <span>View {requestsCount} Pending Request{requestsCount > 1 ? 's' : ''}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {sortedConnections.length > 0 && filteredConnections.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-medium">
                    No connections found matching &quot;{searchQuery}&quot;
                </div>
            )}

            {filteredConnections.map((conn: any) => {
                if (!conn || !conn.partner) return null;
                const stories: any[] = Array.isArray(conn.partner?.stories) ? conn.partner.stories : [];
                const activeStories = filterActive24hStories(stories);
                const hasStories = activeStories.length > 0;
                const isAllViewed = Boolean(hasStories && activeStories.every((s: any) => (Array.isArray(s.views) ? s.views : []).some((v: any) => (v.userId || v.user_id) === currentUserId)));

                return (
                    <div
                        key={conn.interactionId}
                        className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all hover:shadow-md group"
                    >
                        <div
                            className="flex items-center gap-4 flex-1 cursor-pointer w-full sm:w-auto"
                            onClick={() => openChat(conn)}
                        >
                            <div
                                className="relative shrink-0"
                                onClick={(e) => {
                                    if (hasStories && onOpenStory) {
                                        e.stopPropagation();
                                        onOpenStory({ user: conn.partner, stories: activeStories });
                                    }
                                }}
                            >
                                <div className={
                                    hasStories
                                        ? isAllViewed
                                            ? 'w-14 h-14 rounded-full p-[2.5px] bg-slate-300 dark:bg-slate-700 transition-all cursor-pointer'
                                            : 'w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 shadow-md shadow-orange-500/30 transition-all cursor-pointer hover:scale-105'
                                        : 'w-14 h-14 rounded-full'
                                }>
                                    <div className="w-full h-full rounded-full p-[1.5px] bg-white dark:bg-gray-800">
                                        <img 
                                            src={conn.partner.photoUrl || '/avatar-fallback.svg'} 
                                            className="w-full h-full rounded-full object-cover shrink-0" 
                                            alt={conn.partner.name || 'User'}
                                            onError={(e) => { 
                                                const t = e.target as HTMLImageElement; 
                                                t.onerror = null; 
                                                t.src = '/avatar-fallback.svg'; 
                                            }} 
                                        />
                                    </div>
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${isConnOnline(conn) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                                        {conn.partner.name}
                                    </h4>
                                    {conn.unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center shadow-sm animate-pulse">
                                            {conn.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {isConnOnline(conn) ? '🟢 Online now' : 'Offline'} • Tap to open chat
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0 mt-1 sm:mt-0">
                            {onViewProfile && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full"
                                    title="View Full Profile"
                                    onClick={(e) => handleInspectProfile(e, conn.partner)}
                                >
                                    <Eye size={18} />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                title="Remove Connection"
                                onClick={(e) => handleDeleteConnection(e, conn)}
                            >
                                <Trash2 size={18} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                title={currentUser?.muted_users?.includes(conn.partner.id) ? "Unmute Notifications" : "Mute Notifications"}
                                className={currentUser?.muted_users?.includes(conn.partner.id)
                                    ? "text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full"
                                    : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full"}
                                onClick={(e) => handleToggleMute(e, conn)}
                            >
                                {currentUser?.muted_users?.includes(conn.partner.id)
                                    ? <BellOff size={18} />
                                    : <Bell size={18} />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Snakes & Ladders Arena + Voice Chat"
                                className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGameTarget({ id: conn.partner.id, name: conn.partner.name });
                                }}
                            >
                                <Gamepad2 size={18} className="text-purple-600 dark:text-purple-400" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full"
                                title="Open Chat"
                                onClick={() => openChat(conn)}
                            >
                                <MessageCircle size={19} />
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
