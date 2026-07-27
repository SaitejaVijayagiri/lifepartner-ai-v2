'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Tv, Search, Play, Pause, X, Sparkles, Volume2, VolumeX, Send, Loader2, Disc, Heart, Repeat, Share2 } from 'lucide-react';
import { StoryMusicData } from './StoryMusicStudio';

interface ChatMusicJukeboxProps {
    onClose: () => void;
    onShareTrackToChat?: (track: { title: string; artist: string; coverUrl: string; audioUrl: string; videoUrl?: string }) => void;
}

const JUKEBOX_MOODS = [
    { name: '🔥 Top Hits', query: 'Top Chart Hits 2026' },
    { name: '💖 Romantic Vibe', query: 'Romantic Love Songs Arijit' },
    { name: '☕ Chill Lo-Fi', query: 'Lo-Fi Chill Beats' },
    { name: '🥁 Desi Hits', query: 'Bollywood Desi Dance Hits' },
    { name: '🕺 Party Groove', query: 'Global Dance Party Hits' },
    { name: '🎸 Punjabi & Rap', query: 'Punjabi Hits Karan Aujla' }
];

// Fallback Video Stream Providers for 100% uptime
const PIPED_APIS = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.video',
    'https://pipedapi.mha.fi',
    'https://pipedapi.privacy.com.de'
];

