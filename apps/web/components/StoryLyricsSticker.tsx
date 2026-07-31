'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Music } from 'lucide-react';

export interface LyricLine {
    time: number; // in seconds
    text: string;
}

// Built-in Timestamped Lyrics Catalog for Popular Songs
export const SONG_LYRICS_CATALOG: Record<string, LyricLine[]> = {
    'kesariya': [
        { time: 0, text: "Mujhko kitna pyar hai tumse..." },
        { time: 3, text: "Kesariya tera ishq hai piya 💖" },
        { time: 7, text: "Rang jaaun jo main haath lagaun ✨" },
        { time: 11, text: "Din beete saara teri fikr mein 🌅" },
        { time: 15, text: "Rain saari teri khair manaun 🌙" },
        { time: 19, text: "Kesariya tera ishq hai piya..." },
        { time: 24, text: "Har dua mein maine tujhe maanga hai 🙏" },
        { time: 28, text: "Tu hi mera chain, tu hi meri raahat 💫" }
    ],
    'lofi_chill': [
        { time: 0, text: "Late night coffee & quiet thoughts ☕" },
        { time: 4, text: "Watching the stars shine bright ✨" },
        { time: 8, text: "Soft lofi beats in the background 🎧" },
        { time: 12, text: "Thinking about you all night long 💭" },
        { time: 16, text: "Peaceful moments, quiet soul 🌊" },
        { time: 20, text: "Forever in this sweet rhythm 🎶" }
    ],
    'upbeat_pop': [
        { time: 0, text: "I'm levitating in the air tonight 🕺" },
        { time: 4, text: "Feel the rhythm, feel the light ⚡" },
        { time: 8, text: "Dance like nobody's watching us 💃" },
        { time: 12, text: "Summer vibes and golden skies ☀️" },
        { time: 16, text: "Never gonna stop this feeling 🔥" }
    ],
    'golden_hour': [
        { time: 0, text: "It's your golden hour 🌇" },
        { time: 4, text: "You slow down time in a world that rushes by ⏳" },
        { time: 9, text: "I fall in love every single time 💖" },
        { time: 14, text: "Shining bright under the sunset glow ✨" },
        { time: 19, text: "Forever mine, forever yours... 🌹" }
    ]
};

// Generic Fallback Generator for any custom track
export function getFallbackLyrics(title: string): LyricLine[] {
    const cleanTitle = title.replace(/[^\w\s]/gi, '').trim() || "Love & Music";
    return [
        { time: 0, text: `🎵 ${cleanTitle}` },
        { time: 3, text: "Feel the music in your heartbeat 💖" },
        { time: 7, text: "Moments made forever special ✨" },
        { time: 11, text: "Singing along with every wave 🌊" },
        { time: 15, text: "Life & Love in harmony 💫" },
        { time: 19, text: `Listening to ${cleanTitle}... 🎧` },
        { time: 23, text: "Unforgettable memories made together 🌹" }
    ];
}

interface StoryLyricsStickerProps {
    songId?: string;
    songTitle?: string;
    currentTime?: number; // Current audio playback time in seconds
    styleType?: 'karaoke' | 'card' | 'neon';
}

export default function StoryLyricsSticker({
    songId = '',
    songTitle = 'Music Vibe',
    currentTime = 0,
    styleType = 'karaoke'
}: StoryLyricsStickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Fetch lines for this song or use generic generator
    const lines: LyricLine[] = SONG_LYRICS_CATALOG[songId] || getFallbackLyrics(songTitle);

    // Determine current active index
    const activeIndex = lines.reduce((prevIdx, line, idx) => {
        if (currentTime >= line.time) return idx;
        return prevIdx;
    }, 0);

    // Auto-scroll active line to center smoothly
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeIndex]);

    return (
        <div className="w-full max-w-sm mx-auto select-none pointer-events-none px-2">
            {/* Live Lyrics Scrolling Container with Glassmorphism Card */}
            <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/20 p-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                    <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles size={11} className="animate-spin" />
                        Live Synchronized Lyrics
                    </span>
                    <span className="text-[9px] font-bold text-white/70 truncate max-w-[130px]">
                        {songTitle}
                    </span>
                </div>

                <div
                    ref={containerRef}
                    className="max-h-28 overflow-y-auto no-scrollbar py-1 text-center flex flex-col items-center space-y-2 transition-all duration-300"
                >
                    {lines.map((line, idx) => {
                        const isActive = idx === activeIndex;
                        const isPast = idx < activeIndex;

                        return (
                            <div
                                key={idx}
                                ref={isActive ? activeLineRef : null}
                                className={`transition-all duration-300 transform ${
                                    isActive
                                        ? 'scale-105 opacity-100'
                                        : isPast
                                        ? 'scale-95 text-white/40 opacity-40 font-medium'
                                        : 'scale-95 text-white/60 opacity-60 font-medium'
                                }`}
                            >
                                <span
                                    className={`inline-block px-3 py-1 rounded-xl text-xs sm:text-sm leading-snug transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-amber-400 via-rose-300 to-pink-400 text-slate-950 font-black shadow-lg scale-105'
                                            : 'text-white/80 font-semibold'
                                    }`}
                                >
                                    {line.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
