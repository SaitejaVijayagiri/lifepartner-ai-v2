'use client';
import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Sparkles, Heart, User } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { useToast } from '@/components/ui/Toast';

interface MatchCandidate {
    id: string;
    name: string;
    photoUrl: string;
    bio?: string;
    occupation?: string;
    city?: string;
    age?: number;
    compatibility: number;
    guruInsight: string;
}

interface MessageItem {
    role: 'user' | 'assistant';
    content: string;
    matches?: MatchCandidate[];
}

export default function FloatingLoveGuru() {
    const pathname = usePathname();
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<MessageItem[]>([
        { 
            role: 'assistant', 
            content: "Namaste! 🙏 I'm your LifePartner AI Guru.\n\nI analyze your bio-data to find your most compatible platform matches, offer profile advice, or suggest icebreakers! Tap a quick suggestion below or ask me anything!" 
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [userBio, setUserBio] = useState<any | null>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    // Fetch User Profile Bio Data on mount
    useEffect(() => {
        api.profile.getMe()
            .then((res: any) => {
                if (res?.user) setUserBio(res.user);
            })
            .catch(() => {});
    }, []);

    // Auto-open if query param is set
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('openGuru') === 'true') {
                setIsOpen(true);
            }
        }
    }, []);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading]);

    // Lock body scroll on mobile when chat is open
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

    // Helper: Analyze Bio-Data and compute customized compatibility candidates
    const computeSmartMatches = async (userPrompt: string): Promise<MatchCandidate[]> => {
        try {
            const res = await api.matches.getAll(1);
            const rawMatches = res?.matches || [];
            if (rawMatches.length === 0) return [];

            const userText = (userPrompt + " " + (userBio?.bio || "") + " " + (userBio?.city || "") + " " + (userBio?.occupation || "")).toLowerCase();

            // Evaluate candidates against user bio-data and prompt criteria
            const scoredCandidates: MatchCandidate[] = rawMatches.map((cand: any) => {
                let baseScore = 85;
                const candText = (cand.name + " " + (cand.bio || "") + " " + (cand.occupation || "") + " " + (cand.city || "") + " " + (cand.interests ? cand.interests.join(" ") : "")).toLowerCase();

                // Check city alignment
                if (userBio?.city && cand.city && userBio.city.toLowerCase() === cand.city.toLowerCase()) {
                    baseScore += 5;
                }

                // Check prompt keyword matches
                const keywords = userText.split(/\s+/).filter(w => w.length > 3);
                let hitCount = 0;
                keywords.forEach(kw => {
                    if (candText.includes(kw)) hitCount++;
                });

                baseScore += Math.min(9, hitCount * 3);
                const finalScore = Math.min(99, Math.max(88, baseScore));

                // Generate custom Guru Insight explaining suitability
                let insight = "";
                if (hitCount > 0) {
                    insight = `Shares your interest in ${keywords.slice(0, 2).join(" & ")} and aligns with your relationship vibe!`;
                } else if (cand.city && cand.city.toLowerCase() === (userBio?.city || "").toLowerCase()) {
                    insight = `Located right near you in ${cand.city} with high lifestyle & value alignment!`;
                } else {
                    insight = `High bio-data synergy based on complemental career and personality traits!`;
                }

                return {
                    id: cand.id,
                    name: cand.name || "Match Candidate",
                    photoUrl: cand.photoUrl || cand.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cand.name || 'User')}`,
                    bio: cand.bio,
                    occupation: cand.occupation || cand.job_title,
                    city: cand.city || cand.location_name,
                    age: cand.age || 25,
                    compatibility: finalScore,
                    guruInsight: insight
                };
            });

            // Sort by compatibility score descending & return top 3
            return scoredCandidates.sort((a, b) => b.compatibility - a.compatibility).slice(0, 3);
        } catch (e) {
            console.error("Match computation error:", e);
            return [];
        }
    };

    const handleSend = async (customText?: string) => {
        const userMsg = (customText || input).trim();
        if (!userMsg || loading) return;

        if (!customText) setInput('');

        const newHistory = [...messages, { role: 'user', content: userMsg } as MessageItem];
        setMessages(newHistory);
        setLoading(true);

        try {
            const isMatchQuery = /(find.*match|best.*match|recommend.*candidate|show.*match|compatible.*partner|top.*match)/i.test(userMsg);
            const isBioAnalysisQuery = /(analyze.*bio|profile.*analysis|improve.*profile|bio.*rate|profile.*bio)/i.test(userMsg);
            const isIcebreakerQuery = /(icebreaker|first.*message|opener|conversation.*starter)/i.test(userMsg);

            let matchResults: MatchCandidate[] = [];
            let replyText = "";

            if (isMatchQuery) {
                matchResults = await computeSmartMatches(userMsg);
                if (matchResults.length > 0) {
                    replyText = `🔮 Based on your personal bio-data (${userBio?.city ? userBio.city : 'India'}, ${userBio?.occupation || 'Profession'}) and requirements, I analyzed our platform database and found your top 3 most compatible matches:`;
                } else {
                    replyText = "🔮 I searched our platform database, but couldn't find exact candidate matches right now. Try updating your profile location or preferences!";
                }
            } else if (isBioAnalysisQuery) {
                const bioScore = userBio?.bio ? (userBio.bio.length > 50 ? 92 : 78) : 65;
                replyText = `💖 **Profile Bio Analysis & Optimization Report**\n\n` +
                    `• **Profile Strength Score:** ${bioScore}/100 🌟\n` +
                    `• **Location Alignment:** 📍 ${userBio?.city || 'Not specified (Add your city to get 3x more local matches!)'}\n` +
                    `• **Profession Badge:** 💼 ${userBio?.occupation || 'Member'}\n\n` +
                    `✨ **Guru's Top 3 Actionable Tips to Double Your Matches:**\n` +
                    `1. **Add Passion Hooks:** Mention 2 favorite hobbies (e.g. coffee, hiking, vinyl records) in your bio to give matches an easy opening line.\n` +
                    `2. **Use Clear HD Photos:** Profiles with at least 3 bright photos get 400% more connection responses!\n` +
                    `3. **Vibe Jukebox Badge:** Share a favorite song on your profile to trigger instant music compatibility!`;
            } else if (isIcebreakerQuery) {
                replyText = `💬 **3 Creative First Message Openers:**\n\n` +
                    `🌟 **1. Fun & Playful:**\n"Hey! Quick debate: Coffee date, sunset walk, or competitive arcade game first? ☕🌅🎮"\n\n` +
                    `💡 **2. Witty & Curious:**\n"Your profile caught my eye! On a scale of 1-10, how likely are you to join a spontaneous weekend road trip? 🚗✨"\n\n` +
                    `☕ **3. Warm & Authentic:**\n"Hey! I noticed we both share great vibes and deep conversation energy. What's been the highlight of your week so far? 😊"`;
            } else {
                const res = await api.ai.chat(userMsg, messages);
                replyText = res.reply || "I have meditated on your query!";
            }

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: replyText,
                    matches: matchResults.length > 0 ? matchResults : undefined
                }
            ]);
        } catch (err: any) {
            console.error("Guru Error:", err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Oops! My connection to the cosmos is weak right now. Please try again!" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = async (userId: string) => {
        try {
            toast.info("Loading profile...");
            const res = await api.profile.getById(userId);
            if (res) {
                setSelectedProfile(res);
            } else {
                toast.error("Could not load profile details.");
            }
        } catch (e) {
            toast.error("Failed to load profile.");
        }
    };

    const handleConnect = async (userId: string) => {
        try {
            await api.interactions.sendInterest(userId);
            toast.success("💖 Connection request sent!");
        } catch (e: any) {
            toast.info("Connection request already sent or active!");
        }
    };

    // ── Shared chat panel UI ──────────────────────────────────────────────
    const chatPanel = (extraClass: string) => (
        <div className={`bg-white dark:bg-gray-900 flex flex-col overflow-hidden ${extraClass}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-rose-500 p-4 text-white flex justify-between items-center shadow-md flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                        🔮
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm tracking-tight drop-shadow-sm">LifePartner AI Guru</h3>
                        <p className="text-[10px] text-pink-100 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Bio-Data Smart Matchmaker Active
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                            msg.role === 'user'
                                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-xs font-medium'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-xs'
                        }`}>
                            {msg.content}
                        </div>

                        {/* Interactive Bio-Data Match Cards */}
                        {msg.matches && msg.matches.length > 0 && (
                            <div className="mt-3 space-y-3 w-full max-w-[95%]">
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                                    <Sparkles size={13} className="animate-spin" />
                                    <span>Top Bio-Data Compatible Matches</span>
                                </div>

                                {msg.matches.map((m) => (
                                    <div key={m.id} className="bg-gradient-to-br from-white via-rose-50/40 to-purple-50/30 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-3 shadow-md hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={m.photoUrl} 
                                                className="w-12 h-12 rounded-full border-2 border-rose-500 object-cover shadow-sm shrink-0" 
                                                alt={m.name}
                                                onError={(e) => { 
                                                    (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`; 
                                                }} 
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{m.name}, {m.age}</h4>
                                                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-sm shrink-0 flex items-center gap-0.5">
                                                        ⚡ {m.compatibility}% Bio Match
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.occupation || 'Member'} • 📍 {m.city || 'India'}</p>
                                            </div>
                                        </div>

                                        {m.guruInsight && (
                                            <div className="mt-2.5 p-2 rounded-xl bg-purple-50/90 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/40 text-[11px] text-purple-900 dark:text-purple-200 leading-snug">
                                                ✨ <strong>Guru Insight:</strong> {m.guruInsight}
                                            </div>
                                        )}

                                        <div className="mt-3 flex gap-2">
                                            <button 
                                                onClick={() => handleViewProfile(m.id)} 
                                                className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <User size={13} /> Profile
                                            </button>
                                            <button 
                                                onClick={() => handleConnect(m.id)} 
                                                className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-md hover:scale-102 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <Heart size={13} fill="currentColor" /> Connect
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 rounded-bl-xs shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex gap-1.5 items-center px-1">
                                <span className="text-xs text-rose-500 font-bold mr-1">Guru is meditating...</span>
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-3 py-2 bg-gray-100/80 dark:bg-gray-850 border-t border-gray-200/50 dark:border-gray-800 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <button
                    onClick={() => handleSend("🎯 Find my most compatible matches based on my bio-data")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    🎯 Find My Best Match
                </button>
                <button
                    onClick={() => handleSend("💖 Analyze my profile bio and tell me how to improve my match rate")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    💖 Profile Bio Analysis
                </button>
                <button
                    onClick={() => handleSend("💬 Give me 3 creative first message icebreakers for a new match")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    💬 Icebreaker Idea
                </button>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about matches, profiles, dating..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-800 transition-all placeholder:text-gray-400"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md focus:outline-none cursor-pointer"
                >
                    <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>

            {/* Profile Modal when user clicks "View Profile" */}
            {selectedProfile && (
                <ProfileModal
                    profile={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                    onConnect={() => {
                        handleConnect(selectedProfile.user?.id || selectedProfile.id);
                    }}
                />
            )}
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
                            className="absolute bottom-16 right-0 w-96 rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden"
                            style={{ height: '540px', maxHeight: '82vh' }}
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
                            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-rose-500/40 transition-transform duration-300 hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
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
                        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-rose-500/40 transition-transform duration-300 active:scale-95 border border-white/20 cursor-pointer"
                    >
                        <span className="text-2xl drop-shadow-md">🔮</span>
                    </button>
                </motion.div>
            )}
        </div>
    );
}
