'use client';

import Link from 'next/link';

interface PublicMatchCardProps {
    match: any;
}

export default function PublicMatchCard({ match }: PublicMatchCardProps) {
    return (
        <div className="group relative w-72 h-96 flex-shrink-0 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
            {/* Background Image (Immersive) */}
            <div className="absolute inset-0">
                <img
                    src={match.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id)}`}
                    alt={match.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; 
                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(match.name || match.id)}`;
                    }}
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Glowing Verified Badge (Floating Top Right) */}
            {match.isVerified && (
                <div className="absolute top-4 right-4 z-30">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-lg text-white">
                        <span className="text-blue-400 text-sm">✓</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Verified</span>
                    </div>
                </div>
            )}

            {/* Bottom Info Section */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col justify-end pointer-events-none">
                <div className="flex items-end gap-2 mb-1">
                    <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-lg filter flex items-center gap-1">
                        {match.name}, {match.age}
                    </h3>
                </div>

                <div className="flex flex-wrap gap-2 text-gray-100 text-[10px] font-medium mb-4 opacity-95">
                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 uppercase tracking-widest">
                        💼 {match.profession}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 uppercase tracking-widest">
                        📍 {match.location}
                    </span>
                </div>

                {/* Call to Action Button */}
                <div className="pointer-events-auto w-full">
                    <Link href="/register" className="block w-full">
                        <button className="w-full h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-indigo-900 transition-all active:scale-95 shadow-lg">
                            Connect Now
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
