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
                {/* Logo Wrapper with Glowing Rings */}
                <div className="relative mb-6 group">
                    {/* Outer Glowing Ring */}
                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500 via-rose-500 to-purple-500 opacity-60 blur-xl animate-pulse" />
                    
                    {/* Secondary Heart Pulse Ring */}
                    <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-400 to-rose-400 opacity-40 animate-ping [animation-duration:2.5s]" />

                    {/* Logo Image */}
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl p-4 flex items-center justify-center backdrop-blur-md">
                        <img
                            src="/icon-192x192.png"
                            alt="LifePartner AI Logo"
                            className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(79,70,229,0.4)] animate-in zoom-in duration-500"
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
        </div>
    );
}
