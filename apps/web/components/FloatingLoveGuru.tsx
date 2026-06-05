'use client';
import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function FloatingLoveGuru() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Namaste! 🙏 I'm your LifePartner AI Guru. Looking for advice on your profile, how to talk to a match, or relationship red flags? Ask me anything!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Lock body scroll on mobile when chat is open to prevent background scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Render ONLY on the dashboard page
    if (pathname !== '/dashboard') return null;

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');

        const newHistory = [...messages, { role: 'user', content: userMsg } as const];
        setMessages(newHistory);
        setLoading(true);

        try {
            const res = await api.ai.chat(userMsg, messages);
            setMessages(prev => [...prev, { role: 'assistant', content: res.reply || "Sorry, my meditation was interrupted. Try again!" }]);
        } catch (err: any) {
            console.error("Guru Error:", err);
            const detail = err?.message ? ` (${err.message})` : '';
            setMessages(prev => [...prev, { role: 'assistant', content: `Oops! My connection to the cosmos is weak right now.${detail}` }]);
        } finally {
            setLoading(false);
        }
    };

    // ── Shared chat panel UI ──────────────────────────────────────────────
    const chatPanel = (extraClass: string) => (
        <div className={`bg-white dark:bg-gray-900 flex flex-col overflow-hidden ${extraClass}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white flex justify-between items-center shadow-md flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-2xl drop-shadow-sm">🔮</span>
                    <div>
                        <h3 className="font-bold text-sm">LifePartner AI Guru</h3>
                        <p className="text-xs text-white/80">Online &amp; Ready to Help</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm whitespace-pre-line ${
                            msg.role === 'user'
                                ? 'bg-rose-500 text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex gap-1 items-center px-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about dating, profiles, etc..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/40"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="bg-rose-500 hover:bg-rose-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                    <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );

    return (
        <div id="love-guru-wrapper">
            {/* ── MOBILE: Full-screen slide-up overlay ─────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="mobile-guru"
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="md:hidden fixed inset-0 z-[1010]"
                    >
                        {chatPanel('h-full')}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── DESKTOP: Floating bottom-right panel ─────────────────────── */}
            <div className="hidden md:block fixed bottom-6 right-6 z-[1005]">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="desktop-guru"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-16 right-0 w-96 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                            style={{ height: '500px', maxHeight: '80vh' }}
                        >
                            {chatPanel('h-full')}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop FAB */}
                {!isOpen && (
                    <motion.div
                        className="relative group"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 opacity-50 blur-lg group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-rose-500/40 transition-transform duration-300 hover:scale-110 active:scale-95 border border-white/20"
                        >
                            <span className="text-2xl drop-shadow-md">🔮</span>
                        </button>
                    </motion.div>
                )}
            </div>

            {/* ── MOBILE: FAB button (shown when closed) ───────────────────── */}
            {!isOpen && (
                <motion.div
                    className="md:hidden fixed bottom-28 right-4 z-[1005] group"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 opacity-60 blur-md transition duration-1000 animate-pulse"></div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-rose-500/40 transition-transform duration-300 active:scale-95 border border-white/20"
                    >
                        <span className="text-2xl drop-shadow-md">🔮</span>
                    </button>
                </motion.div>
            )}
        </div>
    );
}
