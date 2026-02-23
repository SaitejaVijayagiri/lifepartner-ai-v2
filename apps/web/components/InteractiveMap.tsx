'use client';

import dynamic from 'next/dynamic';

// Dynamically import the entire inner map component with SSR disabled.
// This avoids TypeScript/webpack issues that arise from importing individual
// react-leaflet components via next/dynamic.
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
    return <MapInner profiles={profiles} currentUser={currentUser} onViewProfile={onViewProfile} onBack={onBack} />;
}
