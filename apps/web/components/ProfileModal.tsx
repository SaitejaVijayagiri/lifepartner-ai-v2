
'use client';
import { getZodiacSymbol } from '@/lib/religionUtils';

import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, MoreVertical, MapPin, Briefcase, GraduationCap, Globe, Shield, Star, Coins, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoCallButton from '@/components/VideoCallButton';
import VerificationBadge from './VerificationBadge';
import dynamic from 'next/dynamic';
import { formatLocationString } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

const KundliModal = dynamic(() => import('./KundliModal'), { ssr: false });
const CoinStoreModal = dynamic(() => import('./CoinStoreModal'), { ssr: false });
const CompatibilityModal = dynamic(() => import('./CompatibilityModal'), { ssr: false });
const StoryModal = dynamic(() => import('./StoryModal'), { ssr: false });

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
    const dragStartY = useState(0);
    const swipeStartX = useState(0);

    const toast = useToast();
    const [matchStatus, setMatchStatus] = useState<string | null>(profile.match_status || null);
    const [loadingInterest, setLoadingInterest] = useState(false);

    useEffect(() => {
        setMatchStatus(profile.match_status || null);
    }, [profile.match_status]);

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

    const TABS = ['about', 'highlights', 'ai insight', 'personal', 'career', 'family', 'lifestyle', 'preferences'];
    
    const handleDragStart = (e: React.TouchEvent) => {
        dragStartY[1](e.touches[0].clientY);
        swipeStartX[1](e.touches[0].clientX);
    };
    const handleDragEnd = (e: React.TouchEvent) => {
        const deltaY = dragStartY[0] - e.changedTouches[0].clientY;
        const deltaX = swipeStartX[0] - e.changedTouches[0].clientX;

        // Horizontal swipe → change tab (must be more horizontal than vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const currentIndex = TABS.indexOf(activeTab);
            if (deltaX > 0 && currentIndex < TABS.length - 1) {
                setActiveTab(TABS[currentIndex + 1]); // swipe left → next tab
            } else if (deltaX < 0 && currentIndex > 0) {
                setActiveTab(TABS[currentIndex - 1]); // swipe right → prev tab
            }
            return;
        }

        // Vertical swipe → expand/collapse sheet
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            if (deltaY > 40) setSheetExpanded(true);
            if (deltaY < -40) setSheetExpanded(false);
        }
    };

    if (!profile) return null;

    // 🛡️ Data Sanitization: Ensure all nested objects exist to prevent crashes
    const safeProfile = {
        ...profile,
        career: profile.career || {},
        family: profile.family || {},
        religion: profile.religion || {},
        horoscope: profile.horoscope || {},
        photos: Array.isArray(profile.photos) ? profile.photos : [],
        location: profile.location || {},
        match_reasons: Array.isArray(profile.match_reasons) ? profile.match_reasons : [],
    };

    // Ensure photos array is valid
    const photos: string[] = safeProfile.photos.length > 0
        ? safeProfile.photos
        : [profile.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`];

    // Auto-Slide Effect
    useEffect(() => {
        if (photos.length <= 1) return;

        const interval = setInterval(() => {
            // Only slide if user hasn't interacted in the last 4 seconds
            if (Date.now() - lastInteracted > 4000) {
                setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [photos.length, lastInteracted]);

    // TRACK PROFILE VIEW
    useEffect(() => {
        if (currentUser && profile.id && profile.id !== currentUser.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/interactions/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId: profile.id })
            }).catch(err => console.error("Failed to track view", err));
        }
    }, [profile.id]);


    // Helper for safe Date parsing
    const getAge = (dob: string | undefined, defaultAge: any) => {
        if (!dob) return defaultAge;
        try {
            const date = new Date(dob);
            if (isNaN(date.getTime())) return defaultAge;
            return new Date().getFullYear() - date.getFullYear();
        } catch (e) { return defaultAge; }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md md:p-6 animate-in fade-in duration-300 overflow-hidden">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-screen h-[100dvh] md:h-[85vh] rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">

                {/* Close button REMOVED from fixed — now lives inside the content panel header */}

                {/* LEFT: Photo — hidden when sheet is expanded on mobile */}
                <div className={`w-full md:w-[45%] md:h-full bg-gray-950 relative group shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                    sheetExpanded ? 'h-0 overflow-hidden' : 'h-[45%]'
                }`}>

                    {/* Main Image */}
                    <img
                        src={photos[currentPhotoIndex]}
                        alt={profile.name}
                        onClick={() => setIsFullscreen(true)}
                        className="w-full h-full object-contain md:object-cover bg-black/90 block transition-opacity duration-500 cursor-zoom-in"
                        loading="eager"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'User')}`;
                        }}
                    />

                    {/* Gradient Overlay for Text Readability (Subtler) */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6 z-20 pointer-events-none">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md flex items-center gap-2">
                                {profile.name}, {profile.age}
                                {profile.isPremium && <span className="text-amber-400 text-xl drop-shadow-lg animate-pulse" title="Premium Member">👑</span>}
                            </h2>
                            {profile.isVerified !== false && <VerificationBadge size={16} className="bg-blue-900/30 p-0.5 rounded-full" showTooltip />}
                        </div>
                        <p className="text-gray-300 text-xs font-medium flex items-center gap-2 drop-shadow-md">
                            <span>{profile.career?.profession || "-"}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span>{formatLocationString(profile.location)}</span>
                        </p>
                    </div>

                    {/* Photo Progress Bar (Instagram Story Style) */}
                    {photos.length > 1 && (
                        <div className="absolute top-4 left-4 right-16 flex gap-1 z-30">
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
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLastInteracted(Date.now());
                                    setCurrentPhotoIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/20 transition-all"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLastInteracted(Date.now());
                                    setCurrentPhotoIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 text-white/70 hover:text-white p-2 rounded-full hover:bg-black/20 transition-all"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </>
                    )}

                    {/* Navigation Touch Areas */}
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
                </div>

                {/* RIGHT: Content & Details — expands to fill when sheet is dragged up */}
                <div
                    className={`w-full md:w-[55%] flex flex-col bg-white dark:bg-gray-900 md:h-full relative rounded-t-3xl md:rounded-none z-30 md:z-auto transition-all duration-300 ease-in-out min-h-0 ${
                        sheetExpanded ? 'flex-1' : 'h-[55%]'
                    }`}
                    onTouchStart={handleDragStart}
                    onTouchEnd={handleDragEnd}
                >

                    {/* Drag Handle — mobile only */}
                    <div
                        className="flex md:hidden flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
                        onTouchStart={handleDragStart}
                        onTouchEnd={handleDragEnd}
                        onClick={() => setSheetExpanded(v => !v)}
                    >
                        <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">
                            {sheetExpanded ? '↓ Swipe down for photo' : '↑ Swipe up for full details'}
                        </span>
                    </div>



                    {/* Desktop Header (Hidden on Mobile) */}
                    <div className="hidden md:block px-8 pt-8 pb-4">
                        <div className="flex gap-2 mt-2 pl-4">
                            <div className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full text-xs font-bold border border-pink-100 dark:border-pink-800/50 flex items-center gap-1 w-max">
                                <span>🎁</span> {profile.total_gifts || 0} Gifts
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-100 dark:border-red-800/50 flex items-center gap-1 w-max">
                                <span>❤️</span> {profile.total_likes || 0} Likes
                            </div>
                        </div>
                    </div>





                    {/* Story Highlights Reel */}
                    {(() => {
                        const highlightedStories = (profile.stories || []).filter((s: any) => s.isHighlight);
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
                                                setActiveHighlightSet({
                                                    stories: highlightedStories,
                                                    initialIndex: idx,
                                                    user: {
                                                        id: profile.id,
                                                        name: profile.name || profile.full_name || 'User',
                                                        photoUrl: profile.photos?.[0] || profile.avatar_url
                                                    }
                                                });
                                            }}
                                            className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
                                        >
                                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-purple-500 to-pink-500 shadow-md group-hover:scale-105 transition-transform">
                                                <div className="w-full h-full rounded-full p-[1px] bg-white dark:bg-gray-900 overflow-hidden">
                                                    {hStory.type === 'video' ? (
                                                        <video src={hStory.url} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <img src={hStory.url} className="w-full h-full object-cover" alt="Highlight" />
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

                    {/* Sticky Tabs — with inline close button so X never overlaps */}
                    <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-40 border-b border-gray-100 dark:border-gray-800">
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
                            {/* Close Button lives here — always visible, never overlaps tabs */}
                            <button
                                onClick={onClose}
                                className="shrink-0 mr-3 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all active:scale-95"
                                aria-label="Close"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        {/* Swipe hint on mobile */}
                        <div className="flex md:hidden justify-center pb-1">
                            <span className="text-[9px] text-gray-300 dark:text-gray-600">← swipe to browse tabs →</span>
                        </div>
                    </div>

                    {/* Scrollable Content — extra bottom padding for breathing room */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 pb-20 md:pb-10 min-h-0">
                        {activeTab === 'highlights' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-pink-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-xl space-y-4">
                                    <div className="flex items-center gap-2 text-amber-500 font-black text-sm uppercase tracking-widest">
                                        <Star size={18} fill="currentColor" />
                                        <span>Story Highlights</span>
                                    </div>

                                    {(() => {
                                        const highlightedStories = (profile.stories || []).filter((s: any) => s.isHighlight);
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

                                        return (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                {highlightedStories.map((hStory: any, idx: number) => (
                                                    <div
                                                        key={hStory.id || idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveHighlightSet({
                                                                stories: highlightedStories,
                                                                initialIndex: idx,
                                                                user: {
                                                                    id: profile.id,
                                                                    name: profile.name || profile.full_name || 'User',
                                                                    photoUrl: profile.photos?.[0] || profile.avatar_url
                                                                }
                                                            });
                                                        }}
                                                        className="flex flex-col items-center gap-2 cursor-pointer group"
                                                    >
                                                        <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg group-hover:scale-105 transition-all">
                                                            <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-gray-900 overflow-hidden">
                                                                {hStory.type === 'video' ? (
                                                                    <video src={hStory.url} className="w-full h-full object-cover" muted />
                                                                ) : (
                                                                    <img src={hStory.url} className="w-full h-full object-cover" alt="Highlight" />
                                                                )}
                                                            </div>
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
                                        "{safeProfile.summary || "Strong compatibility based on shared values like lifestyle, career expectations, and background compatibility."}"
                                    </p>

                                    {/* Match Reasons (AI Similarity Badges) */}
                                    {safeProfile.match_reasons && safeProfile.match_reasons.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {safeProfile.match_reasons.map((reason: string, idx: number) => (
                                                <div 
                                                    key={idx}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase tracking-wider shadow-sm"
                                                >
                                                    <span>✨ {reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-6">
                                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 shadow-sm flex items-center gap-2">
                                            <span>✨</span> {profile.score || 0}% Match Score
                                        </div>
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
                                    <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Horoscope & Faith</h3>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <InfoCard label="Religion" value={profile.religion?.faith || profile.religion?.religion || "-"} />
                                        <InfoCard label="Caste" value={profile.religion?.caste || "-"} />
                                        <InfoCard label="Gothra" value={profile.horoscope?.gothra || profile.religion?.gothra || "-"} />
                                        <InfoCard label="Manglik" value={profile.horoscope?.manglik || "-"} icon="✨" />
                                        <InfoCard label="Zodiac" value={profile.horoscope?.zodiacSign ? `${getZodiacSymbol(profile.horoscope.zodiacSign)} ${profile.horoscope.zodiacSign}` : "-"} />
                                        <InfoCard label="Nakshatra" value={profile.horoscope?.nakshatra || "-"} />
                                        <InfoCard label="Time of Birth" value={profile.horoscope?.birthTime || "-"} />
                                        <InfoCard label="Birth Place" value={profile.horoscope?.birthPlace || "-"} />
                                    </div>
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
                                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm">💼</div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{profile.career?.profession || "-"}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                {/* Show Company if Connected OR Premium */}
                                                {(profile.match_status === 'accepted' || currentUser?.id === profile.id || currentUser?.is_premium)
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
                                        <InfoRow label="Education" value={profile.career?.education || "-"} />
                                        <InfoRow label="Degree" value={profile.career?.degree || "-"} />
                                        <InfoRow label="College" value={profile.career?.college || "-"} />
                                        <InfoRow
                                            label="Annual Income"
                                            value={(profile.match_status === 'accepted' || currentUser?.id === profile.id || currentUser?.is_premium) ? (profile.career?.income || "Not Specified") : "🔒 Connect to Unlock"}
                                            highlight={(profile.match_status === 'accepted' || currentUser?.id === profile.id || currentUser?.is_premium)}
                                            premiumUnlocked={currentUser?.is_premium && !(profile.match_status === 'accepted' || currentUser?.id === profile.id)}
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
                                        <InfoCard label="Brothers" value={profile.family?.brothers || "0"} />
                                        <InfoCard label="Sisters" value={profile.family?.sisters || "0"} />
                                        <InfoCard label="Native Place" value={profile.family?.nativePlace || profile.location?.city || "City"} />
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

                                {profile.lifestyle?.hobbies && (
                                    <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Interests & Hobbies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.lifestyle.hobbies.split(',').map((hobby: string, idx: number) => (
                                                <span key={idx} className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    {hobby.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                            "{exp}"
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

                    {/* Bottom Action Bar (Fixed on Mobile) */}
                    {(() => {
                        const isAlreadyConnected = typeof isConnectedProp === 'boolean' ? isConnectedProp : (matchStatus === 'accepted' || matchStatus === 'connected');
                        const isPendingRequest = matchStatus === 'pending';
                        return (
                            <div className="w-full p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 md:static md:bg-gray-50 dark:md:bg-gray-900 z-[210] pb-safe">
                                {isAlreadyConnected && (
                                    <div className="flex items-center justify-center gap-1.5 mb-1.5 py-0.5 px-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 w-max mx-auto">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Connected</span>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800" onClick={onClose}>
                                        {isAlreadyConnected ? 'Close' : 'Skip'}
                                    </Button>
                                    {isAlreadyConnected ? (
                                        <Button className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/30" onClick={() => { onClose(); onChat?.(); }}>
                                            💬 Chat Now
                                        </Button>
                                    ) : isPendingRequest ? (
                                        <Button disabled className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-bold shadow-lg opacity-80 cursor-not-allowed">
                                            ✓ Request Sent
                                        </Button>
                                    ) : (
                                        <Button
                                            disabled={loadingInterest}
                                            className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/10"
                                            onClick={handleConnect}
                                        >
                                            {loadingInterest ? 'Sending...' : '✨ Send Interest'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                </div>

            </div>

            {
                showKundli && (
                    <KundliModal
                        isOpen={showKundli}
                        onClose={() => setShowKundli(false)}
                        data={profile.kundli || { score: 18, total: 36, details: [] }}
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
            {/* Fullscreen Image Gallery — swipe only, no arrows */}
            {isFullscreen && (() => {
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

            {activeHighlightSet && (
                <StoryModal
                    stories={activeHighlightSet.stories}
                    initialIndex={activeHighlightSet.initialIndex || 0}
                    user={activeHighlightSet.user}
                    currentUser={currentUser}
                    onClose={() => setActiveHighlightSet(null)}
                    onHighlightToggle={(storyId, isHighlight) => {
                        if (profile && profile.stories) {
                            profile.stories = profile.stories.map((s: any) => 
                                String(s.id) === String(storyId) ? { ...s, isHighlight } : s
                            );
                        }
                    }}
                />
            )}
        </div>
    );
}

// Sub-components for cleaner code
const InfoCard = ({ label, value, icon }: any) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
        <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">{label}</div>
        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1 break-words">
            {icon && <span>{icon}</span>} {value}
        </div>
    </div>
);

const InfoRow = ({ label, value, highlight, premiumUnlocked }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
        <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${highlight ? 'text-green-700 dark:text-green-400 font-bold' : 'text-gray-900 dark:text-gray-100'}`}>{value}</span>
            {premiumUnlocked && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800/50">💎</span>}
        </div>
    </div>
);

const ContactRow = ({ icon, label, value }: any) => (
    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-green-100/50 dark:border-green-800/30 shadow-sm">
        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-xl">{icon}</div>
        <div>
            <div className="text-[10px] text-green-800 dark:text-green-400 font-bold uppercase tracking-wider">{label}</div>
            <div className="text-gray-900 dark:text-gray-100 font-mono font-medium">{value}</div>
        </div>
    </div>
);
