'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import GameModal from './GameModal';
import { useSocket } from '@/context/SocketContext';
import { Sparkles, Video, Phone, Gift, Send, X } from 'lucide-react';
import GiftModal from './GiftModal';
import ProfileModal from './ProfileModal';

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
}

export default function ChatWindow({ connectionId, partner, onClose, onVideoCall, onAudioCall, className, isCallMode = false }: ChatWindowProps) {
    const { socket } = useSocket() as any;
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [showGame, setShowGame] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);

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
                setMessages(history);
            } catch (e) { console.error(e); }
        };
        loadHistory();
    }, [partner.id]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on("receiveMessage", (newMsg: any) => {
            if (newMsg.senderId === partner.id || newMsg.senderId === 'me') {
                setMessages(prev => [...prev, newMsg]);
                setIsTyping(false);
            }
        });

        socket.on("typing", (data: any) => {
            if (data.from === partner.id) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        });

        return () => {
            socket.off("receiveMessage");
            socket.off("typing");
        };
    }, [socket, partner.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText("");

        const tempMsg = {
            id: 'temp-' + Date.now(),
            text,
            senderId: 'me',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            // Backend expects User ID (partner.id), not Interaction ID
            await api.chat.sendMessage(partner.id, text, 'me');
            if (socket) {
                socket.emit("sendMessage", {
                    to: partner.id,
                    text,
                    from: "me"
                });
            }
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (socket) {
            socket.emit("typing", { to: partner.id, from: "me" });
        }
    };

    return (
        <div className={className || "fixed inset-0 w-full h-full md:inset-auto md:h-[600px] md:w-[400px] md:bottom-4 md:right-4 bg-white md:rounded-3xl rounded-none shadow-2xl flex flex-col border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-bottom duration-300"}>
            {/* Premium Header */}
            {!isCallMode && (
                <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex justify-between items-center relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="flex items-center gap-3 relative z-10 cursor-pointer hover:opacity-90 transition-opacity" onClick={handleViewProfile}>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-500">
                                <img src={partner.photoUrl} alt={partner.name} className="w-full h-full rounded-full border-2 border-white object-cover" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-lg"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{partner.name}</h3>
                            <p className="text-xs text-white/70 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                {partner.role || "Online now"}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-1 relative z-10">
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
                        <button onClick={onVideoCall} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Video Call">
                            <Video size={20} />
                        </button>
                        <button onClick={onAudioCall} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Audio Call">
                            <Phone size={18} />
                        </button>
                        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-all ml-1">
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
                    const isMe = msg.senderId === 'me' || msg.senderId === undefined;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            {!isMe && (
                                <img src={partner.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" />
                            )}
                            <div className={`max-w-[75%] px-4 py-3 text-sm shadow-sm ${isMe
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md'
                                }`}>
                                {msg.text}
                                <div className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <img src={partner.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" />
                        <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 rounded-bl-md shadow-sm">
                            <div className="flex gap-1.5 h-4 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
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
                className="p-4 border-t border-gray-100 bg-white flex gap-3 items-center"
            >
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

