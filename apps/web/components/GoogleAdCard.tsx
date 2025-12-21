'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface GoogleAdCardProps {
    isActive: boolean;
    slotId?: string; // Optional: Allow passing specific slots
}

export default function GoogleAdCard({ isActive, slotId = "8536302476" }: GoogleAdCardProps) {
    // Default slot '8536302476' is an example. In real app, you create units in AdSense console.
    // Using a generic responsive slot here.

    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        // Only push the ad when it becomes active or viewed to ensure viewability stats
        // But for simplicity/performance in a feed, we might want to load it slightly before.
        // AdSense script is already in layout.tsx.

        if (typeof window !== 'undefined' && !initialized.current) {
            try {
                // Wait a tick to ensure the DOM element is ready
                setTimeout(() => {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    initialized.current = true;
                }, 100);
            } catch (err) {
                console.error("AdSense Error", err);
            }
        }
    }, [isActive]);

    return (
        <div className="h-full w-full snap-start snap-child relative bg-black flex flex-col items-center justify-center text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-neutral-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-50 z-0"></div>

            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/70 font-bold z-10 border border-white/10 uppercase tracking-widest">
                Sponsored
            </div>

            {/* Ad Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 space-y-8">
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                        Partner Offer
                    </h3>
                    <p className="text-sm text-gray-400">Recommended for you</p>
                </div>

                {/* Ad Unit Wrapper */}
                <div className="w-full max-w-[340px] bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm min-h-[280px] flex items-center justify-center">
                    <ins className="adsbygoogle"
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        data-ad-client="ca-pub-1408290775036355"
                        data-ad-slot={slotId}
                        data-ad-format="auto"
                        data-full-width-responsive="true"></ins>
                </div>

                <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                    Advertisement
                </div>
            </div>
        </div>
    );
}
