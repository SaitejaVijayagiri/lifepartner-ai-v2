'use client';

import React from 'react';
import { Heart } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-delay:1.5s]" />

            <div className="relative flex flex-col items-center gap-6 z-10">
                {/* Glowing Pulsing Heart Logo */}
                <div className="relative flex items-center justify-center w-24 h-24">
                    {/* Ring 1 (Outer Ping) */}
                    <div className="absolute inset-0 rounded-full bg-rose-500/15 animate-ping [animation-duration:2.5s]" />
                    {/* Ring 2 (Middle Glow) */}
                    <div className="absolute inset-2 rounded-full bg-indigo-500/10 border-2 border-indigo-400/20 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse" />
                    
                    {/* Floating Core */}
                    <div className="relative w-16 h-16 rounded-2xl bg-slate-900/60 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-2xl transition-all hover:scale-105 duration-300">
                        <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-[beat_1.2s_infinite_ease-in-out]" />
                    </div>
                </div>

                {/* Elegant Text */}
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-rose-200 tracking-tight drop-shadow-md">
                        LifePartner AI
                    </h2>
                    <p className="text-xs text-indigo-300/80 font-medium tracking-widest uppercase mt-2.5 animate-pulse">
                        Finding your perfect alignment...
                    </p>
                </div>

                {/* Sleek Progress Indeterminate Bar */}
                <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500 rounded-full w-full animate-[progress_1.8s_infinite_ease-in-out]" />
                </div>
            </div>

            {/* Embed animations directly */}
            <style jsx global>{`
                @keyframes beat {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(244,63,94,0.4)); }
                    50% { transform: scale(1.15); filter: drop-shadow(0 0 12px rgba(244,63,94,0.8)); }
                }
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
