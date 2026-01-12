'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Send, Users, ShieldCheck, Lock } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

export default function CommunityChat({ currentUser }: { currentUser: any }) {
    const { socket } = useSocket() as any;
    const [messages, setMessages] = useState<any[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<'connecting' | 'connected' | 'denied'>('connecting');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;
        if (!currentUser) return;

        // Join Room
        socket.emit('join_community');

        // Listeners
        socket.on('joined_community', () => {
            setStatus('connected');
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

    if (status === 'denied') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-500 mb-6">The Community Lounge is exclusive to Verified Members.</p>
                <a href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm">Get Verified Now</a>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                        <ShieldCheck size={24} className="text-blue-300" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            Verified Lounge
                            <span className="bg-blue-500/20 text-[10px] px-2 py-0.5 rounded-full border border-blue-400/30 text-blue-200">BETA</span>
                        </h2>
                        <p className="text-xs text-indigo-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Live Community Chat
                        </p>
                    </div>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Users size={12} /> {onlineMembers.length} Online
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative" ref={scrollRef}>
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
                                    <img src={msg.sender.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender.id}`} className="w-8 h-8 rounded-full border border-gray-200 self-end mb-1" />
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                        {!isMe && (
                                            <span className="text-[10px] text-gray-500 ml-1 mb-0.5 flex items-center gap-1 font-bold">
                                                {msg.sender.name}
                                                {msg.sender.isVerified && <VerificationBadge size={10} />}
                                            </span>
                                        )}
                                        <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
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
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0 z-10">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-50 text-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-200 transition-all"
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
                <div className="hidden md:flex w-72 bg-white border-l border-gray-100 flex-col">
                    <div className="p-4 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between items-center">
                        <span>Online Members</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{onlineMembers.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {onlineMembers.map((u, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                    {u.photo ? (
                                        <img src={u.photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                            {u.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-xs text-gray-800 truncate group-hover:text-indigo-600 transition-colors flex items-center gap-1">
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
        </div>
    );
}
