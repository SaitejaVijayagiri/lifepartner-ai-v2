'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatLocationString, isProfilePhotoBlurred, isPlaceholderPhoto, hasUserUploadedPhoto } from '@/lib/utils';
import { getReligionSymbol } from '@/lib/religionUtils';
import { trackImageFailure } from '@/lib/analytics';

interface PublicMatchCardProps {
    match: any;
    hideIfNoPhoto?: boolean;
    hideIfBlurred?: boolean;
    onImageUnavailable?: (matchId: string) => void;
}

export default function PublicMatchCard({
    match,
    hideIfNoPhoto = false,
    hideIfBlurred = false,
    onImageUnavailable,
}: PublicMatchCardProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [brokenUrls, setBrokenUrls] = useState<string[]>([]);
    const isPhotoBlurred = isProfilePhotoBlurred(match);

    // Photos Array (prefer real uploaded photos without placeholder or broken URLs)
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id || 'Member')}`;
    const rawList = (Array.isArray(match.photos) && match.photos.length > 0)
        ? match.photos
        : [match.photoUrl || match.avatar_url || fallbackAvatar];
    const cleanStrings = Array.from(new Set(rawList.filter((p: any) => typeof p === 'string' && p.trim().length > 0))) as string[];
    const realPhotoList = cleanStrings.filter((p) => {
        if (isPlaceholderPhoto(p) || brokenUrls.includes(p)) return false;
        if (hideIfNoPhoto && p.toLowerCase().includes('googleusercontent.com')) return false;
        return true;
    });
    const photos = realPhotoList.length > 0
        ? realPhotoList
        : (hideIfNoPhoto ? [] : (cleanStrings.length > 0 ? cleanStrings : [fallbackAvatar]));

    const hasUploadedPhoto = useMemo(() => {
        return realPhotoList.length > 0 || (!hideIfNoPhoto && hasUserUploadedPhoto(match));
    }, [match, realPhotoList.length, hideIfNoPhoto]);

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

    // Auto-Slide Effect (3s interval, pause on hover)
    useEffect(() => {
        if (!hasUploadedPhoto || photos.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentPhotoIndex((prev: number) => (prev + 1) % photos.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [photos.length, isHovered, hasUploadedPhoto]);

    if ((hideIfBlurred && isPhotoBlurred) || (hideIfNoPhoto && (!hasUploadedPhoto || photos.length === 0))) {
        return null;
    }

    return (
        <div 
            className="group relative w-72 h-96 flex-shrink-0 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/20 dark:border-white/10 hover:border-purple-500/40 bg-gray-900 will-change-transform transform-gpu touch-manipulation select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {!hasUploadedPhoto ? (
                /* LUXURY PERSONA SHOWCASE CARD (NO PHOTO) */
                <div className="absolute inset-0 bg-gradient-to-br from-[#12162a] via-[#0d1020] to-[#1c122c] overflow-hidden flex flex-col justify-between p-4 z-20">
                    {/* Atmospheric Glows */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br from-purple-600/25 to-pink-600/10 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-600/25 to-teal-600/10 blur-2xl pointer-events-none" />

                    {/* Subtle Mandala Watermark */}
                    <svg className="absolute -right-10 -top-10 w-48 h-48 text-white/[0.035] pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.5" />
                    </svg>

                    {/* Top Trust Row */}
                    <div className="relative z-10 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {match.isVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md">
                                    ✓ Verified
                                </span>
                            )}
                            {match.managed_by && match.managed_by !== 'Self' && (
                                <span className="inline-flex items-center gap-1 text-teal-200 text-[9px] font-bold bg-teal-950/80 border border-teal-400/30 px-2 py-0.5 rounded-full backdrop-blur-md">
                                    {match.managed_by === 'Parent' ? '👨‍👩‍👧 By Parent' : `👤 By ${match.managed_by}`}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                            📷 Photo on Request
                        </span>
                    </div>

                    {/* Upper Identity */}
                    <div className="relative z-10 flex items-center gap-3 my-1">
                        <div className="relative shrink-0">
                            <div className="w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg shadow-purple-950/50">
                                <div className="w-11 h-11 rounded-full bg-[#121626] flex items-center justify-center">
                                    <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-pink-200">
                                        {initials}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-black text-white tracking-tight truncate">
                                {displayName}{match.age ? `, ${match.age}` : ''}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-medium truncate mt-0.5">
                                {heightStr && <span>📏 {heightStr}</span>}
                                {heightStr && locationStr && <span>•</span>}
                                {locationStr && <span className="truncate">📍 {locationStr}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="relative z-10 grid grid-cols-2 gap-1.5 my-1">
                        {professionStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 flex items-center gap-1.5">
                                <span className="text-xs shrink-0">💼</span>
                                <div className="min-w-0">
                                    <p className="text-[8px] uppercase font-bold text-gray-400">Profession</p>
                                    <p className="text-[11px] font-semibold text-white truncate">{professionStr}</p>
                                </div>
                            </div>
                        )}
                        {educationStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 flex items-center gap-1.5">
                                <span className="text-xs shrink-0">🎓</span>
                                <div className="min-w-0">
                                    <p className="text-[8px] uppercase font-bold text-gray-400">Education</p>
                                    <p className="text-[11px] font-semibold text-white truncate">{educationStr}</p>
                                </div>
                            </div>
                        )}
                        {religionCasteStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 flex items-center gap-1.5">
                                <span className="text-xs shrink-0">{getReligionSymbol(match?.religion?.religion || match?.religion || 'Hindu')}</span>
                                <div className="min-w-0">
                                    <p className="text-[8px] uppercase font-bold text-gray-400">Faith / Caste</p>
                                    <p className="text-[11px] font-semibold text-white truncate">{religionCasteStr}</p>
                                </div>
                            </div>
                        )}
                        {locationStr && (
                            <div className="rounded-xl bg-black/40 border border-white/10 p-1.5 flex items-center gap-1.5">
                                <span className="text-xs shrink-0">📍</span>
                                <div className="min-w-0">
                                    <p className="text-[8px] uppercase font-bold text-gray-400">Location</p>
                                    <p className="text-[11px] font-semibold text-white truncate">{locationStr}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="relative z-10 pt-1 pointer-events-auto">
                        <Link href="/register" className="block w-full">
                            <button className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-xs uppercase tracking-wider shadow-xl hover:opacity-95 transition-all active:scale-95 border border-white/20 flex items-center justify-center cursor-pointer">
                                Connect Now ✨
                            </button>
                        </Link>
                    </div>
                </div>
            ) : (
                /* Background Image (Immersive) */
                <div className="absolute inset-0 bg-gray-950">
                    <img
                        src={photos[currentPhotoIndex] || photos[0] || fallbackAvatar}
                        alt={match.name || 'Member'}
                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform transform-gpu ${isPhotoBlurred ? 'blur-2xl scale-110 filter' : ''}`}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const failedSrc = photos[currentPhotoIndex] || photos[0] || target.src;
                            trackImageFailure(failedSrc, 'PublicMatchCard', match.id);
                            if (hideIfNoPhoto) {
                                const nextBroken = brokenUrls.includes(failedSrc) ? brokenUrls : [...brokenUrls, failedSrc];
                                const remaining = cleanStrings.filter((p) => !isPlaceholderPhoto(p) && !nextBroken.includes(p));
                                setBrokenUrls(nextBroken);
                                setCurrentPhotoIndex(0);
                                if (remaining.length === 0 && onImageUnavailable && match?.id) {
                                    onImageUnavailable(String(match.id));
                                }
                                return;
                            }
                            target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                            target.src = fallbackAvatar;
                        }}
                    />

                    {/* Privacy Shield Blurred Overlay */}
                    {isPhotoBlurred && (
                        <>
                            <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md pointer-events-none" />
                            <div className="absolute inset-x-3 top-12 bottom-36 z-20 flex flex-col items-center justify-center p-3 text-center select-none pointer-events-none">
                                <div className="w-11 h-11 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 mb-1.5 shadow-lg shadow-pink-500/10 animate-pulse">
                                    <span className="text-xl">🔒</span>
                                </div>
                                <span className="text-white font-black text-xs tracking-wide">Photo Private</span>
                                <span className="text-white/85 text-[11px] mt-0.5 max-w-[170px] leading-tight">
                                    Register & connect to view
                                </span>
                                <span className="mt-1.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-950/75 text-pink-200 border border-pink-400/35">
                                    🛡️ Privacy Shield
                                </span>
                            </div>
                        </>
                    )}

                    {/* Photo Progress Bar + Multi-Photo Controls */}
                    {!isPhotoBlurred && photos.length > 1 && (
                        <>
                            <div className="absolute top-2.5 left-3 right-3 flex gap-1.5 z-30">
                                {photos.map((_url: string, idx: number) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        aria-label={`View photo ${idx + 1} of ${photos.length}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCurrentPhotoIndex(idx);
                                        }}
                                        className="h-1.5 flex-1 bg-black/40 rounded-full overflow-hidden backdrop-blur-md border border-white/15 cursor-pointer"
                                    >
                                        <div
                                            className={`h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300 ${idx === currentPhotoIndex ? 'w-full' : idx < currentPhotoIndex ? 'w-full opacity-70' : 'w-0'}`}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Photo Count Pill (Top Left) */}
                            <div className="absolute top-6 left-3 z-30">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow">
                                    📸 {currentPhotoIndex + 1}/{photos.length} Photos
                                </span>
                            </div>

                            {/* Left / Right Tap & Click Controls for Flipping Photos */}
                            <button
                                type="button"
                                aria-label="Previous photo"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20 cursor-pointer"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                aria-label="Next photo"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20 cursor-pointer"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Subtle Edge Gradients Only - Keeps middle of photo 100% bright & crystal clear */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-10" />

                    {/* Glowing Verified Badge (Floating Top Right) */}
                    {match.isVerified && (
                        <div className="absolute top-4 right-4 z-30">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/20 shadow-xl text-white">
                                <span className="text-blue-400 text-sm">✓</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Verified</span>
                            </div>
                        </div>
                    )}

                    {/* Bottom Info Section */}
                    <div className="absolute bottom-0 inset-x-0 p-5 z-30 flex flex-col justify-end pointer-events-none">
                        <div className="flex items-end gap-2 mb-1.5">
                            <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-1">
                                {match.name || 'Member'}{match.age ? `, ${match.age}` : ''}
                            </h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-gray-100 text-[10px] font-medium mb-4 opacity-95">
                            {Boolean(match.managed_by && match.managed_by !== 'Self') && (
                                <span className="px-2.5 py-1 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/30 text-teal-200 uppercase tracking-wider text-[9px] font-bold">
                                    {match.managed_by === 'Parent' ? '👨‍👩‍👧 By Parent' : match.managed_by === 'Sibling' ? '👫 By Sibling' : `👤 By ${match.managed_by}`}
                                </span>
                            )}
                            {(match.profession || match.career?.profession || match.role) && (match.profession || match.career?.profession || match.role) !== '-' && (match.profession || match.career?.profession || match.role) !== 'Member' && (
                                <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 uppercase tracking-wider">
                                    💼 {match.profession || match.career?.profession || match.role}
                                </span>
                            )}
                            {formatLocationString(match.location) && formatLocationString(match.location) !== 'Unknown City' && (
                                <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 uppercase tracking-wider">
                                    📍 {formatLocationString(match.location)}
                                </span>
                            )}
                        </div>

                        {/* Call to Action Button */}
                        <div className="pointer-events-auto w-full">
                            <Link href="/register" className="block w-full">
                                <button className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-xs uppercase tracking-wider shadow-xl hover:opacity-95 transition-all active:scale-95 border border-white/20 flex items-center justify-center cursor-pointer">
                                    Connect Now ✨
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

