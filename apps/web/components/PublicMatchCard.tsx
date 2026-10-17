'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatLocationString } from '@/lib/utils';
import { trackImageFailure } from '@/lib/analytics';

interface PublicMatchCardProps {
    match: any;
}

export default function PublicMatchCard({ match }: PublicMatchCardProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const isPhotoBlurred = Boolean(match.isBlurred || match.blur);

    // Photos Array (with robust fallback)
    const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id || 'Member')}`;
    const rawList = (Array.isArray(match.photos) && match.photos.length > 0)
        ? match.photos
        : [match.photoUrl || match.avatar_url || fallbackAvatar];
    const photos = rawList.filter((p: any) => typeof p === 'string' && p.trim().length > 0);
    if (photos.length === 0) photos.push(fallbackAvatar);

    // Auto-Slide Effect (3s interval, pause on hover)
    useEffect(() => {
        if (photos.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentPhotoIndex((prev: number) => (prev + 1) % photos.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [photos.length, isHovered]);

    return (
        <div 
            className="group relative w-72 h-96 flex-shrink-0 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/20 dark:border-white/10 hover:border-purple-500/40 bg-gray-900 will-change-transform transform-gpu touch-manipulation select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image (Immersive) */}
            <div className="absolute inset-0 bg-gray-950">
                <img
                    src={photos[currentPhotoIndex] || photos[0] || fallbackAvatar}
                    alt={match.name || 'Member'}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform transform-gpu ${isPhotoBlurred ? 'blur-2xl scale-110 filter' : ''}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        trackImageFailure(target.src, 'PublicMatchCard', match.id);
                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                        target.src = fallbackAvatar;
                    }}
                />

                {/* Privacy Shield Blurred Overlay */}
                {isPhotoBlurred && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md p-4 text-center select-none pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 mb-2 shadow-lg shadow-pink-500/10 animate-pulse">
                            <span className="text-xl">🔒</span>
                        </div>
                        <span className="text-white font-black text-xs tracking-wide">Photo Private</span>
                        <span className="text-white/80 text-[11px] mt-0.5 max-w-[170px] leading-tight">
                            Register & connect to view
                        </span>
                        <span className="mt-1.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-900/60 text-pink-200 border border-pink-400/30">
                            🛡️ Privacy Shield
                        </span>
                    </div>
                )}

                {/* Photo Progress Bar */}
                {!isPhotoBlurred && photos.length > 1 && (
                    <div className="absolute top-2 left-3 right-3 flex gap-1 z-30 transition-opacity">
                        {photos.map((_url: string, idx: number) => (
                            <div key={idx} className="h-0.5 flex-1 bg-black/40 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
                                <div
                                    className={`h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300 ${idx === currentPhotoIndex ? 'w-full' : idx < currentPhotoIndex ? 'w-full opacity-60' : 'w-0'}`}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Subtle Edge Gradients Only - Keeps middle of photo 100% bright & crystal clear */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none z-10" />
            </div>

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
            <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col justify-end pointer-events-none">
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
                    {match.profession && match.profession !== '-' && match.profession !== 'Member' && (
                        <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 uppercase tracking-wider">
                            💼 {match.profession}
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
    );
}
