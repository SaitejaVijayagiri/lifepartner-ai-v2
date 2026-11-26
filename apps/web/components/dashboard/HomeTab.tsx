'use client';

import React from 'react';
import { Sparkles, Heart, Zap, Radio, ArrowRight, Star, MapPin, Calendar, Music, Send, X, Headphones } from 'lucide-react';
import dynamic from 'next/dynamic';
import StoriesFeed from '@/components/StoriesFeed';
import ProfileStrengthCard from '@/components/ProfileStrengthCard';
import RequestVerificationButton from '@/components/RequestVerificationButton';
import ChatMusicJukebox from '@/components/ChatMusicJukebox';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

import MatchCard from '@/components/MatchCard';
const AnonymousStrangerChat = dynamic(() => import('@/components/AnonymousStrangerChat'), { ssr: false });
const LiveSinglesRadar = dynamic(() => import('@/components/LiveSinglesRadar'), { ssr: false });
const AISoulmateSpotlight = dynamic(() => import('@/components/AISoulmateSpotlight'), { ssr: false });
const CompatibilityModal = dynamic(() => import('@/components/CompatibilityModal'), { ssr: false });

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
    const [compatibilityModalData, setCompatibilityModalData] = React.useState<{ id: string; name: string; photoUrl?: string } | null>(null);
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
        setShowJukebox(false);
        setTrackToShare(track);
        if (!connections || connections.length === 0) {
            setShowNoConnectionsModal(true);
            return;
        }
        setShowShareModal(true);
    };

    const handleSyncFromHome = (track: any) => {
        setShowJukebox(false);
        setTrackToShare(track);
        if (!connections || connections.length === 0) {
            setShowNoConnectionsModal(true);
            return;
        }
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

    const needsPhotoOrProfile =
        !currentUser?.avatar_url ||
        (typeof currentUser?.avatar_url === 'string' && currentUser.avatar_url.includes('dicebear')) ||
        (Array.isArray(currentUser?.photos) && currentUser.photos.length < 3) ||
        (currentUser?.completenessScore ?? 40) < 80;

    return (
        <div className="w-full space-y-5 sm:space-y-6 animate-in fade-in duration-300">
            
            {/* 1. Stories Feed */}
            <StoriesFeed
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onOpenStory={onOpenStory}
            />

            {/* 2. Clean Compact Greeting + Quick Action Pills */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                            Welcome back, {firstName} ✨
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Your daily compatible matches & live connections
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                        type="button"
                        onClick={() => onJoinLiveRoom()}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                    >
                        <Zap size={13} className="text-rose-500" />
                        <span>Speed Date</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigateTab('live_events')}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                    >
                        <Radio size={13} className="text-indigo-500" />
                        <span>Live Rooms</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowStrangerChat(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                    >
                        <Sparkles size={13} className="text-purple-500" />
                        <span>Blind Chat</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigateTab('map')}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer"
                    >
                        <MapPin size={13} className="text-sky-500" />
                        <span>Nearby Map</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigateTab('events')}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                    >
                        <Calendar size={13} className="text-amber-500" />
                        <span>Meetups</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowJukebox(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/60 text-pink-700 dark:text-pink-300 text-xs font-bold hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors cursor-pointer"
                    >
                        <Headphones size={13} className="text-pink-500" />
                        <span>Vibe Music</span>
                    </button>
                </div>
            </div>

            {/* 3. Single Contextual Profile / Trust Card (at most one shown when needed) */}
            {needsPhotoOrProfile ? (
                <ProfileStrengthCard
                    completenessScore={currentUser?.completenessScore ?? 40}
                    missingSections={currentUser?.missingSections || []}
                    badgeLevel={currentUser?.badgeLevel || 'Basic'}
                    onEditProfile={() => onNavigateTab('profile_edit')}
                />
            ) : currentUser && !currentUser.isVerified ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Get Your Blue Selfie Verified Badge 🛡️</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Verified profiles get higher visibility and more mutual connections.</p>
                    </div>
                    <RequestVerificationButton className="w-full sm:w-auto justify-center shrink-0" />
                </div>
            ) : null}

            {/* 4. Today's #1 AI Match Spotlight */}
            <AISoulmateSpotlight
                currentUser={currentUser}
                onViewProfile={onSelectProfile}
                onOpenChat={openChat}
                onOpenCompatibility={(id, name, photoUrl) => setCompatibilityModalData({ id, name, photoUrl })}
            />

            {/* 5. Live Singles Online Radar */}
            <LiveSinglesRadar
                matches={matches}
                currentUserId={currentUser?.id}
                currentUser={currentUser}
                onViewProfile={onSelectProfile}
                onOpenChat={openChat}
            />

            {showStrangerChat && (
                <AnonymousStrangerChat onClose={() => setShowStrangerChat(false)} />
            )}

            {/* 6. Top AI Recommended Matches */}
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
                                    className="h-full card-premium transition-all duration-300"
                                >
                                    <MatchCard
                                        match={m}
                                        priority={idx < 2}
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
                                            const conn = (Array.isArray(connections) ? connections : []).find((c: any) => c?.partner?.id === m.id || c?.id === m.id);
                                            if (openChat) {
                                                openChat(conn || {
                                                    interactionId: m.interactionId || m.id,
                                                    partner: {
                                                        id: m.id,
                                                        name: m.name || 'Match',
                                                        photoUrl: m.photoUrl || (Array.isArray(m.photos) ? m.photos[0] : ''),
                                                        location: typeof m.location === 'string' ? m.location : (m.location?.city || '')
                                                    }
                                                });
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
                <div className="fixed inset-0 z-[1000005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
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
                                onClick={() => {
                                    setShowNoConnectionsModal(false);
                                    setShowJukebox(true);
                                }}
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
                <div className="fixed inset-0 z-[1000005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
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
                                onClick={() => {
                                    setShowShareModal(false);
                                    setShowJukebox(true);
                                }}
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
            {compatibilityModalData && (
                <CompatibilityModal
                    isOpen={Boolean(compatibilityModalData)}
                    onClose={() => setCompatibilityModalData(null)}
                    targetUserId={compatibilityModalData.id}
                    targetName={compatibilityModalData.name}
                    targetPhotoUrl={compatibilityModalData.photoUrl}
                    onOpenChat={openChat}
                />
            )}
        </div>
    );
}
