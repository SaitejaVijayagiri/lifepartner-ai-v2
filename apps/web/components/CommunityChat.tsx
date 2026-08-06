'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Send, Users, ShieldCheck, Lock, X } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

export default function CommunityChat({ currentUser, onOpenStore, onClose }: { currentUser: any, onOpenStore?: () => void, onClose?: () => void }) {
    const { socket } = useSocket() as any;
    const [messages, setMessages] = useState<any[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<'connecting' | 'connected' | 'denied'>('connecting');
    const [showMobileUsersModal, setShowMobileUsersModal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;
        if (!currentUser) return;

        // Join Room
        socket.emit('join_community');

        // Listeners
        socket.on('joined_community', (data: any) => {
            setStatus('connected');
            if (data?.history && Array.isArray(data.history)) {
                setMessages(data.history);
            }
        });

        socket.on('community_error', () => {
            setStatus('denied');
        });

        socket.on('receive_community_message', (msg: any) => {
            setMessages(prev => [...prev, msg].slice(-100)); // Keep last 100
        });

        socket.on('update_community_users', (users: any[]) => {
            setOnlineMembers(users);
        });

        return () => {
            socket.off('joined_community');
            socket.off('community_error');
            socket.off('receive_community_message');
            socket.off('update_community_users');
            socket.emit('leave_community');

        };
    }, [socket, currentUser]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        socket.emit('send_community_message', { text: inputText });
        setInputText("");
    };

    if (!currentUser) {
        return (
            <div className="fixed inset-0 z-[2000] h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 md:rounded-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (status === 'denied') {
        return (
            <div className="fixed inset-0 z-[2000] h-[100dvh] md:inset-auto md:h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900 md:rounded-2xl border border-gray-200 dark:border-gray-800">
                {onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-200 dark:bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                )}
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="text-blue-500 dark:text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Required</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    The Community Lounge is a safe space for genuine singles. <br />
                    <b>Verify your profile for FREE to join!</b>
                </p>
                <button onClick={() => { if(onClose) onClose(); window.location.href = '/dashboard?tab=profile'; }} className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                    Go to Profile to Verify
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-[100dvh] md:relative md:h-full bg-white dark:bg-gray-900 md:rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col z-[2000] md:z-auto animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                        <ShieldCheck size={24} className="text-blue-300" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            Verified Lounge
                            <span className="bg-green-500/10 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 text-green-600 ml-2">LIVE</span>
                        </h2>
                        <p className="text-xs text-indigo-400/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Open to all Verified Members
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowMobileUsersModal(true)}
                        className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-white/20 transition-colors"
                    >
                        <Users size={14} /> 
                        <span>{onlineMembers.length} <span className="hidden sm:inline">Online</span></span>
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 ml-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-gray-950 relative" ref={scrollRef}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                        {/* Welcome Message */}
                        <div className="text-center py-8 text-gray-400 text-sm">
                            <p>🔒 This is a secure, monitored space.</p>
                            <p>Be respectful to your fellow community members.</p>
                        </div>

                        {messages.map((msg, idx) => {
                            const isMe = msg.sender.id === currentUser?.id;
                            return (
                                <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                                    <img src={msg.sender.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender.name || 'User')}`} className="w-8 h-8 rounded-full border border-gray-200 self-end mb-1" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/avatar-fallback.svg'; }} />
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                        {!isMe && (
                                            <span className="text-[10px] text-gray-500 ml-1 mb-0.5 flex items-center gap-1 font-bold">
                                                {msg.sender.name}
                                                {msg.sender.isVerified && <VerificationBadge size={10} />}
                                            </span>
                                        )}
                                        <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:pb-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0 z-10">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent dark:border-gray-700 focus:border-indigo-200 dark:focus:border-indigo-500 transition-all placeholder:text-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || status !== 'connected'}
                            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>

                {/* Sidebar (Desktop Only) - Integrated */}
                <div className="hidden md:flex w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold text-sm text-gray-700 dark:text-gray-200 flex justify-between items-center">
                        <span>Online Members</span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs">{onlineMembers.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {onlineMembers.map((u, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer group">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                                    {u.photo ? (
                                        <img src={u.photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold">
                                            {u.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                        {u.name}
                                        {u.isVerified && <VerificationBadge size={10} />}
                                    </p>
                                    <p className="text-[10px] text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Users Modal */}
            {showMobileUsersModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 md:hidden animate-in slide-in-from-bottom-full duration-300">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">Online Members</h3>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">{onlineMembers.length}</span>
                        </div>
                        <button onClick={() => setShowMobileUsersModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full">
                            <svg className="w-5 h-5 text-gray-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {onlineMembers.map((u, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm shrink-0">
                                    {u.photo ? (
                                        <img src={u.photo} className="w-full h-full object-cover" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/avatar-fallback.svg'; }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                                            {u.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                                        {u.name}
                                        {u.isVerified && <VerificationBadge size={12} />}
                                    </p>
                                    <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5 font-medium">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span> Online
                                    </p>
                                </div>
                            </div>
                        ))}
                        {onlineMembers.length === 0 && (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No one else is here right now.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
