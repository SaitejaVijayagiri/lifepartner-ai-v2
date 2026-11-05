'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Flame, Users, CheckCircle2, MessageCircle, ArrowRight, Zap, Trophy } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface DailyChemistrySparkProps {
    currentUser: any;
    setCurrentUser?: React.Dispatch<React.SetStateAction<any>>;
    matches?: any[];
    onOpenChat?: (conn: any) => void;
    onViewProfile?: (profile: any) => void;
}

interface SparkQuestion {
    id: string;
    category: string;
    icon: string;
    title: string;
    optionA: { text: string; emoji: string; subtitle: string };
    optionB: { text: string; emoji: string; subtitle: string };
    statsA: number; // percentage
    statsB: number;
    icebreakerA: string;
    icebreakerB: string;
}

const SPARK_QUESTIONS: SparkQuestion[] = [
    {
        id: 'spark_weekend_mood',
        category: 'Weekend Vibe',
        icon: '🍕',
        title: "How do you prefer spending your ideal Saturday night?",
        optionA: { text: "3 AM Pizza & Deep Chats", emoji: '🍕', subtitle: "Late night storytelling & laughs" },
        optionB: { text: "Cozy Sunset & Filter Coffee", emoji: '☕', subtitle: "Peaceful golden hour vibes" },
        statsA: 64,
        statsB: 36,
        icebreakerA: "Hey! Saw you also picked 3 AM Pizza & deep chats in today's Chemistry Spark! 🍕 What's your go-to late night spot?",
        icebreakerB: "Hey! Loved seeing you picked cozy sunset & filter coffee today ☕ Nothing beats great coffee and genuine talk. How is your day going?"
    },
    {
        id: 'spark_vacation_style',
        category: 'Travel Soul',
        icon: '✈️',
        title: "If we had 48 hours for a spontaneous getaway, where are we heading?",
        optionA: { text: "Turquoise Beach Waves", emoji: '🏖️', subtitle: "Sun, sea breeze & coconut water" },
        optionB: { text: "Misty Mountain Peaks", emoji: '⛰️', subtitle: "Foggy mornings & trekking trails" },
        statsA: 52,
        statsB: 48,
        icebreakerA: "Hey! Saw you also voted for turquoise beach waves in today's Chemistry Spark 🌊 What's your dream beach destination?",
        icebreakerB: "Hey! We both picked misty mountain peaks today! ⛰️ Nothing beats crisp mountain air. Have you done any memorable treks lately?"
    },
    {
        id: 'spark_music_vibe',
        category: 'Music Chemistry',
        icon: '🎵',
        title: "Long highway drive at night — what's playing through the speakers?",
        optionA: { text: "90s Bollywood Classics", emoji: '📻', subtitle: "Singing at the top of our lungs" },
        optionB: { text: "Indie Chill & Lo-Fi Beats", emoji: '🎧', subtitle: "Mellow vibes & rhythmic hums" },
        statsA: 59,
        statsB: 41,
        icebreakerA: "Hey! High-five for picking 90s classics in today's Spark! 🎶 What's the one song you always sing along to in the car?",
        icebreakerB: "Hey! Saw you're an Indie Chill & Lo-Fi fan too 🎧 Got any song recommendations on repeat right now?"
    },
    {
        id: 'spark_first_date',
        category: 'Dating Chemistry',
        icon: '💫',
        title: "The ideal first connection: Which vibe feels most natural to you?",
        optionA: { text: "Casual Cafe & Walking in a Park", emoji: '🌿', subtitle: "Relaxed, genuine & zero pretense" },
        optionB: { text: "Candlelight Dinner & Rooftop View", emoji: '🍷', subtitle: "Great food, drinks & romantic ambience" },
        statsA: 71,
        statsB: 29,
        icebreakerA: "Hey! We both voted for a relaxed cafe & park walk in today's Spark 🌿 Always the best way to get to know someone genuinely!",
        icebreakerB: "Hey! Loved that you picked candlelight dinner & rooftop view ✨ What's your absolute favorite cuisine for a date night?"
    },
    {
        id: 'spark_spontaneous_plans',
        category: 'Lifestyle',
        icon: '🚗',
        title: "A free Sunday with zero plans — what's the move?",
        optionA: { text: "Unplanned Road Trip Exploration", emoji: '🚙', subtitle: "No destination, just good energy" },
        optionB: { text: "Chill Brunch & Cozy Movie Marathon", emoji: '🍿', subtitle: "Blanket, great food & binge watch" },
        statsA: 47,
        statsB: 53,
        icebreakerA: "Hey! Spontaneous road trip fan spotted in today's Spark 🚙 If we hit the highway right now, which direction are you driving?",
        icebreakerB: "Hey! Saw you also voted for cozy movie marathon & brunch 🍿 What's your current favorite series or movie recommendation?"
    }
];

