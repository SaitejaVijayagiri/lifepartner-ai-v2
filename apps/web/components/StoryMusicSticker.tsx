'use client';

import React from 'react';
import { Music } from 'lucide-react';
import { StoryMusicData } from './StoryMusicStudio';

interface StoryMusicStickerProps {
    music: StoryMusicData | any;
    isPlaying?: boolean;
}

export default function StoryMusicSticker({ music, isPlaying = true }: StoryMusicStickerProps) {
    if (!music) return null;

    const title = music.title || music.name || 'Custom Song';
    const artist = music.artist || 'Story Music';
    const coverUrl = music.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80';

    return (
        <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl text-white select-none animate-in fade-in zoom-in-95 duration-200">
            {/* Album Cover */}
            <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/30">
                <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Song Title & Artist */}
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                    {title}
                </span>
                <span className="text-[9px] font-medium text-white/70 leading-tight truncate max-w-[140px]">
                    {artist}
                </span>
            </div>

            {/* Animated Equalizer Sound Bars */}
            <div className="flex items-end space-x-0.5 h-3.5 pl-1">
                <span className={`w-0.5 bg-pink-400 rounded-full transition-all ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1.5'}`} style={{ animationDuration: '0.6s' }} />
                <span className={`w-0.5 bg-rose-400 rounded-full transition-all ${isPlaying ? 'h-2.5 animate-bounce' : 'h-2'}`} style={{ animationDuration: '0.4s' }} />
                <span className={`w-0.5 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} style={{ animationDuration: '0.7s' }} />
            </div>
        </div>
    );
}
