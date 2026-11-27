
'use client';
import { getZodiacSymbol } from '@/lib/religionUtils';

import { useState, useEffect } from 'react';
import { X, ArrowLeft, Heart, MessageCircle, MoreVertical, MapPin, Briefcase, GraduationCap, Globe, Shield, Star, Coins, Play, Sparkles, Trash2, Copy, Check, Share2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoCallButton from '@/components/VideoCallButton';
import VerificationBadge from './VerificationBadge';
import dynamic from 'next/dynamic';
import { formatLocationString, getProfilePhotoUrl, isProfilePhotoBlurred, isPlaceholderPhoto, hasUserUploadedPhoto } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

const KundliModal = dynamic(() => import('./KundliModal'), { ssr: false });
const CoinStoreModal = dynamic(() => import('./CoinStoreModal'), { ssr: false });
const CompatibilityModal = dynamic(() => import('./CompatibilityModal'), { ssr: false });
const StoryModal = dynamic(() => import('./StoryModal'), { ssr: false });
const ReportModal = dynamic(() => import('./ReportModal'), { ssr: false });

interface ProfileModalProps {
    profile: any;
    currentUser?: any;
    onClose: () => void;
    onConnect?: () => void;
    onChat?: () => void;
    onUpgrade?: () => void;
    isConnectedProp?: boolean;
}

export default function ProfileModal({ profile, currentUser, onClose, onConnect, onChat, onUpgrade, isConnectedProp }: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState('ai insight');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [lastInteracted, setLastInteracted] = useState(0);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [showKundli, setShowKundli] = useState(false);
    const [showCosmicReport, setShowCosmicReport] = useState(false);
    const [activeHighlightSet, setActiveHighlightSet] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [sheetExpanded, setSheetExpanded] = useState(false);
    const [swipeStartX, setSwipeStartX] = useState(0);
    const [swipeStartY, setSwipeStartY] = useState(0);

    const toast = useToast();
    const [copiedId, setCopiedId] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [matchStatus, setMatchStatus] = useState<string | null>(profile?.match_status || null);
    const [loadingInterest, setLoadingInterest] = useState(false);
    const [livePrivacy, setLivePrivacy] = useState<{ photo_privacy?: string; isBlurred?: boolean; match_status?: string | null } | null>(null);
    const [liveAstrology, setLiveAstrology] = useState<{ kundli?: any; horoscope?: any; religion?: any } | null>(null);

    const isOwnProfile = Boolean(
        currentUser &&
        profile &&
        String(currentUser.id || currentUser.userId) === String(profile.id || profile.user_id)
    );

    const effectiveKundli = (liveAstrology?.kundli && (liveAstrology.kundli.score > 0 || (Array.isArray(liveAstrology.kundli.details) && liveAstrology.kundli.details.length > 0)))
        ? liveAstrology.kundli
        : (profile?.kundli || null);
    const hasValidKundli = Boolean(
        effectiveKundli &&
        typeof effectiveKundli.score === 'number' &&
        (effectiveKundli.score > 0 || (Array.isArray(effectiveKundli.details) && effectiveKundli.details.length > 0))
    );

    useEffect(() => {
        setMatchStatus(profile?.match_status || null);
        setLivePrivacy(null);
        setLiveAstrology(null);
        setCurrentPhotoIndex(0);
        setIsFullscreen(false);
    }, [profile?.id, profile?.match_status]);

    useEffect(() => {
        if (!profile?.id || isOwnProfile) return;
        let cancelled = false;
        api.profile.getById(profile.id)
            .then((full: any) => {
                if (cancelled || !full) return;
                setLivePrivacy({
                    photo_privacy: full.photo_privacy || full.photoPrivacy,
                    isBlurred: Boolean(full.isBlurred),
                    match_status: full.match_status || null
                });
                if (full.kundli || full.horoscope || full.religion) {
                    setLiveAstrology({
                        kundli: full.kundli,
                        horoscope: full.horoscope,
                        religion: full.religion
                    });
                }
                if (full.match_status) {
                    setMatchStatus(full.match_status);
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [profile?.id, isOwnProfile]);

    const effectiveMatchStatus = livePrivacy?.match_status || matchStatus;
    const isConnected = Boolean(isConnectedProp || effectiveMatchStatus === 'accepted' || effectiveMatchStatus === 'connected');
    const isPhotoBlurred = isProfilePhotoBlurred(
        {
            ...profile,
            match_status: effectiveMatchStatus,
            photo_privacy: livePrivacy?.photo_privacy ?? profile?.photo_privacy,
            isBlurred: profile?.name === '???'
                ? true
                : (livePrivacy ? Boolean(livePrivacy.isBlurred) : Boolean(profile?.isBlurred))
        },
        currentUser,
        isConnected
    );

    useEffect(() => {
        if (isPhotoBlurred && isFullscreen) {
            setIsFullscreen(false);
        }
    }, [isPhotoBlurred, isFullscreen]);

    const handleConnect = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (loadingInterest || matchStatus === 'pending' || isConnectedProp) return;

        setLoadingInterest(true);
        const prevStatus = matchStatus;
        setMatchStatus('pending');

        try {
            await api.interactions.sendInterest(profile.id);
            if (onConnect) onConnect();
        } catch (err) {
            setMatchStatus(prevStatus);
            toast.error("Connection failed. Please try again.");
        } finally {
            setLoadingInterest(false);
        }
    };

    const TABS = ['ai insight', 'about', 'highlights', 'personal', 'career', 'family', 'lifestyle', 'preferences'];

    const handleTouchStart = (e: React.TouchEvent) => {
        setSwipeStartX(e.touches[0].clientX);
        setSwipeStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!swipeStartX || !swipeStartY) return;
        const deltaX = swipeStartX - e.changedTouches[0].clientX;
        const deltaY = swipeStartY - e.changedTouches[0].clientY;

        // Horizontal swipe → change tab (must be more horizontal than vertical & > 40px)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            const currentIndex = TABS.indexOf(activeTab);
            if (deltaX > 0 && currentIndex < TABS.length - 1) {
                setActiveTab(TABS[currentIndex + 1]); // swipe left → next tab
            } else if (deltaX < 0 && currentIndex > 0) {
                setActiveTab(TABS[currentIndex - 1]); // swipe right → prev tab
            }
        }
    };

    const [hasRequestedPhoto, setHasRequestedPhoto] = useState(false);
    const [requestingPhoto, setRequestingPhoto] = useState(false);

    // Safe derived values so hooks always execute in identical order
    const safePhotosList: string[] = Array.isArray(profile?.photos) && profile.photos.length > 0
        ? profile.photos
        : (profile?.photoUrl ? [profile.photoUrl] : []);
    const hasUploadedPhotoEarly = Boolean(profile) && hasUserUploadedPhoto(profile) && safePhotosList.some(p => !isPlaceholderPhoto(p));

    // Auto-Slide Effect (disabled while Privacy Shield is active or when photo not uploaded)
    useEffect(() => {
        if (!profile || !hasUploadedPhotoEarly || safePhotosList.length <= 1 || isPhotoBlurred) return;

        const interval = setInterval(() => {
            if (Date.now() - lastInteracted > 4000) {
                setCurrentPhotoIndex(prev => (prev + 1) % safePhotosList.length);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [profile, safePhotosList.length, lastInteracted, isPhotoBlurred, hasUploadedPhotoEarly]);

    // TRACK PROFILE VIEW
    useEffect(() => {
        if (currentUser && profile?.id && profile.id !== currentUser.id) {
            api.interactions.recordView(profile.id).catch(err => console.error("Failed to track profile view", err));
        }
    }, [profile?.id, currentUser]);

    if (!profile) return null;

    // 🛡️ Data Sanitization: Ensure all nested objects exist to prevent crashes
    const safeProfile = {
        ...profile,
        career: profile.career || {},
        family: profile.family || {},
        religion: liveAstrology?.religion || profile.religion || {},
        horoscope: liveAstrology?.horoscope || profile.horoscope || {},
        photos: Array.isArray(profile.photos) ? profile.photos : [],
        location: profile.location || {},
        match_reasons: Array.isArray(profile.match_reasons) ? profile.match_reasons : [],
    };

    // Ensure photos array is valid
    const photos: string[] = safeProfile.photos.length > 0
        ? safeProfile.photos
        : [profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`];

    const hasUploadedPhoto = hasUserUploadedPhoto(profile) && photos.some(p => !isPlaceholderPhoto(p));

    const handleRequestPhoto = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasRequestedPhoto || requestingPhoto) return;
        setRequestingPhoto(true);
        try {
            await api.interactions.requestPhoto(profile.id);
            setHasRequestedPhoto(true);
            toast.success(`📷 Photo request sent to ${profile.name || 'member'}! We'll notify you when uploaded.`);
        } catch {
            setHasRequestedPhoto(true);
            toast.success(`📷 Photo request sent to ${profile.name || 'member'}!`);
        } finally {
            setRequestingPhoto(false);
        }
    };


    // Helper for safe Date parsing
    const getAge = (dob: string | undefined, defaultAge: any) => {
        if (!dob) return defaultAge;
        try {
            const date = new Date(dob);
            if (isNaN(date.getTime())) return defaultAge;
            return new Date().getFullYear() - date.getFullYear();
        } catch (e) { return defaultAge; }
    };

    const displayProfileId = profile.profile_id || profile.profileId || (profile.referral_code ? `LP-${String(profile.referral_code).toUpperCase()}` : (profile.id ? `LP-${String(profile.id).slice(0, 8).toUpperCase()}` : ''));
    const displayHandle = profile.handle || (profile.name ? `@${String(profile.name).toLowerCase().replace(/[^a-z0-9]/g, '')}` : '');

    const handleCopyId = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!displayProfileId) return;
        navigator.clipboard.writeText(displayProfileId);
        setCopiedId(true);
        toast.success(`Copied Profile ID: ${displayProfileId}`);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleShareProfile = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${displayProfileId || profile.id}`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `${profile.name} on LifePartner AI`,
                    text: `View ${profile.name}'s verified profile on LifePartner AI (${displayProfileId})`,
                    url: profileUrl,
                });
                return;
            } catch (err: any) {
                if (err.name === 'AbortError') return;
            }
        }
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(profileUrl);
            toast.success("Profile link copied to clipboard!");
        }
    };

    const isAlreadyConnected = typeof isConnectedProp === 'boolean'
        ? isConnectedProp
        : (effectiveMatchStatus === 'accepted' || effectiveMatchStatus === 'connected');
    const isPendingRequest = effectiveMatchStatus === 'pending';

    const renderActionBar = (className: string) => (
        <div className={className}>
            {isAlreadyConnected && (
                <div className="flex items-center justify-center gap-1.5 mb-1.5 py-0.5 px-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 w-max mx-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Connected</span>
                </div>
            )}
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11 sm:h-12 rounded-xl border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose}>
                    {isAlreadyConnected ? 'Close' : 'Skip'}
                </Button>
                {isAlreadyConnected ? (
                    <Button className="flex-[2] h-11 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/30" onClick={() => { onClose(); onChat?.(); }}>
                        💬 Chat Now
                    </Button>
                ) : isPendingRequest ? (
                    <Button disabled className="flex-[2] h-11 sm:h-12 rounded-xl bg-emerald-600 text-white font-bold shadow-lg opacity-80 cursor-not-allowed">
                        ✓ Request Sent
                    </Button>
                ) : (
                    <Button
                        disabled={loadingInterest}
                        className="flex-[2] h-11 sm:h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/10"
                        onClick={handleConnect}
                    >
                        {loadingInterest ? 'Sending...' : '✨ Send Interest'}
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md md:p-6 animate-in fade-in duration-300 overflow-hidden">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[100dvh] md:h-[86vh] md:max-h-[820px] rounded-none md:rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">

                {/* Mobile Top Navigation Bar (Respects safe-area & never overlaps hero or sticky tabs) */}
                <div className="md:hidden shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top,0px))] flex items-center justify-between gap-2 z-40">
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 flex items-center gap-1 text-xs font-bold active:scale-95 transition-all shrink-0 cursor-pointer"
                        aria-label="Back to matches"
                        title="Back to matches"
                    >
                        <ArrowLeft size={18} />
                        <span>Back</span>
                    </button>
                    <div className="min-w-0 flex-1 text-center px-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {profile.name}{profile.age ? `, ${profile.age}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {!isOwnProfile && (
                            <button
                                type="button"
                                onClick={() => setShowReportModal(true)}
                                className="p-2 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 active:scale-95 transition-all cursor-pointer"
                                aria-label="Report and Block User"
                                title="Report & Block User"
                            >
                                <Flag size={15} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleShareProfile}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 active:scale-95 transition-all cursor-pointer"
                            aria-label="Share Profile"
                            title="Share Profile"
                        >
                            <Share2 size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 active:scale-95 transition-all cursor-pointer"
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Desktop Close Button (Floating top-right, clear of desktop header badges) */}
                <button
                    type="button"
                    onClick={onClose}
                    className="hidden md:flex absolute top-4 right-4 z-[999] p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer items-center justify-center"
                    aria-label="Close"
                    title="Close"
                >
                    <X size={18} />
                </button>

                {/* Main Body: Single vertical scroll on mobile, independent 2-column split on desktop */}
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative">

                {/* LEFT: Photo (Responsive hero on mobile, 45% full-height column on desktop) */}
                <div className="w-full md:w-[45%] h-[340px] sm:h-[400px] md:h-full bg-gray-950 relative group shrink-0 overflow-hidden flex items-center justify-center">

                    {!hasUploadedPhoto ? (
                        <div className="w-full h-full bg-gradient-to-br from-[#12162a] via-[#0d1020] to-[#1c122c] relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                            {/* Ambient Glows */}
                            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-purple-600/25 to-pink-600/15 blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-gradient-to-tr from-indigo-600/25 to-teal-600/15 blur-3xl pointer-events-none" />

                            {/* Watermark Mandala */}
                            <svg className="absolute -right-12 -top-12 w-64 h-64 text-white/[0.035] pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
                                <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
                                <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
                                <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.5" />
                            </svg>

                            {/* Monogram Crest */}
                            <div className="relative mb-3.5 z-10">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-2xl shadow-purple-950/60">
                                    <div className="w-full h-full rounded-full bg-[#121626] flex items-center justify-center">
                                        <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-rose-200 to-purple-200">
                                            {(() => {
                                                const clean = (profile.name || '').replace(/[^a-zA-Z\s]/g, '').trim();
                                                if (!clean) return 'LP';
                                                const parts = clean.split(/\s+/).filter(Boolean);
                                                return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : clean.slice(0, 2).toUpperCase();
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-600 border-2 border-white/40 flex items-center justify-center text-xs shadow-md">
                                    📷
                                </div>
                            </div>

                            <div className="relative z-10 max-w-xs">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-200 text-xs font-bold mb-2">
                                    📷 Photo on Request
                                </span>
                                <h3 className="text-xl font-black text-white tracking-tight">
                                    {profile.name || 'Member'}{profile.age ? `, ${profile.age}` : ''}
                                </h3>
                                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                                    This member has chosen to keep photos private or pending upload. Connect or request a photo to view their gallery.
                                </p>

                                <div className="mt-3.5 flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleRequestPhoto}
                                        disabled={hasRequestedPhoto || requestingPhoto}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 ${hasRequestedPhoto
                                            ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300'
                                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border border-white/20 cursor-pointer'
                                            }`}
                                    >
                                        <span>📷</span>
                                        <span>{hasRequestedPhoto ? '✓ Photo Requested' : requestingPhoto ? 'Sending...' : 'Request Photo'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Main Image */}
                            <img
                                src={photos[currentPhotoIndex]}
                                alt={profile.name}
                                onClick={() => {
                                    if (!isPhotoBlurred) setIsFullscreen(true);
                                }}
                                className={`w-full h-full object-cover bg-black/90 block transition-opacity duration-500 ${isPhotoBlurred ? 'blur-2xl scale-110 filter cursor-default select-none' : 'cursor-zoom-in'}`}
                                loading="eager"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'User')}`;
                                }}
                            />

                            {/* Privacy Shield Blurred Overlay — Scrim across full hero + badge centered above bottom profile details */}
                            {isPhotoBlurred && (
                                <>
                                    <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" />
                                    <div className="absolute inset-x-4 top-6 bottom-36 md:top-10 md:bottom-40 z-20 flex flex-col items-center justify-center p-4 text-center select-none pointer-events-none">
                                        <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 mb-2 shadow-lg shadow-pink-500/10 animate-pulse">
                                            <span className="text-xl">🔒</span>
                                        </div>
                                        <span className="text-white font-black text-sm tracking-wide drop-shadow">Photo Private</span>
                                        <span className="text-white/85 text-xs mt-1 max-w-[210px] leading-snug drop-shadow">
                                            Connect to view full profile photos
                                        </span>
                                        <span className="mt-2 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-pink-950/75 text-pink-200 border border-pink-400/35 shadow-sm">
                                            🛡️ Privacy Shield
                                        </span>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col justify-end z-30 pointer-events-none">
                        {/* Highlight Badge on Cover */}
                        {(() => {
                            const highlights = (profile.stories || []).filter((s: any) => Boolean(s.isHighlight || s.is_highlight));
                            if (highlights.length === 0) return null;
                            return (
                                <div className="pointer-events-auto mb-2 flex items-center">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPhotoBlurred) {
                                                toast.info('Connect to view private photos & highlights');
                                                return;
                                            }
                                            setActiveHighlightSet({
                                                stories: highlights,
                                                initialIndex: 0,
                                                user: {
                                                    id: profile.id,
                                                    name: profile.name || profile.full_name || 'User',
                                                    photoUrl: getProfilePhotoUrl(profile)
                                                }
                                            });
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-white text-[11px] font-black uppercase tracking-wide shadow-xl border border-white/30 hover:scale-105 transition-transform"
                                    >
                                        <span>{isPhotoBlurred ? '🔒' : '⭐'} Highlights ({highlights.length})</span>
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Profile ID & Handle Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5 pointer-events-auto">
                            {displayProfileId && (
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white text-[11px] font-mono font-bold bg-purple-950/80 hover:bg-purple-900 border border-purple-400/40 px-2.5 py-0.5 rounded-full backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
                                    title="Click to copy Profile ID"
                                >
                                    <span>🆔 {displayProfileId}</span>
                                    {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-purple-300" />}
                                </button>
                            )}
                            {displayHandle && (
                                <span className="inline-flex items-center text-indigo-200 text-[11px] font-semibold bg-indigo-950/70 border border-indigo-400/30 px-2.5 py-0.5 rounded-full backdrop-blur-md max-w-full truncate">
                                    {displayHandle}
                                </span>
                            )}
                            {Boolean(profile.managed_by && profile.managed_by !== 'Self') && (
                                <span className="inline-flex items-center gap-1 text-teal-200 text-[11px] font-bold bg-teal-950/80 border border-teal-400/40 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm" title={`Profile managed by ${profile.managed_by}`}>
                                    {profile.managed_by === 'Parent' ? '👨‍👩‍👧 Managed by Parent' : profile.managed_by === 'Sibling' ? '👫 Managed by Sibling' : `👤 Managed by ${profile.managed_by}`}
                                </span>
                            )}
                            {!isOwnProfile && hasValidKundli && (
                                <button
                                    type="button"
                                    onClick={() => setShowKundli(true)}
                                    className="inline-flex items-center gap-1 text-orange-200 text-[11px] font-bold bg-orange-950/80 border border-orange-400/40 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-sm active:scale-95 cursor-pointer"
                                    title="View Vedic Kundli Milan"
                                >
                                    <span>🕉️</span> {effectiveKundli.score}/36 Guna
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-md flex items-center gap-2">
                                {profile.name}{profile.age ? `, ${profile.age}` : ''}
                                {profile.isPremium && <span className="text-amber-400 text-xl drop-shadow-lg animate-pulse" title="Premium Member">👑</span>}
                            </h2>
                            {Boolean(profile.isVerified) && <VerificationBadge size={16} className="bg-blue-900/30 p-0.5 rounded-full" showTooltip />}
                        </div>
                        <p className="text-gray-200 text-xs font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 drop-shadow-md">
                            <span>{profile.career?.profession || "-"}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span>{formatLocationString(profile.location)}</span>
                        </p>
                    </div>

                    {/* Photo Progress Bar (Instagram Story Style) */}
                    {!isPhotoBlurred && photos.length > 1 && (
                        <div className="absolute top-3 inset-x-4 flex gap-1 z-30">
                            {photos.map((_, idx) => (
                                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-white transition-all duration-300 ${idx === currentPhotoIndex ? 'w-full' : idx < currentPhotoIndex ? 'w-full' : 'w-0'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Navigation Arrows for Visibility */}
                    {!isPhotoBlurred && photos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLastInteracted(Date.now());
                                    setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 text-white/80 hover:text-white p-2 rounded-full bg-black/25 hover:bg-black/50 transition-all"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLastInteracted(Date.now());
                                    setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 text-white/80 hover:text-white p-2 rounded-full bg-black/25 hover:bg-black/50 transition-all"
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </>
                    )}

                    {/* Navigation Touch Areas — Strictly disabled when Privacy Shield is active */}
                    {!isPhotoBlurred && (
                        <div className="absolute inset-0 flex z-10">
                            <div className="w-[30%] h-full cursor-pointer" onClick={() => {
                                setLastInteracted(Date.now());
                                setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                            }} />
                            <div className="w-[40%] h-full cursor-zoom-in" onClick={() => setIsFullscreen(true)} />
                            <div className="w-[30%] h-full cursor-pointer" onClick={() => {
                                setLastInteracted(Date.now());
                                setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                            }} />
                        </div>
                    )}
                </div>

                {/* RIGHT: Content & Details — Natural flow on mobile scroll, independent scroll pane on desktop */}
                <div className="w-full md:w-[55%] md:flex-1 md:h-full md:overflow-y-auto flex flex-col bg-white dark:bg-gray-900 relative min-w-0">

                    {/* Desktop Header (Hidden on Mobile; padded on right to clear floating X button) */}
                    <div className="hidden md:block pl-8 pr-14 pt-6 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {displayProfileId && (
                                    <button
                                        type="button"
                                        onClick={handleCopyId}
                                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-full transition-all active:scale-95 cursor-pointer"
                                        title="Click to copy Profile ID"
                                    >
                                        <span>🆔 {displayProfileId}</span>
                                        {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-purple-500" />}
                                    </button>
                                )}
                                {displayHandle && (
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                                        {displayHandle}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {(!currentUser || String(currentUser.id || currentUser.userId) !== String(profile.id)) && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReportModal(true)}
                                        className="p-1 px-3 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                        title="Report & Block Profile"
                                    >
                                        <Flag size={13} />
                                        <span>Report</span>
                                    </button>
                                )}
                                <div className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full text-xs font-bold border border-pink-100 dark:border-pink-800/50 flex items-center gap-1 w-max">
                                    <span>🎁</span> {profile.total_gifts || 0} Gifts
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-800/50 flex items-center gap-1 w-max">
                                    <span>❤️</span> {profile.total_likes || 0} Likes
                                </div>
                                {!isOwnProfile && hasValidKundli && (
                                    <button
                                        type="button"
                                        onClick={() => setShowKundli(true)}
                                        className="bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                        title="View Vedic Kundli Milan"
                                    >
                                        <span>🕉️</span> {effectiveKundli.score}/36 Guna
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleShareProfile}
                                    className="p-1 px-3 rounded-full bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                    title="Share Profile Link"
                                >
                                    <Share2 size={13} />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>





                    {/* Story Highlights Reel */}
                    {(() => {
                        const highlightedStories = (profile.stories || []).filter((s: any) => Boolean(s.isHighlight || s.is_highlight));
                        if (highlightedStories.length === 0) return null;

                        return (
                            <div className="px-4 md:px-8 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-amber-50/50 via-purple-50/30 to-pink-50/50 dark:from-gray-800/40 dark:to-gray-800/20">
                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-800 dark:text-gray-200 mb-2 tracking-wide uppercase">
                                    <span className="text-amber-500">⭐</span>
                                    <span>Profile Highlights</span>
                                </div>
                                <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-1">
                                    {highlightedStories.map((hStory: any, idx: number) => (
                                        <div
                                            key={hStory.id || idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isPhotoBlurred) {
                                                    toast.info('Highlights are hidden until you connect');
                                                    return;
                                                }
                                                setActiveHighlightSet({
                                                    stories: highlightedStories,
                                                    initialIndex: idx,
                                                    user: {
                                                        id: profile.id,
                                                        name: profile.name || profile.full_name || 'User',
                                                        photoUrl: getProfilePhotoUrl(profile)
                                                    }
                                                });
                                            }}
                                            className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
                                        >
                                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-purple-500 to-pink-500 shadow-md group-hover:scale-105 transition-transform">
                                                <div className="relative w-full h-full rounded-full p-[1px] bg-white dark:bg-gray-900 overflow-hidden">
                                                    {hStory.type === 'video' ? (
                                                        <video src={hStory.url} className={`w-full h-full object-cover ${isPhotoBlurred ? 'blur-md scale-110' : ''}`} muted />
                                                    ) : (
                                                        <img src={hStory.url} className={`w-full h-full object-cover ${isPhotoBlurred ? 'blur-md scale-110' : ''}`} alt="Highlight" />
                                                    )}
                                                    {isPhotoBlurred && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">🔒</div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate max-w-[60px]">
                                                Highlight {idx + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Sticky Tabs */}
                    <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-30 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-0">
                            {/* Tab scroll area */}
                            <div className="flex-1 flex space-x-5 overflow-x-auto no-scrollbar py-2.5 px-4 md:px-6">
                                {TABS.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                            pb-1.5 text-xs md:text-sm font-semibold capitalize whitespace-nowrap transition-all
                                            ${activeTab === tab
                                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'}
                                        `}
                                    >
                                        {tab === 'ai insight' ? '🤖 AI' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Swipe hint on mobile */}
                        <div className="flex md:hidden justify-center pb-1">
                            <span className="text-[9px] text-gray-300 dark:text-gray-600">← swipe to browse tabs →</span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div 
                        className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 pb-8 min-h-0 min-w-0"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {activeTab === 'highlights' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-xl space-y-4">
                                    <div className="flex items-center gap-2 text-amber-500 font-black text-sm uppercase tracking-widest">
                                        <Star size={18} fill="currentColor" />
                                        <span>Story Highlights</span>
                                    </div>

                                    {(() => {
                                        const highlightedStories = (profile.stories || []).filter((s: any) => Boolean(s.isHighlight || s.is_highlight));
                                        if (highlightedStories.length === 0) {
                                            const isOwner = currentUser && (String(currentUser.id || currentUser.userId) === String(profile.id || profile.user_id));
                                            return (
                                                <div className="text-center py-8 px-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/50 space-y-3">
                                                    <div className="text-3xl">⭐</div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                        {isOwner ? "No Saved Highlights Yet" : "No Highlights Available"}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                                        {isOwner 
                                                            ? "Pin your favorite active stories to your profile! Open your story in the viewer and tap the ⭐ Star button to save it here permanently."
                                                            : "This profile has not saved any active stories to their highlights reel yet."
                                                        }
                                                    </p>
                                                </div>
                                            );
                                        }

                                        const isOwner = currentUser && (String(currentUser.id || currentUser.userId) === String(profile.id || profile.user_id));

                                        return (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                {highlightedStories.map((hStory: any, idx: number) => (
                                                    <div
                                                        key={hStory.id || idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isPhotoBlurred) {
                                                                toast.info('Highlights are hidden until you connect');
                                                                return;
                                                            }
                                                            setActiveHighlightSet({
                                                                stories: highlightedStories,
                                                                initialIndex: idx,
                                                                user: {
                                                                    id: profile.id,
                                                                    name: profile.name || profile.full_name || 'User',
                                                                    photoUrl: getProfilePhotoUrl(profile)
                                                                }
                                                            });
                                                        }}
                                                        className="relative flex flex-col items-center gap-2 cursor-pointer group"
                                                    >
                                                        <div className="relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg group-hover:scale-105 transition-all">
                                                            <div className="relative w-full h-full rounded-full p-[2px] bg-white dark:bg-gray-900 overflow-hidden">
                                                                {hStory.type === 'video' ? (
                                                                    <video src={hStory.url} className={`w-full h-full object-cover ${isPhotoBlurred ? 'blur-md scale-110' : ''}`} muted />
                                                                ) : (
                                                                    <img src={hStory.url} className={`w-full h-full object-cover ${isPhotoBlurred ? 'blur-md scale-110' : ''}`} alt="Highlight" />
                                                                )}
                                                                {isPhotoBlurred && (
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm">🔒</div>
                                                                )}
                                                            </div>

                                                            {isOwner && (
                                                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            try {
                                                                                const res = await api.profile.toggleStoryHighlight(hStory.id);
                                                                                if (res?.success && Array.isArray(profile.stories)) {
                                                                                    profile.stories = profile.stories.map((s: any) =>
                                                                                        String(s.id) === String(hStory.id) ? { ...s, isHighlight: false, is_highlight: false } : s
                                                                                    );
                                                                                    toast.success("Removed from highlights");
                                                                                }
                                                                            } catch (err: any) {
                                                                                toast.error("Failed to unhighlight story");
                                                                            }
                                                                        }}
                                                                        className="p-1.5 rounded-full bg-amber-500/90 text-white hover:bg-amber-600 shadow-md transition-transform hover:scale-110"
                                                                        title="Remove from Highlights"
                                                                    >
                                                                        <Star size={12} fill="currentColor" />
                                                                    </button>
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm("Delete this story permanently?")) {
                                                                                try {
                                                                                    await api.profile.deleteStory(hStory.id);
                                                                                    if (profile.stories) {
                                                                                        profile.stories = profile.stories.filter((s: any) => String(s.id) !== String(hStory.id));
                                                                                    }
                                                                                    toast.success("Story deleted!");
                                                                                } catch (err: any) {
                                                                                    toast.error("Failed to delete story");
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-700 shadow-md transition-transform hover:scale-110"
                                                                        title="Delete Story Permanently"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                                                            Highlight {idx + 1}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai insight' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-xl">🤖</div>
                                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100">AI Compatibility Analysis</h3>
                                    </div>
                                    <p className="text-indigo-800/80 dark:text-indigo-300 italic text-sm leading-relaxed border-l-4 border-indigo-400 dark:border-indigo-500 pl-4 py-1">
                                        &ldquo;{safeProfile.summary || "Strong compatibility based on shared values like lifestyle, career expectations, and background compatibility."}&rdquo;
                                    </p>

                                    {/* Match Reasons (AI Similarity Badges) */}
                                    {(() => {
                                        const matchReasons = Array.isArray(safeProfile.match_reasons)
                                            ? safeProfile.match_reasons
                                            : (typeof safeProfile.match_reasons === 'string'
                                                ? safeProfile.match_reasons.split(',').map((s: string) => s.trim()).filter(Boolean)
                                                : []);
                                        if (matchReasons.length === 0) return null;
                                        return (
                                            <div className="flex flex-wrap gap-1.5 mt-4">
                                                {matchReasons.map((reason: string, idx: number) => (
                                                    <div 
                                                        key={idx}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider shadow-sm"
                                                    >
                                                        <span>✨ {reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    <div className="flex flex-wrap gap-3 mt-6">
                                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 shadow-sm flex items-center gap-2">
                                            <span>✨</span> {profile.score || 0}% Match Score
                                        </div>
                                        {!isOwnProfile && hasValidKundli && (
                                            <button
                                                type="button"
                                                onClick={() => setShowKundli(true)}
                                                className="bg-orange-100/80 dark:bg-orange-950/40 hover:bg-orange-200/90 px-4 py-2 rounded-xl text-xs font-bold text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 shadow-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                                            >
                                                <span>🕉️</span> {effectiveKundli.score}/36 Guna Match
                                            </button>
                                        )}
                                        <div className="bg-pink-100/50 dark:bg-pink-900/20 px-4 py-2 rounded-xl text-xs font-bold text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-900/50 shadow-sm flex items-center gap-2">
                                            <span>🎁</span> {profile.total_gifts || 0} Gifts
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Detailed AI breakdown */}
                                </div>

                                <Button 
                                    onClick={() => setShowCosmicReport(true)}
                                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={20} />
                                    Generate Cosmic Compatibility Report
                                </Button>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">About Me</h3>
                                    <p className="text-blue-800/90 dark:text-blue-300 leading-relaxed text-sm md:text-[15px]">
                                        {profile.aboutMe || "No bio provided."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <InfoCard label="Age / Height" value={`${profile.dob ? (() => { const b = new Date(profile.dob); const t = new Date(); let a = t.getFullYear() - b.getFullYear(); const m = t.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--; return a; })() : profile.age} Yrs, ${profile.height || "-"}`} />
                                    <InfoCard label="Marital Status" value={(!profile.maritalStatus) ? "Not Specified" : profile.maritalStatus} />
                                    <InfoCard label="Location" value={formatLocationString(profile.location)} />
                                    <InfoCard label="Mother Tongue" value={profile.motherTongue || "-"} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'personal' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/50">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                        <h3 className="font-bold text-purple-900 dark:text-purple-100">Horoscope &amp; Faith</h3>
                                        {!isOwnProfile && hasValidKundli && (
                                            <button
                                                type="button"
                                                onClick={() => setShowKundli(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
                                            >
                                                <span>🕉️</span>
                                                <span>Kundli Match ({effectiveKundli.score}/36 Guna)</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <InfoCard label="Religion" value={safeProfile.religion?.faith || safeProfile.religion?.religion || "-"} />
                                        <InfoCard label="Caste" value={safeProfile.religion?.caste || "-"} />
                                        <InfoCard label="Inter-Caste" value={safeProfile.religion?.interCasteOpen || "-"} />
                                        <InfoCard label="Gothra" value={safeProfile.horoscope?.gothra || safeProfile.religion?.gothra || "-"} />
                                        <InfoCard label="Manglik" value={safeProfile.horoscope?.manglik || "-"} icon="✨" />
                                        <InfoCard label="Zodiac" value={safeProfile.horoscope?.zodiacSign ? `${getZodiacSymbol(safeProfile.horoscope.zodiacSign)} ${safeProfile.horoscope.zodiacSign}` : "-"} />
                                        <InfoCard label="Nakshatra" value={safeProfile.horoscope?.nakshatra || "-"} />
                                        <InfoCard label="Time of Birth" value={safeProfile.horoscope?.birthTime || "-"} />
                                        <InfoCard label="Birth Place" value={safeProfile.horoscope?.birthPlace || "-"} />
                                    </div>
                                    {!isOwnProfile && hasValidKundli && (
                                        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-400/15 border border-orange-300 dark:border-orange-700/50 flex items-center justify-center text-2xl shrink-0">
                                                    🕉️
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Vedic Kundli Compatibility</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${effectiveKundli.score >= 18 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'}`}>
                                                            {effectiveKundli.score}/36 Guna
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                                        {effectiveKundli.verdict || (effectiveKundli.score >= 18 ? 'Auspicious Match (Uttama Guna)' : 'Needs Consideration')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowKundli(true)}
                                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0 text-center"
                                            >
                                                View 8-Koota Breakdown →
                                            </button>
                                        </div>
                                    )}
                                </section>

                                {/* Premium Contact Section */}
                                <section className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-2xl border border-teal-100 dark:border-teal-900/50 mt-2">
                                    <h3 className="font-bold text-teal-900 dark:text-teal-100 mb-4 flex justify-between items-center">
                                        Contact Information
                                        {!currentUser?.is_premium && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">PREMIUM</span>}
                                    </h3>

                                    {currentUser?.is_premium ? (
                                        <div className="bg-white/60 dark:bg-gray-800/60 border border-teal-200/50 dark:border-teal-800/50 rounded-2xl p-5 space-y-4">
                                            <ContactRow icon="📞" label="Phone" value={profile.phone || "Not Available"} />
                                            <ContactRow icon="✉️" label="Email" value={profile.email || "hidden@email.com"} />
                                            <div className="pt-2">
                                                <VideoCallButton
                                                    targetUserId={profile.id}
                                                    targetUserName={profile.name}
                                                    targetUserPhoto={profile.photoUrl}
                                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3 font-bold shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-teal-200/50 dark:border-teal-800/50 p-8 text-center backdrop-blur-sm">
                                            <div className="absolute inset-0 blur-md opacity-40 bg-white/50 dark:bg-gray-900/50 pointer-events-none p-6 space-y-4">
                                                <div className="h-4 bg-teal-200/50 dark:bg-teal-800/50 rounded w-3/4 mx-auto" />
                                                <div className="h-4 bg-teal-200/50 dark:bg-teal-800/50 rounded w-1/2 mx-auto" />
                                            </div>
                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30 text-white text-2xl animate-bounce">
                                                    👑
                                                </div>
                                                <h4 className="font-bold text-teal-950 dark:text-teal-100 text-lg mb-4">Upgrade to Premium</h4>

                                                <div className="space-y-2 text-left mb-6 bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl border border-white/40 dark:border-gray-700/50 shadow-sm w-full max-w-[280px]">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="text-green-600 dark:text-green-400">✓</span> Instant Contact Numbers
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="text-green-600 dark:text-green-400">✓</span> Video & Audio Calls
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="text-green-600 dark:text-green-400">✓</span> See Who Liked You
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <span className="text-green-600 dark:text-green-400">✓</span> Verified Profile Badge
                                                    </div>
                                                </div>

                                                <Button onClick={onUpgrade} className="bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 dark:text-black text-white hover:scale-105 transition-transform rounded-full px-8 py-6 shadow-xl font-bold text-lg">
                                                    Unlock All Features
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeTab === 'career' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 shrink-0 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm">💼</div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg break-words">{profile.career?.profession || "-"}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                                                {/* Show Company if Connected OR Premium */}
                                                {(isAlreadyConnected || isOwnProfile || currentUser?.is_premium)
                                                    ? (
                                                        <>
                                                            {profile.career?.company || "-"}
                                                            {currentUser?.is_premium && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800/50">💎 UNLOCKED</span>}
                                                        </>
                                                    )
                                                    : "🔒 Connect to Unlock Company"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <InfoRow label="Education" value={profile.career?.education || profile.career?.educationLevel || profile.education || "-"} />
                                        <InfoRow label="Degree" value={profile.career?.degree || "-"} />
                                        <InfoRow label="College" value={profile.career?.college || "-"} />
                                        <InfoRow
                                            label="Annual Income"
                                            value={(isAlreadyConnected || isOwnProfile || currentUser?.is_premium) ? (profile.career?.income || "Not Specified") : "🔒 Connect to Unlock"}
                                            highlight={(isAlreadyConnected || isOwnProfile || currentUser?.is_premium)}
                                            premiumUnlocked={currentUser?.is_premium && !(isAlreadyConnected || isOwnProfile)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'family' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                                    <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-4">Family Background</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoCard label="Family Type" value={profile.family?.type || profile.family?.familyType || "-"} />
                                        <InfoCard label="Values" value={profile.family?.values || profile.family?.familyValues || "-"} />
                                        <InfoCard label="Father" value={profile.family?.fatherOccupation || "-"} />
                                        <InfoCard label="Mother" value={profile.family?.motherOccupation || "-"} />
                                        <InfoCard label="Brothers" value={profile.family?.brothers !== undefined && profile.family?.brothers !== null && profile.family?.brothers !== '' ? String(profile.family.brothers) : "0"} />
                                        <InfoCard label="Sisters" value={profile.family?.sisters !== undefined && profile.family?.sisters !== null && profile.family?.sisters !== '' ? String(profile.family.sisters) : "0"} />
                                        <InfoCard label="Native Place" value={profile.family?.nativePlace || profile.location?.city || "-"} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lifestyle' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/50">
                                    <h3 className="font-bold text-green-900 dark:text-green-100 mb-4">Habits & Lifestyle</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoCard label="Diet" value={profile.lifestyle?.diet || "-"} icon="🥗" />
                                        <InfoCard label="Smoking" value={profile.lifestyle?.smoking || profile.lifestyle?.smoke || "-"} icon="🚬" />
                                        <InfoCard label="Drinking" value={profile.lifestyle?.drinking || profile.lifestyle?.drink || "-"} icon="🍷" />
                                    </div>
                                </div>

                                {(() => {
                                    const rawHobbies = profile.interests || profile.lifestyle?.hobbies;
                                    const hobbiesArr: string[] = Array.isArray(rawHobbies)
                                        ? rawHobbies
                                        : (typeof rawHobbies === 'string' ? rawHobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

                                    if (hobbiesArr.length === 0) return null;

                                    return (
                                        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Interests & Hobbies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {hobbiesArr.map((hobby: string, idx: number) => (
                                                    <span key={idx} className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        {hobby}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {(() => {
                                    const exp = profile.expectations || (profile.prompt && profile.prompt !== profile.aboutMe ? profile.prompt : null);
                                    return exp ? (
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 mb-4">
                                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                            <span className="text-xl">💭</span> Expectations
                                        </h3>
                                        <p className="text-indigo-800 dark:text-indigo-300 text-sm italic leading-relaxed">
                                            &ldquo;{exp}&rdquo;
                                        </p>
                                    </div>
                                    ) : null;
                                })()}
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                    <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-4">Basic Preferences</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoCard label="Age Range" value={profile.partnerPreferences?.ageRange || "Open"} />
                                        <InfoCard label="Height Range" value={profile.partnerPreferences?.heightRange || "Open"} />
                                        <InfoCard label="Min Income" value={profile.partnerPreferences?.income || "Any"} />
                                        <InfoCard label="Preferred Location" value={profile.partnerPreferences?.location || "Anywhere"} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Desktop Sticky Action Bar (Inside Right Column) */}
                    {renderActionBar('hidden md:block shrink-0 sticky bottom-0 mt-auto w-full p-4 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-30')}

                </div>

                </div>

                {/* Mobile Pinned Bottom Action Bar (Respects safe-area & theme contrast) */}
                {renderActionBar('md:hidden shrink-0 w-full p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-40 shadow-2xl')}

            </div>

            {
                showKundli && effectiveKundli && (
                    <KundliModal
                        isOpen={showKundli}
                        onClose={() => setShowKundli(false)}
                        data={effectiveKundli}
                        names={{ me: currentUser?.full_name || 'You', partner: profile.name }}
                    />
                )
            }

            {
                showCosmicReport && (
                    <CompatibilityModal 
                        isOpen={showCosmicReport}
                        onClose={() => setShowCosmicReport(false)}
                        targetUserId={profile.id}
                        targetName={profile.name}
                    />
                )
            }

            <CoinStoreModal
                isOpen={showCoinStore}
                onClose={() => setShowCoinStore(false)}
                onSuccess={() => {
                    setShowCoinStore(false);
                    // Trigger refresh in parent if needed
                }}
            />
            {/* Fullscreen Image Gallery — swipe only, no arrows (blocked when Privacy Shield is active) */}
            {isFullscreen && !isPhotoBlurred && (() => {
                let fsSwipeStartX = 0;
                return (
                    <div
                        className="fixed inset-0 z-[20000] bg-black flex items-center justify-center animate-in fade-in duration-200 select-none"
                        onClick={() => setIsFullscreen(false)}
                        onTouchStart={(e) => { fsSwipeStartX = e.touches[0].clientX; }}
                        onTouchEnd={(e) => {
                            const delta = fsSwipeStartX - e.changedTouches[0].clientX;
                            if (Math.abs(delta) > 50) {
                                e.stopPropagation();
                                if (delta > 0) setCurrentPhotoIndex(p => p < photos.length - 1 ? p + 1 : p);
                                else setCurrentPhotoIndex(p => p > 0 ? p - 1 : p);
                            }
                        }}
                    >
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 z-50 text-white p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all"
                            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                        >
                            <X size={24} />
                        </button>

                        {/* Photo counter top-left */}
                        {photos.length > 1 && (
                            <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                {currentPhotoIndex + 1} / {photos.length}
                            </div>
                        )}

                        {/* Main image — tap doesn't close, swipe navigates */}
                        <img
                            src={photos[currentPhotoIndex]}
                            alt={`Photo ${currentPhotoIndex + 1}`}
                            className="w-full h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Swipe hint — shows only if multiple photos, fades after 2s via CSS animation */}
                        {photos.length > 1 && (
                            <div
                                className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full pointer-events-none"
                                style={{ animation: 'fadeOutDelay 2.5s ease-in-out forwards' }}
                            >
                                <span>←</span>
                                <span>Swipe to browse photos</span>
                                <span>→</span>
                            </div>
                        )}

                        {/* Dot indicators */}
                        {photos.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                                {photos.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-full transition-all duration-300 ${idx === currentPhotoIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetUserId={profile.id}
                targetUserName={profile.name || profile.full_name}
                onSuccess={onClose}
            />

            {activeHighlightSet && !isPhotoBlurred && (
                <StoryModal
                    stories={activeHighlightSet.stories}
                    initialIndex={activeHighlightSet.initialIndex || 0}
                    user={activeHighlightSet.user}
                    currentUser={currentUser}
                    onClose={() => setActiveHighlightSet(null)}
                    onDelete={async (storyId) => {
                        await api.profile.deleteStory(storyId);
                        if (profile && profile.stories) {
                            profile.stories = profile.stories.filter((s: any) => String(s.id) !== String(storyId));
                        }
                        setActiveHighlightSet((prev: any) => {
                            if (!prev || !Array.isArray(prev.stories)) return prev;
                            const remaining = prev.stories.filter((s: any) => String(s.id) !== String(storyId));
                            return remaining.length > 0 ? { ...prev, stories: remaining } : null;
                        });
                        toast.success("Story deleted!");
                    }}
                    onHighlightToggle={(storyId, isHighlight) => {
                        if (profile && Array.isArray(profile.stories)) {
                            profile.stories = profile.stories.map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                        }
                        setActiveHighlightSet((prev: any) => {
                            if (!prev || !prev.stories) return prev;
                            const updatedStories = prev.stories.map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                            return { ...prev, stories: updatedStories };
                        });
                    }}
                />
            )}
        </div>
    );
}

// Sub-components for cleaner code
const safeDisplayValue = (val: any): string => {
    if (val === null || val === undefined) return "-";
    if (typeof val === 'string') return val.trim() || "-";
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? "Yes" : "No";
    if (typeof val === 'object') {
        if (Array.isArray(val)) return val.map(safeDisplayValue).filter(Boolean).join(', ') || "-";
        if (val.city || val.state || val.country) {
            return formatLocationString(val) || "-";
        }
        if (val.name || val.title || val.profession || val.label) {
            return String(val.name || val.title || val.profession || val.label);
        }
        try {
            return Object.values(val).filter(v => typeof v !== 'object').join(', ') || "-";
        } catch (_) {
            return "-";
        }
    }
    return String(val);
};

const InfoCard = ({ label, value, icon }: any) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 min-w-0">
        <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1 truncate">{label}</div>
        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1 break-words min-w-0">
            {icon && <span className="shrink-0">{icon}</span>} <span className="min-w-0 break-words">{safeDisplayValue(value)}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value, highlight, premiumUnlocked }: any) => (
    <div className="flex justify-between items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
        <span className="text-gray-500 dark:text-gray-400 text-sm shrink-0">{label}</span>
        <div className="flex items-center gap-2 min-w-0 justify-end text-right">
            <span className={`font-medium text-sm break-words ${highlight ? 'text-green-700 dark:text-green-400 font-bold' : 'text-gray-900 dark:text-gray-100'}`}>{safeDisplayValue(value)}</span>
            {premiumUnlocked && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800/50 shrink-0">💎</span>}
        </div>
    </div>
);

const ContactRow = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-green-100/50 dark:border-green-800/30 shadow-sm min-w-0">
        <div className="w-10 h-10 shrink-0 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xl">{icon}</div>
        <div className="min-w-0 flex-1">
            <div className="text-[10px] text-green-800 dark:text-green-400 font-bold uppercase tracking-wider">{label}</div>
            <div className="text-gray-900 dark:text-gray-100 font-mono font-medium text-sm break-all">{safeDisplayValue(value)}</div>
        </div>
    </div>
);
