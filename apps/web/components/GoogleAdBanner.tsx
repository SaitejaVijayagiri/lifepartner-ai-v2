'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface GoogleAdBannerProps {
    slotId?: string;
    format?: 'auto' | 'horizontal' | 'rectangle';
}

export default function GoogleAdBanner({ slotId = "8536302476", format = 'auto' }: GoogleAdBannerProps) {
    const initialized = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !initialized.current) {
            try {
                // Wait a tick to ensure the DOM element is ready
                setTimeout(() => {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    initialized.current = true;
                }, 100);
            } catch (err) {
                console.error("AdSense Error:", err);
            }
        }
    }, []);

    return (
        <div className="w-full my-8 bg-gray-50/50 flex flex-col items-center justify-center overflow-hidden border border-gray-100 rounded-xl p-2 relative min-h-[100px]">
            <div className="absolute top-1 right-2 text-[9px] text-gray-400 uppercase tracking-widest z-10">Advertisement</div>
            <ins className="adsbygoogle"
                style={{ display: 'block', minWidth: '300px', width: '100%' }}
                data-ad-client="ca-pub-1408290775036355"
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive="true"></ins>
        </div>
    );
}
