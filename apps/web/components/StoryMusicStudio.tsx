'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, Play, Pause, Check, Volume2, Sparkles, X, Sliders, Loader2 } from 'lucide-react';

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

export const FALLBACK_CATALOG: Omit<StoryMusicData, 'startOffset'>[] = [
    {
        id: 'kesariya',
        title: 'Kesariya Sunset 💖',
        artist: 'Arijit & Pritam',
        mood: 'Romantic',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3',
        duration: 30
    },
    {
        id: 'lofi_chill',
        title: 'Midnight Lo-Fi ☕',
        artist: 'ChillHop Beats',
        mood: 'Chill',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        duration: 30
    },
    {
        id: 'desi_beats',
        title: 'Pasoori Desi Groove 🥁',
        artist: 'Coke Studio Desi',
        mood: 'Desi',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        duration: 30
    },
    {
        id: 'upbeat_pop',
        title: 'Levitating Summer Pop 🕺',
        artist: 'Summer Party Crew',
        mood: 'Upbeat',
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
        duration: 30
    },
    {
        id: 'golden_hour',
        title: 'Golden Hour Vibe 🌇',
        artist: 'Aesthetic Chill',
        mood: 'Aesthetic',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
        duration: 30
    }
];

export const MUSIC_CATALOG = FALLBACK_CATALOG;

const MOOD_CHIPS = [
    { name: '🔥 Trending', query: 'Top Hits Trending' },
    { name: '💖 Romantic', query: 'Arijit Singh Romantic Bollywood' },
    { name: '☕ Chill Lo-Fi', query: 'Lo-Fi Chill Beats' },
    { name: '🥁 Desi & Bollywood', query: 'Bollywood Movie Hits' },
    { name: '🕺 Pop Hits', query: 'Global Pop Hits' },
    { name: '🎸 Punjabi & Rap', query: 'Punjabi Hits Karan Aujla' },
    { name: '🌇 Aesthetic', query: 'Aesthetic Chill Synthwave' },
    { name: '🌧️ Sad & Slow', query: 'Slowed Reverbed Sad Songs' }
];

interface StoryMusicStudioProps {
    currentMusic?: StoryMusicData | null;
    onSelectMusic: (music: StoryMusicData | null) => void;
    onClose: () => void;
}

export default function StoryMusicStudio({ currentMusic, onSelectMusic, onClose }: StoryMusicStudioProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('🔥 Trending');
    const [onlineTracks, setOnlineTracks] = useState<Omit<StoryMusicData, 'startOffset'>[]>(FALLBACK_CATALOG);
    const [isSearching, setIsSearching] = useState(false);

    const [activeTrack, setActiveTrack] = useState<Omit<StoryMusicData, 'startOffset'> | null>(
        currentMusic ? {
            id: currentMusic.id,
            title: currentMusic.title,
            artist: currentMusic.artist,
            mood: currentMusic.mood,
            coverUrl: currentMusic.coverUrl,
            audioUrl: currentMusic.audioUrl,
            duration: currentMusic.duration || 30
        } : FALLBACK_CATALOG[0]
    );
    const [startOffset, setStartOffset] = useState<number>(currentMusic?.startOffset || 0);
    const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Live Music API Search (iTunes / Apple Music / Instagram Engine)
    const searchMusicAPI = async (term: string) => {
        if (!term.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=30`);
            const data = await res.json();
            if (data.results && Array.isArray(data.results)) {
                const mappedTracks: Omit<StoryMusicData, 'startOffset'>[] = data.results
                    .filter((r: any) => r.previewUrl)
                    .map((r: any) => ({
                        id: `track_${r.trackId}`,
                        title: r.trackName,
                        artist: r.artistName,
                        mood: r.primaryGenreName || 'Trending',
                        coverUrl: r.artworkUrl100?.replace('100x100bb', '300x300bb') || r.artworkUrl100,
                        audioUrl: r.previewUrl,
                        duration: Math.min(30, Math.floor((r.trackTimeMillis || 30000) / 1000))
                    }));

                if (mappedTracks.length > 0) {
                    setOnlineTracks(mappedTracks);
                }
            }
        } catch (err) {
            console.warn('[MusicStudio] Music API search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Load initial trending music
    useEffect(() => {
        searchMusicAPI('Top Hits Trending 2026');
    }, []);

    // Debounced search query handler
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (searchQuery.trim().length > 1) {
            searchTimeoutRef.current = setTimeout(() => {
                searchMusicAPI(searchQuery);
            }, 300);
        }
    }, [searchQuery]);

    // Mood Chip click handler
    const handleSelectMood = (moodName: string, query: string) => {
        setSelectedMood(moodName);
        setSearchQuery('');
        searchMusicAPI(query);
    };

    // Handle track selection for segment trimming
    const handlePickTrack = (track: Omit<StoryMusicData, 'startOffset'>) => {
        setActiveTrack(track);
        setStartOffset(0);
        playPreviewSegment(track.audioUrl, 0);
    };

    // Play 15s audio preview starting from startOffset
    const playPreviewSegment = (audioUrl: string, startSec: number) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.currentTime = startSec;
        audio.volume = 0.7;
        audio.play().then(() => {
            setIsPlayingPreview(true);
        }).catch(err => console.log('Audio play error:', err));

        // Loop segment preview
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
        <div className="fixed inset-0 z-[3500] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full sm:max-w-md bg-slate-950 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-md">
                            <Music className="w-4 h-4 fill-white" />
                        </span>
                        <div>
                            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                                <span>Spotify & Instagram Music</span>
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            </h3>
                            <p className="text-[10px] text-slate-400">Search millions of songs & customize segment</p>
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
                        placeholder="Search any song, artist, movie or track..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    {isSearching && (
                        <Loader2 className="w-4 h-4 text-pink-400 animate-spin absolute right-3 top-2.5" />
                    )}
                </div>

                {/* Mood & Genre Chips */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-3">
                    {MOOD_CHIPS.map(chip => (
                        <button
                            key={chip.name}
                            onClick={() => handleSelectMood(chip.name, chip.query)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedMood === chip.name
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {chip.name}
                        </button>
                    ))}
                </div>

                {/* Track Results List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-1 max-h-[32vh]">
                    {isSearching && onlineTracks.length === 0 ? (
                        <div className="py-12 text-center text-xs text-pink-400 flex flex-col items-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Searching millions of tracks...</span>
                        </div>
                    ) : onlineTracks.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No matching songs found. Try searching another artist or title!
                        </div>
                    ) : (
                        onlineTracks.map(track => {
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
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 ${
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
                        })
                    )}
                </div>

                {/* Selected Track Audio Segment Customizer / Scrubber */}
                {activeTrack && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-pink-500/30 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Sliders className="w-4 h-4 text-pink-400" />
                                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                                    Scrub 15s Segment: {activeTrack.title}
                                </span>
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
                                max={Math.max(0, (activeTrack.duration || 30) - 15)}
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
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                    >
                        <Check className="w-4 h-4" />
                        <span>Apply Custom Song to Story</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
