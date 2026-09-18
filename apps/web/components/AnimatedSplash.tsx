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
                {/* Dynamic Purple Love Animation (No Static Picture!) */}
                <div className="relative mb-6 flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44">
                    {/* Radiating Purple Love Ripples */}
                    <div className="absolute inset-2 rounded-full border border-purple-500/40 animate-[purpleRipple_2.4s_ease-out_infinite]" />
                    <div className="absolute inset-2 rounded-full border border-fuchsia-500/25 animate-[purpleRipple_2.4s_ease-out_infinite_0.8s]" />
                    <div className="absolute inset-2 rounded-full border border-violet-500/30 animate-[purpleRipple_2.4s_ease-out_infinite_1.6s]" />

                    {/* Ambient Purple Glow */}
                    <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-600/30 via-fuchsia-600/20 to-violet-600/30 blur-2xl pointer-events-none animate-pulse" />

                    {/* Floating Micro-Hearts */}
                    <div className="absolute top-2 right-2 text-purple-400 opacity-75 animate-[floatParticle_2.6s_ease-in-out_infinite]">
                        <Heart className="w-4 h-4 fill-purple-400 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    </div>
                    <div className="absolute bottom-3 left-2 text-fuchsia-400 opacity-60 animate-[floatParticle_2.6s_ease-in-out_infinite_1.3s]">
                        <Heart className="w-3.5 h-3.5 fill-fuchsia-400 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                    </div>

                    {/* Central Glowing Purple Twin Hearts */}
                    <div className="relative z-10 flex items-center justify-center animate-[purpleHeartbeat_1.8s_ease-in-out_infinite]">
                        <svg
                            viewBox="0 0 100 100"
                            className="w-24 h-24 sm:w-28 sm:h-28 overflow-visible"
                        >
                            <defs>
                                <linearGradient id="splashPurpleHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#c084fc" />
                                    <stop offset="50%" stopColor="#9333ea" />
                                    <stop offset="100%" stopColor="#6b21a8" />
                                </linearGradient>
                                <linearGradient id="splashCompanionHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                                <filter id="splashGlow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Companion Back Heart */}
                            <path
                                d="M35,28 C28,18 16,20 12,28 C6,38 12,52 35,70 C42,64 47,58 51,52 C45,46 38,36 35,28 Z"
                                fill="url(#splashCompanionHeart)"
                                opacity="0.8"
                                transform="rotate(-12 35 50)"
                            />

                            {/* Main Glowing Purple Heart */}
                            <path
                                d="M50,30 C42,15 22,17 18,32 C12,50 32,68 50,84 C68,68 88,50 82,32 C78,17 58,15 50,30 Z"
                                fill="url(#splashPurpleHeart)"
                                filter="url(#splashGlow)"
                            />

                            {/* Specular Highlight Arc */}
                            <path
                                d="M30,30 C32,22 42,21 46,26"
                                stroke="rgba(255,255,255,0.45)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                fill="none"
                            />

                            {/* Center AI Sparkle Star */}
                            <g transform="translate(44, 42) scale(0.6)">
                                <path
                                    d="M10,0 L12,7 L19,10 L12,13 L10,20 L8,13 L1,10 L8,7 Z"
                                    fill="#ffffff"
                                    className="animate-pulse"
                                />
                            </g>
                        </svg>
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

            {/* Purple Love Animation Keyframes */}
            <style jsx global>{`
                @keyframes purpleHeartbeat {
                    0% {
                        transform: scale(1);
                        filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.45));
                    }
                    14% {
                        transform: scale(1.16);
                        filter: drop-shadow(0 0 32px rgba(192, 132, 252, 0.85));
                    }
                    28% {
                        transform: scale(1.06);
                        filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.6));
                    }
                    42% {
                        transform: scale(1.24);
                        filter: drop-shadow(0 0 45px rgba(217, 70, 239, 0.95));
                    }
                    70%, 100% {
                        transform: scale(1);
                        filter: drop-shadow(0 0 16px rgba(168, 85, 247, 0.45));
                    }
                }

                @keyframes purpleRipple {
                    0% {
                        transform: scale(0.75);
                        opacity: 0.85;
                    }
                    50% {
                        opacity: 0.4;
                    }
                    100% {
                        transform: scale(2.2);
                        opacity: 0;
                    }
                }

                @keyframes floatParticle {
                    0%, 100% {
                        transform: translateY(0px) scale(0.9);
                        opacity: 0.5;
                    }
                    50% {
                        transform: translateY(-10px) scale(1.15);
                        opacity: 0.95;
                    }
                }
            `}</style>
        </div>
    );
}
