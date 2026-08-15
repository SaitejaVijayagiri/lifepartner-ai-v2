'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Share2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api, fetchAPI } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/modal';
import KundliModal from './KundliModal';
import ReportModal from './ReportModal';
import { getReligionSymbol } from '@/lib/religionUtils';
import { formatLocationString } from '@/lib/utils';
import { trackImageFailure } from '@/lib/analytics';
import dynamic from 'next/dynamic';

const CompatibilityModal = dynamic(() => import('./CompatibilityModal'), { ssr: false });
const StoryModal = dynamic(() => import('./StoryModal'), { ssr: false });

interface MatchCardProps {
    match: any;
    onConnect?: () => void;
    onViewProfile?: () => void;
    onStoryClick?: () => void;
    onShowKundli?: (data: any) => void;
    onGift?: () => void;
    onChat?: () => void; // Called when clicking "Message" on an already-connected user
    currentUserName?: string; // For Kundli
    isConnectedProp?: boolean; // Prop to override connection state
}

const MatchCard = React.memo(function MatchCard({ match, onConnect, onViewProfile, onStoryClick, onShowKundli, onGift, onChat, isConnectedProp }: MatchCardProps) {
    // Independent States
    const { onlineUsers } = useSocket();
    const { user: currentUser, setUser } = useAuth() as any;
    const isUserOnline = match.isOnline || onlineUsers.includes(match.id);

    const [matchStatus, setMatchStatus] = useState<string | null>(match.match_status || null);
    const [isLiked, setIsLiked] = useState<boolean>(match.is_liked || false);

    // Derived states
    const isConnected = typeof isConnectedProp === 'boolean' ? isConnectedProp : (matchStatus === 'accepted' || matchStatus === 'connected');
    const isRequestSent = matchStatus === 'pending';
    const hasLiked = isLiked;

    const toast = useToast();
    const [isPlaying, setIsPlaying] = useState(false); // Audio State
    const [showKundli, setShowKundli] = useState(false); // Modal State
    const [showReport, setShowReport] = useState(false); // Report Modal State
    const [showDMModal, setShowDMModal] = useState(false);
    const [dmText, setDmText] = useState("");
    const [sendingDM, setSendingDM] = useState(false);
    const [showCosmicReport, setShowCosmicReport] = useState(false);
    const [activeHighlightSet, setActiveHighlightSet] = useState<any>(null);

    // Counts
    const [likeCount, setLikeCount] = useState(match.total_likes || 0);

    const [loading, setLoading] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Photos Array (Fallback to single photo)
    const photos = match.photos && match.photos.length > 0 ? match.photos : [match.photoUrl];

    const [isHovered, setIsHovered] = useState(false);

    // Auto-Slide Effect (3s interval, pause on hover)
    useEffect(() => {
        if (photos.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentPhotoIndex((prev: number) => (prev + 1) % photos.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [photos.length, isHovered]);

    // 1. Handle "Send Interest" (Primary Action)
    // Connecting does NOT toggle Like anymore.
    const handleConnect = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (loading || isRequestSent || isConnected) return;

        setLoading(true);
        const prevStatus = matchStatus;

        // Optimistic: Update Status Only
        setMatchStatus('pending');

        try {
            await api.interactions.sendInterest(match.id);
            if (onConnect) onConnect();
        } catch (err) {
            setMatchStatus(prevStatus);
            toast.error("Connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle "Message" (for already-connected users)
    const handleMessage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        if (onChat) onChat();
    };

    // 3. Handle "Like/Shortlist" (Secondary Action)
    // Liking does NOT affect connection status. purely Instagram style.
    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (loading) return;

        // Optimistic Toggle
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                await api.interactions.sendLike(match.id);
            } else {
                await api.interactions.revokeLike(match.id);
            }
        } catch (err) {
            // Revert
            setIsLiked(!newIsLiked);
            setLikeCount((prev: number) => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    // 4. Handle Direct Message
    const handleSendDM = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dmText.trim() || sendingDM) return;

        setSendingDM(true);
        try {
            const res = await fetchAPI('/interactions/direct', {
                method: 'POST',
                body: JSON.stringify({
                    toUserId: match.id,
                    text: dmText
                })
            });

            toast.success("Direct Message sent!");
            setShowDMModal(false);
            setMatchStatus('connected'); // Immediately mark as connected in UI
            
            // Update local quota if needed
            if (res.remaining !== undefined && res.remaining !== 'Unlimited') {
                setUser({ ...currentUser, free_direct_messages: res.remaining });
            }
            
            if (onConnect) onConnect(); // Trigger refresh if parent cares
        } catch (err: any) {
            toast.error(err.message || "Failed to send Direct Message");
        } finally {
            setSendingDM(false);
        }
    };

    return (
        <div
            className="group relative h-[560px] sm:h-[500px] w-full rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onViewProfile}
        >
            {/* Background Image (Immersive) */}
            <div className="absolute inset-0">
                <img
                    src={match.photos?.[currentPhotoIndex] || match.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.id}`}
                    alt={match.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        trackImageFailure(target.src, 'MatchCard', match.id);
                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id || 'Match')}`;
                    }}
                />

                {/* Photo Progress Bar (Card Style) */}
                {photos.length > 1 && (
                    <div className="absolute top-2 left-2 right-2 flex gap-1 z-30 transition-opacity">
                        {photos.map((_url: string, idx: number) => (
                            <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-white transition-all duration-300 ${idx === currentPhotoIndex ? 'w-full' : idx < currentPhotoIndex ? 'w-full' : 'w-0'}`}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/90 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent opacity-60 pointer-events-none" />
            </div>

            {/* Glowing Match Score (Floating Top Right) - Premium Redesign */}
            <div className="absolute top-4 right-4 z-30">
                <div className="relative flex items-center justify-center w-16 h-16">
                    {/* Pulsing Outer Ring */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.5)]"></div>

                    {/* Glass Core */}
                    <div className="relative w-full h-full rounded-full bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center border border-white/10">
                        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-500 leading-none">{match.score}%</span>
                        <span className="text-[9px] font-bold text-emerald-200 tracking-widest uppercase mt-0.5">Match</span>
                    </div>
                </div>
            </div>

            {/* Connected Badge (Top Left) */}
            {isConnected && (
                <div className="absolute top-4 left-4 z-30">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md border border-emerald-400/30 shadow-lg">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">✓ Connected</span>
                    </div>
                </div>
            )}

            {/* Status Stack: Stories, Voice Bio */}
            <div className={`absolute z-20 flex flex-col gap-2 items-start max-w-[75%] pointer-events-none ${isConnected ? 'left-4 top-14' : 'left-4 top-4'}`}>
                {/* 1. Story & Highlight Badges */}
                {match.stories && match.stories.length > 0 && (() => {
                    const highlightedStories = match.stories.filter((s: any) => s.isHighlight);
                    return (
                        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
                            {highlightedStories.length > 0 && (
                                <div 
                                    className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wide shadow-xl border-2 border-white/30 hover:scale-105 transition-transform"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveHighlightSet({
                                            stories: highlightedStories,
                                            initialIndex: 0,
                                            user: {
                                                id: match.id,
                                                name: match.name,
                                                photoUrl: match.photoUrl
                                            }
                                        });
                                    }}
                                >
                                    <span>⭐ Highlights ({highlightedStories.length})</span>
                                </div>
                            )}

                            <div 
                                className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg border-2 border-white/20 hover:scale-105 transition-transform"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onStoryClick) {
                                        onStoryClick();
                                    } else {
                                        setActiveHighlightSet({
                                            stories: match.stories,
                                            initialIndex: 0,
                                            user: {
                                                id: match.id,
                                                name: match.name,
                                                photoUrl: match.photoUrl
                                            }
                                        });
                                    }
                                }}
                            >
                                <span>📸 Story</span>
                            </div>
                        </div>
                    );
                })()}

                {/* 3. Voice Bio */}
                {match.voiceBioUrl && (
                    <div className="pointer-events-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const audio = new Audio(match.voiceBioUrl);
                                if (isPlaying) {
                                    setIsPlaying(false);
                                } else {
                                    audio.play();
                                    setIsPlaying(true);
                                    audio.onended = () => setIsPlaying(false);
                                }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg hover:bg-white/30 transition-all"
                        >
                            <span>{isPlaying ? '🔊 Playing...' : '🎙️ Voice Bio'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Info Section */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col justify-end pointer-events-none">
                {/* Info pushed up to clear the 2-row action buttons */}
                <div className="transform transition-transform duration-300 group-hover:-translate-y-28 [@media(hover:none)]:-translate-y-28">
                    {/* Kundli Badge - Now inside the animated container */}
                    {match.kundli && match.kundli.details?.[0]?.name !== "Data Missing" && (
                        <div className="pointer-events-auto self-start mb-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onShowKundli) {
                                        onShowKundli(match.kundli);
                                    } else {
                                        setShowKundli(true);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all hover:scale-105 active:scale-95 ${match.kundli.score >= 18 ? 'bg-orange-500/90 border-orange-300/50 text-white' : 'bg-red-500/90 border-red-300/50 text-white'}`}
                            >
                                <span className="text-sm">🕉️</span>
                                <span className="text-xs font-bold">{match.kundli.score}/36 Guna</span>
                            </button>
                        </div>
                    )}


                    <div className="flex items-end gap-2 mb-1">
                        <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg filter flex items-center gap-1">
                            {match.name}, {match.age}
                            {match.isPremium && <span className="text-amber-400 text-xl drop-shadow-md animate-pulse" title="Premium Member">👑</span>}
                        </h3>
                        {match.isVerified && <span className="text-blue-400 text-lg mb-1 drop-shadow-md" title="Verified">✓</span>}
                        {/* Online Indicator */}
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md border ${isUserOnline ? 'bg-green-500/20 border-green-400/30' : 'bg-gray-500/20 border-gray-400/30'} mb-1.5`}>
                            <div className={`w-2 h-2 rounded-full ${isUserOnline ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-gray-400'}`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isUserOnline ? 'text-green-200' : 'text-gray-300'}`}>
                                {isUserOnline ? 'Active' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-gray-100 text-xs font-medium mb-3 opacity-95">
                        {/* Standard Tags */}
                        <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">📏 {match.height || "-"}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">💼 {match.career?.profession || "-"}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">{getReligionSymbol(match.religion?.religion || match.religion?.faith)} {match.religion?.religion || match.religion?.faith || "-"}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">📍 {formatLocationString(match.location)}</span>
                    </div>
                </div>

                {/* Hidden ACTION Buttons — visible on hover on desktop, always visible on mobile tap */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 translate-y-24 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 transition-all duration-300 ease-out pointer-events-auto z-30">

                    {/* ROW 1 — Primary CTA */}
                    <div className="flex gap-2">
                        {isConnected ? (
                            <Button
                                onClick={handleMessage}
                                className="flex-1 h-11 font-bold uppercase tracking-wider text-xs border-0 shadow-2xl transition-transform active:scale-95 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
                                style={{ opacity: 1 }}
                            >
                                💬 Message
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleConnect}
                                    disabled={loading || isRequestSent}
                                    className={`flex-1 h-11 font-bold uppercase tracking-wider text-xs border-0 shadow-2xl transition-transform active:scale-95 ${isRequestSent
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                    style={{ opacity: 1 }}
                                >
                                    {loading ? 'Sending...' : (isRequestSent ? '✓ Request Sent' : '✨ Send Interest')}
                                </Button>
                                {!isRequestSent && (
                                    <Button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDMModal(true); }}
                                        className="h-11 w-11 shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl flex items-center justify-center p-0 rounded-lg active:scale-95 transition-transform"
                                        title={`Direct Message (${currentUser?.is_premium ? 'Unlimited' : (currentUser?.free_direct_messages ?? 3) + ' Left'})`}
                                    >
                                        <Mail size={18} />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>

                    {/* ROW 2 — Icon Actions: Like | Gift | Share | Cosmic | Report */}
                    <div className="flex gap-1.5">
                        {/* Like */}
                        <button
                            onClick={handleLike}
                            disabled={loading}
                            className={`flex-1 h-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 active:scale-95 ${hasLiked
                                ? 'bg-pink-500/30 border-pink-500/60'
                                : 'bg-black/60 border-white/10 hover:bg-black/80'
                                }`}
                            title={hasLiked ? "You liked this profile" : "Like"}
                        >
                            <span className={`text-base leading-none ${hasLiked ? 'scale-110' : ''} transition-transform`}>{hasLiked ? '❤️' : '🤍'}</span>
                            <span className="text-[9px] font-bold text-white/80 mt-0.5">{likeCount}</span>
                        </button>

                        {/* Gift */}
                        <button
                            onClick={(e) => { e.stopPropagation(); if (onGift) onGift(); }}
                            className="flex-1 h-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-md border border-white/10 bg-black/60 shadow-lg transition-all duration-300 hover:bg-black/80 active:scale-95"
                            title="Send a Gift"
                        >
                            <span className="text-base leading-none">🎁</span>
                            <span className="text-[9px] font-bold text-white/80 mt-0.5">{match.total_gifts || 0}</span>
                        </button>

                        {/* Share */}
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const shareData = {
                                    title: `Match: ${match.name}`,
                                    text: `Check out ${match.name} on LifePartner AI!`,
                                    url: `https://lifepartnerai.in/profile/${match.id}?utm_source=share&utm_medium=social&utm_campaign=profile_share`
                                };
                                try {
                                    if (navigator.share) {
                                        await navigator.share(shareData);
                                    } else {
                                        await navigator.clipboard.writeText(shareData.url);
                                        toast.success("Link copied!");
                                    }
                                } catch { /* cancelled */ }
                            }}
                            className="flex-1 h-10 flex items-center justify-center rounded-xl backdrop-blur-md border border-white/10 bg-black/60 shadow-lg transition-all duration-300 active:scale-95 hover:bg-blue-500/20 hover:border-blue-500/50 text-gray-300"
                            title="Share Profile"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        {/* Cosmic Compatibility */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowCosmicReport(true); }}
                            className="flex-1 h-10 flex items-center justify-center rounded-xl backdrop-blur-md border border-purple-400/40 bg-gradient-to-br from-pink-500/70 to-purple-600/70 shadow-lg transition-all duration-300 active:scale-95 hover:from-pink-500 hover:to-purple-600"
                            title="Cosmic Compatibility"
                        >
                            <span className="text-base">✨</span>
                        </button>

                        {/* Report */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                            className="flex-1 h-10 flex items-center justify-center rounded-xl backdrop-blur-md border border-white/10 bg-black/60 shadow-lg transition-all duration-300 active:scale-95 hover:bg-red-500/20 hover:border-red-500/50 text-gray-400 hover:text-red-400"
                            title="Report User"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <ReportModal
                    isOpen={showReport}
                    onClose={() => setShowReport(false)}
                    targetUserId={match.id}
                    targetUserName={match.name}
                />

                {/* Direct Message Modal */}
                <Modal
                    isOpen={showDMModal}
                    onClose={() => setShowDMModal(false)}
                    title="Direct Message"
                    description={`Send a direct message to ${match.name} instantly, bypassing the match process.`}
                >
                    <div className="space-y-4 py-2">
                        {!currentUser?.is_premium && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-3 rounded-xl flex items-center gap-2 text-sm text-purple-800 dark:text-purple-300">
                                <Sparkles size={16} />
                                You have <strong>{currentUser?.free_direct_messages ?? 3}</strong> free messages left.
                            </div>
                        )}

                        <form onSubmit={handleSendDM}>
                            <textarea
                                value={dmText}
                                onChange={e => setDmText(e.target.value)}
                                placeholder="Type something nice to start the conversation..."
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 min-h-[100px] resize-none text-gray-900 dark:text-white"
                                autoFocus
                            />
                            <Button 
                                type="submit" 
                                disabled={sendingDM || !dmText.trim() || (!currentUser?.is_premium && (currentUser?.free_direct_messages ?? 3) <= 0)}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12 shadow-lg"
                            >
                                {sendingDM ? 'Sending...' : 'Send Direct Message'}
                            </Button>
                        </form>
                    </div>
                </Modal>
            </div>

            {/* Cosmic Compatibility Modal */}
            {showCosmicReport && (
                <CompatibilityModal
                    isOpen={showCosmicReport}
                    onClose={() => setShowCosmicReport(false)}
                    targetUserId={match.id}
                    targetName={match.name}
                />
            )}
            {activeHighlightSet && (
                <StoryModal
                    stories={activeHighlightSet.stories}
                    initialIndex={activeHighlightSet.initialIndex || 0}
                    user={activeHighlightSet.user}
                    currentUser={currentUser}
                    onClose={() => setActiveHighlightSet(null)}
                />
            )}
        </div>
    );
});

export default MatchCard;
