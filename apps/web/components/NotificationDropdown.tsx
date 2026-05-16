'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

// Individual swipeable notification row
function SwipeableNotif({ notif, onDelete }: { notif: any; onDelete: (id: string) => void }) {
    const startXRef = useRef<number | null>(null);
    const [translateX, setTranslateX] = useState(0);
    const [swiped, setSwiped] = useState(false);

    const SWIPE_THRESHOLD = 100; // px to trigger delete

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startXRef.current === null) return;
        const diff = e.touches[0].clientX - startXRef.current;
        if (diff < 0) setTranslateX(Math.max(diff, -200)); // cap at -200px
    };

    const handleTouchEnd = async () => {
        if (translateX < -SWIPE_THRESHOLD) {
            setSwiped(true);
            try { await api.notifications.remove(notif.id); } catch {}
            setTimeout(() => onDelete(notif.id), 300);
        } else {
            setTranslateX(0); // snap back
        }
        startXRef.current = null;
    };

    const deleteOpacity = Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD);

    if (swiped) return null;

    return (
        <div className="relative overflow-hidden">
            {/* Red delete background */}
            <div
                className="absolute inset-0 bg-red-500 flex items-center justify-end pr-5"
                style={{ opacity: deleteOpacity }}
            >
                <Trash2 size={18} className="text-white" />
                <span className="text-white text-xs font-bold ml-1.5">Delete</span>
            </div>

            {/* Notification row */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`relative border-b border-gray-50 dark:border-gray-800 transition-transform duration-200
                    ${!notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}
                `}
                style={{ transform: `translateX(${translateX}px)` }}
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
                    {/* Desktop delete button */}
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            setSwiped(true);
                            try { await api.notifications.remove(notif.id); } catch {}
                            setTimeout(() => onDelete(notif.id), 300);
                        }}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1 rounded sm:block hidden"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
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
        setUnreadCount(prev => {
            const wasUnread = notifications.find(n => n.id === id && !n.is_read);
            return wasUnread ? Math.max(0, prev - 1) : prev;
        });
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
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[1100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <p className="text-[10px] text-gray-400 text-center py-1.5 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 sm:hidden">
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
                            notifications.map((notif: any) => (
                                <SwipeableNotif key={notif.id} notif={notif} onDelete={handleDelete} />
                            ))
                        )}
                    </div>
                </div>
            )}

            {isOpen && <div className="fixed inset-0 z-[1050]" onClick={() => setIsOpen(false)} />}
        </div>
    );
}
