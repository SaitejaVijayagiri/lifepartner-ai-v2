'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { X, MessageCircle } from 'lucide-react';

interface MessageToast {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto: string;
    text: string;
}

export default function MessageToastBanner() {
    const { socket } = useSocket() as any;
    const router = useRouter();
    const pathname = usePathname();
    const [toasts, setToasts] = useState<MessageToast[]>([]);
    const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

    const dismiss = (id: string) => {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: any) => {
            // 1. Don't show my own messages
            const myId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
            if (!myId || msg.senderId === myId || msg.senderId === 'me') return;

            // 2. Don't show if on the dedicated /chat/[id] page for this sender
            if (pathname?.includes(msg.senderId)) return;

            // 3. Don't show if the chat window is open in dashboard for this sender
            //    (Dashboard sets window.__activeChatPartnerId when a chat is open)
            if (typeof window !== 'undefined' && (window as any).__activeChatPartnerId === msg.senderId) return;

            // 4. Don't show if on a call page or call is active
            if (pathname?.includes('/call') || pathname?.includes('/video')) return;

            const toastId = `msg-${Date.now()}`;
            const preview = msg.text?.startsWith('[IMAGE]') ? '📷 Sent a photo'
                : msg.text?.startsWith('[AUDIO]') ? '🎤 Sent a voice message'
                : msg.text?.startsWith('[STICKER]') ? '🎭 Sent a sticker'
                : msg.text?.startsWith('[STORY_REPLY:') ? (() => {
                    const endIdx = msg.text.indexOf(']');
                    const replyText = endIdx !== -1 ? msg.text.substring(endIdx + 1) : '';
                    return replyText ? `📸 Replied to your story: "${replyText}"` : '📸 Replied to your story';
                  })()
                : (msg.text || '').substring(0, 60) + ((msg.text || '').length > 60 ? '...' : '');

            const newToast: MessageToast = {
                id: toastId,
                senderId: msg.senderId,
                senderName: msg.senderName || 'New Message',
                senderPhoto: msg.senderPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderId}`,
                text: preview,
            };

            setToasts(prev => {
                // Max 3 toasts at once, replace existing toast from same sender
                const updated = [...prev.filter(t => t.senderId !== msg.senderId), newToast];
                return updated.slice(-3);
            });

            // Auto-dismiss after 5 seconds
            timersRef.current[toastId] = setTimeout(() => {
                dismiss(toastId);
            }, 5000);
        };

        socket.on('receiveMessage', handleNewMessage);
        return () => {
            socket.off('receiveMessage', handleNewMessage);
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, [socket, pathname]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl px-4 py-3 w-[300px] max-w-[90vw] animate-in slide-in-from-right-8 fade-in duration-300 cursor-pointer hover:shadow-indigo-200 dark:hover:shadow-indigo-900 hover:scale-[1.02] transition-all"
                    onClick={() => {
                        dismiss(toast.id);
                        if (pathname === '/dashboard') {
                            window.dispatchEvent(new CustomEvent('openChat', { 
                                detail: { 
                                    partnerId: toast.senderId, 
                                    partnerName: toast.senderName, 
                                    partnerPhoto: toast.senderPhoto 
                                } 
                            }));
                        } else {
                            router.push(`/chat/${toast.senderId}?name=${encodeURIComponent(toast.senderName)}&photo=${encodeURIComponent(toast.senderPhoto)}`);
                        }
                    }}
                >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={toast.senderPhoto}
                            alt={toast.senderName}
                            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
                            onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(toast.senderName)}`;
                            }}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                            <MessageCircle size={11} className="text-indigo-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{toast.senderName}</p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 truncate leading-snug">{toast.text}</p>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                        className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
