'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ChevronLeft, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

// Dynamically import the entire inner map component with SSR disabled.
const MapInner = dynamic(() => import('./MapInner'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 rounded-2xl border border-indigo-900/30 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading Live Map…</p>
        </div>
    )
});

export default function InteractiveMap({ profiles, currentUser, onViewProfile, onBack }: { profiles: any[], currentUser: any, onViewProfile?: (p: any) => void, onBack?: () => void }) {
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [astrologyMode, setAstrologyMode] = useState(false);
    const { publicStats, onlineUsers } = useSocket() as any;

    // Apply Live Map Filters
    const filteredProfiles = profiles.filter((p) => {
        if (!activeFilter) return true;

        switch (activeFilter) {
            case 'Software':
            case 'Doctor':
            case 'Engineer':
                const prof = (p.career?.profession || p.role || '').toLowerCase();
                return prof.includes(activeFilter.toLowerCase());
            case 'Telugu':
            case 'Hindi':
            case 'Tamil':
                const lang = (p.motherTongue || p.details?.find((d: any) => d.name === "Mother Tongue")?.value || '').toLowerCase();
                return lang.includes(activeFilter.toLowerCase());
            default:
                return true;
        }
    });

    // Only count profiles that have actual coordinates
    const mapProfilesCount = filteredProfiles.filter(
        (p: any) => p.location_data && p.location_data.lat && p.location_data.lng
    ).length;

    const filters = ['Software', 'Doctor', 'Engineer', 'Telugu', 'Hindi', 'Tamil'];

    return (
        <div className="w-full h-full relative flex flex-col rounded-2xl overflow-hidden shadow-lg border border-indigo-900/30">

            {/* Unified Top Overlay */}
            <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-none">

                {/* Row 1: Back Button & Stats (Horizontal to save space) */}
                <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1 bg-white/90 hover:bg-white text-gray-900 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-full border border-gray-200 shadow-sm transition-colors w-max"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    )}
                    <div className="bg-gray-900/80 backdrop-blur-md text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full border border-indigo-500/30 shadow-sm w-max flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-bold">{publicStats?.onlineCount || onlineUsers?.length || 1}</span> online
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-md text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-full border border-gray-700 shadow-sm w-max">
                        <span className="text-gray-300 font-bold">{mapProfilesCount}</span> nearby
                    </div>
                </div>

                {/* Row 2: Filters (Hidden Scrollbar) */}
                <div 
                    className="flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
                    
                    <button
                        onClick={() => setAstrologyMode(!astrologyMode)}
                        className={`shrink-0 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm
                            ${astrologyMode
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-none'
                                : 'bg-white/90 text-gray-700 hover:bg-white border border-gray-200'}`}
                    >
                        🕉️ Astrology
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-0.5 shrink-0"></div>

                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                            className={`shrink-0 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition shadow-sm border
                                ${activeFilter === filter
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white/90 text-gray-700 hover:bg-white border-gray-200'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map Canvas */}
            <MapInner
                profiles={filteredProfiles}
                currentUser={currentUser}
                onViewProfile={onViewProfile}
                astrologyMode={astrologyMode}
            />
        </div>
    );
}