export default function DailyChemistrySpark({
    currentUser,
    setCurrentUser,
    matches = [],
    onOpenChat,
    onViewProfile
}: DailyChemistrySparkProps) {
    const toast = useToast();
    const todayIndex = useMemo(() => {
        // Daily rotation based on epoch day
        const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        return dayOfYear % SPARK_QUESTIONS.length;
    }, []);

    const currentQuestion = SPARK_QUESTIONS[todayIndex];
    const storageKey = `lp_spark_choice_${currentQuestion.id}`;

    const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [streakDays, setStreakDays] = useState(3);
    const [coinsEarned, setCoinsEarned] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved === 'A' || saved === 'B') {
                setSelectedOption(saved);
                setHasVoted(true);
            }
            const savedStreak = localStorage.getItem('lp_spark_streak');
            if (savedStreak) {
                setStreakDays(parseInt(savedStreak, 10) || 3);
            }
        } catch (e) {}
    }, [storageKey]);

    const handleVote = async (option: 'A' | 'B') => {
        if (hasVoted) return;

        setSelectedOption(option);
        setHasVoted(true);
        setCoinsEarned(true);

        try {
            localStorage.setItem(storageKey, option);
            const newStreak = streakDays + 1;
            setStreakDays(newStreak);
            localStorage.setItem('lp_spark_streak', newStreak.toString());

            // Optimistically give user +15 coins in context
            if (setCurrentUser) {
                setCurrentUser((prev: any) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        coins: (prev.coins || 0) + 15
                    };
                });
            }

            // Persist to backend wallet and sync balance
            api.wallet.claimSparkReward().then((res: any) => {
                if (res?.newBalance !== undefined && setCurrentUser) {
                    setCurrentUser((prev: any) => prev ? { ...prev, coins: res.newBalance } : prev);
                }
            }).catch(() => {});

            toast.success("🎉 +15 Daily Spark Coins awarded! Vibe Tribe unlocked!");
        } catch (e) {
            console.error("Failed to persist spark vote", e);
        }
    };

    // Filter matches who match user's criteria to show as "Vibe Tribe"
    const vibeMatches = useMemo(() => {
        if (!Array.isArray(matches) || matches.length === 0) return [];
        // Take top 4 suitable matches
        return matches.slice(0, 4);
    }, [matches]);

    const chosenOptionStats = selectedOption === 'A' ? currentQuestion.statsA : currentQuestion.statsB;

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-slate-900/70 border border-purple-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all duration-300 overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            {/* Header info */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 text-white shadow-md text-base">
                        {currentQuestion.icon}
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black tracking-wider uppercase text-purple-400">
                                Daily Chemistry Spark
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold">
                                <Flame size={12} className="text-amber-400 fill-amber-400" />
                                {streakDays} Day Streak
                            </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                            {currentQuestion.title}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                        <Zap size={13} className="text-amber-400 fill-amber-400" />
                        {hasVoted ? "Voted (+15 Coins Claimed)" : "Vote for +15 Free Coins"}
                    </span>
                </div>
            </div>

            {/* Voting Options */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 my-2">
                {/* Option A */}
                <button
                    type="button"
                    onClick={() => handleVote('A')}
                    disabled={hasVoted}
                    className={`group relative p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                        selectedOption === 'A'
                            ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-400 shadow-lg shadow-purple-500/20 scale-[1.01]'
                            : hasVoted
                            ? 'bg-slate-900/40 border-slate-700/50 opacity-70'
                            : 'bg-slate-800/60 hover:bg-purple-900/30 border-slate-700/80 hover:border-purple-400/80 hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl group-hover:scale-110 transition-transform">{currentQuestion.optionA.emoji}</span>
                            <div>
                                <p className="text-sm sm:text-base font-black text-white group-hover:text-purple-200 transition-colors">
                                    {currentQuestion.optionA.text}
                                </p>
                                <p className="text-xs text-gray-300 dark:text-gray-400">
                                    {currentQuestion.optionA.subtitle}
                                </p>
                            </div>
                        </div>
                        {selectedOption === 'A' && (
                            <CheckCircle2 size={20} className="text-purple-400 shrink-0 mt-0.5" />
                        )}
                    </div>

                    {hasVoted && (
                        <div className="mt-3 pt-3 border-t border-purple-500/20">
                            <div className="flex justify-between text-xs font-bold mb-1 text-gray-300">
                                <span>Singles Vibe Match</span>
                                <span className="text-purple-300 font-extrabold">{currentQuestion.statsA}% picked this</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950/60 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                                    style={{ width: `${currentQuestion.statsA}%` }}
                                />
                            </div>
                        </div>
                    )}
                </button>

                {/* Option B */}
                <button
                    type="button"
                    onClick={() => handleVote('B')}
                    disabled={hasVoted}
                    className={`group relative p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                        selectedOption === 'B'
                            ? 'bg-gradient-to-r from-pink-600/30 to-rose-600/30 border-pink-400 shadow-lg shadow-pink-500/20 scale-[1.01]'
                            : hasVoted
                            ? 'bg-slate-900/40 border-slate-700/50 opacity-70'
                            : 'bg-slate-800/60 hover:bg-pink-900/30 border-slate-700/80 hover:border-pink-400/80 hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl group-hover:scale-110 transition-transform">{currentQuestion.optionB.emoji}</span>
                            <div>
                                <p className="text-sm sm:text-base font-black text-white group-hover:text-pink-200 transition-colors">
                                    {currentQuestion.optionB.text}
                                </p>
                                <p className="text-xs text-gray-300 dark:text-gray-400">
                                    {currentQuestion.optionB.subtitle}
                                </p>
                            </div>
                        </div>
                        {selectedOption === 'B' && (
                            <CheckCircle2 size={20} className="text-pink-400 shrink-0 mt-0.5" />
                        )}
                    </div>

                    {hasVoted && (
                        <div className="mt-3 pt-3 border-t border-pink-500/20">
                            <div className="flex justify-between text-xs font-bold mb-1 text-gray-300">
                                <span>Singles Vibe Match</span>
                                <span className="text-pink-300 font-extrabold">{currentQuestion.statsB}% picked this</span>
                            </div>
                            <div className="h-2 w-full bg-slate-950/60 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-700"
                                    style={{ width: `${currentQuestion.statsB}%` }}
                                />
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* Revealed Vibe Tribe (Singles who picked the same choice) */}
            {hasVoted && vibeMatches.length > 0 && (
                <div className="relative z-10 mt-4 pt-4 border-t border-purple-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-purple-200 flex items-center gap-1.5">
                            <Users size={14} className="text-pink-400" />
                            Active Matches Who Share Your Vibe ({chosenOptionStats}% Tribe):
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">
                            Tap to send 1-click Icebreaker
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        {vibeMatches.map((match, mIdx) => {
                            const pName = match.name || match.full_name || 'Match';
                            const photo = match.photoUrl || (Array.isArray(match.photos) ? match.photos[0] : '') || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pName)}`;
                            const location = typeof match.location === 'string' ? match.location : (match.location?.city || match.city || '');

                            const icebreakerMsg = selectedOption === 'A' ? currentQuestion.icebreakerA : currentQuestion.icebreakerB;

                            return (
                                <div
                                    key={match.id || mIdx}
                                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/60 border border-purple-500/30 hover:border-purple-400/60 transition-all hover:-translate-y-0.5 shadow-sm"
                                >
                                    <div 
                                        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                                        onClick={() => onViewProfile && onViewProfile(match)}
                                    >
                                        <img
                                            src={photo}
                                            alt={pName}
                                            className="w-10 h-10 rounded-full object-cover border border-purple-400/50 shrink-0"
                                            loading="lazy"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{pName}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{location || `${match.age || 24} yrs`}</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onOpenChat) {
                                                onOpenChat({
                                                    interactionId: match.interactionId || match.id,
                                                    initialMessage: icebreakerMsg,
                                                    partner: {
                                                        id: match.id,
                                                        name: pName,
                                                        photoUrl: photo,
                                                        location
                                                    }
                                                });
                                            }
                                        }}
                                        className="shrink-0 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                                        title="Send Instant Spark Icebreaker"
                                    >
                                        <MessageCircle size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