export default function ChatMusicJukebox({ onClose, onShareTrackToChat }: ChatMusicJukeboxProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('🔥 Top Hits');
    const [tracks, setTracks] = useState<Omit<StoryMusicData, 'startOffset'>[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [activeTrack, setActiveTrack] = useState<Omit<StoryMusicData, 'startOffset'> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [isMuted, setIsMuted] = useState(false);

    // Native Video Player State
    const [videoId, setVideoId] = useState<string | null>(null);
    const [directVideoUrl, setDirectVideoUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        searchMusicAPI('Top Chart Hits 2026');
    }, []);

    const searchMusicAPI = async (term: string) => {
        if (!term.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=30`);
            const data = await res.json();
            if (data.results && Array.isArray(data.results)) {
                const mapped: Omit<StoryMusicData, 'startOffset'>[] = data.results
                    .filter((r: any) => r.previewUrl)
                    .map((r: any) => ({
                        id: `juke_${r.trackId}`,
                        title: r.trackName,
                        artist: r.artistName,
                        mood: r.primaryGenreName || 'Trending',
                        coverUrl: r.artworkUrl100?.replace('100x100bb', '600x600bb') || r.artworkUrl100,
                        audioUrl: r.previewUrl,
                        duration: Math.max(30, Math.floor((r.trackTimeMillis || 180000) / 1000))
                    }));

                if (mapped.length > 0) {
                    setTracks(mapped);
                    if (!activeTrack) {
                        setActiveTrack(mapped[0]);
                        resolveVideoForTrack(mapped[0].artist, mapped[0].title);
                    }
                }
            }
        } catch (e) {
            console.warn('[Jukebox] Search error:', e);
        } finally {
            setIsSearching(false);
        }
    };

    // Multi-provider YouTube / MP4 Video Stream Resolver
    const resolveVideoForTrack = async (artist: string, title: string) => {
        setIsVideoLoading(true);
        setVideoId(null);
        setDirectVideoUrl(null);

        const query = `${artist} ${title} official music video`;

        // Attempt Piped API instances first for direct MP4 video streams
        for (const baseUrl of PIPED_APIS) {
            try {
                const searchRes = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}&filter=videos`, {
                    signal: AbortSignal.timeout(3000)
                });
                const searchData = await searchRes.json();
                if (searchData.items && Array.isArray(searchData.items) && searchData.items.length > 0) {
                    const item = searchData.items[0];
                    const urlParts = item.url ? item.url.split('v=') : [];
                    const vId = urlParts[1] || item.url?.replace('/watch?v=', '');

                    if (vId) {
                        setVideoId(vId);

                        // Try to get direct MP4 stream
                        try {
                            const streamRes = await fetch(`${baseUrl}/streams/${vId}`, {
                                signal: AbortSignal.timeout(3000)
                            });
                            const streamData = await streamRes.json();
                            if (streamData.videoStreams && Array.isArray(streamData.videoStreams)) {
                                const mp4 = streamData.videoStreams.find((s: any) => s.mimeType?.includes('mp4') || s.quality === '720p' || s.quality === '360p');
                                if (mp4?.url) {
                                    setDirectVideoUrl(mp4.url);
                                    setIsVideoLoading(false);
                                    return;
                                }
                            }
                        } catch (e) {}

                        setIsVideoLoading(false);
                        return;
                    }
                }
            } catch (e) {
                // Continue to next provider on failure
            }
        }

        // Secondary Invidious Fallback
        try {
            const res = await fetch(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
                signal: AbortSignal.timeout(3000)
            });
            const data = await res.json();
            if (Array.isArray(data) && data[0]?.videoId) {
                setVideoId(data[0].videoId);
            }
        } catch (e) {}

        setIsVideoLoading(false);
    };

    // Debounced search query handler for both Audio & Video
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (searchQuery.trim().length > 1) {
            searchTimeoutRef.current = setTimeout(() => {
                searchMusicAPI(searchQuery);
            }, 300);
        }
    }, [searchQuery]);

    const handleSelectMood = (moodName: string, query: string) => {
        setSelectedMood(moodName);
        setSearchQuery('');
        searchMusicAPI(query);
    };

    const handlePlayTrack = (track: Omit<StoryMusicData, 'startOffset'>) => {
        setActiveTrack(track);
        resolveVideoForTrack(track.artist, track.title);

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(track.audioUrl);
        audioRef.current = audio;
        audio.volume = isMuted ? 0 : 0.8;
        audio.loop = true;

        audio.onloadedmetadata = () => {
            setDuration(audio.duration || 30);
        };

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.play().then(() => {
            setIsPlaying(true);
        }).catch(() => setIsPlaying(false));
    };

    const handleTogglePlay = () => {
        if (!audioRef.current && activeTrack) {
            handlePlayTrack(activeTrack);
            return;
        }

        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().catch(() => {});
                setIsPlaying(true);
            }
        }
    };

    const handleSeek = (newTime: number) => {
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const handleToggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (audioRef.current) {
            audioRef.current.volume = nextMuted ? 0 : 0.8;
        }
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const modalMarkup = (
        <div className="fixed inset-0 z-[999999] w-screen h-screen w-full h-full min-h-[100vh] bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg">
                        {activeTab === 'audio' ? <Music className="w-5 h-5 fill-white" /> : <Tv className="w-5 h-5" />}
                    </span>
                    <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                            <span>Chat Vibe Music & Video Player</span>
                            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </h3>
                        <p className="text-xs text-slate-400">Play full audio songs & watch music videos directly in chat</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        if (audioRef.current) audioRef.current.pause();
                        onClose();
                    }}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="flex items-center justify-center p-3 bg-slate-950 border-b border-slate-900 gap-3">
                <button
                    onClick={() => setActiveTab('audio')}
                    className={`flex-1 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        activeTab === 'audio'
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Music className="w-4 h-4" />
                    <span>🎶 Full Audio Songs</span>
                </button>

                <button
                    onClick={() => {
                        setActiveTab('video');
                        if (audioRef.current) audioRef.current.pause();
                        setIsPlaying(false);
                        if (activeTrack) {
                            resolveVideoForTrack(activeTrack.artist, activeTrack.title);
                        }
                    }}
                    className={`flex-1 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        activeTab === 'video'
                            ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-lg'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Tv className="w-4 h-4" />
                    <span>📺 Watch In-Chat Video</span>
                </button>
            </div>

            {/* Search & Mood Chips Header (Shared across Audio and Video tabs) */}
            <div className="p-4 pb-2 bg-slate-950 border-b border-slate-900/50">
                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        placeholder="Search any song or video to vibe with in chat..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                    {isSearching && <Loader2 className="w-5 h-5 text-pink-400 animate-spin absolute right-3.5 top-2.5" />}
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-3 pb-1">
                    {JUKEBOX_MOODS.map(chip => (
                        <button
                            key={chip.name}
                            onClick={() => handleSelectMood(chip.name, chip.query)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedMood === chip.name
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {chip.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content View */}
            {activeTab === 'audio' ? (
                /* Audio Songs List */
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-2.5">
                    {tracks.map(track => {
                        const isCurrent = activeTrack?.id === track.id;

                        return (
                            <div
                                key={track.id}
                                onClick={() => handlePlayTrack(track)}
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                                    isCurrent
                                        ? 'bg-slate-900 border-2 border-pink-500 shadow-xl'
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
                                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-pink-400 font-medium">
                                            {track.mood}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {onShareTrackToChat && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onShareTrackToChat({
                                                    title: track.title,
                                                    artist: track.artist,
                                                    coverUrl: track.coverUrl,
                                                    audioUrl: track.audioUrl
                                                });
                                            }}
                                            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-pink-400 transition-colors"
                                            title="Share Song to Chat"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isCurrent) {
                                                handleTogglePlay();
                                            } else {
                                                handlePlayTrack(track);
                                            }
                                        }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                                            isCurrent
                                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                                                : 'bg-slate-800 text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {isCurrent && isPlaying ? (
                                            <Pause className="w-5 h-5 fill-white" />
                                        ) : (
                                            <Play className="w-5 h-5 fill-white ml-0.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Native In-Chat Video Player & Video Catalog */
                <div className="flex-1 flex flex-col items-center justify-start p-4 bg-black overflow-y-auto no-scrollbar space-y-4">
                    {activeTrack ? (
                        <div className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col flex-shrink-0">
                            {/* Video Display Container */}
                            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                {isVideoLoading ? (
                                    <div className="flex flex-col items-center space-y-3 text-pink-400 text-xs p-6 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span>Resolving in-chat video stream for {activeTrack.title}...</span>
                                    </div>
                                ) : directVideoUrl ? (
                                    <video
                                        src={directVideoUrl}
                                        controls
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-contain bg-black"
                                    />
                                ) : videoId ? (
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                                        className="w-full h-full border-0"
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                        title={activeTrack.title}
                                    />
                                ) : (
                                    /* High-Visualizer Audio Stage Fallback */
                                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black">
                                        <div className="relative">
                                            <img src={activeTrack.coverUrl} className="w-28 h-28 rounded-3xl object-cover shadow-2xl border-2 border-pink-500/50" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl">
                                                <Music className="w-10 h-10 text-pink-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base text-white">{activeTrack.title}</h4>
                                            <p className="text-xs text-slate-400">{activeTrack.artist}</p>
                                        </div>
                                        <audio src={activeTrack.audioUrl} controls autoPlay loop className="w-full max-w-sm mt-2 accent-pink-500" />
                                    </div>
                                )}
                            </div>

                            {/* Video Info & Share Action */}
                            <div className="p-4 bg-slate-900 flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                    <img src={activeTrack.coverUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-white truncate">{activeTrack.title}</h4>
                                        <p className="text-xs text-slate-400 truncate">{activeTrack.artist} • In-Chat Video Stage</p>
                                    </div>
                                </div>

                                {onShareTrackToChat && (
                                    <button
                                        onClick={() => onShareTrackToChat({
                                            title: activeTrack.title,
                                            artist: activeTrack.artist,
                                            coverUrl: activeTrack.coverUrl,
                                            audioUrl: activeTrack.audioUrl
                                        })}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg flex-shrink-0 hover:scale-105 transition-transform"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span>Share Video to Chat</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm py-8">Select a track from the list to play its video!</div>
                    )}

                    {/* Videos Catalog List */}
                    <div className="w-full max-w-2xl space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Select Video Track:</h4>
                        {tracks.map(track => {
                            const isCurrent = activeTrack?.id === track.id;

                            return (
                                <div
                                    key={track.id}
                                    onClick={() => handlePlayTrack(track)}
                                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                                        isCurrent
                                            ? 'bg-slate-900 border-2 border-pink-500 shadow-xl'
                                            : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3.5 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={track.coverUrl}
                                                alt={track.title}
                                                className="w-14 h-14 rounded-2xl object-cover shadow-md bg-slate-800"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                                                <Tv className="w-5 h-5 text-white drop-shadow-md" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                                            <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-pink-400 font-medium">
                                                {track.mood}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayTrack(track);
                                        }}
                                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-transform active:scale-95 flex items-center space-x-1.5 ${
                                            isCurrent
                                                ? 'bg-pink-500 text-white shadow-md'
                                                : 'bg-slate-800 text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        <Play className="w-3.5 h-3.5 fill-white" />
                                        <span>Watch</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Audio Player Bar */}
            {activeTab === 'audio' && activeTrack && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                            <img src={activeTrack.coverUrl} className="w-12 h-12 rounded-2xl object-cover shadow-md flex-shrink-0" />
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs text-white truncate">{activeTrack.title}</h4>
                                <p className="text-[10px] text-slate-400 truncate">{activeTrack.artist}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleToggleMute}
                                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
                            >
                                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={handleTogglePlay}
                                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={duration || 30}
                            step={0.5}
                            value={currentTime}
                            onChange={e => handleSeek(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
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
