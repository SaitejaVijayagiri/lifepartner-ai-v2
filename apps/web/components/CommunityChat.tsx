'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Send, Users, ShieldCheck, Lock, X, Trash2, MessageCircle, User, Eye } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

export default function CommunityChat({ 
    currentUser, 
    onOpenStore, 
    onClose,
    onViewProfile,
    onInstantMessage
}: { 
    currentUser: any, 
    onOpenStore?: () => void, 
    onClose?: () => void,
    onViewProfile?: (member: any) => void,
    onInstantMessage?: (member: any) => void
}) {
    const { socket } = useSocket() as any;
    const [messages, setMessages] = useState<any[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<'connecting' | 'connected' | 'denied'>('connecting');
    const [showMobileUsersModal, setShowMobileUsersModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
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

        socket.on('community_message_deleted', ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        });

        return () => {
            socket.off('joined_community');
            socket.off('community_error');
            socket.off('receive_community_message');
            socket.off('update_community_users');
            socket.off('community_message_deleted');
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

    const handleDeleteMessage = (messageId: string) => {
        if (!messageId) return;
        // Optimistic UI removal
        setMessages(prev => prev.filter(m => m.id !== messageId));
        if (socket) {
            socket.emit('delete_community_message', { messageId });
        }
    };

    const handleViewProfile = (member: any) => {
        if (!member) return;
        const targetId = member.userId || member.id;
        if (!targetId) return;

        if (onViewProfile) {
            onViewProfile(member);
        } else {
            window.location.href = `/profile/${targetId}`;
        }
        setSelectedMember(null);
        setShowMobileUsersModal(false);
    };

    const handleInstantMessage = (member: any) => {
        if (!member) return;
        const targetId = member.userId || member.id;
        if (!targetId) return;

        if (onInstantMessage) {
            onInstantMessage(member);
        } else {
            window.dispatchEvent(new CustomEvent('openChat', {
                detail: {
                    partnerId: targetId,
                    partnerName: member.name || 'User',
                    partnerPhoto: member.photo || member.photoUrl || ''
                }
            }));
            if (onClose) onClose();
        }
        setSelectedMember(null);
        setShowMobileUsersModal(false);
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
                            const currentUserId = currentUser?.id || currentUser?.userId;
                            const isMe = Boolean(currentUserId && msg.sender.id === currentUserId);
                            const canDelete = Boolean(msg.id) && isMe;
                            return (
                                <div key={msg.id || idx} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                                    <img 
                                        src={msg.sender.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender.name || 'User')}`} 
                                        onClick={() => !isMe && setSelectedMember(msg.sender)}
                                        className={`w-8 h-8 rounded-full border border-gray-200 self-end mb-1 shrink-0 ${!isMe ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all' : ''}`} 
                                        onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/avatar-fallback.svg'; }} 
                                        title={!isMe ? `Tap to view ${msg.sender.name}'s card or send message` : undefined}
                                    />
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                        {!isMe && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMember(msg.sender)}
                                                className="text-[10px] text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 ml-1 mb-0.5 flex items-center gap-1 font-bold transition-colors cursor-pointer group/name"
                                                title={`Tap to view ${msg.sender.name}'s matchcard or message`}
                                            >
                                                <span>{msg.sender.name}</span>
                                                {msg.sender.isVerified && <VerificationBadge size={10} />}
                                                <span className="text-[9px] text-indigo-500 opacity-0 group-hover/name:opacity-100 transition-opacity ml-1">· view card</span>
                                            </button>
                                        )}
                                        <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm break-words ${isMe
                                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    title="Delete your message"
                                                    className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
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
                        {onlineMembers.map((u, i) => {
                            const currentUserId = currentUser?.id || currentUser?.userId;
                            const isCurrentUser = (u.userId || u.id) === currentUserId;
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => !isCurrentUser && setSelectedMember(u)}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                                            {u.photo ? (
                                                <img src={u.photo} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold">
                                                    {u.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                                <span>{u.name}</span>
                                                {isCurrentUser && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                                                {u.isVerified && <VerificationBadge size={10} />}
                                            </p>
                                            <p className="text-[10px] text-green-500 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                            </p>
                                        </div>
                                    </div>

                                    {!isCurrentUser && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInstantMessage(u);
                                                }}
                                                title={`Send instant message to ${u.name}`}
                                                className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                                            >
                                                <MessageCircle size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewProfile(u);
                                                }}
                                                title={`View ${u.name}'s matchcard`}
                                                className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <User size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                        {onlineMembers.map((u, i) => {
                            const currentUserId = currentUser?.id || currentUser?.userId;
                            const isCurrentUser = (u.userId || u.id) === currentUserId;
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => !isCurrentUser && setSelectedMember(u)}
                                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer active:scale-[0.99] transition-transform"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
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
                                                <span>{u.name}</span>
                                                {isCurrentUser && <span className="text-[10px] text-gray-400 font-normal">(You)</span>}
                                                {u.isVerified && <VerificationBadge size={12} />}
                                            </p>
                                            <p className="text-xs text-green-500 flex items-center gap-1 mt-0.5 font-medium">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span> Online
                                            </p>
                                        </div>
                                    </div>

                                    {!isCurrentUser && (
                                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => handleInstantMessage(u)}
                                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                                                title="Send instant message"
                                            >
                                                <MessageCircle size={13} />
                                                <span>Chat</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleViewProfile(u)}
                                                className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                                title="View matchcard"
                                            >
                                                <User size={13} />
                                                <span>Card</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {onlineMembers.length === 0 && (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No one else is here right now.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Action Modal: Member Card & Instant Chat */}
            {selectedMember && (
                <div 
                    className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedMember(null)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            type="button"
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="relative mb-3 mt-1">
                            <img 
                                src={selectedMember.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedMember.name || 'User')}`} 
                                className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500/20 shadow-lg"
                                onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = '/avatar-fallback.svg'; }}
                            />
                            <span className="absolute bottom-0 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </div>

                        <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-1.5 justify-center">
                            <span>{selectedMember.name}</span>
                            {selectedMember.isVerified && <VerificationBadge size={14} />}
                        </h3>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1 mt-0.5 justify-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active in Lounge right now
                        </p>

                        <div className="w-full flex flex-col gap-2.5 mt-6">
                            <button
                                type="button"
                                onClick={() => handleInstantMessage(selectedMember)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                            >
                                <MessageCircle size={17} />
                                Send Instant Message
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewProfile(selectedMember)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold text-xs rounded-2xl border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
                            >
                                <User size={15} />
                                View Matchcard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
