'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { X, Heart, Camera, Sparkles, Bell } from 'lucide-react';

interface NotificationToast {
    id: string;
    type: 'request' | 'like' | 'story' | 'match' | string;
    message: string;
    fromUserId?: string;
    fromUserName?: string;
    fromUserPhoto?: string;
    timestamp: Date;
}

// Synthesize a beautiful, premium, soft sine-wave chime using browser Web Audio API
const playNotificationSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Helper to play a soft tone with exponential decay envelope
        const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Attack / Decay envelope
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.04); // 40ms attack
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // smooth decay
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        const now = audioCtx.currentTime;
        // Premium arpeggio chime (E5 -> B5) with a 120ms offset for a crisp "chime" sound
        playTone(659.25, now, 0.4, 0.07);
        playTone(987.77, now + 0.12, 0.5, 0.05);
        
    } catch (e) {
        console.warn("Failed to play notification sound:", e);
    }
};

export default function NotificationToastBanner() {
    const { socket } = useSocket() as any;
    const router = useRouter();
    const pathname = usePathname();
    const [toasts, setToasts] = useState<NotificationToast[]>([]);
    const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

    const dismiss = (id: string) => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data: any) => {
            // console.log("🔔 New Realtime Notification:", data);

            // 1. Check if the user is currently on a full-screen view where toasts would be annoying (like active calls)
            if (pathname?.includes('/call') || pathname?.includes('/video')) return;

            const toastId = `notif-${Date.now()}`;
            
            // Build the toast object
            const newToast: NotificationToast = {
                id: toastId,
                type: data.type || 'info',
                message: data.message || 'New notification',
                fromUserId: data.fromUserId,
                fromUserName: data.fromUserName || 'LifePartner Member',
                fromUserPhoto: data.fromUserPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fromUserName || 'User')}`,
                timestamp: new Date(data.timestamp || Date.now())
            };

            setToasts(prev => {
                // Max 3 toasts, filter out existing toast from the same user for the same type to prevent spamming
                const filtered = prev.filter(t => !(t.fromUserId === data.fromUserId && t.type === data.type));
                const updated = [...filtered, newToast];
                return updated.slice(-3); // Keep only the latest 3
            });

            // Play the premium chime arpeggio
            playNotificationSound();

            // Auto-dismiss after 6 seconds
            timersRef.current[toastId] = setTimeout(() => {
                dismiss(toastId);
            }, 6000);
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, [socket, pathname]);

    if (toasts.length === 0) return null;

    // Helper to get styling based on notification type
    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'request':
                return {
                    borderColor: 'border-pink-500',
                    shadowColor: 'hover:shadow-pink-200/80 dark:hover:shadow-pink-900/30',
                    iconBg: 'bg-pink-100 dark:bg-pink-950 text-pink-500',
                    icon: Heart,
                    targetTab: 'requests'
                };
            case 'like':
                return {
                    borderColor: 'border-rose-500',
                    shadowColor: 'hover:shadow-rose-200/80 dark:hover:shadow-rose-900/30',
                    iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-500',
                    icon: Heart,
                    targetTab: 'matches' // Likes show at the top of matches
                };
            case 'story':
                return {
                    borderColor: 'border-indigo-500',
                    shadowColor: 'hover:shadow-indigo-200/80 dark:hover:shadow-indigo-900/30',
                    iconBg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-500',
                    icon: Camera,
                    targetTab: 'matches' // Stories show at the top of matches
                };
            case 'match':
                return {
                    borderColor: 'border-amber-500',
                    shadowColor: 'hover:shadow-amber-200/80 dark:hover:shadow-amber-900/30',
                    iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-500',
                    icon: Sparkles,
                    targetTab: 'connections' // Matches go to chat tab
                };
            default:
                return {
                    borderColor: 'border-blue-500',
                    shadowColor: 'hover:shadow-blue-200/80 dark:hover:shadow-blue-900/30',
                    iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-500',
                    icon: Bell,
                    targetTab: 'matches'
                };
        }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[360px] px-4 md:px-0">
            {toasts.map((toast) => {
                const config = getTypeConfig(toast.type);
                const IconComponent = config.icon;

                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex gap-3 bg-white dark:bg-gray-900 border-l-4 ${config.borderColor} rounded-xl shadow-xl p-4 w-full animate-in slide-in-from-top-8 md:slide-in-from-right-8 fade-in duration-300 cursor-pointer hover:scale-[1.02] ${config.shadowColor} transition-all border border-gray-100 dark:border-gray-800`}
                        onClick={() => {
                            dismiss(toast.id);
                            
                            // 1. Sync the active tab in localStorage
                            if (typeof window !== 'undefined') {
                                localStorage.setItem('dashboard_active_tab', config.targetTab);
                                // Dispatch custom event in case user is already on `/dashboard`
                                window.dispatchEvent(new CustomEvent('changeTab', { 
                                    detail: { tab: config.targetTab } 
                                }));
                            }

                            // 2. Navigate to dashboard or matching screen
                            if (toast.type === 'match' && toast.fromUserId) {
                                router.push(`/chat/${toast.fromUserId}?name=${encodeURIComponent(toast.fromUserName || '')}&photo=${encodeURIComponent(toast.fromUserPhoto || '')}`);
                            } else {
                                router.push('/dashboard');
                            }
                        }}
                    >
                        {/* Sender Photo with Type Icon Badge */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={toast.fromUserPhoto}
                                alt={toast.fromUserName}
                                className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                                onError={(e) => {
                                    const t = e.target as HTMLImageElement;
                                    t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(toast.fromUserName || 'User')}`;
                                }}
                            />
                            {/* Type Icon Badge */}
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 ${config.iconBg} shadow-sm`}>
                                <IconComponent size={12} className="stroke-[2.5]" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                                {toast.type === 'request' ? 'Interest Request' : toast.type === 'like' ? 'Profile Like' : toast.type === 'story' ? 'New Story' : toast.type === 'match' ? 'It\'s a Match!' : 'Notification'}
                            </p>
                            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-snug">
                                {toast.message}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                            className="flex-shrink-0 self-start p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
