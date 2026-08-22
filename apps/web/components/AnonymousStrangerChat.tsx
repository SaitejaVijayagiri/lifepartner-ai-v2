'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Send, MapPin, Sparkles, UserX, ShieldCheck, Heart, UserCheck, X, RefreshCw, Lock, Unlock } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface AnonymousPartner {
    id: string;
    name: string;
    photoUrl: string;
    location?: string;
    age?: number;
    gender?: string;
    realName?: string;
    realPhotoUrl?: string;
}

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

interface AnonymousStrangerChatProps {
    onClose: () => void;
}

export default function AnonymousStrangerChat({ onClose }: AnonymousStrangerChatProps) {
    const { socket } = useSocket();
    const { user: currentUser } = useAuth() as any;
    const toast = useToast();

    const [isSearching, setIsSearching] = useState(true);
    const [partner, setPartner] = useState<AnonymousPartner | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [revealRequested, setRevealRequested] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Socket Listeners for Anonymous Matchmaking
    useEffect(() => {
        if (!socket) return;

        // Auto-join stranger queue
        const targetGender = currentUser?.gender?.toLowerCase() === 'female' ? 'male' : 'female';
        const targetLabel = targetGender === 'female' ? 'Single Female' : 'Single Male';
        socket.emit('join_speed_dating_lobby', { targetGender });
        setIsSearching(true);

        const handleMatchFound = (data: { partner: AnonymousPartner; initiator: boolean }) => {
            setIsSearching(false);
            setPartner(data.partner);
            const genderLabel = (data.partner.gender?.toLowerCase() === 'female' || data.partner.gender?.toLowerCase() === 'woman') ? 'Female ♀️' : 'Male ♂️';
            setMessages([
                {
                    id: 'sys_1',
                    senderId: 'system',
                    text: `🎭 Connected with a Verified ${genderLabel} Member from ${data.partner.location || 'a nearby city'}! Real identity & photos are 100% hidden until both tap 'Reveal & Connect'.`,
                    timestamp: Date.now()
                }
            ]);
            toast.success(`🎭 Connected with a Verified Single ${genderLabel}!`);
        };

        const handlePartnerSkipped = () => {
            toast.info("Partner skipped. Finding another stranger...");
            setPartner(null);
            setMessages([]);
            setIsRevealed(false);
            setRevealRequested(false);
            setIsSearching(true);
            socket.emit('join_speed_dating_lobby', { targetGender });
        };

        const handleRevealRequested = () => {
            toast.info("🤝 Stranger requested to Reveal Identity! Tap 'Reveal & Connect' to agree.");
        };

        const handleIdentityRevealed = (data: { realUser: any }) => {
            setIsRevealed(true);
            if (data.realUser) {
                setPartner(prev => prev ? {
                    ...prev,
                    name: data.realUser.full_name || prev.name,
                    photoUrl: data.realUser.avatar_url || prev.photoUrl
                } : null);
            }
            toast.success("🎉 Identities Revealed! Connection created in your Saved Matches.");
        };

        const handleAnonymousMessage = (msg: { from: string; text: string }) => {
            setMessages(prev => [
                ...prev,
                {
                    id: `msg_${Date.now()}_${Math.random()}`,
                    senderId: msg.from,
                    text: msg.text,
                    timestamp: Date.now()
                }
            ]);
        };

        socket.on('speed_date_match_found', handleMatchFound);
        socket.on('anonymous_chat_partner_skipped', handlePartnerSkipped);
        socket.on('anonymous_chat_reveal_requested', handleRevealRequested);
        socket.on('anonymous_chat_identity_revealed', handleIdentityRevealed);
        socket.on('anonymous_chat_message', handleAnonymousMessage);

        return () => {
            socket.off('speed_date_match_found', handleMatchFound);
            socket.off('anonymous_chat_partner_skipped', handlePartnerSkipped);
            socket.off('anonymous_chat_reveal_requested', handleRevealRequested);
            socket.off('anonymous_chat_identity_revealed', handleIdentityRevealed);
            socket.off('anonymous_chat_message', handleAnonymousMessage);
            socket.emit('leave_speed_dating_lobby');
        };
    }, [socket, currentUser]);

    // Send Message Handler
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !partner || !socket) return;

        const newMsg: Message = {
            id: `msg_${Date.now()}`,
            senderId: currentUser?.id || 'me',
            text: inputText.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMsg]);

        // Send via Socket to partner
        socket.emit('anonymous_chat_message', {
            to: partner.id,
            text: inputText.trim()
        });

        setInputText('');
    };

    // Skip Stranger Handler
    const handleSkip = () => {
        if (!socket) return;
        toast.info("Skipped. Searching for next stranger...");
        setPartner(null);
        setMessages([]);
        setIsRevealed(false);
        setRevealRequested(false);
        setIsSearching(true);

        const targetGender = currentUser?.gender?.toLowerCase() === 'female' ? 'male' : 'female';
        socket.emit('anonymous_chat_skip', { partnerId: partner?.id });
    };

    // Reveal Identity & Connect Handler
    const handleRevealAndConnect = () => {
        if (!socket || !partner) return;
        setRevealRequested(true);
        socket.emit('anonymous_chat_reveal_request', { partnerId: partner.id });
        socket.emit('anonymous_chat_reveal_accept', { partnerId: partner.id });
        toast.success("Identity reveal request sent!");
    };

    return (
        <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] relative">

                {/* HEADER BAR */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-indigo-500/20 flex items-center justify-between z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={partner?.photoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=anonymous`}
                                alt="Partner"
                                className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/40 bg-indigo-950"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-base tracking-tight">
                                    {isSearching ? 'Searching Stranger...' : (partner?.name || 'Anonymous Stranger')}
                                </h3>
                                {isRevealed ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                        <Unlock className="w-3 h-3" /> Revealed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                                        <Lock className="w-3 h-3" /> Hidden Identity
                                    </span>
                                )}
                            </div>

                            {partner && (
                                <div className="flex items-center gap-2 text-xs text-indigo-200/80 mt-0.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-md border border-pink-500/30">
                                        {(partner.gender?.toLowerCase() === 'female' || partner.gender?.toLowerCase() === 'woman') ? '♀️ Single Female' : '♂️ Single Male'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} className="text-pink-400" />
                                        {partner.location || 'Verified Location'}
                                    </span>
                                    <span>•</span>
                                    <span>Age {partner.age || 24}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* SEARCHING RADAR SCREEN */}
                {isSearching ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                        <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 flex items-center justify-center animate-ping mb-6" style={{ animationDuration: '2s' }}>
                            <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-1">
                            Searching {currentUser?.gender?.toLowerCase() === 'female' ? 'Single Male ♂️' : 'Single Female ♀️'}...
                        </h4>
                        <p className="text-xs text-indigo-200/70 max-w-xs leading-relaxed">
                            Connecting with verified single members on LifePartner-AI. Location & age are displayed while real identity & photos stay 100% masked!
                        </p>
                    </div>
                ) : (
                    /* CHAT MESSAGES BODY */
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
                        {messages.map((msg) => {
                            if (msg.senderId === 'system') {
                                return (
                                    <div key={msg.id} className="my-3 p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-center text-xs text-indigo-200 font-medium max-w-md mx-auto backdrop-blur-sm">
                                        {msg.text}
                                    </div>
                                );
                            }

                            const isMe = msg.senderId === (currentUser?.id || 'me');

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                                            isMe
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md'
                                                : 'bg-slate-800 text-gray-100 border border-white/10 rounded-bl-none shadow-md'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* BOTTOM ACTION & INPUT BAR */}
                {!isSearching && partner && (
                    <div className="p-3 bg-slate-900 border-t border-indigo-500/20 space-y-3 shrink-0">
                        {/* Quick Control Actions */}
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={handleSkip}
                                className="flex-1 py-2 px-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            >
                                <UserX size={16} />
                                <span>⏭️ Skip Stranger</span>
                            </button>

                            <button
                                onClick={handleRevealAndConnect}
                                disabled={isRevealed || revealRequested}
                                className={`flex-1 py-2 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                    isRevealed
                                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                        : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-lg shadow-amber-500/20'
                                }`}
                            >
                                <Heart size={16} className={isRevealed ? 'fill-emerald-400' : 'fill-white'} />
                                <span>{isRevealed ? '✓ Connected' : revealRequested ? 'Requested...' : '🤝 Reveal & Connect'}</span>
                            </button>
                        </div>

                        {/* Input Box */}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message to stranger..."
                                className="flex-1 bg-slate-800 border border-white/15 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim()}
                                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-all shadow-md active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
