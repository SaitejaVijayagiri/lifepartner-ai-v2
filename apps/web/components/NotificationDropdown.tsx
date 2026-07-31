'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

// Individual notification row with visible delete button + swipe support
function NotifRow({ notif, onDelete }: { notif: any; onDelete: (id: string) => void }) {
    const startXRef = useRef<number | null>(null);
    const [translateX, setTranslateX] = useState(0);
    const [removing, setRemoving] = useState(false);

    const SWIPE_THRESHOLD = 90;

    const doDelete = async () => {
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`relative flex items-start gap-3 px-4 py-3 transition-transform duration-150
                    ${!notif.is_read ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                `}
                style={{ transform: `translateX(${translateX}px)` }}
            >
                {/* Unread dot */}
                <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                        {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(notif.created_at).toLocaleString()}
                    </p>
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
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
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
                                    <NotifRow key={notif.id} notif={notif} onDelete={handleDelete} />
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
