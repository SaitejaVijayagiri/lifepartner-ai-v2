'use client';

import React from 'react';
import { Sparkles, Heart, Zap, Radio, ArrowRight, Star, Users, Video } from 'lucide-react';
import dynamic from 'next/dynamic';
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
    const firstName = (currentUser?.full_name || currentUser?.name || 'User').split(' ')[0];

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-300">
            
            {/* 1. Hero Welcome Header */}
            <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
                            <Sparkles size={14} className="text-amber-400 animate-pulse" />
                            Welcome Back, {firstName}!
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                            How would you like to connect today?
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                            Connect instantly in 1-on-1 blind speed dates, watch live video broadcasts, or browse top AI recommended matches.
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Clear & Distinct Feature Selection Cards (3-Column Grid) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                            Interactive Feature Hub
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Select a feature below to start interacting immediately</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Feature 1: 1-on-1 Speed Date */}
                    <div className="group relative rounded-3xl bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-rose-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                                    <Zap size={22} className="fill-white" />
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-wider">
                                    ⚡ 1-ON-1 RANDOM CALL
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">
                                Instant Speed Dating
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Connect in a 3-minute blind 1-on-1 audio/video call. Automatically paired with verified opposite-gender singles.
                            </p>
                        </div>

                        <button
                            onClick={() => onJoinLiveRoom()}
                            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Zap size={16} className="text-yellow-300 fill-yellow-300 animate-bounce" />
                            <span>Start Instant Speed Date</span>
                        </button>
                    </div>

                    {/* Feature 2: Live Video Broadcasts */}
                    <div className="group relative rounded-3xl bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                    <Radio size={22} className="animate-pulse" />
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                    📡 GROUP BROADCASTS
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                                Live Video Stream Rooms
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Join live stream video rooms hosted by verified members, or launch your own public stream for the community.
                            </p>
                        </div>

                        <button
                            onClick={() => onNavigateTab('live_events')}
                            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Radio size={16} className="text-rose-300" />
                            <span>Explore Live Video Rooms</span>
                        </button>
                    </div>

                    {/* Feature 3: AI Bio-Data Matches */}
                    <div className="group relative rounded-3xl bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 p-6 flex flex-col justify-between space-y-5 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                    <Heart size={22} className="fill-white" />
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                    ❤️ BIO-DATA MATCHING
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                                Top Compatible Matches
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Browse hand-picked verified single profiles calculated using AI bio-data compatibility & Kundli score.
                            </p>
                        </div>

                        <button
                            onClick={() => onNavigateTab('matches')}
                            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Heart size={16} className="fill-white" />
                            <span>Browse Matches ({matches.length})</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* 3. Active Stories & Moments Feed */}
            <StoriesFeed
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onOpenStory={onOpenStory}
            />

            {/* 4. Top AI Recommended Matches Section */}
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

            {/* 5. Clean Inline App Feedback Banner */}
            <AppExperienceFeedback userId={currentUser?.id} userName={currentUser?.full_name} variant="card" />
        </div>
    );
}
