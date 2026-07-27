'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, Play, Pause, Check, Volume2, Sparkles, X, Sliders } from 'lucide-react';

export interface StoryMusicData {
    id: string;
    title: string;
    artist: string;
    mood: string;
    coverUrl: string;
    audioUrl: string;
    duration: number;
    startOffset: number; // Selected start time in seconds
}

export const MUSIC_CATALOG: Omit<StoryMusicData, 'startOffset'>[] = [
    {
        id: 'kesariya',
        title: 'Kesariya Sunset 💖',
        artist: 'Arijit & Pritam',
        mood: 'Romantic',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3',
        duration: 180
    },
    {
        id: 'lofi_chill',
        title: 'Midnight Lo-Fi ☕',
        artist: 'ChillHop Beats',
        mood: 'Chill',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        duration: 210
    },
    {
        id: 'desi_beats',
        title: 'Pasoori Desi Groove 🥁',
        artist: 'Coke Studio Desi',
        mood: 'Desi',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        duration: 240
    },
    {
        id: 'upbeat_pop',
        title: 'Levitating Summer Pop 🕺',
        artist: 'Summer Party Crew',
        mood: 'Upbeat',
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
        duration: 195
    },
    {
        id: 'golden_hour',
        title: 'Golden Hour Vibe 🌇',
        artist: 'Aesthetic Chill',
        mood: 'Aesthetic',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
        duration: 200
    },
    {
        id: 'acoustic_love',
        title: 'Soft Acoustic Guitar 🎸',
        artist: 'Folk Harmony',
        mood: 'Romantic',
        coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3',
        duration: 165
    },
    {
        id: 'synthwave_party',
        title: 'Club Synthwave 🔥',
        artist: 'Retro Beats',
        mood: 'Party',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        duration: 220
    },
    {
        id: 'sad_piano',
        title: 'Rainy Memories 🌧️',
        artist: 'Melancholy Strings',
        mood: 'Sad',
        coverUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_9bc6b3a0cc.mp3',
        duration: 190
    },
    {
        id: 'midnight_jazz',
        title: 'Midnight Jazz Drive 🎷',
        artist: 'Velvet Lounge',
        mood: 'Chill',
        coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: 210
    }
];

const MOODS = ['All', 'Romantic', 'Chill', 'Desi', 'Upbeat', 'Party', 'Aesthetic', 'Sad'];

interface StoryMusicStudioProps {
    currentMusic?: StoryMusicData | null;
    onSelectMusic: (music: StoryMusicData | null) => void;
    onClose: () => void;
}

