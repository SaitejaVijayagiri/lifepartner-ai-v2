import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Trash2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

// Individual notification row with visible delete button + swipe support + click navigation
function NotifRow({ 
    notif, 
    onDelete, 
    onSelect 
}: { 
    notif: any; 
    onDelete: (id: string) => void;
    onSelect: (notif: any) => void;
}) {
    const startXRef = useRef<number | null>(null);
    const [translateX, setTranslateX] = useState(0);
    const [removing, setRemoving] = useState(false);

    const SWIPE_THRESHOLD = 90;

    const doDelete = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (removing) return;
        setRemoving(true);
        try {
            await api.notifications.remove(notif.id);
        } catch (err) {
            console.error('Delete notification failed:', err);
        }
        onDelete(notif.id);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startXRef.current === null) return;
        const diff = e.touches[0].clientX - startXRef.current;
        if (diff < 0) setTranslateX(Math.max(diff, -180));
    };

    const handleTouchEnd = () => {
        if (translateX < -SWIPE_THRESHOLD) {
            doDelete();
        } else {
            setTranslateX(0);
        }
        startXRef.current = null;
    };

    const bgOpacity = Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD);

    if (removing) return null;

    return (
        <div className="relative overflow-hidden border-b border-gray-100 dark:border-gray-800 last:border-0">
            {/* Red swipe background */}
            <div
                className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 pointer-events-none"
                style={{ opacity: bgOpacity }}
            >
                <Trash2 size={16} className="text-white" />
            </div>

            {/* Row content */}
            <div
                onClick={() => onSelect(notif)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`relative flex items-start gap-3 px-4 py-3 transition-all duration-150 cursor-pointer group
                    ${!notif.is_read ? 'bg-indigo-50/70 dark:bg-indigo-900/25 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                `}
                style={{ transform: `translateX(${translateX}px)` }}
            >
                {/* Unread dot */}
                <div className={`mt-2 w-2 h-2 rounded-full shrink-0 transition-colors ${!notif.is_read ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.6)]' : 'bg-transparent'}`} />

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug transition-colors ${!notif.is_read ? 'font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                        {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                            {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {notif.data?.actionUrl && (
                            <span className="text-[10px] text-indigo-500 flex items-center gap-0.5 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                View <ExternalLink size={10} />
                            </span>
                        )}
                    </div>
                </div>

                {/* Always-visible delete button */}
                <button
                    onClick={doDelete}
                    disabled={removing}
                    className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete notification"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

export default function NotificationDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (typeof window !== 'undefined' && !localStorage.getItem('token')) return;
        try {
            const data = await api.notifications.getAll();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch {
            console.error('Failed to load notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = () => {
        // Instant 0ms optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        api.notifications.markAllRead().catch(e => console.error('Mark all read sync error:', e));
    };

    const handleDelete = (id: string) => {
        const wasUnread = notifications.find(n => n.id === id && !n.is_read);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleSelectNotif = (notif: any) => {
        // 1. Mark as read optimistically
        if (!notif.is_read) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            api.notifications.markRead(notif.id).catch(console.error);
        }

        setIsOpen(false);

        const data = notif.data || {};
        const actionUrl = data.actionUrl || data.url || data.targetUrl;

        // Custom window events to trigger instant tab/chat changes in dashboard without page reload
        if (typeof window !== 'undefined') {
            if (notif.type === 'request' || actionUrl?.includes('requests')) {
                window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'requests' } }));
            } else if (notif.type === 'like' || notif.type === 'match' || actionUrl?.includes('matches')) {
                window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'matches' } }));
            } else if (data.partnerId) {
                window.dispatchEvent(new CustomEvent('openChat', { detail: { partnerId: data.partnerId, partnerName: data.partnerName } }));
            } else if (data.profileId) {
                window.dispatchEvent(new CustomEvent('openProfile', { detail: { profileId: data.profileId } }));
            }
        }

        if (actionUrl) {
            router.push(actionUrl);
        } else if (notif.type === 'request') {
            router.push('/dashboard?tab=requests');
        } else if (notif.type === 'like' || notif.type === 'match') {
            router.push('/dashboard?tab=matches');
        } else if (notif.type === 'direct_message') {
            router.push('/dashboard?tab=connections');
        }
    };

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(o => !o)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Notifications"
            >
                <Bell size={24} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-[1050]" onClick={() => setIsOpen(false)} />

                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[1100] animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline font-medium">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Swipe hint — mobile only */}
                        {notifications.length > 0 && (
                            <p className="text-[10px] text-gray-400 text-center py-1.5 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 sm:hidden">
                                Tap 🗑️ or swipe left to delete
                            </p>
                        )}

                        {/* List */}
                        <div className="max-h-[380px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />
                                    <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <NotifRow 
                                        key={notif.id} 
                                        notif={notif} 
                                        onDelete={handleDelete} 
                                        onSelect={handleSelectNotif} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
