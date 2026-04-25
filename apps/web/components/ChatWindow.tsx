'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import GameModal from './GameModal';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Video, Phone, Gift, Send, X, Check, CheckCheck, SmilePlus, Trash2, Camera, Mic, Square, Image as ImageIcon } from 'lucide-react';
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
    const { user, login } = useAuth() as any;
    const toast = useToast();
    
    // Media & Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    
    // Internal state for partner info to handle missing query params
    const [partnerInfo, setPartnerInfo] = useState(partner);

    // Mute State
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        const mutedUsers = user?.muted_users || [];
        return mutedUsers.includes(partner.id);
    });
    const [isMuting, setIsMuting] = useState(false);

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const lastEmitTypingRef = useRef<number>(0);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);

    const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '🤩'];

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

    const handleClearChat = async () => {
        if (!confirm("Are you sure you want to clear this chat history? This cannot be undone.")) return;
        try {
            await api.chat.clearHistory(partner.id);
            setMessages([]);
            toast.success("Chat history cleared");
        } catch (e) {
            toast.error("Failed to clear chat history");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                
                setIsUploadingMedia(true);
                try {
                    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
                    const res = await api.chat.uploadMedia(audioFile);
                    if (res.url) handleSend(undefined, `[AUDIO]${res.url}`);
                } catch (e: any) {
                    toast.error(`Audio upload failed: ${e.message || 'Unknown error'}`);
                } finally {
                    setIsUploadingMedia(false);
                }
                
                setIsRecording(false);
                setRecordingTime(0);
                clearInterval(recordingTimerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 59) {
                        stopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (e) {
            console.error("Microphone access denied", e);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploadingMedia(true);
        try {
            const res = await api.chat.uploadMedia(file);
            if (res.url) handleSend(undefined, `[IMAGE]${res.url}`);
        } catch (err: any) {
            toast.error(`Image upload failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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

    const handleToggleMute = async () => {
        if (isMuting) return;
        setIsMuting(true);
        try {
            const res = await api.profile.toggleMute(partner.id);
            if (res.isMuted !== undefined) {
                setIsMuted(res.isMuted);
                
                // Update local auth context silently to persist state across dashboard views
                if (user) {
                    let newMuted = [...(user.muted_users || [])];
                    if (res.isMuted) newMuted.push(partner.id);
                    else newMuted = newMuted.filter((id) => id !== partner.id);
                    login(user.token, { ...user, muted_users: newMuted });
                }

                toast.success(res.isMuted ? "Notifications muted" : "Notifications unmuted");
            }
        } catch (err) {
            toast.error("Failed to update mute settings");
        } finally {
            setIsMuting(false);
        }
    };

    useEffect(() => {
        const loadHistory = async () => {
            try {
                // Backend expects User ID (partner.id), not Interaction ID
                const history = await api.chat.getHistory(partner.id);
                if (Array.isArray(history)) {
                    setMessages(history);
                } else {
                    setMessages([]);
                }
                // Mark messages as read
                await api.chat.markRead(partner.id);
                if (onMessagesRead) onMessagesRead();
            } catch (e: any) {
                console.error("Chat history fetch error:", e);
                setMessages([]);
                toast.error(`Failed to load chat: ${e.message || 'Network error'}`);
            }
        };

        const loadProfileHeader = async () => {
            try {
                const data = await api.profile.getById(partner.id);
                if (data) {
                    setPartnerInfo(prev => ({
                        ...prev,
                        name: data.name || data.full_name || prev.name,
                        photoUrl: data.photoUrl || data.avatar_url || prev.photoUrl
                    }));
                }
            } catch (err) {
                console.error("Failed to load header profile details", err);
            }
        };

        loadHistory();
        loadProfileHeader();
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

        const handleLiked = (data: any) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === data.messageId) {
                    return { ...msg, is_liked: data.isLiked };
                }
                return msg;
            }));
        };

        const handleReaction = (data: any) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
            ));
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("updateMessageStatus", handleStatus);
        socket.on("messageLiked", handleLiked);
        socket.on("messageReaction", handleReaction);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("updateMessageStatus", handleStatus);
            socket.off("messageLiked", handleLiked);
            socket.off("messageReaction", handleReaction);
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
            const response = await api.chat.sendMessage(partner.id, textToSend);

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

    // Auto-close emoji picker after 3 seconds of inactivity
    useEffect(() => {
        if (emojiPickerMsgId) {
            const timer = setTimeout(() => {
                setEmojiPickerMsgId(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [emojiPickerMsgId]);

    const handleReact = async (msgId: string, emoji: string) => {
        setEmojiPickerMsgId(null);
        const uid = user?.id;
        if (!uid) return;
        // Optimistic update
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const reactions: Record<string, string> = { ...(m.reactions || {}) };
            if (reactions[uid] === emoji) {
                delete reactions[uid];
            } else {
                reactions[uid] = emoji;
            }
            return { ...m, reactions };
        }));
        try {
            const result = await api.chat.reactToMessage(msgId, emoji);
            if (result?.reactions) {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: result.reactions } : m));
            }
        } catch (err) {
            console.error('React failed', err);
        }
    };

    // Keep likeMessage for Android native backward compat
    const handleLikeMessage = async (msgId: string) => {
        handleReact(msgId, '❤️');
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
        <div className={className || "fixed inset-0 w-full h-[100dvh] md:inset-auto md:h-[600px] md:w-[400px] md:bottom-4 md:right-4 bg-white dark:bg-gray-900 md:rounded-3xl rounded-none shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden z-[100] animate-in slide-in-from-bottom duration-300"}>
            {/* Premium Header */}
            {!isCallMode && (
                <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex justify-between items-center relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="flex flex-col gap-1 relative z-10 cursor-pointer hover:opacity-90 transition-opacity min-w-0 flex-1 mr-2" onClick={handleViewProfile}>
                        <div className="flex items-center gap-3 w-full">
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-500">
                                    <img src={partnerInfo.photoUrl} className="w-full h-full rounded-full border-2 border-white object-cover" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`;
                                    }} />
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg ${onlineUsers?.includes(partner.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-lg leading-tight truncate pr-1">{partnerInfo.name}</h3>
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
                    </div>

                    <div className="flex gap-1 relative z-10 flex-shrink-0">
                        <button
                            onClick={handleClearChat}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Clear Chat"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            onClick={() => setShowGiftModal(true)}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Send Gift"
                        >
                            <Gift size={20} />
                        </button>
                        <VideoCallButton
                            targetUserId={partner.id}
                            targetUserName={partnerInfo.name}
                            targetUserPhoto={partnerInfo.photoUrl}
                            showLabel={false}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        />
                        <VideoCallButton
                            targetUserId={partner.id}
                            targetUserName={partnerInfo.name}
                            targetUserPhoto={partnerInfo.photoUrl}
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
                <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-gray-700 dark:text-white">Chat</span>
                </div>
            )}

            {/* Messages - Premium Design */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-gray-50 dark:from-gray-950 dark:to-gray-900 space-y-3" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Say hello to {partnerInfo.name}!</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start a conversation</p>
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
                                    <span className="text-xs font-semibold bg-gray-200/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                        {dateHeaderText}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 mb-1`}>
                                {!isMe && (
                                    <img src={partnerInfo.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`;
                                    }} />
                                )}
                                <div className={`flex flex-col relative max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {/* Emoji picker popup */}
                                    {emojiPickerMsgId === msg.id && (
                                        <div
                                            className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-12 z-50 flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-2 py-1.5 shadow-xl animate-in zoom-in-95 duration-150`}
                                            onMouseLeave={() => setEmojiPickerMsgId(null)}
                                        >
                                            {QUICK_EMOJIS.map(e => (
                                                <button
                                                    key={e}
                                                    onClick={() => handleReact(msg.id, e)}
                                                    className={`text-lg hover:scale-125 transition-transform p-0.5 rounded-lg ${
                                                        (msg.reactions || {})[user?.id ?? ''] === e
                                                            ? 'bg-indigo-100 dark:bg-indigo-900'
                                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    title={e}
                                                >{e}</button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message bubble */}
                                    <div
                                        onDoubleClick={() => msg.id && !msg.id.toString().startsWith('temp-') && setEmojiPickerMsgId(msg.id)}
                                        className={`relative group w-fit px-4 py-3 text-sm shadow-sm transition-all cursor-pointer select-none ${msg.text.startsWith('[STICKER]')
                                        ? 'bg-transparent shadow-none p-0 max-w-[50%]'
                                        : (isMe ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md whitespace-pre-wrap break-words' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-md whitespace-pre-wrap break-words')
                                        }`}>
                                        {msg.text.startsWith('[STICKER]') ? (
                                            <img src={msg.text.replace('[STICKER]', '')} className={`w-32 h-32 object-contain drop-shadow-lg ${getStickerAnimation(msg.text.replace('[STICKER]', ''))}`} alt="sticker" />
                                        ) : msg.text.startsWith('[IMAGE]') ? (
                                            <img src={msg.text.replace('[IMAGE]', '')} className="max-w-[200px] sm:max-w-[250px] max-h-[300px] rounded-xl object-cover cursor-pointer hover:opacity-90 mt-1" alt="attachment" onClick={() => window.open(msg.text.replace('[IMAGE]', ''), '_blank')} />
                                        ) : msg.text.startsWith('[AUDIO]') ? (
                                            <audio src={msg.text.replace('[AUDIO]', '')} controls className="max-w-[220px] h-[40px] mt-1" />
                                        ) : (
                                            msg.text
                                        )}
                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${msg.text.startsWith('[STICKER]') ? 'text-gray-500 font-medium drop-shadow-sm' : (isMe ? 'text-white/80' : 'text-gray-400')}`}>
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {isMe && (
                                                <div className="flex items-center justify-center">
                                                    {msg.status === 'sending' && <Check size={12} className="opacity-50" />}
                                                    {msg.status === 'sent' && <Check size={12} />}
                                                    {msg.status === 'delivered' && <CheckCheck size={12} />}
                                                    {msg.status === 'read' && <CheckCheck size={12} className={msg.text.startsWith('[STICKER]') ? 'text-blue-500' : 'text-blue-300'} />}
                                                </div>
                                            )}
                                        </div>

                                        {/* React button — shows on hover */}
                                        {msg.id && !msg.id.toString().startsWith('temp-') && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                                                className={`absolute ${isMe ? '-left-7' : '-right-7'} bottom-1 p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm transition-all focus:outline-none opacity-0 group-hover:opacity-100 hover:scale-110`}
                                                title="React"
                                            >
                                                <span className="text-sm">😊</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Reactions strip */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                                        const reactionCounts: Record<string, string[]> = {};
                                        Object.entries(msg.reactions as Record<string, string>).forEach(([uid, emoji]) => {
                                            if (!reactionCounts[emoji]) reactionCounts[emoji] = [];
                                            reactionCounts[emoji].push(uid === user?.id ? 'You' : (uid === partner.id ? partner.name : uid.slice(0, 6)));
                                        });
                                        return (
                                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {Object.entries(reactionCounts).map(([emoji, users]) => (
                                                    <div key={emoji} className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleReact(msg.id, emoji)}
                                                            title={users.join(', ')}
                                                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105 ${
                                                                (msg.reactions as any)[user?.id ?? ''] === emoji
                                                                    ? 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-700'
                                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                                                            }`}
                                                        >
                                                            <span>{emoji}</span>
                                                            {users.length > 1 && <span className="text-gray-600 dark:text-gray-300 font-medium">{users.length}</span>}
                                                        </button>
                                                        <span className="text-[10px] text-gray-500 max-w-[60px] truncate opacity-70">
                                                            {users.join(', ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex flex-col items-start mb-2">
                        <span className="text-[10px] text-gray-400 ml-11 mb-1">{partnerInfo.name} is typing...</span>
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <img src={partnerInfo.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`;
                            }} />
                            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 rounded-bl-md shadow-sm">
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
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border-t border-indigo-100 dark:border-indigo-900 animate-in slide-in-from-bottom duration-300">
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
                                className="text-left text-sm bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all text-gray-700 dark:text-gray-200 shadow-sm"
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
                className="p-2 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-1.5 sm:gap-2 items-center pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))] relative"
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
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia || isRecording}
                    className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                    title="Send Photo"
                >
                    <Camera className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>

                {isRecording ? (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 animate-pulse"
                        title="Stop Recording"
                    >
                        <Square className="w-4 h-4" fill="currentColor" />
                        <span className="text-[10px] sm:text-xs font-bold">{recordingTime}s</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={isUploadingMedia}
                        className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                        title="Record Audio"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    disabled={isUploadingMedia || isRecording}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 ${showStickers ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Send Sticker"
                >
                    <SmilePlus className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={handleIcebreaker}
                    disabled={loadingAi || isRecording || isUploadingMedia}
                    className="hidden sm:block p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                    title="AI Wingman"
                >
                    <Sparkles size={18} className={loadingAi ? 'animate-spin' : ''} />
                </button>

                <input
                    type="text"
                    value={inputText}
                    onChange={handleInput}
                    placeholder="Type..."
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 text-sm min-w-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all placeholder:text-gray-400 dark:placeholder-gray-500 dark:text-white"
                />

                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full sm:rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:hover:shadow-none transition-all flex-shrink-0"
                >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 relative -ml-0.5 sm:ml-0" />
                </button>
            </form>

            {showGame && (
                <GameModal
                    onClose={() => setShowGame(false)}
                    partnerName={partnerInfo.name}
                />
            )}
            <GiftModal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} toUserId={partner.id} toUserName={partnerInfo.name} />

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

