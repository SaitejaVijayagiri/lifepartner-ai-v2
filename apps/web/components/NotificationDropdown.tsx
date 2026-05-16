'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

// Individual swipeable notification row
function SwipeableNotif({ notif, onDelete }: { notif: any; onDelete: (id: string) => void }) {
    const startXRef = useRef<number | null>(null);
    const [translateX, setTranslateX] = useState(0);
    const [swiped, setSwiped] = useState(false); // fully swiped out
    const [deleting, setDeleting] = useState(false);

    const SWIPE_THRESHOLD = 120; // px to trigger delete

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startXRef.current === null) return;
        const diff = e.touches[0].clientX - startXRef.current;
        // Only allow left swipe
        if (diff < 0) setTranslateX(diff);
    };

    const handleTouchEnd = async () => {
        if (translateX < -SWIPE_THRESHOLD) {
            // Animate fully out then delete
            setSwiped(true);
            setDeleting(true);
            try {
                await api.notifications.delete(notif.id);
            } catch {}
            setTimeout(() => onDelete(notif.id), 350);
        } else {
            // Snap back
            setTranslateX(0);
        }
        startXRef.current = null;
    };

    // Show red background proportionally
    const deleteOpacity = Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD);

    return (
        <div className="relative overflow-hidden">
            {/* Red delete background */}
            <div
                className="absolute inset-0 bg-red-500 flex items-center justify-end pr-5 transition-opacity"
                style={{ opacity: deleteOpacity }}
            >
                <Trash2 size={20} className="text-white" />
                <span className="text-white text-xs font-bold ml-2">Delete</span>
            </div>

            {/* Notification content */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`relative border-b border-gray-50 dark:border-gray-800 transition-all duration-300 ease-out
                    ${!notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/30' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}
                    ${swiped ? 'opacity-0 max-h-0 py-0' : 'max-h-40 opacity-100'}
                `}
                style={{ transform: swiped ? 'translateX(-100%)' : `translateX(${translateX}px)` }}
            >
                <div className="flex items-start gap-3 p-4">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                            {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                        </p>
                    </div>
                    {/* Tap-to-delete button (desktop fallback) */}
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            setSwiped(true);
                            setDeleting(true);
                            try { await api.notifications.delete(notif.id); } catch {}
                            setTimeout(() => onDelete(notif.id), 350);
                        }}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1 rounded opacity-0 group-hover:opacity-100 hidden sm:block"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                {/* Swipe hint — shown on first render briefly */}
                {Math.abs(translateX) > 10 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 opacity-60">
                        <Trash2 size={16} />
                    </div>
                )}
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
        } catch (e) {
            console.error("Failed to load notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllRead = async () => {
        await api.notifications.markAllRead();
        fetchNotifications();
    };

    const handleDelete = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Notifications"
            >
                <Bell size={24} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Swipe hint */}
                    {notifications.length > 0 && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center py-1.5 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 sm:hidden">
                            ← Swipe left to delete
                        </p>
                    )}

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                No notifications yet
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notif: any) => (
                                    <div key={notif.id} className="group">
                                        <SwipeableNotif notif={notif} onDelete={handleDelete} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
