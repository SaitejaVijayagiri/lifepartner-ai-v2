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
                {/* Dynamic Purple Love Animation (No Static Picture or Box!) */}
                <div className="relative flex items-center justify-center w-32 h-32">
                    {/* Radiating Purple Love Ripples */}
                    <div className="absolute inset-2 rounded-full border border-purple-500/40 animate-[purpleRipple_2.4s_ease-out_infinite]" />
                    <div className="absolute inset-2 rounded-full border border-fuchsia-500/25 animate-[purpleRipple_2.4s_ease-out_infinite_0.8s]" />
                    <div className="absolute inset-2 rounded-full border border-violet-500/30 animate-[purpleRipple_2.4s_ease-out_infinite_1.6s]" />

                    {/* Ambient Purple Radial Glow */}
                    <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-600/30 via-fuchsia-600/20 to-violet-600/30 blur-2xl pointer-events-none animate-pulse" />

                    {/* Floating Micro-Hearts */}
                    <div className="absolute top-1 right-1 text-purple-400 opacity-75 animate-[floatParticle_2.6s_ease-in-out_infinite]">
                        <Heart className="w-3.5 h-3.5 fill-purple-400 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    </div>
                    <div className="absolute bottom-2 left-1 text-fuchsia-400 opacity-60 animate-[floatParticle_2.6s_ease-in-out_infinite_1.3s]">
                        <Heart className="w-3 h-3 fill-fuchsia-400 text-fuchsia-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                    </div>

                    {/* Central Glowing Purple Twin Hearts */}
                    <div className="relative z-10 flex items-center justify-center animate-[purpleHeartbeat_1.8s_ease-in-out_infinite]">
                        <svg
                            viewBox="0 0 100 100"
                            className="w-20 h-20 sm:w-24 sm:h-24 overflow-visible"
                        >
                            <defs>
                                <linearGradient id="loadingPurpleHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#c084fc" />
                                    <stop offset="50%" stopColor="#9333ea" />
                                    <stop offset="100%" stopColor="#6b21a8" />
                                </linearGradient>
                                <linearGradient id="loadingCompanionHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                                <filter id="loadingGlow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Companion Back Heart */}
                            <path
                                d="M35,28 C28,18 16,20 12,28 C6,38 12,52 35,70 C42,64 47,58 51,52 C45,46 38,36 35,28 Z"
                                fill="url(#loadingCompanionHeart)"
                                opacity="0.8"
                                transform="rotate(-12 35 50)"
                            />

                            {/* Main Glowing Purple Heart */}
                            <path
                                d="M50,30 C42,15 22,17 18,32 C12,50 32,68 50,84 C68,68 88,50 82,32 C78,17 58,15 50,30 Z"
                                fill="url(#loadingPurpleHeart)"
                                filter="url(#loadingGlow)"
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

                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
