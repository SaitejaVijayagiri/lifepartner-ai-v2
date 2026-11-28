'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Share2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api, fetchAPI } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/modal';
import KundliModal from './KundliModal';
import ReportModal from './ReportModal';
import { getReligionSymbol } from '@/lib/religionUtils';
import { formatLocationString, getProfilePhotoUrl, filterActive24hStories, filterHighlights, isProfilePhotoBlurred, isPlaceholderPhoto, hasUserUploadedPhoto } from '@/lib/utils';
import { trackImageFailure } from '@/lib/analytics';
import dynamic from 'next/dynamic';

const CompatibilityModal = dynamic(() => import('./CompatibilityModal'), { ssr: false });
const StoryModal = dynamic(() => import('./StoryModal'), { ssr: false });

interface MatchCardProps {
    match: any;
    priority?: boolean;
    onConnect?: () => void;
    onViewProfile?: () => void;
    onStoryClick?: () => void;
    onShowKundli?: (data: any) => void;
    onGift?: () => void;
    onChat?: () => void; // Called when clicking "Message" on an already-connected user
    currentUserName?: string; // For Kundli
    isConnectedProp?: boolean; // Prop to override connection state
}

const MatchCard = React.memo(function MatchCard({ match, priority = false, onConnect, onViewProfile, onStoryClick, onShowKundli, onGift, onChat, isConnectedProp }: MatchCardProps) {
    // Card DOM Ref & Viewport Intersection Tracking
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [isInViewport, setIsInViewport] = useState(false);

    useEffect(() => {
        if (!cardRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting);
            },
            { rootMargin: '200px' } // Pre-trigger 200px before card enters viewport
        );

        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    // Independent States
    const { isUserOnline: checkUserOnline } = useSocket();
    const { user: currentUser, setUser } = useAuth() as any;
    const matchTargetId = match?.id || match?.userId || (match as any)?.user_id;
    const isUserOnline = Boolean(checkUserOnline(matchTargetId) || match?.isOnline);

    const [matchStatus, setMatchStatus] = useState<string | null>(match?.match_status || null);
    const [isLiked, setIsLiked] = useState<boolean>(match?.is_liked || false);

    // Derived states
    const isConnected = typeof isConnectedProp === 'boolean' ? isConnectedProp : (matchStatus === 'accepted' || matchStatus === 'connected');
    const isPhotoBlurred = isProfilePhotoBlurred({ ...match, match_status: matchStatus }, currentUser, isConnected);
    const isRequestSent = matchStatus === 'pending';
    const hasLiked = isLiked;

    const toast = useToast();
    const [isPlaying, setIsPlaying] = useState(false); // Audio State
    const [showKundli, setShowKundli] = useState(false); // Modal State
    const kundliScore = match?.kundli?.score;
    const hasValidKundli = Boolean(
        match?.kundli &&
        typeof kundliScore === 'number' &&
        (kundliScore > 0 || (Array.isArray(match.kundli.details) && match.kundli.details.length > 0))
    );
    const [showReport, setShowReport] = useState(false); // Report Modal State
    const [showDMModal, setShowDMModal] = useState(false);
    const [dmText, setDmText] = useState("");
    const [sendingDM, setSendingDM] = useState(false);
    const [showCosmicReport, setShowCosmicReport] = useState(false);
    const [activeHighlightSet, setActiveHighlightSet] = useState<any>(null);

    // Counts
    const [likeCount, setLikeCount] = useState(match?.total_likes || 0);

    const [loading, setLoading] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [hasRequestedPhoto, setHasRequestedPhoto] = useState(false);
    const [requestingPhoto, setRequestingPhoto] = useState(false);

    // Optimized Photos Array (CDN Load Balancing & WebP conversion)
    const photos = useMemo(() => {
        const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match?.name || match?.id || 'Member')}`;

        const extractCandidate = (v: any): string => {
            if (!v) return '';
            if (typeof v === 'string') return v.trim();
            if (typeof v === 'object') {
                return (v.url || v.photo_url || v.avatar_url || '').trim();
            }
            return '';
        };

        const rawList: string[] = [];
        if (Array.isArray(match.photos) && match.photos.length > 0) {
            match.photos.forEach((p: any) => {
                const s = extractCandidate(p);
                if (s) rawList.push(s);
            });
        }
        if (rawList.length === 0 && Array.isArray(match.photo_urls) && match.photo_urls.length > 0) {
            match.photo_urls.forEach((p: any) => {
                const s = extractCandidate(p);
                if (s) rawList.push(s);
            });
        }
        if (rawList.length === 0 && Array.isArray(match.metadata?.photos) && match.metadata.photos.length > 0) {
            match.metadata.photos.forEach((p: any) => {
                const s = extractCandidate(p);
                if (s) rawList.push(s);
            });
        }
        if (rawList.length === 0) {
            const single = extractCandidate(match.photoUrl) || extractCandidate(match.avatar_url);
            if (single) rawList.push(single);
        }

        const validPhotos = rawList.map((url: string) => {
            if (typeof url !== 'string' || !url.trim()) return '';
            // Auto-optimize Cloudinary CDN URLs for card resolution & WebP
            if (url.includes('res.cloudinary.com') && !url.includes('/w_')) {
                return url.replace('/upload/', '/upload/w_600,c_limit,q_auto,f_auto/');
            }
            return url.trim();
        }).filter(Boolean);

        return validPhotos.length > 0 ? validPhotos : [fallbackUrl];
    }, [match.photos, match.photo_urls, match.metadata?.photos, match.photoUrl, match.avatar_url, match.id, match.name]);

    const hasUploadedPhoto = useMemo(() => {
        return hasUserUploadedPhoto(match) && photos.some(p => !isPlaceholderPhoto(p));
    }, [match, photos]);

    const displayName = useMemo(() => {
        if (typeof match?.name === 'string') return match.name;
        if (match?.name?.first) return `${match.name.first} ${match.name.last || ''}`.trim();
        return 'Member';
    }, [match?.name]);

    const initials = useMemo(() => {
        const clean = (displayName || '').replace(/[^a-zA-Z\s]/g, '').trim();
        if (!clean) return 'LP';
        const parts = clean.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return clean.slice(0, 2).toUpperCase();
    }, [displayName]);

    const heightStr = useMemo(() => {
        if (!match?.height || match.height === '-' || match.height === 'Not Specified' || match.height === 'Unknown') return '';
        if (typeof match.height === 'string') return match.height;
        if (typeof match.height === 'object') {
            return match.height.value || (match.height.feet ? `${match.height.feet}'${match.height.inches || 0}"` : '');
        }
        return String(match.height);
    }, [match?.height]);

    const locationStr = useMemo(() => {
        const loc = formatLocationString(match?.location || match?.location_data);
        return (loc && loc !== 'Unknown City' && loc !== '-') ? loc : '';
    }, [match?.location, match?.location_data]);

    const distText = useMemo(() => {
        return typeof match?.distanceKm === 'number'
            ? (match.distanceKm < 1 ? 'Within 1 km' : `${Math.round(match.distanceKm)} km away`)
            : '';
    }, [match?.distanceKm]);

    const professionStr = useMemo(() => {
        const rawProf = match?.profession || match?.career?.profession || match?.role;
        const prof = typeof rawProf === 'string' ? rawProf : (typeof rawProf === 'object' ? (rawProf?.profession || rawProf?.title || '') : '');
        return (prof && prof !== '-' && prof !== 'Member' && prof !== 'Not Specified') ? prof : '';
    }, [match?.profession, match?.career?.profession, match?.role]);

    const educationStr = useMemo(() => {
        const rawEdu = match?.education || match?.career?.education || match?.career?.educationLevel;
        const edu = typeof rawEdu === 'string' ? rawEdu : (typeof rawEdu === 'object' ? (rawEdu?.degree || rawEdu?.education || rawEdu?.educationLevel || '') : '');
        return (edu && edu !== '-' && edu !== 'Other' && edu !== 'Not Specified') ? edu : '';
    }, [match?.education, match?.career?.education]);

    const religionCasteStr = useMemo(() => {
        const rel = typeof match?.religion === 'string' ? match.religion : (match?.religion?.religion || match?.religion?.faith || '');
        const caste = typeof match?.religion === 'object' ? (match.religion?.caste || match.religion?.subcaste || '') : '';
        if (rel && rel !== '-' && rel !== 'Not Specified' && rel !== 'Unknown') {
            return (caste && caste !== '-' && caste !== 'Not Specified') ? `${rel} (${caste})` : rel;
        }
        if (caste && caste !== '-' && caste !== 'Not Specified') return String(caste);
        return '';
    }, [match?.religion]);

    const motherTongueStr = useMemo(() => {
        const raw = match?.motherTongue || match?.metadata?.motherTongue;
        return (typeof raw === 'string' && raw !== '-' && raw !== 'Unknown') ? raw : '';
    }, [match?.motherTongue, match?.metadata?.motherTongue]);

    const maritalStatusStr = useMemo(() => {
        const raw = match?.maritalStatus || match?.metadata?.maritalStatus;
        return (typeof raw === 'string' && raw !== '-') ? raw : 'Never Married';
    }, [match?.maritalStatus, match?.metadata?.maritalStatus]);

    const dietStr = useMemo(() => {
        const raw = match?.diet || match?.lifestyle?.diet || match?.metadata?.diet;
        return (typeof raw === 'string' && raw !== '-' && raw !== 'Unknown') ? raw : '';
    }, [match?.diet, match?.lifestyle?.diet, match?.metadata?.diet]);

    const cleanBio = useMemo(() => {
        const raw = match?.aboutMe || match?.bio || match?.about || match?.metadata?.aboutMe || match?.metadata?.bio || match?.prompt || match?.profiles?.raw_prompt;
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return raw.trim();
        }
        return '';
    }, [match?.aboutMe, match?.bio, match?.about, match?.metadata?.aboutMe, match?.metadata?.bio, match?.prompt, match?.profiles?.raw_prompt]);

    const matchReasons = useMemo(() => {
        return Array.isArray(match?.match_reasons) ? match.match_reasons : [];
    }, [match?.match_reasons]);

    const profileIdStr = useMemo(() => {
        return match?.profile_id || match?.profileId || (match?.referral_code ? `LP-${String(match.referral_code).toUpperCase()}` : (match?.id ? `LP-${String(match.id).slice(0, 8).toUpperCase()}` : ''));
    }, [match?.profile_id, match?.profileId, match?.referral_code, match?.id]);

    const handleRequestPhoto = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasRequestedPhoto || requestingPhoto) return;
        setRequestingPhoto(true);
        try {
            await api.interactions.requestPhoto(match.id);
            setHasRequestedPhoto(true);
            toast.success(`📷 Photo request sent to ${displayName}! We'll notify you when uploaded.`);
        } catch {
            setHasRequestedPhoto(true);
            toast.success(`📷 Photo request sent to ${displayName}!`);
        } finally {
            setRequestingPhoto(false);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const agePart = match.age ? `${match.age} yrs` : '';
        const profPart = professionStr;
        const locPart = locationStr;
        const relPart = religionCasteStr;
        const scorePart = match.score ? `🌟 ${match.score}% AI Match` : '';

        const detailChips = [agePart, profPart, locPart, relPart].filter(Boolean).join(' • ');
        const shareText = `✨ Check out ${displayName}${detailChips ? ` (${detailChips})` : ''} on LifePartner AI! ${scorePart}`.trim();
        const shareUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/profile/${match.id}?utm_source=share&utm_medium=social&utm_campaign=matchcard_share`
            : `https://lifepartnerai.in/profile/${match.id}`;

        const shareData = {
            title: `${displayName} • LifePartner AI Profile`,
            text: shareText,
            url: shareUrl
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                toast.success("Profile details & link copied!");
            }
        } catch { /* user cancelled share */ }
    };

    const [isHovered, setIsHovered] = useState(false);
    const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const voiceBioAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
            if (voiceBioAudioRef.current) {
                voiceBioAudioRef.current.pause();
                voiceBioAudioRef.current.src = '';
                voiceBioAudioRef.current = null;
            }
        };
    }, []);

    // Asynchronous In-Memory Preloader for Adjacent Photos (LRU Queue - Zero DOM Bloat)
    useEffect(() => {
        if (!hasUploadedPhoto || photos.length <= 1 || !isInViewport || isPhotoBlurred) return;

        // Preload next image into browser disk/RAM cache
        const nextIdx = (currentPhotoIndex + 1) % photos.length;
        if (photos[nextIdx]) {
            const imgNext = new Image();
            imgNext.src = photos[nextIdx];
        }

        // Preload previous image
        const prevIdx = (currentPhotoIndex - 1 + photos.length) % photos.length;
        if (photos[prevIdx]) {
            const imgPrev = new Image();
            imgPrev.src = photos[prevIdx];
        }
    }, [currentPhotoIndex, photos, isInViewport, isPhotoBlurred, hasUploadedPhoto]);

    // Auto-Scroll Photos Carousel (3.5s interval, strictly when in viewport, pauses on hover or private blur)
    useEffect(() => {
        if (!hasUploadedPhoto || photos.length <= 1 || isHovered || !isInViewport || isPhotoBlurred) return;

        const interval = setInterval(() => {
            setCurrentPhotoIndex((prev: number) => (prev + 1) % photos.length);
        }, 3500);

        return () => clearInterval(interval);
    }, [photos.length, isHovered, isInViewport, isPhotoBlurred, hasUploadedPhoto]);

    // 1. Handle "Send Interest" (Primary Action)
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
            const res = await api.interactions.sendInterest(match.id);
            if (res?.connected || res?.status === 'connected' || res?.message?.includes('Connected') || res?.message?.includes('mutually') || res?.message?.includes('Already connected')) {
                setMatchStatus('connected');
                toast.success(`🎉 You and ${match.name || 'your match'} are connected! Opening chat...`);
                if (onChat) {
                    onChat();
                } else if (onConnect) {
                    onConnect();
                }
            } else {
                toast.success(`Interest sent to ${match.name || 'match'}!`);
                if (onConnect) onConnect();
            }
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
            ref={cardRef}
            className="group relative h-[560px] sm:h-[500px] w-full rounded-[2rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/20 dark:border-white/10 hover:border-purple-500/40 bg-gray-900 touch-manipulation select-none"
            onMouseEnter={() => {
                if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
                    setIsHovered(true);
                }
            }}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => {
                if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
                setIsHovered(true);
            }}
            onTouchEnd={() => {
                if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = setTimeout(() => {
                    setIsHovered(false);
                }, 2000);
            }}
            onClick={() => {
                if (match?.id) {
                    api.interactions.recordView(match.id).catch(() => {});
                }
                if (onViewProfile) onViewProfile();
            }}
        >
            {!hasUploadedPhoto ? (
                /* LUXURY PERSONA SHOWCASE CARD (NO PHOTO UPLOADED) */
                <div className="absolute inset-0 bg-gradient-to-br from-[#12162a] via-[#0d1020] to-[#1c122c] overflow-hidden flex flex-col justify-between p-4 sm:p-5 z-20">
                    {/* Atmospheric Background Layers */}
                    <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br from-purple-600/25 to-pink-600/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-gradient-to-tr from-indigo-600/25 to-teal-600/10 blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

                    {/* Elegant Matrimonial Geometric / Mandala Watermark */}
                    <svg className="absolute -right-12 -top-12 w-64 h-64 text-white/[0.035] pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.5" />
                    </svg>

                    {/* 1. TOP BAR: Trust Badges & Glowing Match Score */}
                    <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {isConnected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                                    ✓ Connected
                                </span>
                            )}
                            {match.isVerified && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/25 border border-blue-400/50 text-blue-200 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                                    ✓ Verified
                                </span>
                            )}
                            {match.managed_by && match.managed_by !== 'Self' && (
                                <span className="inline-flex items-center gap-1 text-teal-200 text-[10px] font-bold bg-teal-950/80 border border-teal-400/40 px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm">
                                    {match.managed_by === 'Parent' ? '👨‍👩‍👧 By Parent' : match.managed_by === 'Sibling' ? '👫 By Sibling' : `👤 By ${match.managed_by}`}
                                </span>
                            )}
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md border ${isUserOnline ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-gray-500/20 border-gray-400/20 text-gray-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isUserOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="text-[9px] font-bold uppercase">{isUserOnline ? 'Active' : 'Offline'}</span>
                            </div>
                        </div>

                        {/* Right: Match Score + Quick Kundli */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-emerald-400/50 backdrop-blur-md shadow-lg shadow-emerald-500/10">
                                <span className="text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">{match?.score ?? 85}%</span>
                                <span className="text-[8px] font-bold text-emerald-200 tracking-wider uppercase">Match</span>
                            </div>
                            {hasValidKundli && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (onShowKundli) {
                                            onShowKundli(match.kundli);
                                        } else {
                                            setShowKundli(true);
                                        }
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 text-[10px] font-extrabold backdrop-blur-md transition-transform active:scale-95 cursor-pointer"
                                    title="View Vedic Kundli Match"
                                >
                                    <span>🕉️</span>
                                    <span>{kundliScore}/36</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. UPPER IDENTITY: Monogram Crest + Persona Title + Photo Action */}
                    <div className="relative z-10 flex items-center gap-3.5 my-1">
                        {/* Monogram Crest with Luxury Gradient Ring */}
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-xl shadow-purple-950/50">
                                <div className="w-full h-full rounded-full bg-[#121626] flex items-center justify-center relative overflow-hidden">
                                    <span className="text-base sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-rose-200 to-purple-200">
                                        {initials}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-600 border border-white/40 flex items-center justify-center text-[10px] shadow-md" title="Photo Not Uploaded">
                                📷
                            </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                                    {displayName}{match.age ? `, ${match.age}` : ''}
                                </h3>
                                {match.isPremium && <span className="text-amber-400 text-sm" title="Premium Member">👑</span>}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-300 font-medium mt-0.5 truncate">
                                {heightStr && <span>📏 {heightStr}</span>}
                                {heightStr && locationStr && <span>•</span>}
                                {locationStr && <span className="truncate">📍 {locationStr}</span>}
                            </div>

                            {/* Photo on Request Badge & Quick Request Action */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-200 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                                    📷 Photo on Request
                                </span>
                                <button
                                    onClick={handleRequestPhoto}
                                    disabled={hasRequestedPhoto || requestingPhoto}
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all active:scale-95 ${hasRequestedPhoto
                                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer'
                                        }`}
                                >
                                    {hasRequestedPhoto ? '✓ Requested' : requestingPhoto ? 'Sending...' : 'Request Photo ➔'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. CENTER: Bio Quote OR AI Match Summary */}
                    <div className="relative z-10 my-1">
                        {cleanBio ? (
                            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 backdrop-blur-md">
                                <p className="text-[11px] sm:text-xs text-gray-200 line-clamp-2 italic font-normal leading-relaxed">
                                    “{cleanBio}”
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-2.5 backdrop-blur-md">
                                <div className="flex items-center gap-1.5 text-[11px] text-purple-200 font-medium">
                                    <span>✨</span>
                                    <span className="line-clamp-2 leading-snug">
                                        {matchReasons.length > 0 ? matchReasons.slice(0, 3).join(' • ') : 'Verified member looking for a compatible life partner'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. DETAILS MATRIX: 2-Column Key Matrimonial Facts */}
                    <div className="relative z-10 grid grid-cols-2 gap-2 my-1">
                        {professionStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">💼</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Profession</p>
                                    <p className="text-xs font-semibold text-white truncate">{professionStr}</p>
                                </div>
                            </div>
                        )}

                        {educationStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">🎓</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Education</p>
                                    <p className="text-xs font-semibold text-white truncate">{educationStr}</p>
                                </div>
                            </div>
                        )}

                        {religionCasteStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">{getReligionSymbol(match?.religion?.religion || match?.religion || 'Hindu')}</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Faith / Caste</p>
                                    <p className="text-xs font-semibold text-white truncate">{religionCasteStr}</p>
                                </div>
                            </div>
                        )}

                        {motherTongueStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">🗣️</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Mother Tongue</p>
                                    <p className="text-xs font-semibold text-white truncate">{motherTongueStr}</p>
                                </div>
                            </div>
                        )}

                        {maritalStatusStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">💍</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Marital Status</p>
                                    <p className="text-xs font-semibold text-white truncate">{maritalStatusStr}</p>
                                </div>
                            </div>
                        )}

                        {dietStr ? (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">🥗</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Diet</p>
                                    <p className="text-xs font-semibold text-white truncate">{dietStr}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-2 flex items-center gap-2">
                                <span className="text-sm shrink-0">🆔</span>
                                <div className="min-w-0">
                                    <p className="text-[9px] uppercase font-bold text-gray-400">Profile ID</p>
                                    <p className="text-xs font-mono font-semibold text-purple-300 truncate">{profileIdStr}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. BOTTOM ACTIONS: Always Visible */}
                    <div className="relative z-10 pt-2 flex flex-col gap-2">
                        {/* ROW 1 — Primary CTA */}
                        <div className="flex gap-2">
                            {isConnected ? (
                                <Button
                                    onClick={handleMessage}
                                    className="flex-1 h-11 font-black uppercase tracking-wider text-xs border-0 shadow-2xl transition-transform active:scale-95 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
                                >
                                    💬 Message
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleConnect}
                                        disabled={loading || isRequestSent}
                                        className={`flex-1 h-11 font-black uppercase tracking-wider text-xs border-0 shadow-2xl transition-transform active:scale-95 ${isRequestSent
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95'
                                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95'
                                            }`}
                                    >
                                        {loading ? 'Sending...' : (isRequestSent ? '✓ Request Sent' : '✨ Send Interest')}
                                    </Button>
                                    {!isRequestSent && (
                                        <Button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDMModal(true); }}
                                            className="h-11 w-11 shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl flex items-center justify-center p-0 rounded-xl active:scale-95 transition-transform border border-white/20"
                                            title="Direct Message"
                                        >
                                            <Mail size={18} />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ROW 2 — Icon Actions: Like | Gift | Share | Cosmic | Report */}
                        <div className="flex gap-1.5">
                            <button
                                onClick={handleLike}
                                disabled={loading}
                                className={`flex-1 h-9 flex items-center justify-center gap-1 rounded-xl backdrop-blur-xl border shadow-lg transition-all active:scale-95 ${hasLiked
                                    ? 'bg-pink-500/30 border-pink-500/60 text-pink-300'
                                    : 'bg-black/60 border-white/15 hover:bg-black/80 text-white'
                                    }`}
                                title="Like"
                            >
                                <span className="text-xs">{hasLiked ? '❤️' : '🤍'}</span>
                                <span className="text-[10px] font-bold text-white/90">{likeCount}</span>
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); if (onGift) onGift(); }}
                                className="flex-1 h-9 flex items-center justify-center gap-1 rounded-xl backdrop-blur-xl border border-white/15 bg-black/60 shadow-lg hover:bg-black/80 active:scale-95"
                                title="Send a Gift"
                            >
                                <span className="text-xs">🎁</span>
                                <span className="text-[10px] font-bold text-white/90">{match.total_gifts || 0}</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className="flex-1 h-9 flex items-center justify-center rounded-xl backdrop-blur-xl border border-white/15 bg-black/60 shadow-lg hover:bg-black/80 active:scale-95 text-white"
                                title="Share Profile"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); setShowCosmicReport(true); }}
                                className="flex-1 h-9 flex items-center justify-center rounded-xl backdrop-blur-xl border border-purple-500/30 bg-purple-950/50 shadow-lg hover:bg-purple-900/60 active:scale-95 text-purple-300"
                                title="Cosmic Compatibility"
                            >
                                <Sparkles className="w-4 h-4" />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                                className="flex-1 h-9 flex items-center justify-center rounded-xl backdrop-blur-xl border border-white/15 bg-black/60 shadow-lg hover:bg-black/80 active:scale-95 text-gray-400 hover:text-red-400"
                                title="Report User"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Background Image (Immersive Carousel with Zero-Lag Hardware Acceleration) */}
                    <div className="absolute inset-0 bg-gray-950">
                <img
                    src={photos[currentPhotoIndex] || photos[0] || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id || 'Member')}`}
                    alt={match.name || 'Member'}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform transform-gpu ${isPhotoBlurred ? 'blur-2xl scale-110 filter' : ''}`}
                    loading={priority ? "eager" : "lazy"}
                    // @ts-ignore
                    fetchPriority={priority ? "high" : "auto"}
                    decoding="async"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        trackImageFailure(target.src, 'MatchCard', match.id);
                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id || 'Match')}`;
                    }}
                />

                {/* Privacy Shield Blurred Overlay — Scrim across full photo, lock badge confined to upper hero zone so bottom profile details stay clear */}
                {isPhotoBlurred && (
                    <>
                        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" />
                        <div className="absolute inset-x-4 top-16 bottom-[54%] sm:bottom-[50%] z-20 flex flex-col items-center justify-center px-3 text-center select-none pointer-events-none">
                            <div className="w-11 h-11 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 mb-1.5 shadow-lg shadow-pink-500/10 animate-pulse">
                                <span className="text-xl">🔒</span>
                            </div>
                            <span className="text-white font-black text-sm tracking-wide drop-shadow">Photo Private</span>
                            <span className="text-white/85 text-[11px] mt-0.5 max-w-[200px] leading-snug drop-shadow">
                                Connect to view full profile photos
                            </span>
                            <span className="mt-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-pink-950/75 text-pink-200 border border-pink-400/35 shadow-sm">
                                🛡️ Privacy Shield
                            </span>
                        </div>
                    </>
                )}

                {/* Intuitive Touch/Tap Navigation Regions (Left 35% prev, Right 35% next) */}
                {!isPhotoBlurred && photos.length > 1 && (
                    <div className="absolute inset-x-0 top-0 h-[60%] z-20 flex pointer-events-auto">
                        <div
                            className="w-[35%] h-full"
                            title="Previous Photo"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
                            }}
                        />
                        <div
                            className="w-[30%] h-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (match?.id) api.interactions.recordView(match.id).catch(() => {});
                                if (onViewProfile) onViewProfile();
                            }}
                        />
                        <div
                            className="w-[35%] h-full"
                            title="Next Photo"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
                            }}
                        />
                    </div>
                )}

                {/* Photo Progress Bar & Counter (Card Style) */}
                {!isPhotoBlurred && photos.length > 1 && (
                    <>
                        <div className="absolute top-2 left-3 right-3 flex gap-1 z-30 transition-opacity">
                            {photos.map((_url: string, idx: number) => (
                                <div key={idx} className="h-1 flex-1 bg-black/40 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
                                    <div
                                        className={`h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300 ${idx === currentPhotoIndex ? 'w-full' : idx < currentPhotoIndex ? 'w-full opacity-60' : 'w-0'}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Interactive Left / Right Photo Scroll Controls */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95"
                            title="Previous Photo"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95"
                            title="Next Photo"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Photo Index Counter Pill */}
                        <div className="absolute bottom-28 left-4 z-30 pointer-events-none">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20 shadow-md">
                                📷 {currentPhotoIndex + 1} / {photos.length}
                            </span>
                        </div>
                    </>
                )}

                {/* Subtle Edge Gradients Only - Keeps middle 80% of photo bright while preserving bottom text legibility */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-10" />
                <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none z-20 ${isPhotoBlurred ? 'h-72' : 'h-56 sm:h-52'}`} />
            </div>

            {/* Glowing Match Score & Quick Kundli (Floating Top Right) */}
            <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-1.5">
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16">
                    {/* Pulsing Outer Ring */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.5)]"></div>

                    {/* Glass Core */}
                    <div className="relative w-full h-full rounded-full bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center border border-white/20 shadow-xl">
                        <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-green-400 leading-none">{match?.score ?? 85}%</span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-200 tracking-widest uppercase mt-0.5">Match</span>
                    </div>
                </div>
                {hasValidKundli && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onShowKundli) {
                                onShowKundli(match.kundli);
                            } else {
                                setShowKundli(true);
                            }
                        }}
                        className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 hover:bg-orange-950/90 text-amber-200 border border-amber-400/50 backdrop-blur-md text-[10px] font-extrabold shadow-lg transition-transform active:scale-95 cursor-pointer"
                        title="View Vedic Kundli Match"
                    >
                        <span>🕉️</span>
                        <span>{kundliScore}/36</span>
                    </button>
                )}
            </div>

            {/* Connected Badge (Top Left) */}
            {isConnected && (
                <div className="absolute top-4 left-4 z-30">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 backdrop-blur-md border border-emerald-400/40 shadow-lg">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">✓ Connected</span>
                    </div>
                </div>
            )}

            {/* Status Stack: Stories, Voice Bio */}
            <div className={`absolute z-30 flex flex-col gap-2 items-start max-w-[68%] pointer-events-none ${isConnected ? 'left-4 top-14' : 'left-4 top-4'}`}>
                {/* 1. Story & Highlight Badges */}
                {Array.isArray(match?.stories) && match.stories.length > 0 && (() => {
                    const highlightedStories = filterHighlights(match.stories);
                    const active24hStories = filterActive24hStories(match.stories);

                    if (highlightedStories.length === 0 && active24hStories.length === 0) return null;

                    return (
                        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
                            {highlightedStories.length > 0 && (
                                <div 
                                    className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wide shadow-xl border-2 border-white/30 hover:scale-105 transition-transform"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isPhotoBlurred) {
                                            toast.info('Connect to view private photos & highlights');
                                            return;
                                        }
                                        setActiveHighlightSet({
                                            stories: highlightedStories,
                                            initialIndex: 0,
                                            user: {
                                                id: match.id,
                                                name: match.name,
                                                photoUrl: getProfilePhotoUrl(match)
                                            }
                                        });
                                    }}
                                >
                                    <span>{isPhotoBlurred ? '🔒' : '⭐'} Highlights ({highlightedStories.length})</span>
                                </div>
                            )}

                            {active24hStories.length > 0 && (
                                <div 
                                    className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg border-2 border-white/20 hover:scale-105 transition-transform"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isPhotoBlurred) {
                                            toast.info('Connect to view private photos & stories');
                                            return;
                                        }
                                        if (onStoryClick) {
                                            onStoryClick();
                                        } else {
                                            setActiveHighlightSet({
                                                stories: active24hStories,
                                                initialIndex: 0,
                                                user: {
                                                    id: match.id,
                                                    name: match.name,
                                                    photoUrl: getProfilePhotoUrl(match)
                                                }
                                            });
                                        }
                                    }}
                                >
                                    <span>{isPhotoBlurred ? '🔒' : '📸'} Story ({active24hStories.length})</span>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 2. Voice Bio */}
                {match.voiceBioUrl && (
                    <div className="pointer-events-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isPlaying && voiceBioAudioRef.current) {
                                    voiceBioAudioRef.current.pause();
                                    setIsPlaying(false);
                                    return;
                                }
                                if (voiceBioAudioRef.current) {
                                    voiceBioAudioRef.current.pause();
                                    voiceBioAudioRef.current = null;
                                }
                                const audio = new Audio(match.voiceBioUrl);
                                voiceBioAudioRef.current = audio;
                                audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                                audio.onended = () => setIsPlaying(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg hover:bg-white/30 transition-all"
                        >
                            <span>{isPlaying ? '🔊 Playing...' : '🎙️ Voice Bio'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Info Section */}
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-30 flex flex-col justify-end pointer-events-none">
                {/* Info container */}
                <div className="transform transition-all duration-300 group-hover:-translate-y-28 [@media(hover:none)]:-translate-y-28">
                    <div className="flex items-end gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-1">
                            {typeof match.name === 'string' ? match.name : (match.name?.first ? `${match.name.first} ${match.name.last || ''}`.trim() : 'Member')}
                            {typeof match.age === 'number' || typeof match.age === 'string' ? `, ${match.age}` : ''}
                            {match.isPremium && <span className="text-amber-400 text-lg sm:text-xl drop-shadow-md animate-pulse" title="Premium Member">👑</span>}
                        </h3>
                        {match.isVerified && (
                            <>
                                <span className="text-blue-400 text-base sm:text-lg mb-0.5 drop-shadow-md" title="Verified">✓</span>
                                {(match.completenessScore >= 90 || match.badgeLevel === 'Gold Verified') && (
                                    <span className="inline-flex items-center gap-1 text-amber-300 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full mb-0.5 backdrop-blur-md" title="Gold Verified Profile">
                                        ⭐ Gold
                                    </span>
                                )}
                                {match.isWorldwide && (
                                    <span className="inline-flex items-center gap-1 text-sky-200 text-[10px] font-black uppercase tracking-wider bg-sky-500/30 border border-sky-400/50 px-2 py-0.5 rounded-full mb-0.5 backdrop-blur-md shadow-sm" title="Worldwide / International Suitor">
                                        🌍 Worldwide
                                    </span>
                                )}
                                {photos.length >= 2 && typeof photos[0] === 'string' && !photos[0].includes('dicebear') && (
                                    <span className="inline-flex items-center gap-1 text-pink-200 text-[10px] font-black uppercase tracking-wider bg-pink-500/30 border border-pink-400/40 px-2 py-0.5 rounded-full mb-0.5 backdrop-blur-md shadow-sm" title={`${photos.length} Verified Photos Uploaded`}>
                                        📸 {photos.length} Photos
                                    </span>
                                )}
                            </>
                        )}
                        {/* Managed By Trust Badge */}
                        {Boolean(match.managed_by && match.managed_by !== 'Self') && (
                            <span className="inline-flex items-center gap-1 text-teal-200 text-[10px] font-bold bg-teal-950/80 border border-teal-400/40 px-2 py-0.5 rounded-full mb-0.5 backdrop-blur-md shadow-sm" title={`Profile managed by ${match.managed_by}`}>
                                {match.managed_by === 'Parent' ? '👨‍👩‍👧 By Parent' : match.managed_by === 'Sibling' ? '👫 By Sibling' : `👤 By ${typeof match.managed_by === 'string' ? match.managed_by : 'Family'}`}
                            </span>
                        )}
                        {/* Profile ID / Matrimony ID Badge */}
                        {(match.profile_id || match.profileId || match.referral_code || match.id) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const idToCopy = match.profile_id || match.profileId || (match.referral_code ? `LP-${String(match.referral_code).toUpperCase()}` : `LP-${String(match.id || '').slice(0, 8).toUpperCase()}`);
                                    navigator.clipboard.writeText(idToCopy);
                                    toast.success(`Copied Profile ID: ${idToCopy}`);
                                }}
                                className="pointer-events-auto inline-flex items-center gap-1 text-purple-200 hover:text-white text-[10px] font-mono font-bold bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/40 px-2 py-0.5 rounded-full mb-0.5 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm"
                                title="Click to copy Profile ID"
                            >
                                <span>🆔 {match.profile_id || match.profileId || (match.referral_code ? `LP-${String(match.referral_code).toUpperCase()}` : `LP-${String(match.id || '').slice(0, 8).toUpperCase()}`)}</span>
                            </button>
                        )}
                        {match.is_exact_match && (
                            <span className="inline-flex items-center gap-1 text-emerald-300 text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 border border-emerald-400/50 px-2 py-0.5 rounded-full mb-0.5 backdrop-blur-md shadow-md animate-pulse">
                                🎯 Exact Match
                            </span>
                        )}
                        {/* Online Indicator */}
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md border ${isUserOnline ? 'bg-green-500/30 border-green-400/40 text-green-200' : 'bg-gray-500/30 border-gray-400/30 text-gray-300'} mb-0.5`}>
                            <div className={`w-2 h-2 rounded-full ${isUserOnline ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-gray-400'}`}></div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                {isUserOnline ? 'Active' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    {(() => {
                        const chips: { icon: string; text: string }[] = [];

                        // 1. Height (if specified)
                        if (match.height && match.height !== '-' && match.height !== 'Not Specified' && match.height !== 'Unknown') {
                            const hStr = typeof match.height === 'string' ? match.height : (typeof match.height === 'object' ? (match.height?.value || (match.height?.feet ? `${match.height.feet}'${match.height.inches || 0}"` : '')) : String(match.height));
                            if (hStr) chips.push({ icon: '📏', text: hStr });
                        }

                        // 2. Profession or Education
                        const rawProf = match.profession || match.career?.profession;
                        const prof = typeof rawProf === 'string' ? rawProf : (typeof rawProf === 'object' ? (rawProf?.profession || rawProf?.title || '') : '');
                        const rawEdu = match.education || match.career?.education || match.career?.educationLevel;
                        const edu = typeof rawEdu === 'string' ? rawEdu : (typeof rawEdu === 'object' ? (rawEdu?.degree || rawEdu?.education || rawEdu?.educationLevel || '') : '');
                        if (prof && prof !== '-' && prof !== 'Member' && prof !== 'Not Specified') {
                            chips.push({ icon: '💼', text: prof });
                        } else if (edu && edu !== '-' && edu !== 'Other') {
                            chips.push({ icon: '🎓', text: edu });
                        }

                        // 3. Religion & Caste
                        const rel = typeof match.religion === 'string' ? match.religion : (match.religion?.religion || match.religion?.faith || '');
                        const caste = typeof match.religion === 'object' ? match.religion?.caste : '';
                        if (rel && rel !== '-' && rel !== 'Not Specified' && rel !== 'Unknown') {
                            chips.push({ icon: getReligionSymbol(rel), text: (caste && caste !== '-' && caste !== 'Not Specified') ? `${rel} (${caste})` : rel });
                        } else if (caste && caste !== '-' && caste !== 'Not Specified') {
                            chips.push({ icon: '🕉️', text: String(caste) });
                        }

                        // 4. Marital Status or Mother Tongue
                        const rawMarital = match.maritalStatus || match.metadata?.maritalStatus;
                        const marital = typeof rawMarital === 'string' ? rawMarital : '';
                        if (chips.length < 3 && marital && marital !== 'Single' && marital !== '-') {
                            chips.push({ icon: '💍', text: marital });
                        }
                        const rawLang = match.motherTongue || match.metadata?.motherTongue;
                        const lang = typeof rawLang === 'string' ? rawLang : '';
                        if (chips.length < 3 && lang && lang !== 'Unknown' && lang !== '-') {
                            chips.push({ icon: '🗣️', text: lang });
                        }

                        // 5. Location (+ distance badge when GPS active)
                        const loc = formatLocationString(match.location);
                        const distText = typeof match.distanceKm === 'number'
                            ? (match.distanceKm < 1 ? 'Within 1 km' : `${Math.round(match.distanceKm)} km away`)
                            : '';
                        if (loc && loc !== 'Unknown City' && loc !== '-') {
                            chips.push({ icon: '📍', text: distText ? `${loc} • ${distText}` : loc });
                        } else if (distText) {
                            chips.push({ icon: '📍', text: distText });
                        }

                        if (chips.length === 0) {
                            chips.push({ icon: '✨', text: 'Verified Profile' });
                        }

                        return (
                            <div className="flex flex-wrap gap-1.5 text-gray-100 text-xs font-medium mb-3 opacity-95">
                                {chips.map((c, i) => (
                                    <span key={i} className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
                                        {c.icon} {typeof c.text === 'object' ? formatLocationString(c.text) : String(c.text || '')}
                                    </span>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* ACTION Buttons — Desktop hover & mobile tap optimized */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 translate-y-24 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 transition-all duration-300 ease-out pointer-events-auto z-30">

                    {/* ROW 1 — Primary CTA */}
                    <div className="flex gap-2">
                        {isConnected ? (
                            <Button
                                onClick={handleMessage}
                                className="flex-1 h-11 font-black uppercase tracking-wider text-xs border-0 shadow-2xl transition-transform active:scale-95 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
                                style={{ opacity: 1 }}
                            >
                                💬 Message
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleConnect}
                                    disabled={loading || isRequestSent}
                                    className={`flex-1 h-11 font-black uppercase tracking-wider text-xs border-0 shadow-2xl transition-transform active:scale-95 ${isRequestSent
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95'
                                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95'
                                        }`}
                                    style={{ opacity: 1 }}
                                >
                                    {loading ? 'Sending...' : (isRequestSent ? '✓ Request Sent' : '✨ Send Interest')}
                                </Button>
                                {!isRequestSent && (
                                    <Button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDMModal(true); }}
                                        className="h-11 w-11 shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl flex items-center justify-center p-0 rounded-xl active:scale-95 transition-transform border border-white/20"
                                        title={currentUser?.gender?.toLowerCase() === 'female' ? "Direct Message (Free for Women ✨)" : `Direct Message (${currentUser?.is_premium ? 'Unlimited' : (currentUser?.free_direct_messages ?? 3) + ' Left'})`}
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
                            className={`flex-1 h-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-xl border shadow-lg transition-all duration-300 active:scale-95 ${hasLiked
                                ? 'bg-pink-500/30 border-pink-500/60 text-pink-300'
                                : 'bg-black/60 border-white/15 hover:bg-black/80 text-white'
                                }`}
                            title={hasLiked ? "You liked this profile" : "Like"}
                        >
                            <span className={`text-sm leading-none ${hasLiked ? 'scale-125' : ''} transition-transform`}>{hasLiked ? '❤️' : '🤍'}</span>
                            <span className="text-[9px] font-black text-white/90 mt-0.5">{likeCount}</span>
                        </button>

                        {/* Gift */}
                        <button
                            onClick={(e) => { e.stopPropagation(); if (onGift) onGift(); }}
                            className="flex-1 h-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-xl border border-white/15 bg-black/60 shadow-lg transition-all duration-300 hover:bg-black/80 active:scale-95"
                            title="Send a Gift"
                        >
                            <span className="text-sm leading-none">🎁</span>
                            <span className="text-[9px] font-black text-white/90 mt-0.5">{match.total_gifts || 0}</span>
                        </button>

                        {/* Share */}
                        <button
                            onClick={handleShare}
                            className="flex-1 h-10 flex items-center justify-center rounded-xl backdrop-blur-xl border border-white/15 bg-black/60 shadow-lg transition-all duration-300 active:scale-95 hover:bg-blue-500/20 hover:border-blue-500/50 text-gray-200"
                            title="Share Profile"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        {/* Cosmic Compatibility */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowCosmicReport(true); }}
                            className="flex-1 h-10 flex items-center justify-center rounded-xl backdrop-blur-xl border border-purple-400/40 bg-gradient-to-br from-pink-500/70 to-purple-600/70 shadow-lg transition-all duration-300 active:scale-95 hover:from-pink-500 hover:to-purple-600 text-white"
                            title="Cosmic Compatibility"
                        >
                            <span className="text-sm">✨</span>
                        </button>

                        {/* Report */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                            className="flex-1 h-10 flex items-center justify-center rounded-xl backdrop-blur-xl border border-white/15 bg-black/60 shadow-lg transition-all duration-300 active:scale-95 hover:bg-red-500/20 hover:border-red-500/50 text-gray-400 hover:text-red-400"
                            title="Report User"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            </>
            )}

            {/* Shared Modals */}
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                targetUserId={match.id}
                targetUserName={displayName}
            />

            {/* Direct Message Modal */}
            <Modal
                isOpen={showDMModal}
                onClose={() => setShowDMModal(false)}
                title="Direct Message"
                description={`Send a direct message to ${displayName} instantly, bypassing the match process.`}
            >
                    <div className="space-y-4 py-2">
                        {currentUser?.gender?.toLowerCase() === 'female' ? (
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm">
                                <Sparkles size={16} className="text-emerald-500 animate-pulse shrink-0" />
                                <span>✨ Women message free! Send a message directly to start chatting anytime.</span>
                            </div>
                        ) : !currentUser?.is_premium ? (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-3 rounded-xl flex items-center gap-2 text-sm text-purple-800 dark:text-purple-300">
                                <Sparkles size={16} />
                                You have <strong>{currentUser?.free_direct_messages ?? 3}</strong> free messages left.
                            </div>
                        ) : null}

                        {/* 1-Click AI Icebreakers */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                                ✨ 1-Click Icebreakers (Tap to use):
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    "👋 Hi! Loved your profile, let's connect!",
                                    "✨ Your vibe caught my attention! How's your week going?",
                                    match.isWorldwide ? "🌍 Hey! Where are you currently based?" : "☕ Would love to connect and chat!",
                                    "🌟 Great profile! What kind of partner are you looking for?"
                                ].map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setDmText(prompt)}
                                        className="text-xs text-left px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition-all active:scale-95 cursor-pointer"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                disabled={sendingDM || !dmText.trim() || (!currentUser?.is_premium && currentUser?.gender?.toLowerCase() !== 'female' && (currentUser?.free_direct_messages ?? 3) <= 0)}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12 shadow-lg"
                            >
                                {sendingDM ? 'Sending...' : 'Send Direct Message'}
                            </Button>
                        </form>
                    </div>
                </Modal>

            {/* Kundli Modal */}
            {showKundli && match?.kundli && (
                <KundliModal
                    isOpen={showKundli}
                    onClose={() => setShowKundli(false)}
                    data={match.kundli}
                    names={{ me: currentUser?.full_name || 'You', partner: displayName }}
                />
            )}

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
