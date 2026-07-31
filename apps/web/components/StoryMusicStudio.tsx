'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Search, Play, Pause, Check, Volume2, Sparkles, X, Sliders, Loader2, Bookmark, Heart, Radio, Disc, Repeat } from 'lucide-react';

export interface StoryMusicData {
    id: string;
    title: string;
    artist: string;
    mood: string;
    coverUrl: string;
    audioUrl: string;
    duration: number;
    startOffset: number; // Selected start time in seconds
    isFullSong?: boolean; // Whether user wants full song playback
    showLyrics?: boolean; // Whether to display live scrolling lyrics
    lyricsLang?: string; // Language code e.g. hindi, telugu, tamil, punjabi, english_hinglish
}

export const FALLBACK_CATALOG: Omit<StoryMusicData, 'startOffset'>[] = [
    {
        id: 'kesariya',
        title: 'Kesariya Sunset 💖',
        artist: 'Arijit & Pritam',
        mood: 'Romantic',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3',
        duration: 180
    },
    {
        id: 'lofi_chill',
        title: 'Midnight Lo-Fi ☕',
        artist: 'ChillHop Beats',
        mood: 'Chill',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        duration: 210
    },
    {
        id: 'desi_beats',
        title: 'Pasoori Desi Groove 🥁',
        artist: 'Coke Studio Desi',
        mood: 'Desi',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        duration: 240
    },
    {
        id: 'upbeat_pop',
        title: 'Levitating Summer Pop 🕺',
        artist: 'Summer Party Crew',
        mood: 'Upbeat',
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
        duration: 195
    },
    {
        id: 'golden_hour',
        title: 'Golden Hour Vibe 🌇',
        artist: 'Aesthetic Chill',
        mood: 'Aesthetic',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
        duration: 220
    }
];

export const MUSIC_CATALOG = FALLBACK_CATALOG;