export default function StoryMusicStudio({ currentMusic, onSelectMusic, onClose }: StoryMusicStudioProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('All');
    const [activeTrack, setActiveTrack] = useState<Omit<StoryMusicData, 'startOffset'> | null>(
        currentMusic ? MUSIC_CATALOG.find(m => m.id === currentMusic.id) || MUSIC_CATALOG[0] : null
    );
    const [startOffset, setStartOffset] = useState<number>(currentMusic?.startOffset || 15);
    const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Filter tracks by mood and search query
    const filteredTracks = MUSIC_CATALOG.filter(track => {
        const matchesMood = selectedMood === 'All' || track.mood === selectedMood;
        const matchesSearch =
            track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.mood.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMood && matchesSearch;
    });

    // Handle track selection for segment trimming
    const handlePickTrack = (track: Omit<StoryMusicData, 'startOffset'>) => {
        setActiveTrack(track);
        setStartOffset(15);
        playPreviewSegment(track.audioUrl, 15);
    };

    // Play 15s audio preview starting from startOffset
    const playPreviewSegment = (audioUrl: string, startSec: number) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.currentTime = startSec;
        audio.volume = 0.6;
        audio.play().then(() => {
            setIsPlayingPreview(true);
        }).catch(err => console.log('Audio play error:', err));

        // Stop preview after 15 seconds segment
        audio.ontimeupdate = () => {
            if (audio.currentTime >= startSec + 15) {
                audio.currentTime = startSec;
            }
        };
    };

    const handleScrubChange = (newOffset: number) => {
        setStartOffset(newOffset);
        if (audioRef.current && activeTrack) {
            audioRef.current.currentTime = newOffset;
            if (audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
                setIsPlayingPreview(true);
            }
        }
    };

    const handleTogglePlay = () => {
        if (!audioRef.current && activeTrack) {
            playPreviewSegment(activeTrack.audioUrl, startOffset);
            return;
        }

        if (audioRef.current) {
            if (isPlayingPreview) {
                audioRef.current.pause();
                setIsPlayingPreview(false);
            } else {
                audioRef.current.play().catch(() => {});
                setIsPlayingPreview(true);
            }
        }
    };

    const handleApplySong = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }

        if (!activeTrack) {
            onSelectMusic(null);
        } else {
            onSelectMusic({
                ...activeTrack,
                startOffset: startOffset
            });
        }
        onClose();
    };

    const handleRemoveSong = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onSelectMusic(null);
        onClose();
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[3500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full sm:max-w-md bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md">
                            <Music className="w-4 h-4 fill-white" />
                        </span>
                        <div>
                            <h3 className="font-bold text-sm text-white">Music Studio</h3>
                            <p className="text-[10px] text-slate-400">Pick any song & customize segment</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mt-3 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Search song, artist or mood..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                </div>

                {/* Mood Chips */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-3">
                    {MOODS.map(mood => (
                        <button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedMood === mood
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {mood}
                        </button>
                    ))}
                </div>

                {/* Song List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-1 max-h-[30vh]">
                    {filteredTracks.map(track => {
                        const isSelected = activeTrack?.id === track.id;

                        return (
                            <div
                                key={track.id}
                                onClick={() => handlePickTrack(track)}
                                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                                    isSelected
                                        ? 'bg-slate-900 border border-pink-500/50 shadow-md'
                                        : 'bg-slate-900/50 hover:bg-slate-900 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center space-x-3 min-w-0">
                                    <img
                                        src={track.coverUrl}
                                        alt={track.title}
                                        className="w-11 h-11 rounded-xl object-cover shadow-sm bg-slate-800 flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-xs text-white truncate">{track.title}</h4>
                                        <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                                        <span className="inline-block mt-0.5 text-[9px] px-2 py-0.5 rounded-md bg-slate-800 text-pink-400 font-medium">
                                            {track.mood}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSelected) {
                                            handleTogglePlay();
                                        } else {
                                            handlePickTrack(track);
                                        }
                                    }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                                        isSelected
                                            ? 'bg-pink-500 text-white shadow-md'
                                            : 'bg-slate-800 text-slate-300 hover:text-white'
                                    }`}
                                >
                                    {isSelected && isPlayingPreview ? (
                                        <Pause className="w-4 h-4 fill-white" />
                                    ) : (
                                        <Play className="w-4 h-4 fill-white ml-0.5" />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Track Audio Segment Customizer / Scrubber */}
                {activeTrack && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/30 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Sliders className="w-4 h-4 text-pink-400" />
                                <span className="text-xs font-bold text-white">Customize 15s Story Audio Segment</span>
                            </div>

                            {/* Animated Equalizer */}
                            <div className="flex items-center space-x-1 h-3">
                                <span className={`w-0.5 bg-pink-500 rounded-full ${isPlayingPreview ? 'h-3 animate-pulse' : 'h-1'}`} />
                                <span className={`w-0.5 bg-pink-400 rounded-full ${isPlayingPreview ? 'h-4 animate-bounce' : 'h-1.5'}`} />
                                <span className={`w-0.5 bg-rose-500 rounded-full ${isPlayingPreview ? 'h-2 animate-pulse' : 'h-1'}`} />
                            </div>
                        </div>

                        {/* Instagram Style Scrubber Range Slider */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                <span>Start: {formatTime(startOffset)}</span>
                                <span className="text-pink-400">Selected: 15s Snippet</span>
                                <span>End: {formatTime(startOffset + 15)}</span>
                            </div>

                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, activeTrack.duration - 15)}
                                step={1}
                                value={startOffset}
                                onChange={e => handleScrubChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>
                    </div>
                )}

                {/* Footer Action Buttons */}
                <div className="mt-4 flex items-center space-x-2">
                    {currentMusic && (
                        <button
                            onClick={handleRemoveSong}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs font-semibold transition-colors border border-slate-800"
                        >
                            Remove Music
                        </button>
                    )}

                    <button
                        onClick={handleApplySong}
                        disabled={!activeTrack}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                    >
                        <Check className="w-4 h-4" />
                        <span>Apply Custom Song to Story</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
