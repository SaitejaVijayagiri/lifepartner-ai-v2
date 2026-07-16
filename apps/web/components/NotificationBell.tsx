'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Heart, Eye, Camera, MessageCircle, Sparkles } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const NotificationBell = () => {
    const { socket } = useSocket() as any;
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Initial
    const fetchNotifications = async () => {
        try {
            const res = await api.notifications.getAll();
            if (res) {
                setNotifications(res.notifications);
                setUnreadCount(res.unreadCount);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (socket) {
            const handleNewNotification = (data: any) => {
                // console.log("🔔 New Notification:", data);
                // Add to list, increment unread
                setNotifications((prev: any[]) => [data, ...prev]);
                setUnreadCount((prev: number) => prev + 1);
            };

            socket.on('notification:new', handleNewNotification);
            return () => {
                socket.off('notification:new', handleNewNotification);
            };
        }
    }, [socket]);

    const markRead = async (id: string) => {
        try {
            await api.notifications.markRead(id);
            setNotifications((prev: any[]) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount((prev: number) => Math.max(0, prev - 1));
        } catch (e) { }
    };

    const deleteNotif = async (id: string) => {
        try {
            await api.notifications.remove(id);
            const wasUnread = notifications.find((n: any) => n.id === id && !n.is_read);
            setNotifications((prev: any[]) => prev.filter(n => n.id !== id));
            if (wasUnread) setUnreadCount((prev: number) => Math.max(0, prev - 1));
        } catch (e) { console.error('Delete failed', e); }
    };

    const markAllRead = async () => {
        try {
            await api.notifications.markAllRead();
            setNotifications((prev: any[]) => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) { }
    };

    const handleNotificationClick = async (n: any) => {
        if (n.id && !n.is_read) {
            await markRead(n.id);
        }

        const fromUserId = n.fromUserId || n.data?.fromUserId;
        const type = n.type;

        setIsOpen(false);

        if ((type === 'match' || type === 'connection_online') && fromUserId) {
            router.push(`/chat/${fromUserId}?name=${encodeURIComponent(n.fromUserName || 'Member')}`);
        } else if (type === 'view' && fromUserId) {
            router.push(`/profile/${fromUserId}`);
        } else if (type === 'request') {
            if (typeof window !== 'undefined') {
                localStorage.setItem('dashboard_active_tab', 'requests');
                window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'requests' } }));
            }
            router.push('/dashboard?tab=requests');
        } else if (type === 'like') {
            if (typeof window !== 'undefined') {
                localStorage.setItem('dashboard_active_tab', 'matches');
                window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'matches' } }));
            }
            router.push('/dashboard?tab=matches');
        } else if (type === 'story' && fromUserId) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('dashboard_active_tab', 'matches');
                window.dispatchEvent(new CustomEvent('changeTab', { detail: { tab: 'matches' } }));
            }
            router.push('/dashboard?tab=matches');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-gray-800"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm border border-white dark:border-gray-900">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:mt-2 md:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[1100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                {notifications.map((n, i) => {
                                    const dateStr = n.created_at || n.timestamp;
                                    const dateObj = dateStr ? new Date(dateStr) : new Date();
                                    const isValidDate = !isNaN(dateObj.getTime());

                                    const getNotifIcon = (type: string) => {
                                        switch (type) {
                                            case 'request':
                                                return <Heart size={14} className="text-pink-500" />;
                                            case 'like':
                                                return <Heart size={14} className="text-rose-500 fill-rose-500" />;
                                            case 'view':
                                                return <Eye size={14} className="text-cyan-500" />;
                                            case 'match':
                                                return <Sparkles size={14} className="text-amber-500 fill-amber-500" />;
                                            case 'connection_online':
                                                return <Sparkles size={14} className="text-emerald-500 fill-emerald-500" />;
                                            case 'story':
                                                return <Camera size={14} className="text-indigo-500" />;
                                            default:
                                                return <Bell size={14} className="text-blue-500" />;
                                        }
                                    };

                                    return (
                                        <div
                                            key={n.id || i}
                                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/30' : ''}`}
                                            onClick={() => handleNotificationClick(n)}
                                        >
                                            <div className="mt-1 flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                                {getNotifIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                                                    {n.message}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {isValidDate ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    {' · '}
                                                    {isValidDate ? dateObj.toLocaleDateString() : ''}
                                                </p>
                                            </div>
                                            {/* Delete button */}
                                            {n.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                                                    className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/30 text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Real-time updates active</p>
                    </div>
                </div>
            )}
        </div>
    );
};
