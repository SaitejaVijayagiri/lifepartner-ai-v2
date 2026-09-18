'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function AnimatedSplash() {
    const [visible, setVisible] = useState(true);
    const [animatingOut, setAnimatingOut] = useState(false);

    useEffect(() => {
        // Prevent scroll while splash is active
        document.body.style.overflow = 'hidden';

        const timer = setTimeout(() => {
            setAnimatingOut(true);
            setTimeout(() => {
                setVisible(false);
                document.body.style.overflow = '';
            }, 700); // match transition duration
        }, 1800);

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none transition-all duration-700 ${
                animatingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
            }`}
        >
            {/* Ambient Background Gradient Orbs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-600/25 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse [animation-delay:0.5s]" />

            {/* Main Central Container */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-75 duration-700">
                {/* Free-Floating Logo with Movement Animation (No Box!) */}
                <div className="relative mb-6 flex items-center justify-center">
                    {/* Soft Ambient Radial Light Behind Logo (Borderless) */}
                    <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-rose-500/25 via-purple-500/20 to-indigo-500/25 blur-2xl pointer-events-none animate-pulse" />
                    
                    {/* Floating Animated Logo (Pure Logo Icon with Breathing/Floating Motion) */}
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center animate-[logoFloat_2.4s_ease-in-out_infinite]">
                        <img
                            src="/icon-192x192.png"
                            alt="LifePartner AI Logo"
                            className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(99,102,241,0.5)]"
                            onError={(e) => {
                                (e.target as any).style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-rose-200 bg-clip-text text-transparent drop-shadow-sm">
                        LifePartner <span className="text-indigo-400 font-extrabold">AI</span>
                    </h1>
                    <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                </div>

                {/* Subtitle / Tagline */}
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 tracking-wide mb-8">
                    <span>Where Hearts Connect</span>
                    <span className="w-1 h-1 rounded-full bg-rose-400 inline-block" />
                    <span className="text-indigo-300 font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" /> Powered by AI
                    </span>
                </div>

                {/* Modern Sleek Loading Bar */}
                <div className="w-48 sm:w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-full animate-[splashProgress_1.8s_ease-in-out_infinite]" />
                </div>
            </div>

            {/* Footer Badge */}
            <div className="absolute bottom-6 text-[11px] font-semibold text-slate-500 tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                100% Free • Verified Matches
            </div>

            {/* Logo Float Animation Keyframes */}
            <style jsx global>{`
                @keyframes logoFloat {
                    0%, 100% {
                        transform: translateY(0px) scale(1);
                        filter: drop-shadow(0 12px 24px rgba(99, 102, 241, 0.45)) drop-shadow(0 4px 10px rgba(244, 63, 94, 0.35));
                    }
                    50% {
                        transform: translateY(-8px) scale(1.06);
                        filter: drop-shadow(0 22px 34px rgba(99, 102, 241, 0.65)) drop-shadow(0 8px 18px rgba(244, 63, 94, 0.55));
                    }
                }
            `}</style>
        </div>
    );
}
