'use client';

import React from 'react';
import { Sparkles, Heart, Zap, Radio, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import LiveVideoEventsHub from '@/components/LiveVideoEventsHub';
import AppExperienceFeedback from '@/components/AppExperienceFeedback';

import StoriesFeed from '@/components/StoriesFeed';

const MatchCard = dynamic(() => import('@/components/MatchCard'));

interface HomeTabProps {
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    matches: any[];
    onNavigateTab: (tab: string) => void;
    onSelectProfile: (profile: any) => void;
    onSelectKundli: (kundli: any) => void;
    onJoinLiveRoom: (event?: any) => void;
    onOpenStory: (storySet: { user: any; stories: any[] }) => void;
}

export default function HomeTab({
    currentUser,
    setCurrentUser,
    matches,
    onNavigateTab,
    onSelectProfile,
    onSelectKundli,
    onJoinLiveRoom,
    onOpenStory
}: HomeTabProps) {
    const topMatches = matches.slice(0, 4);

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-300">
            {/* Hero Welcome Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
                            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                            Welcome Back, {(currentUser?.full_name || currentUser?.name || 'User').split(' ')[0]}!
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight">
                            Find Your Life Partner with AI Matchmaking
                        </h1>
                        <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                            Browse live video events, explore top bio-data compatible matches, or jump into 3-minute speed dating roulette!
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={() => onNavigateTab('matches')}
                            className="px-5 py-3 rounded-2xl bg-white text-gray-900 font-extrabold text-xs shadow-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Heart size={16} className="text-rose-500 fill-rose-500" />
                            <span>Browse Matches</span>
                        </button>
                        <button
                            onClick={() => onJoinLiveRoom()}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white font-extrabold text-xs shadow-lg hover:brightness-110 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                            <Zap size={16} className="text-yellow-300 fill-yellow-300 animate-bounce" />
                            <span>⚡ 1-on-1 Speed Dating</span>
                        </button>
                        <button
                            onClick={() => onNavigateTab('live_events')}
                            className="px-5 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/30 text-white font-extrabold text-xs shadow-lg hover:bg-black/60 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Radio size={16} className="text-rose-400 animate-pulse" />
                            <span>Live Video Hub</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Stories & Moments Feed Section */}
            <StoriesFeed
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onOpenStory={onOpenStory}
            />

            {/* Instant Random Speed Dating Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-rose-500/30 p-6 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider">
                        <Zap size={14} className="text-amber-400 fill-amber-400 animate-pulse" /> Random Audio & Video Speed Dating
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                        Connect Randomly (Male ↔ Female)
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 max-w-lg">
                        Match instantly in 3-minute 1-on-1 blind audio or video speed dates with real verified opposite-gender members!
                    </p>
                </div>
                <button
                    onClick={() => onJoinLiveRoom()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-black text-xs shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                    <Zap size={18} className="text-yellow-300 fill-yellow-300 animate-bounce" />
                    <span>Start Live Speed Date Now</span>
                </button>
            </div>

            {/* Live Video Events Broadcast Hub Section */}
            <LiveVideoEventsHub onJoinLive={onJoinLiveRoom} />

            {/* Top Bio-Data Compatible Matches Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Star className="text-amber-500 fill-amber-500" size={22} />
                            <span>Top AI Recommended Matches</span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hand-picked high compatibility profiles based on bio-data & Kundli</p>
                    </div>
                    <button
                        onClick={() => onNavigateTab('matches')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                        <span>View All ({matches.length})</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

                {topMatches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {topMatches.map((m) => (
                            <MatchCard
                                key={m.id}
                                match={m}
                                onViewProfile={() => onSelectProfile(m)}
                                onShowKundli={(kundli) => onSelectKundli({ data: kundli, names: { me: currentUser?.full_name || 'You', partner: m.name } })}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center space-y-3">
                        <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-pulse" />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Loading AI Recommendations...</p>
                    </div>
                )}
            </div>

            {/* Clean Inline App Feedback Banner */}
            <AppExperienceFeedback userId={currentUser?.id} userName={currentUser?.full_name} variant="card" />
        </div>
    );
}