const MOOD_CHIPS = [
    { name: '🔖 Saved Songs', query: 'SAVED' },
    { name: '🔥 Trending', query: 'Top Hits Trending 2026' },
    { name: '💖 Romantic', query: 'Arijit Singh Romantic Bollywood' },
    { name: '☕ Chill Lo-Fi', query: 'Lo-Fi Chill Beats' },
    { name: '🥁 Desi & Bollywood', query: 'Bollywood Hits' },
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
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('🔥 Trending');
    const [onlineTracks, setOnlineTracks] = useState<Omit<StoryMusicData, 'startOffset'>[]>(FALLBACK_CATALOG);
    const [savedMusicList, setSavedMusicList] = useState<Omit<StoryMusicData, 'startOffset'>[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFullSongMode, setIsFullSongMode] = useState<boolean>(currentMusic?.isFullSong ?? true);
    const [showLyrics, setShowLyrics] = useState<boolean>(currentMusic?.showLyrics ?? false);

    const [activeTrack, setActiveTrack] = useState<Omit<StoryMusicData, 'startOffset'> | null>(
        currentMusic ? {
            id: currentMusic.id,
            title: currentMusic.title,
            artist: currentMusic.artist,
            mood: currentMusic.mood,
            coverUrl: currentMusic.coverUrl,
            audioUrl: currentMusic.audioUrl,
            duration: currentMusic.duration || 180
        } : FALLBACK_CATALOG[0]
    );
    const [startOffset, setStartOffset] = useState<number>(currentMusic?.startOffset || 0);
    const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Portal & Saved Songs from localStorage
    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem('lifepartner_saved_music');
            if (saved) {
                setSavedMusicList(JSON.parse(saved));
            }
        } catch (e) {}
    }, []);

    // Toggle Bookmark / Save Song to Playlist
    const toggleSaveSong = (track: Omit<StoryMusicData, 'startOffset'>) => {
        setSavedMusicList(prev => {
            const exists = prev.some(t => t.id === track.id);
            let updated: Omit<StoryMusicData, 'startOffset'>[];
            if (exists) {
                updated = prev.filter(t => t.id !== track.id);
            } else {
                updated = [track, ...prev];
            }
            try {
                localStorage.setItem('lifepartner_saved_music', JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

    // Live Music API Search (iTunes / Spotify Engine)
    const searchMusicAPI = async (term: string) => {
        if (!term.trim() || term === 'SAVED') return;
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
                        coverUrl: r.artworkUrl100?.replace('100x100bb', '500x500bb') || r.artworkUrl100,
                        audioUrl: r.previewUrl,
                        duration: Math.max(30, Math.floor((r.trackTimeMillis || 180000) / 1000))
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
        if (query === 'SAVED') {
            setOnlineTracks(savedMusicList);
        } else {
            searchMusicAPI(query);
        }
    };

    // Handle track selection
    const handlePickTrack = (track: Omit<StoryMusicData, 'startOffset'>) => {
        setActiveTrack(track);
        setStartOffset(0);
        playPreviewSegment(track.audioUrl, 0, isFullSongMode);
    };

    // Play Audio Preview starting from startOffset
    const playPreviewSegment = (audioUrl: string, startSec: number, fullSong: boolean) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.currentTime = startSec;
        audio.volume = 0.8;
        audio.loop = true;
        audio.play().then(() => {
            setIsPlayingPreview(true);
        }).catch(err => console.log('Audio play error:', err));

        // If not full song mode, loop 15-second snippet
        if (!fullSong) {
            audio.ontimeupdate = () => {
                if (audio.currentTime >= startSec + 15) {
                    audio.currentTime = startSec;
                }
            };
        } else {
            audio.ontimeupdate = null;
        }
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
            playPreviewSegment(activeTrack.audioUrl, startOffset, isFullSongMode);
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
                startOffset: startOffset,
                isFullSong: isFullSongMode,
                showLyrics: showLyrics
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

    const currentDisplayTracks = selectedMood === '🔖 Saved Songs' ? savedMusicList : onlineTracks;

    const modalMarkup = (
        <div className="fixed inset-0 z-[999999] w-screen h-screen w-full h-full min-h-[100vh] bg-slate-950 flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
                <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg">
                        <Music className="w-5 h-5 fill-white" />
                    </span>
                    <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                            <span>Spotify & Instagram Music Studio</span>
                            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </h3>
                        <p className="text-xs text-slate-400">Search millions of songs, save playlists & scrub full track</p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 bg-slate-950 pb-2">
                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        placeholder="Search any song, artist, movie or track..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    {isSearching && (
                        <Loader2 className="w-5 h-5 text-pink-400 animate-spin absolute right-3.5 top-2.5" />
                    )}
                </div>

                {/* Mood & Playlist Category Chips */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-3 pb-1">
                    {MOOD_CHIPS.map(chip => (
                        <button
                            key={chip.name}
                            onClick={() => handleSelectMood(chip.name, chip.query)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                                selectedMood === chip.name
                                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg scale-105'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            <span>{chip.name}</span>
                            {chip.name === '🔖 Saved Songs' && savedMusicList.length > 0 && (
                                <span className="bg-pink-500/30 text-pink-300 text-[10px] px-1.5 py-0.5 rounded-full">
                                    {savedMusicList.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Song Catalog List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-2.5">
                {isSearching && currentDisplayTracks.length === 0 ? (
                    <div className="py-20 text-center text-sm text-pink-400 flex flex-col items-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Searching millions of tracks across Spotify & Apple Music...</span>
                    </div>
                ) : currentDisplayTracks.length === 0 ? (
                    <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center space-y-2">
                        <Disc className="w-10 h-10 text-slate-600" />
                        <span>{selectedMood === '🔖 Saved Songs' ? 'No saved songs yet! Click ❤️ on any song to save it to your playlist.' : 'No matching songs found.'}</span>
                    </div>
                ) : (
                    currentDisplayTracks.map(track => {
                        const isSelected = activeTrack?.id === track.id;
                        const isSaved = savedMusicList.some(t => t.id === track.id);

                        return (
                            <div
                                key={track.id}
                                onClick={() => handlePickTrack(track)}
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-slate-900 to-slate-900/90 border-2 border-pink-500 shadow-xl'
                                        : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80'
                                }`}
                            >
                                <div className="flex items-center space-x-3.5 min-w-0">
                                    <img
                                        src={track.coverUrl}
                                        alt={track.title}
                                        className="w-14 h-14 rounded-2xl object-cover shadow-md bg-slate-800 flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                                        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-pink-400 font-medium">
                                                {track.mood}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {formatTime(track.duration)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {/* Bookmark / Heart Save Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSaveSong(track);
                                        }}
                                        className={`p-2 rounded-full transition-all ${
                                            isSaved
                                                ? 'text-pink-500 bg-pink-500/10'
                                                : 'text-slate-500 hover:text-slate-300 bg-slate-800/50'
                                        }`}
                                        title={isSaved ? 'Remove from Saved' : 'Save to Playlist'}
                                    >
                                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-pink-500' : ''}`} />
                                    </button>

                                    {/* Play / Pause Toggle Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSelected) {
                                                handleTogglePlay();
                                            } else {
                                                handlePickTrack(track);
                                            }
                                        }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                                                : 'bg-slate-800 text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {isSelected && isPlayingPreview ? (
                                            <Pause className="w-5 h-5 fill-white" />
                                        ) : (
                                            <Play className="w-5 h-5 fill-white ml-0.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Selected Track Customizer & Scrubber Panel */}
            {activeTrack && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                            <Sliders className="w-5 h-5 text-pink-400" />
                            <div>
                                <h5 className="text-xs font-bold text-white truncate max-w-[220px]">
                                    {activeTrack.title}
                                </h5>
                                <p className="text-[10px] text-slate-400">{activeTrack.artist}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Live Lyrics Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowLyrics(prev => !prev)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                                    showLyrics
                                        ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 shadow-md font-black'
                                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                }`}
                                title="Toggle live scrolling lyrics display"
                            >
                                <span>📜 Lyrics: {showLyrics ? 'ON ✨' : 'OFF'}</span>
                            </button>

                            {/* Full Song vs 15s Snippet Mode Toggle */}
                            <button
                                type="button"
                                onClick={() => {
                                    const nextMode = !isFullSongMode;
                                    setIsFullSongMode(nextMode);
                                    if (audioRef.current && activeTrack) {
                                        playPreviewSegment(activeTrack.audioUrl, startOffset, nextMode);
                                    }
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                                    isFullSongMode
                                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                                        : 'bg-slate-800 text-pink-300 border border-pink-500/30'
                                }`}
                            >
                                <Repeat className="w-3.5 h-3.5" />
                                <span>{isFullSongMode ? '🎵 Full' : '✂️ 15s'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Scrubber Slider across Full Track */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>Start: {formatTime(startOffset)}</span>
                            <span className="text-pink-400 font-bold">
                                {isFullSongMode ? 'Continuous Full Track' : '15s Snippet'}
                            </span>
                            <span>Track End: {formatTime(activeTrack.duration || 180)}</span>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={Math.max(0, (activeTrack.duration || 180) - (isFullSongMode ? 1 : 15))}
                            step={1}
                            value={startOffset}
                            onChange={e => handleScrubChange(parseFloat(e.target.value))}
                            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>

                    {/* Precision Manual Start & End Time Inputs */}
                    <div className="flex items-center space-x-3 pt-1">
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold">Start Sec:</span>
                            <input
                                type="number"
                                min={0}
                                max={Math.max(0, (activeTrack.duration || 180) - 1)}
                                value={Math.floor(startOffset)}
                                onChange={e => handleScrubChange(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white text-right font-mono focus:outline-none focus:border-pink-500"
                            />
                        </div>

                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold">Mode:</span>
                            <span className="text-xs text-pink-400 font-bold font-mono">
                                {isFullSongMode ? 'Full Track' : '15 Sec'}
                            </span>
                        </div>
                    </div>

                    {/* Apply Actions */}
                    <div className="flex items-center space-x-3 pt-1">
                        {currentMusic && (
                            <button
                                onClick={handleRemoveSong}
                                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold transition-colors border border-slate-700"
                            >
                                Remove Music
                            </button>
                        )}

                        <button
                            onClick={handleApplySong}
                            disabled={!activeTrack}
                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white font-bold text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <Check className="w-5 h-5" />
                            <span>Add Song to Story</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (mounted && typeof document !== 'undefined') {
        return createPortal(modalMarkup, document.body);
    }

    return modalMarkup;
}
