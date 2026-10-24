'use client';

import React from 'react';
import { Sparkles, Heart, Zap, Radio, ArrowRight, Star, Users, Video, MapPin, Coffee, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import AppExperienceFeedback from '@/components/AppExperienceFeedback';
import StoriesFeed from '@/components/StoriesFeed';
import GlobalViewsBadge from '@/components/GlobalViewsBadge';
import ProfileStrengthCard from '@/components/ProfileStrengthCard';

import MatchCard from '@/components/MatchCard';
const AnonymousStrangerChat = dynamic(() => import('@/components/AnonymousStrangerChat'), { ssr: false });

interface HomeTabProps {
    currentUser: any;
    setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
    matches: any[];
    setMatches?: React.Dispatch<React.SetStateAction<any[]>>;
    connections?: any[];
    openChat?: (conn: any) => void;
    setGiftData?: (gift: { userId: string; userName: string }) => void;
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
    setMatches,
    connections = [],
    openChat,
    setGiftData,
    onNavigateTab,
    onSelectProfile,
    onSelectKundli,
    onJoinLiveRoom,
    onOpenStory
}: HomeTabProps) {
    const [showStrangerChat, setShowStrangerChat] = React.useState(false);
    const topMatches = (Array.isArray(matches) ? matches : []).slice(0, 4);
    const firstName = (currentUser?.full_name || currentUser?.name || 'User').split(' ')[0];

    const connectedPartnerIds = React.useMemo(() => {
        return new Set((Array.isArray(connections) ? connections : []).map(c => c?.partner?.id || c?.id).filter(Boolean));
    }, [connections]);

    return (
        <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            
            {/* 1. Stories Feed Arranged at the Very Top of Home Screen */}
            <StoriesFeed
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onOpenStory={onOpenStory}
            />

            {/* 2. Hero Welcome Header */}
            <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-7 text-white shadow-2xl border border-indigo-500/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
                            <Sparkles size={13} className="text-amber-400 animate-pulse" />
                            Welcome Back, {firstName}!
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                            How would you like to connect today?
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                            Jump into 1-on-1 blind speed dates, live video streams, nearby radar, or AI bio-data & Kundli matches.
                        </p>
                    </div>
                </div>
            </div>

            {/* Photo Upload Accelerator for Photo-less Profiles */}
            {(!currentUser?.avatar_url || currentUser?.avatar_url.includes('dicebear')) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                            📸
                        </div>
                        <div>
                            <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                                Unlock 10x More Matches & Worldwide Reach!
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                Profiles with real photos get 10x more responses from women and priority placement in global feeds.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigateTab('profile_edit')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                        Upload Photo Now ➔
                    </button>
                </div>
            )}

            {/* Profile Strength Indicator Card (Gamification & Match Boost) */}
            <ProfileStrengthCard
                completenessScore={currentUser?.completenessScore ?? 40}
                missingSections={currentUser?.missingSections || []}
                badgeLevel={currentUser?.badgeLevel || 'Basic'}
                onEditProfile={() => onNavigateTab('profile_edit')}
            />

            {/* 3. Balanced 6-Card Interactive Feature Hub (2x3 Grid on Mobile, 3x2 on Desktop) */}
            <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                            Interactive Feature Hub
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">All 6 ways to meet verified singles — arranged for 1-tap access</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                    
                    {/* Feature 1: 1-on-1 Speed Date */}
                    <div
                        onClick={() => onJoinLiveRoom()}
                        className="group relative rounded-3xl bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/30 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-rose-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform shrink-0">
                                    <Zap size={20} className="fill-white" />
                                </div>
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                                    ⚡ 1-ON-1 CALL
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors leading-snug">
                                Instant Speed Date
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                3-minute blind 1-on-1 audio or video call paired with verified opposite-gender singles.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full py-2.5 sm:py-3 px-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-1.5"
                        >
                            <Zap size={14} className="text-yellow-300 fill-yellow-300 shrink-0" />
                            <span className="truncate">Start Speed Date</span>
                        </button>
                    </div>

                    {/* Feature 2: Live Video Broadcasts */}
                    <div
                        onClick={() => onNavigateTab('live_events')}
                        className="group relative rounded-3xl bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/30 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-indigo-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform shrink-0">
                                    <Radio size={20} className="animate-pulse" />
                                </div>
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                                    📡 LIVE ROOMS
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors leading-snug">
                                Live Video Streams
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                Join live stream rooms hosted by verified members or broadcast your own room.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full py-2.5 sm:py-3 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
                        >
                            <Radio size={14} className="text-rose-300 shrink-0" />
                            <span className="truncate">Explore Rooms</span>
                        </button>
                    </div>

                    {/* Feature 3: AI Bio-Data Matches */}
                    <div
                        onClick={() => onNavigateTab('matches')}
                        className="group relative rounded-3xl bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform shrink-0">
                                    <Heart size={20} className="fill-white" />
                                </div>
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                                    ❤️ AI + KUNDLI
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-snug">
                                Compatible Matches
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                Browse verified profiles ranked by AI bio-data compatibility, lifestyle & Kundli score.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full py-2.5 sm:py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                        >
                            <Heart size={14} className="fill-white shrink-0" />
                            <span className="truncate">Matches ({(Array.isArray(matches) ? matches : []).length})</span>
                        </button>
                    </div>

                    {/* Feature 4: Anonymous Stranger Chat */}
                    <div
                        onClick={() => setShowStrangerChat(true)}
                        className="group relative rounded-3xl bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/30 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-purple-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform shrink-0">
                                    <Sparkles size={20} className="text-amber-300 animate-pulse" />
                                </div>
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                                    🎭 BLIND CHAT
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors leading-snug">
                                Stranger Blind Chat
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                Chat anonymously without revealing your identity first. Shows city & age — skip anytime!
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full py-2.5 sm:py-3 px-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-1.5"
                        >
                            <Sparkles size={14} className="text-amber-300 shrink-0" />
                            <span className="truncate">Start Blind Chat</span>
                        </button>
                    </div>

                    {/* Feature 5: Interactive Live Map */}
                    <div
                        onClick={() => onNavigateTab('map')}
                        className="group relative rounded-3xl bg-gradient-to-b from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/30 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-sky-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                                    📍 LIVE RADAR
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors leading-snug">
                                Nearby Singles Map
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                Explore verified singles near your city on the interactive map with full incognito control.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full py-2.5 sm:py-3 px-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-1.5"
                        >
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">Open Live Map</span>
                        </button>
                    </div>

                    {/* Feature 6: Community Lounge & Real-World Meetups */}
                    <div
                        onClick={() => onNavigateTab('community')}
                        className="group relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4 hover:border-amber-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform shrink-0">
                                    <Coffee size={20} />
                                </div>
                                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate">
                                    ☕ SOCIAL CLUB
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors leading-snug">
                                Lounge & Meetups
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2 sm:line-clamp-3">
                                Chat in the Verified Community Lounge or RSVP to curated local coffee & social meetups.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onNavigateTab('community'); }}
                                className="py-2.5 sm:py-3 px-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-[10px] sm:text-xs shadow-md transition-all flex items-center justify-center gap-1"
                            >
                                <Coffee size={13} className="shrink-0" />
                                <span className="truncate">Lounge</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onNavigateTab('events'); }}
                                className="py-2.5 sm:py-3 px-2 rounded-2xl bg-white dark:bg-gray-800 border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-gray-700 font-extrabold text-[10px] sm:text-xs shadow-sm transition-all flex items-center justify-center gap-1"
                            >
                                <Calendar size={13} className="shrink-0" />
                                <span className="truncate">Meetups</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {showStrangerChat && (
                <AnonymousStrangerChat onClose={() => setShowStrangerChat(false)} />
            )}

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
                        <span>View All ({(Array.isArray(matches) ? matches : []).length})</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

                {topMatches.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {topMatches.map((m, idx) => {
                            if (!m) return null;
                            return (
                                <div
                                    key={m.id || idx}
                                    id={m.id ? `match-card-${m.id}` : `match-card-home-${idx}`}
                                    data-match-id={m.id}
                                    className="h-full transition-all duration-300"
                                >
                                    <MatchCard
                                        match={m}
                                        onConnect={() => {
                                            if (setMatches) {
                                                setMatches(prev => (Array.isArray(prev) ? prev.map(item =>
                                                    item.id === m.id ? { ...item, match_status: 'pending' } : item
                                                ) : []));
                                            }
                                            try { localStorage.removeItem('matches_cache_v2'); } catch (e) {}
                                        }}
                                        onViewProfile={() => onSelectProfile(m)}
                                        onShowKundli={(kundli) => onSelectKundli({ data: kundli, names: { me: currentUser?.full_name || 'You', partner: m.name || 'Partner' } })}
                                        onGift={setGiftData ? () => setGiftData({ userId: m.id, userName: m.name || 'Member' }) : undefined}
                                        isConnectedProp={connectedPartnerIds.has(m.id)}
                                        onChat={() => {
                                            const conn = (Array.isArray(connections) ? connections : []).find((c: any) => c?.partner?.id === m.id);
                                            if (conn && openChat) {
                                                openChat(conn);
                                            } else {
                                                onNavigateTab('connections');
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center space-y-3">
                        <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-pulse" />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Loading AI Recommendations...</p>
                    </div>
                )}
            </div>

            {/* 5. Global Site Views Badge (Rendered ONLY at bottom of Home page) */}
            <GlobalViewsBadge className="my-4" />

            {/* 6. Clean Inline App Feedback Banner */}
            <AppExperienceFeedback userId={currentUser?.id} userName={currentUser?.full_name} variant="card" />
        </div>
    );
}
