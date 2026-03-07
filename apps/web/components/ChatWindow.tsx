'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import GameModal from './GameModal';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Video, Phone, Gift, Send, X, Check, CheckCheck, SmilePlus } from 'lucide-react';
import GiftModal from './GiftModal';
import ProfileModal from './ProfileModal';
import VideoCallButton from './VideoCallButton';
import StickerPicker from './StickerPicker';
import { useToast } from '@/components/ui/Toast';

interface ChatWindowProps {
    connectionId: string;
    partner: {
        id: string;
        name: string;
        photoUrl: string;
        role?: string;
    };
    onClose?: () => void;
    onVideoCall?: () => void;
    onAudioCall?: () => void;
    className?: string;
    isCallMode?: boolean;
    onMessagesRead?: () => void;
    onMessageSent?: () => void;
}

export default function ChatWindow({ connectionId, partner, onClose, onVideoCall, onAudioCall, className, isCallMode = false, onMessagesRead, onMessageSent }: ChatWindowProps) {
    const { socket, onlineUsers } = useSocket() as any;
    const { user } = useAuth();
    const toast = useToast();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const lastEmitTypingRef = useRef<number>(0);

    const getStickerAnimation = (url: string) => {
        return '';
    };

    const [showGame, setShowGame] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [showStickers, setShowStickers] = useState(false);

    // Profile View State
    const [showProfile, setShowProfile] = useState(false);
    const [fullProfile, setFullProfile] = useState<any>(null);

    // AI Wingman State
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

    const handleViewProfile = async () => {
        try {
            // Optimistic open with basic data if fetched already or just set loading
            const data = await api.profile.getById(partner.id);
            setFullProfile(data);
            setShowProfile(true);
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    };

    const handleIcebreaker = async () => {
        setLoadingAi(true);
        try {
            const res = await api.ai.getIcebreaker(partner.id);
            if (res.suggestions) {
                setAiSuggestions(res.suggestions);
            }
        } catch (e) {
            console.error("AI Error", e);
        } finally {
            setLoadingAi(false);
        }
    };

    // Initial Load
    useEffect(() => {
        const loadHistory = async () => {
            try {
                // Backend expects User ID (partner.id), not Interaction ID
                const history = await api.chat.getHistory(partner.id);
                if (Array.isArray(history)) {
                    setMessages(history);
                } else {
                    // console.warn("History empty or invalid format, resetting.");
                    setMessages([]);
                }
                // Mark messages as read
                await api.chat.markRead(partner.id);
                if (onMessagesRead) onMessagesRead();
            } catch (e: any) {
                console.error("Chat history fetch error:", e);
                setMessages([]);
                // Only show toast if it's a real api error and not an empty state
                toast.error(`Failed to load chat: ${e.message || 'Network error'}`);
                // Suppress for silent/empty states - do not crash
            }
        };
        loadHistory();
    }, [partner.id]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMsg: any) => {
            // Ignore my own messages from socket (handled optimistically)
            if (newMsg.senderId === 'me' || newMsg.senderId === user?.id) {
                return;
            }

            if (newMsg.senderId === partner.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                setIsTyping(false);

                // Immediately emit delivered receipt now that we received the message
                socket.emit("messageDelivered", {
                    messageId: newMsg.id,
                    senderId: partner.id
                });

                // If chat is open and visible on screen, automatically mark as read
                if (document.visibilityState === 'visible') {
                    api.chat.markRead(partner.id).catch(err => console.error("Auto-read failed", err));
                    if (onMessagesRead) onMessagesRead();
                }
            }
        };

        const handleTyping = (data: any) => {
            if (data.from === partner.id) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
        };

        const handleStatus = (data: any) => {
            // Can be for a single messageId, or a readerMode event for ALL messages
            setMessages(prev => prev.map(msg => {
                if (data.readerMode === partner.id || msg.id === data.messageId) {
                    return { ...msg, status: data.status };
                }
                return msg;
            }));
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("updateMessageStatus", handleStatus);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("updateMessageStatus", handleStatus);
        };
    }, [socket, partner.id, user]);

    const prevMsgCountRef = useRef(0);

    // Smart auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

            // Allow a 150px threshold to be considered "at the bottom" so we don't yank users viewing history
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
            const isInitialLoad = prevMsgCountRef.current === 0 && messages.length > 0;

            const lastMsg = messages[messages.length - 1];
            const isMyLatest = lastMsg?.senderId === 'me' || lastMsg?.senderId === user?.id;

            if (isNearBottom || isInitialLoad || isMyLatest) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    // Use instant jump for initial load so users don't see the long scroll animation
                    behavior: isInitialLoad ? 'instant' : 'smooth'
                });
            }
            prevMsgCountRef.current = messages.length;
        }
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent, forcedText?: string) => {
        if (e) e.preventDefault();

        const textToSend = forcedText || inputText;
        if (!textToSend.trim()) return;

        if (!forcedText) setInputText("");

        const tempMsg = {
            id: 'temp-' + Date.now(),
            text: textToSend,
            senderId: 'me',
            timestamp: new Date(),
            status: 'sending'
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            // Backend expects User ID (partner.id), not Interaction ID
            const response = await api.chat.sendMessage(partner.id, textToSend, 'me');

            // Replace temporary message with the real one from DB (which has status: 'sent')
            if (response && response.message) {
                setMessages(prev => prev.map(m => m.id === tempMsg.id ? response.message : m));
            }

            // Trigger re-order in parent connection list
            if (onMessageSent) onMessageSent();

            // Socket emit is now handled by the Backend API to prevent double-writes.
            // if (socket) { ... } REMOVED
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (socket) {
            const now = Date.now();
            if (now - lastEmitTypingRef.current > 2000) {
                socket.emit("typing", { to: partner.id, from: "me" });
                lastEmitTypingRef.current = now;
            }
        }
    };

    return (
        <div className={className || "fixed inset-0 w-full h-[100dvh] md:inset-auto md:h-[600px] md:w-[400px] md:bottom-4 md:right-4 bg-white md:rounded-3xl rounded-none shadow-2xl flex flex-col border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-bottom duration-300"}>
            {/* Premium Header */}
            {!isCallMode && (
                <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex justify-between items-center relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="flex items-center gap-3 relative z-10 cursor-pointer hover:opacity-90 transition-opacity min-w-0 flex-1 mr-2" onClick={handleViewProfile}>
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-500">
                                <img src={partner.photoUrl} className="w-12 h-12 rounded-full border-2 border-white object-cover" onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partner.name || 'User')}`;
                                }} />
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg ${onlineUsers?.includes(partner.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg leading-tight truncate pr-1">{partner.name}</h3>
                            <p className="text-xs text-white/70 flex items-center gap-1">
                                {onlineUsers?.includes(partner.id) ? (
                                    <>
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                                        <span className="truncate">Online now</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                                        <span className="truncate">Offline</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-1 relative z-10 flex-shrink-0">
                        <button
                            onClick={() => setShowGiftModal(true)}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Send Gift"
                        >
                            <Gift size={20} />
                        </button>
                        <button
                            onClick={() => setShowGame(true)}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all text-lg"
                            title="Play Game"
                        >
                            🎲
                        </button>
                        <VideoCallButton
                            targetUserId={partner.id}
                            targetUserName={partner.name}
                            targetUserPhoto={partner.photoUrl}
                            showLabel={false}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        />
                        <VideoCallButton
                            targetUserId={partner.id}
                            targetUserName={partner.name}
                            targetUserPhoto={partner.photoUrl}
                            showLabel={false}
                            mode="audio"
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        />
                        <button onClick={onClose} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* In Call Mode Header (Minimal) */}
            {isCallMode && (
                <div className="p-3 bg-gray-100 border-b flex justify-between items-center">
                    <span className="font-bold text-gray-700">Chat</span>
                </div>
            )}

            {/* Messages - Premium Design */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-gray-50 space-y-3" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <p className="text-gray-500 font-medium">Say hello to {partner.name}!</p>
                        <p className="text-gray-400 text-sm mt-1">Start a conversation</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    // Safe sender determination: Since it's a 1-on-1 chat, if they aren't the partner, they are me.
                    // This completely avoids mobile Capacitor / Safari localStorage sync bugs.
                    const isMe = msg.senderId !== partner.id;

                    const msgDate = msg.timestamp ? new Date(msg.timestamp) : new Date();

                    // Grouping Logic: Check if this message is on a different day than the previous one
                    let showDateHeader = false;
                    let dateHeaderText = "";
                    if (idx === 0) {
                        showDateHeader = true;
                    } else if (messages[idx - 1].timestamp) {
                        const prevDate = new Date(messages[idx - 1].timestamp);
                        if (prevDate.toDateString() !== msgDate.toDateString()) {
                            showDateHeader = true;
                        }
                    }

                    if (showDateHeader) {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (msgDate.toDateString() === today.toDateString()) {
                            dateHeaderText = "Today";
                        } else if (msgDate.toDateString() === yesterday.toDateString()) {
                            dateHeaderText = "Yesterday";
                        } else {
                            dateHeaderText = msgDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                        }
                    }

                    return (
                        <div key={idx} className="flex flex-col">
                            {showDateHeader && (
                                <div className="flex justify-center my-4">
                                    <span className="text-xs font-semibold bg-gray-200/50 text-gray-500 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                        {dateHeaderText}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 mb-2`}>
                                {!isMe && (
                                    <img src={partner.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partner.name || 'User')}`;
                                    }} />
                                )}
                                <div className={`max-w-[75%] px-4 py-3 text-sm shadow-sm ${msg.text.startsWith('[STICKER]')
                                    ? 'bg-transparent shadow-none p-0 max-w-[50%]'
                                    : (isMe ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md')
                                    }`}>
                                    {msg.text.startsWith('[STICKER]') ? (
                                        <img src={msg.text.replace('[STICKER]', '')} className={`w-32 h-32 object-contain drop-shadow-lg ${getStickerAnimation(msg.text.replace('[STICKER]', ''))}`} alt="sticker" />
                                    ) : (
                                        msg.text
                                    )}
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}

                                        {isMe && (
                                            <div className="flex items-center justify-center">
                                                {msg.status === 'sending' && <Check size={12} className="opacity-50" />}
                                                {msg.status === 'sent' && <Check size={12} />}
                                                {msg.status === 'delivered' && <CheckCheck size={12} />}
                                                {msg.status === 'read' && <CheckCheck size={12} className="text-blue-300" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex flex-col items-start mb-2">
                        <span className="text-[10px] text-gray-400 ml-11 mb-1">{partner.name} is typing...</span>
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <img src={partner.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partner.name || 'User')}`;
                            }} />
                            <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 rounded-bl-md shadow-sm">
                                <div className="flex gap-1.5 h-4 items-center">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Icebreaker Suggestions */}
            {aiSuggestions.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-100 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-purple-500" />
                            AI Suggestions
                        </p>
                        <button onClick={() => setAiSuggestions([])} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {aiSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputText(suggestion);
                                    setAiSuggestions([]);
                                }}
                                className="text-left text-sm bg-white border border-indigo-100 p-3 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-gray-700 shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Message Input */}
            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleSend(e);
                }}
                className="p-4 border-t border-gray-100 bg-white flex gap-2 items-center pb-[max(1rem,env(safe-area-inset-bottom))] relative"
            >
                {showStickers && (
                    <StickerPicker
                        onClose={() => setShowStickers(false)}
                        onSelect={(url) => {
                            setShowStickers(false);
                            handleSend(undefined, `[STICKER]${url}`);
                        }}
                    />
                )}
                <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    className={`p-3 rounded-xl transition-all ${showStickers ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    title="Send Sticker"
                >
                    <SmilePlus size={20} />
                </button>
                <button
                    type="button"
                    onClick={handleIcebreaker}
                    disabled={loadingAi}
                    className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                    title="AI Wingman"
                >
                    <Sparkles size={18} className={loadingAi ? 'animate-spin' : ''} />
                </button>

                <input
                    type="text"
                    value={inputText}
                    onChange={handleInput}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-gray-400"
                />

                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:hover:shadow-none transition-all"
                >
                    <Send size={18} />
                </button>
            </form>

            {showGame && (
                <GameModal
                    onClose={() => setShowGame(false)}
                    partnerName={partner.name}
                />
            )}
            <GiftModal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} toUserId={partner.id} toUserName={partner.name} />

            {showProfile && fullProfile && (
                <ProfileModal
                    profile={fullProfile}
                    onClose={() => setShowProfile(false)}
                    onConnect={() => { }}
                />
            )}
        </div>
    );
}

