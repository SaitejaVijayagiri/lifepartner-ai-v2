'use client';

import React from 'react';
import { Sparkles, Heart, Zap, Radio, ArrowRight, Star, Users, Video, MapPin, Coffee, Calendar, Music, Tv, Play, Send, X, Headphones, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import AppExperienceFeedback from '@/components/AppExperienceFeedback';
import StoriesFeed from '@/components/StoriesFeed';
import GlobalViewsBadge from '@/components/GlobalViewsBadge';
import ProfileStrengthCard from '@/components/ProfileStrengthCard';
import ChatMusicJukebox from '@/components/ChatMusicJukebox';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

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
    const [showJukebox, setShowJukebox] = React.useState(false);
    const [trackToShare, setTrackToShare] = React.useState<any | null>(null);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showNoConnectionsModal, setShowNoConnectionsModal] = React.useState(false);
    const [isSendingShare, setIsSendingShare] = React.useState(false);
    const toast = useToast();

    const topMatches = (Array.isArray(matches) ? matches : []).slice(0, 4);
    const firstName = (currentUser?.full_name || currentUser?.name || 'User').split(' ')[0];

    const connectedPartnerIds = React.useMemo(() => {
        return new Set((Array.isArray(connections) ? connections : []).map(c => c?.partner?.id || c?.id).filter(Boolean));
    }, [connections]);

    React.useEffect(() => {
        const handleOpenJukebox = () => setShowJukebox(true);
        window.addEventListener('open-jukebox', handleOpenJukebox);
        return () => window.removeEventListener('open-jukebox', handleOpenJukebox);
    }, []);

    const handleShareTrackFromHome = (track: any) => {
        if (!connections || connections.length === 0) {
            setTrackToShare(track);
            setShowNoConnectionsModal(true);
            return;
        }
        setTrackToShare(track);
        setShowShareModal(true);
    };

    const handleSyncFromHome = (track: any) => {
        if (!connections || connections.length === 0) {
            setTrackToShare(track);
            setShowNoConnectionsModal(true);
            return;
        }
        setTrackToShare(track);
        setShowShareModal(true);
    };

    const handleSendTrackToMatch = async (conn: any) => {
        if (!trackToShare) return;
        setIsSendingShare(true);
        try {
            const payloadObj = {
                title: trackToShare.title,
                artist: trackToShare.artist,
                coverUrl: trackToShare.coverUrl,
                audioUrl: trackToShare.audioUrl,
                videoUrl: trackToShare.videoUrl || ''
            };
            const musicPayload = `[MUSIC_SHARE:${encodeURIComponent(JSON.stringify(payloadObj))}]`;
            await api.chat.sendMessage(conn.id, musicPayload);
            const partnerName = conn.partner?.name || conn.partner?.full_name || 'your match';
            toast.success(`🎵 Shared "${trackToShare.title}" with ${partnerName}!`);
            setShowShareModal(false);
            setTrackToShare(null);
            if (openChat) {
                openChat(conn);
            }
        } catch (err) {
            toast.error("Failed to share track. Please check connection.");
        } finally {
            setIsSendingShare(false);
        }
    };

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

            {/* Music & Video Vibe Jukebox Featured Banner */}
            <div 
                onClick={() => setShowJukebox(true)}
                className="group relative rounded-3xl bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-rose-500/15 dark:from-pink-950/50 dark:via-purple-950/60 dark:to-indigo-950/70 border border-pink-300/80 dark:border-pink-500/30 hover:border-pink-500/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md cursor-pointer transition-all duration-300 hover:shadow-pink-500/10 hover:-translate-y-0.5 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-pink-400/20 via-rose-400/15 to-transparent dark:from-pink-500/15 dark:via-rose-500/10 dark:to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform shrink-0">
                        <Music size={26} className="fill-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-500/20 border border-pink-300 dark:border-pink-500/40 text-pink-700 dark:text-pink-300 text-[10px] font-black uppercase tracking-wider">
                                <Sparkles size={11} className="text-amber-500 dark:text-amber-400" />
                                Vibe Music & Video Player
                            </span>
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                                🎬 Full HD Videos
                            </span>
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                                🔥 100% Free
                            </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight mt-1 truncate">
                            Chat & Dating Vibe Jukebox
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 sm:line-clamp-2">
                            Explore trending songs, watch full HD official music videos, bookmark favorites, or share with your match!
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="relative z-10 w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 shrink-0 group-hover:scale-105 cursor-pointer"
                >
                    <Play size={14} className="fill-white" />
                    <span>Open Vibe Jukebox</span>
                </button>
            </div>

            {/* Photo Upload Accelerator for Profiles without Multiple Photos */}
            {(!currentUser?.avatar_url || (typeof currentUser?.avatar_url === 'string' && currentUser.avatar_url.includes('dicebear')) || (Array.isArray(currentUser?.photos) && currentUser.photos.length < 3)) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                            📸
                        </div>
                        <div>
                            <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                                {(!currentUser?.avatar_url || (typeof currentUser?.avatar_url === 'string' && currentUser.avatar_url.includes('dicebear'))) 
                                    ? 'Unlock Top Match Ranking & 10x More Responses!' 
                                    : 'Upload 3+ Photos to Rank at the Top of Matches!'}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                Profiles with multiple verified photos receive top priority placement in matches and 10x higher interest rates.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigateTab('profile_edit')}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                        {(!currentUser?.avatar_url || (typeof currentUser?.avatar_url === 'string' && currentUser.avatar_url.includes('dicebear'))) ? 'Upload Photo Now ➔' : 'Add More Photos ➔'}
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

            {/* Floating Music & Video Jukebox Trigger Button */}
            <button
                onClick={() => setShowJukebox(true)}
                className="fixed bottom-24 right-4 sm:right-6 z-[900] flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-2xl shadow-pink-500/40 border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="Open Music & Video Vibe Player"
            >
                <Music size={18} className="fill-white" />
                <span className="text-xs font-black tracking-wide hidden xs:inline">Vibe Player</span>
            </button>

            {/* In-Home Music & Video Jukebox Modal */}
            {showJukebox && (
                <ChatMusicJukebox
                    onClose={() => setShowJukebox(false)}
                    currentUser={currentUser}
                    partnerName={connections?.[0]?.partner?.name || 'your match'}
                    onShareTrackToChat={(track) => handleShareTrackFromHome(track)}
                    onStartSyncTrack={(track) => handleSyncFromHome(track)}
                />
            )}

            {/* Modal 1: Prompt when user wants to share/sync but has 0 connected matches */}
            {showNoConnectionsModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/30 rounded-3xl p-6 text-white shadow-2xl space-y-4 text-center">
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                            <Heart size={32} className="fill-pink-500 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-lg text-white">Connect with a Match First 💕</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                All users can freely listen to full songs and watch HD music videos anytime! To share songs and sync live listening, connect with a verified match first.
                            </p>
                        </div>
                        {trackToShare && (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left">
                                <img src={trackToShare.coverUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate">{trackToShare.title}</p>
                                    <p className="text-[10px] text-pink-300 truncate">{trackToShare.artist}</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => {
                                    setShowNoConnectionsModal(false);
                                    setShowJukebox(false);
                                    onNavigateTab('matches');
                                }}
                                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all cursor-pointer"
                            >
                                Explore Compatible Matches ➔
                            </button>
                            <button
                                onClick={() => setShowNoConnectionsModal(false)}
                                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                                Keep Listening (Solo Vibe)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Connected Match Selector to Share Track */}
            {showShareModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/30 rounded-3xl p-5 text-white shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                                    <Send size={16} />
                                </span>
                                <div>
                                    <h3 className="font-black text-sm text-white">Share Song with a Match</h3>
                                    <p className="text-[11px] text-slate-400">Choose who you want to vibe with</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {trackToShare && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                                <img src={trackToShare.coverUrl} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-white truncate">{trackToShare.title}</p>
                                    <p className="text-[11px] text-pink-300 truncate">{trackToShare.artist}</p>
                                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-semibold mt-0.5 inline-block">
                                        🎵 Full HD Video Song
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">Your Connected Matches ({connections.length}):</p>
                            {connections.map((conn: any) => {
                                const partner = conn.partner || conn.user || conn;
                                const partnerName = partner.name || partner.full_name || 'Match';
                                const avatar = partner.photoUrl || partner.avatar_url || '/default-avatar.png';
                                const city = partner.city || partner.location || 'Connected';

                                return (
                                    <div
                                        key={conn.id}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                            <img src={avatar} className="w-11 h-11 rounded-2xl object-cover border border-pink-500/30 shrink-0" alt="" />
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs sm:text-sm text-white truncate">{partnerName}</h4>
                                                <p className="text-[10px] text-slate-400 truncate">{city}</p>
                                            </div>
                                        </div>
                                        <button
                                            disabled={isSendingShare}
                                            onClick={() => handleSendTrackToMatch(conn)}
                                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                                        >
                                            <Send size={12} />
                                            <span>Send</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
