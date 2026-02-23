'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

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

    const filters = ['Software', 'Doctor', 'Engineer', 'Telugu', 'Hindi', 'Tamil'];

    return (
        <div className="w-full h-full relative flex flex-col">
            {/* Floating Filter Bar */}
            <div className="absolute top-16 left-3 right-3 z-[1000] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
                <button
                    onClick={() => setAstrologyMode(!astrologyMode)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-md
                        ${astrologyMode
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-none'
                            : 'bg-white/90 text-gray-700 hover:bg-white border border-gray-200'}`}
                >
                    🕉️ Astrology Mode
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1 shrink-0"></div>

                {filters.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-md border
                            ${activeFilter === filter
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white/90 text-gray-700 hover:bg-white border-gray-200'}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Map Canvas */}
            <MapInner
                profiles={filteredProfiles}
                currentUser={currentUser}
                onViewProfile={onViewProfile}
                onBack={onBack}
                astrologyMode={astrologyMode}
            />
        </div>
    );
}
