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
    { name: '🔥 Top Hits', query: 'pop hits' },
    { name: '💖 Romantic Vibe', query: 'romantic love songs' },
    { name: '☕ Chill Lo-Fi', query: 'lofi chill' },
    { name: '🥁 Desi Hits', query: 'bollywood hits' },
    { name: '🕺 Party Groove', query: 'dance party' },
    { name: '🎸 Punjabi & Rap', query: 'punjabi rap' }
];

const PIPED_HOSTS = [
    'https://api.piped.video',
    'https://pipedapi.kavin.rocks',
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
    const [duration, setDuration] = useState(210);
    const [isMuted, setIsMuted] = useState(false);

    // Stream State (Full-length Audio + MP4 Video)
    const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
    const [fullVideoUrl, setFullVideoUrl] = useState<string | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [isStreamLoading, setIsStreamLoading] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        searchMusicAPI('pop hits');
    }, []);

    useEffect(() => {
        if (activeTab === 'video') {
            stopAudioPlayback();
        }
    }, [activeTab]);

    const stopAudioPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const searchMusicAPI = async (term: string) => {
        if (!term.trim()) return;
        setIsSearching(true);
        try {
            let mapped: Omit<StoryMusicData, 'startOffset'>[] = [];

            // Jamendo Free Music API for Full Songs
            try {
                const jamRes = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=56d30237&format=jsonpretty&limit=25&namesearch=${encodeURIComponent(term)}&audioformat=mp32`);
                const jamData = await jamRes.json();
                if (jamData.results && Array.isArray(jamData.results) && jamData.results.length > 0) {
                    mapped = jamData.results.map((r: any) => ({
                        id: `jam_${r.id}`,
                        title: r.name,
                        artist: r.artist_name,
                        mood: 'Full Song',
                        coverUrl: r.image || r.album_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
                        audioUrl: r.audio,
                        duration: r.duration || 210
                    }));
                }
            } catch (e) {}

            // iTunes as secondary search
            try {
                const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=20`);
                const itunesData = await itunesRes.json();
                if (itunesData.results && Array.isArray(itunesData.results)) {
                    const itunesMapped: Omit<StoryMusicData, 'startOffset'>[] = itunesData.results
                        .filter((r: any) => r.previewUrl)
                        .map((r: any) => ({
                            id: `juke_${r.trackId}`,
                            title: r.trackName,
                            artist: r.artistName,
                            mood: r.primaryGenreName || 'Trending',
                            coverUrl: r.artworkUrl100?.replace('100x100bb', '600x600bb') || r.artworkUrl100,
                            audioUrl: r.previewUrl,
                            duration: Math.max(180, Math.floor((r.trackTimeMillis || 210000) / 1000))
                        }));
                    mapped = [...mapped, ...itunesMapped];
                }
            } catch (e) {}

            if (mapped.length > 0) {
                setTracks(mapped);
                if (!activeTrack) {
                    handlePlayTrack(mapped[0]);
                }
            }
        } catch (e) {
            console.warn('[Jukebox] Search error:', e);
        } finally {
            setIsSearching(false);
        }
    };

    // Resolve 100% full-length Audio & MP4 Video stream URLs dynamically
    const resolveFullMediaStreams = async (artist: string, title: string, fallbackAudioUrl: string) => {
        setIsStreamLoading(true);
        setFullAudioUrl(fallbackAudioUrl);
        setFullVideoUrl(null);
        setVideoId(null);

        const query = `${artist} ${title} official music video`;

        for (const host of PIPED_HOSTS) {
            try {
                const searchRes = await fetch(`${host}/search?q=${encodeURIComponent(query)}&filter=videos`, {
                    signal: AbortSignal.timeout(3000)
                });
                const searchData = await searchRes.json();

                if (searchData.items && Array.isArray(searchData.items) && searchData.items.length > 0) {
                    const vId = searchData.items[0].url?.replace('/watch?v=', '');
                    if (vId) {
                        setVideoId(vId);

                        const streamRes = await fetch(`${host}/streams/${vId}`, {
                            signal: AbortSignal.timeout(3000)
                        });
                        const streamData = await streamRes.json();

                        // Full 3-5 minute audio stream
                        const audioObj = streamData.audioStreams?.find((a: any) => a.mimeType?.includes('audio/mp4') || a.mimeType?.includes('audio')) || streamData.audioStreams?.[0];
                        if (audioObj?.url) {
                            setFullAudioUrl(audioObj.url);
                        }

                        // Full HD MP4 video stream
                        const videoObj = streamData.videoStreams?.find((v: any) => v.mimeType?.includes('video/mp4') && (v.quality === '720p' || v.quality === '360p')) || streamData.videoStreams?.find((v: any) => v.mimeType?.includes('video/mp4')) || streamData.videoStreams?.[0];
                        if (videoObj?.url) {
                            setFullVideoUrl(videoObj.url);
                        }

                        if (streamData.duration) {
                            setDuration(streamData.duration);
                        }

                        setIsStreamLoading(false);
                        return audioObj?.url || fallbackAudioUrl;
                    }
                }
            } catch (e) {
                // Try next host
            }
        }

        setIsStreamLoading(false);
        return fallbackAudioUrl;
    };

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

    const handlePlayTrack = async (track: Omit<StoryMusicData, 'startOffset'>) => {
        setActiveTrack(track);
        setDuration(track.duration || 210);

        const resolvedAudioUrl = await resolveFullMediaStreams(track.artist, track.title, track.audioUrl);

        if (activeTab === 'video') {
            stopAudioPlayback();
            return;
        }

        stopAudioPlayback();

        const audio = new Audio(resolvedAudioUrl || track.audioUrl);
        audioRef.current = audio;
        audio.volume = isMuted ? 0 : 0.8;

        audio.onloadedmetadata = () => {
            setDuration(audio.duration || track.duration || 210);
        };

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
            setIsPlaying(false);
        };

        audio.play().then(() => {
            setIsPlaying(true);
        }).catch(() => setIsPlaying(false));
    };

    const handleTogglePlay = () => {
        if (activeTab === 'video') return;

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
            stopAudioPlayback();
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
                        <p className="text-xs text-slate-400">Play full 3-5 min audio songs & watch music videos directly in chat</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        stopAudioPlayback();
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
                    onClick={() => {
                        setActiveTab('audio');
                        if (activeTrack) handlePlayTrack(activeTrack);
                    }}
                    className={`flex-1 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                        activeTab === 'audio'
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Music className="w-4 h-4" />
                    <span>🎶 Full Length Audio</span>
                </button>

                <button
                    onClick={() => {
                        setActiveTab('video');
                        stopAudioPlayback();
                        if (activeTrack) {
                            resolveFullMediaStreams(activeTrack.artist, activeTrack.title, activeTrack.audioUrl);
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

            {/* Search & Mood Chips Header */}
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
                                            {track.mood} • {formatTime(track.duration || 210)}
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
                                                    audioUrl: fullAudioUrl || track.audioUrl,
                                                    videoUrl: fullVideoUrl || videoId || ''
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
                                {isStreamLoading ? (
                                    <div className="flex flex-col items-center space-y-3 text-pink-400 text-xs p-6 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span>Loading full video stream for {activeTrack.title}...</span>
                                    </div>
                                ) : fullVideoUrl ? (
                                    <video
                                        src={fullVideoUrl}
                                        controls
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-contain bg-black"
                                    />
                                ) : videoId ? (
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                                        <audio src={fullAudioUrl || activeTrack.audioUrl} controls autoPlay loop className="w-full max-w-sm mt-2 accent-pink-500" />
                                    </div>
                                )}
                            </div>

                            {/* Video Info & Share Action */}
                            <div className="p-4 bg-slate-900 flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                    <img src={activeTrack.coverUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-white truncate">{activeTrack.title}</h4>
                                        <p className="text-xs text-slate-400 truncate">{activeTrack.artist} • In-Chat Video</p>
                                    </div>
                                </div>

                                {onShareTrackToChat && (
                                    <button
                                        onClick={() => onShareTrackToChat({
                                            title: activeTrack.title,
                                            artist: activeTrack.artist,
                                            coverUrl: activeTrack.coverUrl,
                                            audioUrl: fullAudioUrl || activeTrack.audioUrl,
                                            videoUrl: fullVideoUrl || videoId || ''
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
                            max={duration || 210}
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
