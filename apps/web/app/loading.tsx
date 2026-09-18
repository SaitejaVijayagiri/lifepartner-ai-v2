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
                {/* Free-Floating Animated Logo (No Box!) */}
                <div className="relative flex items-center justify-center w-28 h-28">
                    {/* Soft Ambient Radial Light Behind Logo (Borderless) */}
                    <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-rose-500/25 via-purple-500/20 to-indigo-500/25 blur-2xl pointer-events-none animate-pulse" />
                    
                    {/* Floating Animated Logo */}
                    <div className="relative w-20 h-20 flex items-center justify-center animate-[logoFloat_2.4s_ease-in-out_infinite]">
                        <img
                            src="/icon-192x192.png"
                            alt="LifePartner AI Logo"
                            className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(99,102,241,0.45)]"
                            onError={(e) => {
                                (e.target as any).style.display = 'none';
                            }}
                        />
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
                @keyframes logoFloat {
                    0%, 100% {
                        transform: translateY(0px) scale(1);
                        filter: drop-shadow(0 10px 20px rgba(99, 102, 241, 0.4)) drop-shadow(0 4px 8px rgba(244, 63, 94, 0.3));
                    }
                    50% {
                        transform: translateY(-6px) scale(1.06);
                        filter: drop-shadow(0 20px 30px rgba(99, 102, 241, 0.6)) drop-shadow(0 8px 16px rgba(244, 63, 94, 0.5));
                    }
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
