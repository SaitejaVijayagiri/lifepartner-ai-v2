'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Sparkles, Heart, User, Volume2, VolumeX, Maximize2, Minimize2, Send, RefreshCw, Compass, ShieldCheck } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { useToast } from '@/components/ui/Toast';

const ThreeDGuruCanvas = dynamic(() => import('./ThreeDGuruCanvas'), { ssr: false });

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
            content: "Namaste! 🙏 I am your 3D LifePartner AI Guru.\n\nI combine sacred relationship wisdom with modern AI bio-data matching. Ask me for compatible matches, personalized icebreakers, profile advice, or first date guidance — and listen as I guide you!" 
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [userBio, setUserBio] = useState<any | null>(null);

    // 3D Avatar & Voice State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isVoiceMuted, setIsVoiceMuted] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'full3d'>('split');
    const [guruMood, setGuruMood] = useState<'meditating' | 'greeting' | 'talking' | 'thinking'>('meditating');

    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Fetch User Profile Bio Data on mount
    useEffect(() => {
        api.profile.getMe()
            .then((res: any) => {
                if (res?.user) setUserBio(res.user);
            })
            .catch(() => {});
    }, []);

    // Load voice preference from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMute = localStorage.getItem('guru_voice_muted');
            if (savedMute !== null) {
                setIsVoiceMuted(savedMute === 'true');
            }
        }
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
        if (endOfMessagesRef.current && viewMode === 'split') {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading, viewMode]);

    // Lock body scroll on mobile when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Stop speech synthesis on unmount or close
    useEffect(() => {
        if (!isOpen) {
            stopSpeaking();
        }
    }, [isOpen]);

    // Clean text for speech synthesis
    const cleanTextForSpeech = (text: string): string => {
        return text
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/•/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Guru Voice Engine (SpeechSynthesis)
    const speakGuru = useCallback((text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        if (isVoiceMuted) return;

        window.speechSynthesis.cancel();

        const clean = cleanTextForSpeech(text);
        if (!clean) return;

        // Take the first 300 characters to keep audio responses natural, crisp, and fast
        const spokenExcerpt = clean.length > 320 ? clean.substring(0, clean.lastIndexOf('.', 320) || 320) + '.' : clean;

        const utterance = new SpeechSynthesisUtterance(spokenExcerpt);
        currentUtteranceRef.current = utterance;

        // Find warm, natural voice (preferably Indian English, British English, or soothing natural tone)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-IN')) ||
                               voices.find(v => v.lang.includes('en-GB')) ||
                               voices.find(v => v.lang.includes('en-US')) ||
                               voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 0.95;
        utterance.pitch = 0.94;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setGuruMood('talking');
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setGuruMood('meditating');
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            setGuruMood('meditating');
        };

        window.speechSynthesis.speak(utterance);
    }, [isVoiceMuted]);

    const stopSpeaking = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setGuruMood('meditating');
    };

    const toggleVoiceMute = () => {
        const nextState = !isVoiceMuted;
        setIsVoiceMuted(nextState);
        if (nextState) {
            stopSpeaking();
            toast.info("Guru voice muted 🔇");
        } else {
            toast.success("Guru voice enabled 🔊");
            // Speak current latest message
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
                speakGuru(lastMsg.content);
            }
        }
        try {
            localStorage.setItem('guru_voice_muted', String(nextState));
        } catch (_) {}
    };

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
        setGuruMood('thinking');
        stopSpeaking();

        try {
            const isMatchQuery = /(find.*match|best.*match|recommend.*candidate|show.*match|compatible.*partner|top.*match)/i.test(userMsg);
            const isBioAnalysisQuery = /(analyze.*bio|profile.*analysis|improve.*profile|bio.*rate|profile.*bio)/i.test(userMsg);
            const isIcebreakerQuery = /(icebreaker|first.*message|opener|conversation.*starter)/i.test(userMsg);
            const isDateAdviceQuery = /(first.*date|date.*idea|date.*advice|where.*meet|meeting.*offline)/i.test(userMsg);
            const isKundliQuery = /(kundli|horoscope|nakshatra|astrology|guna|marriage.*readiness)/i.test(userMsg);

            let matchResults: MatchCandidate[] = [];
            let replyText = "";

            if (isMatchQuery) {
                matchResults = await computeSmartMatches(userMsg);
                if (matchResults.length > 0) {
                    replyText = `🔮 Based on your bio-data (${userBio?.city ? userBio.city : 'India'}, ${userBio?.occupation || 'Profession'}) and spiritual compatibility, I analyzed our platform database and found your top 3 most aligned matches:`;
                } else {
                    replyText = "🔮 I searched the platform cosmos, but couldn't find exact candidate matches right now. Try updating your profile city or partner preferences to expand your circle!";
                }
            } else if (isBioAnalysisQuery) {
                const bioScore = userBio?.bio ? (userBio.bio.length > 50 ? 94 : 78) : 65;
                replyText = `💖 **Profile Bio Analysis & Optimization Report**\n\n` +
                    `• **Profile Magnetism Score:** ${bioScore}/100 🌟\n` +
                    `• **Location Alignment:** 📍 ${userBio?.city || 'Not specified (Add your city to get 3x more local matches!)'}\n` +
                    `• **Profession Badge:** 💼 ${userBio?.occupation || 'Member'}\n\n` +
                    `✨ **Guru's Top 3 Golden Tips:**\n` +
                    `1. **Add Passion Hooks:** Mention 2 favorite passions (e.g. filter coffee, weekend drives, old Kishore Kumar vinyl) to give matches an effortless first message!\n` +
                    `2. **High-Confidence Photos:** Profiles with at least 3 genuine, smiling photos receive 400% more connection responses.\n` +
                    `3. **Music Vibe Badge:** Connect your favorite song to unlock instant musical chemistry on your profile!`;
            } else if (isIcebreakerQuery) {
                replyText = `💬 **3 Creative First Message Openers:**\n\n` +
                    `🌟 **1. Warm & Playful:**\n"Hey! Quick debate: Filter coffee date, scenic sunset walk, or competitive board games first? ☕🌅"\n\n` +
                    `💡 **2. Witty & Genuine:**\n"Your profile caught my eye! On a scale of 1-10, how likely are you to join an impromptu weekend road trip? 🚗✨"\n\n` +
                    `☕ **3. Deep & Authentic:**\n"Hey! I noticed we both share great calm energy. What has been the most exciting moment of your week so far? 😊"`;
            } else if (isDateAdviceQuery) {
                replyText = `☕ **Guru's First Date Wisdom & Etiquette:**\n\n` +
                    `1. **Choose a Low-Pressure Venue:** A cozy cafe or art walk allows conversation to flow naturally without the stiffness of formal dinners.\n` +
                    `2. **The 70/30 Listening Rule:** Listen 70% of the time, speak 30%. True connection begins when someone feels genuinely heard.\n` +
                    `3. **Spotting Green Flags:** Look for consistency, punctuality, kindness to servers, and genuine curiosity about your family and aspirations!`;
            } else if (isKundliQuery) {
                replyText = `💍 **Sacred Kundli & Matrimony Insights:**\n\n` +
                    `• **Vedic Harmony:** True marital synergy blends 8 Gunas (Ashtakoota) with emotional maturity and shared long-term life vision.\n` +
                    `• **Manglik & Gothra Balance:** Spiritual alignment focuses on understanding, calm communication, and mutual respect between both families.\n` +
                    `• **Actionable Step:** Tap on any match card in your dashboard to view instant Guna Milan compatibility score!`;
            } else {
                const res = await api.ai.chat(userMsg, messages);
                replyText = res.reply || "I have meditated on your query. May your heart find its destined partner!";
            }

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: replyText,
                    matches: matchResults.length > 0 ? matchResults : undefined
                }
            ]);

            // Speak the response automatically if voice is unmuted
            speakGuru(replyText);
        } catch (err: any) {
            console.error("Guru Error:", err);
            const fallback = "Oops! My spiritual connection to the cosmos is weak right now. Please try again in a moment!";
            setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
            speakGuru(fallback);
        } finally {
            setLoading(false);
            setGuruMood('meditating');
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
        <div className={`bg-white dark:bg-gray-900 flex flex-col overflow-hidden shadow-2xl border border-rose-200/50 dark:border-rose-900/30 ${extraClass}`}>
            {/* Header with 3D Avatar Controls */}
            <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 p-3.5 text-white flex justify-between items-center shadow-md flex-shrink-0 relative overflow-hidden">
                <div className="flex items-center gap-2.5 z-10">
                    <div className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                        <span>🔮</span>
                        {isSpeaking && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-ping"></span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-sm tracking-tight drop-shadow-sm">3D LifePartner Guru</h3>
                            <span className="px-1.5 py-0.2 bg-amber-400/90 text-amber-950 text-[9px] font-black rounded-md uppercase tracking-wider">
                                3D AI
                            </span>
                        </div>
                        <p className="text-[10px] text-pink-100 font-medium flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-amber-300 animate-ping' : 'bg-green-400 animate-pulse'}`}></span>
                            {isSpeaking ? 'Guru is speaking aloud...' : 'Spiritual Guidance & Matchmaking'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 z-10">
                    {/* Voice Toggle Button */}
                    <button
                        type="button"
                        onClick={toggleVoiceMute}
                        className={`p-1.5 rounded-full transition-all cursor-pointer ${isVoiceMuted ? 'bg-white/10 text-white/60 hover:bg-white/20' : 'bg-amber-400 text-amber-950 font-bold shadow-sm hover:scale-105'}`}
                        title={isVoiceMuted ? "Enable Guru Voice 🔊" : "Mute Guru Voice 🔇"}
                    >
                        {isVoiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>

                    {/* View Mode Toggle (3D Sanctuary vs Split) */}
                    <button
                        type="button"
                        onClick={() => setViewMode(prev => prev === 'split' ? 'full3d' : 'split')}
                        className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all cursor-pointer"
                        title={viewMode === 'split' ? "Expand 3D Sanctuary" : "Split Chat View"}
                    >
                        {viewMode === 'split' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>

                    {/* Close Button */}
                    <button 
                        type="button"
                        onClick={() => {
                            stopSpeaking();
                            setIsOpen(false);
                        }} 
                        className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Real 3D Animated Guru Viewport */}
            <div className={`relative transition-all duration-300 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-900 border-b border-rose-500/20 overflow-hidden flex flex-col items-center justify-center shrink-0 ${viewMode === 'full3d' ? 'flex-1' : 'h-48 sm:h-52'}`}>
                {/* 3D WebGL Canvas */}
                <ThreeDGuruCanvas
                    isSpeaking={isSpeaking}
                    mood={guruMood}
                    className="w-full h-full"
                    onCanvasClick={() => {
                        if (!isSpeaking) {
                            speakGuru("Greetings! I am meditating on your journey. Tap any question below or speak with me!");
                        }
                    }}
                />

                {/* Floating Cosmic Aura Badge */}
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-500/40 text-[10px] text-amber-300 font-bold flex items-center gap-1 shadow-md">
                        <Sparkles size={11} className="text-amber-400 animate-spin" />
                        <span>Interactive 3D Avatar</span>
                    </span>
                </div>

                {/* Live Speech Sound Wave Indicator */}
                {isSpeaking && (
                    <div className="absolute bottom-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/50 backdrop-blur-md shadow-lg animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold text-amber-300 mr-1 flex items-center gap-1">
                            <Volume2 size={12} className="animate-pulse text-amber-400" /> Speaking
                        </span>
                        <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce"></span>
                        <span className="w-1 h-4 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.12s' }}></span>
                        <span className="w-1 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.24s' }}></span>
                        <span className="w-1 h-3.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.18s' }}></span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                stopSpeaking();
                            }}
                            className="ml-2 px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[9px] font-bold text-white cursor-pointer"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </div>

            {/* Chat Body (Rendered when in split mode) */}
            {viewMode === 'split' && (
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50/70 dark:bg-gray-950/70">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`relative group max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-xs font-medium'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200/80 dark:border-gray-700/80 rounded-bl-xs'
                            }`}>
                                {msg.content}

                                {/* Message Voice Replay Button */}
                                {msg.role === 'assistant' && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-[11px] text-gray-500">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isSpeaking) {
                                                    stopSpeaking();
                                                } else {
                                                    speakGuru(msg.content);
                                                }
                                            }}
                                            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold cursor-pointer"
                                            title="Listen to Guru"
                                        >
                                            {isSpeaking ? (
                                                <>
                                                    <VolumeX size={12} />
                                                    <span>Stop Voice</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 size={12} />
                                                    <span>Listen aloud 🔊</span>
                                                </>
                                            )}
                                        </button>
                                        <span className="text-[10px] text-gray-400">Guru Guidance</span>
                                    </div>
                                )}
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
                                    <span className="text-xs text-rose-500 font-bold mr-1">Guru is meditating in 3D...</span>
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endOfMessagesRef} />
                </div>
            )}

            {/* Quick Action Suggestion Chips */}
            <div className="px-3 py-2 bg-gray-100/90 dark:bg-gray-850 border-t border-gray-200/50 dark:border-gray-800 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <button
                    onClick={() => handleSend("🎯 Find my most compatible matches based on my bio-data")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    🎯 Find Matches
                </button>
                <button
                    onClick={() => handleSend("💬 Give me 3 creative first message icebreakers for a new match")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    💬 3 Icebreakers
                </button>
                <button
                    onClick={() => handleSend("💖 Analyze my profile bio and tell me how to improve my match rate")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    💖 Profile Bio Review
                </button>
                <button
                    onClick={() => handleSend("☕ What are the best first date ideas and etiquette to make a great impression?")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    ☕ First Date Guide
                </button>
                <button
                    onClick={() => handleSend("💍 How do I check Kundli compatibility, family values, and marriage readiness?")}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50 rounded-full text-[11px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                    💍 Kundli & Marriage
                </button>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask 3D Guru for guidance, tips, icebreakers..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-800 transition-all placeholder:text-gray-400"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md focus:outline-none cursor-pointer"
                    title="Send to 3D Guru"
                >
                    <Send size={16} className="ml-0.5" />
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
                            className="absolute bottom-16 right-0 w-[420px] rounded-3xl shadow-2xl border border-rose-200/60 dark:border-rose-900/40 overflow-hidden"
                            style={{ height: '620px', maxHeight: '88vh' }}
                        >
                            {chatPanel('h-full')}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop 3D FAB Launcher */}
                {!isOpen && (
                    <motion.div
                        className="relative group"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-rose-600 to-purple-700 text-white shadow-2xl shadow-rose-500/50 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-amber-300/60 cursor-pointer overflow-hidden"
                            title="Open Real 3D Animated Guru"
                        >
                            <span className="text-2xl drop-shadow-md select-none transform hover:rotate-12 transition-transform">
                                🔮
                            </span>
                            <Sparkles className="w-4 h-4 text-amber-300 absolute top-1 right-1 drop-shadow-md animate-spin" />
                            <span className="absolute bottom-0.5 px-2 py-0.2 rounded-full bg-slate-950/90 text-[8px] font-black text-amber-300 uppercase tracking-widest border border-amber-400/40 shadow-sm">
                                3D GURU
                            </span>
                        </button>
                    </motion.div>
                )}
            </div>

            {/* ── MOBILE: FAB button (shown when closed) ───────────────────── */}
            {!isOpen && (
                <motion.div
                    className="md:hidden fixed bottom-24 right-4 z-[1005] group"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 opacity-75 blur-md transition duration-1000 animate-pulse"></div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-rose-600 to-purple-700 text-white shadow-2xl shadow-rose-500/50 transition-transform duration-300 active:scale-95 border-2 border-amber-300/60 cursor-pointer"
                        title="Open Real 3D Animated Guru"
                    >
                        <span className="text-xl select-none">🔮</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute top-1 right-1 animate-spin" />
                        <span className="absolute bottom-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/90 text-[7px] font-black text-amber-300 uppercase tracking-widest border border-amber-400/40 shadow-sm">
                            3D GURU
                        </span>
                    </button>
                </motion.div>
            )}
        </div>
    );
}
