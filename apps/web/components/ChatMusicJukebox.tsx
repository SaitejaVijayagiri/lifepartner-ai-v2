'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Tv, Search, Play, Pause, X, Sparkles, Volume2, VolumeX, Send, Loader2, Camera, Heart, Headphones } from 'lucide-react';
import { StoryMusicData } from './StoryMusicStudio';
import RewardedAdModal from './RewardedAdModal';
import { isMediaUnlocked, getRemainingUnlockedMinutes } from '@/lib/adRewards';
import { api } from '@/lib/api';

interface ChatMusicJukeboxProps {
    onClose: () => void;
    onShareTrackToChat?: (track: { title: string; artist: string; coverUrl: string; audioUrl: string; videoUrl?: string }) => void;
    onCreateStoryWithTrack?: (track: { title: string; artist: string; coverUrl: string; audioUrl: string }) => void;
    onStartSyncTrack?: (track: { title: string; artist: string; coverUrl: string; audioUrl: string; videoUrl?: string }) => void;
    currentUser?: any;
    partnerName?: string;
}

const JUKEBOX_MOODS = [
    { name: '🔖 Saved', query: 'SAVED' },
    { name: '🔥 Top Hits', query: 'pop hits' },
    { name: '💖 Romantic Vibe', query: 'romantic love songs' },
    { name: '🥁 Bollywood Hits', query: 'bollywood hits' },
    { name: '🌟 South Hits', query: 'tamil telugu melody hits' },
    { name: '🎸 Punjabi & Rap', query: 'punjabi rap' },
    { name: '☕ Chill Lo-Fi', query: 'lofi chill' },
    { name: '🕺 Party Groove', query: 'dance party' },
    { name: '🌸 Acoustic & Indie', query: 'indian indie acoustic' }
];

const getYoutubeId = (text: string): string | null => {
    if (!text) return null;
    const clean = text.trim();
    const standardMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    if (standardMatch) return standardMatch[1];
    const shortsMatch = clean.match(/youtube\.com\/shorts\/([^"&?\/ ]{11})/i);
    if (shortsMatch) return shortsMatch[1];
    return null;
};

export default function ChatMusicJukebox({ 
    onClose, 
    onShareTrackToChat, 
    onCreateStoryWithTrack, 
    onStartSyncTrack,
    currentUser,
    partnerName = 'your match'
}: ChatMusicJukeboxProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('🔥 Top Hits');
    const [tracks, setTracks] = useState<(Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string })[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [activeTrack, setActiveTrack] = useState<(Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);

    // Monetization & Full HD Video Resolution State
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [pendingTrackForVideo, setPendingTrackForVideo] = useState<(Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) | null>(null);
    const [isLoadingFullVideo, setIsLoadingFullVideo] = useState(false);
    const [remainingMins, setRemainingMins] = useState(getRemainingUnlockedMinutes());

    const isUserVip = Boolean(currentUser?.is_premium || currentUser?.isPremium);
    const isUnlocked = isUserVip || isMediaUnlocked(currentUser);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [savedTracks, setSavedTracks] = useState<(Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string })[]>([]);

    const handleCloseModal = () => {
        stopAudioPlayback();
        onClose();
    };

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem('lifepartner_saved_music');
            if (saved) {
                setSavedTracks(JSON.parse(saved));
            }
        } catch (e) {}

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                stopAudioPlayback();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Push temporary state so device/browser back button closes Jukebox first
        window.history.pushState({ inJukebox: true }, '', window.location.href);
        const handlePop = () => {
            stopAudioPlayback();
            onClose();
        };
        window.addEventListener('popstate', handlePop);

        searchMusicAPI('pop hits');

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('popstate', handlePop);
        };
    }, []);

    const toggleSaveTrack = (track: Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) => {
        setSavedTracks(prev => {
            const isSaved = prev.some(t => t.id === track.id || (t.title === track.title && t.artist === track.artist));
            let updated: (Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string })[];
            if (isSaved) {
                updated = prev.filter(t => t.id !== track.id && !(t.title === track.title && t.artist === track.artist));
            } else {
                updated = [track, ...prev];
            }
            try {
                localStorage.setItem('lifepartner_saved_music', JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

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
            const mapped: (Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string })[] = [];

            // 0. Direct URL / YouTube Link Parsing
            const ytId = getYoutubeId(term);
            if (ytId) {
                mapped.push({
                    id: `yt_${ytId}`,
                    title: 'Custom YouTube Video',
                    artist: 'Full Video Stream',
                    mood: 'Full HD Video',
                    coverUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
                    audioUrl: `https://www.youtube.com/watch?v=${ytId}`,
                    videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
                    duration: 240
                });
            } else if (term.startsWith('http://') || term.startsWith('https://')) {
                mapped.push({
                    id: `custom_${Date.now()}`,
                    title: 'Custom Web Video Track',
                    artist: 'Web Link 🔗',
                    mood: 'Custom Stream',
                    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
                    audioUrl: term,
                    videoUrl: term,
                    duration: 240
                });
            } else {
                // 0.5. Live YouTube Video Search (Enables ANY video or song in the world)
                try {
                    const ytRes = await api.interactions.searchYoutubeVideo(`${term} official video`);
                    const directYtId = ytRes?.videoId || ytRes?.data?.videoId || ytRes?.data?.data?.videoId;
                    if (directYtId) {
                        mapped.push({
                            id: `yt_${directYtId}`,
                            title: `${term.length > 30 ? term.slice(0, 30) + '...' : term}`,
                            artist: 'YouTube Full Video',
                            mood: 'Full HD Video',
                            coverUrl: `https://img.youtube.com/vi/${directYtId}/hqdefault.jpg`,
                            audioUrl: `https://www.youtube.com/watch?v=${directYtId}`,
                            videoUrl: `https://www.youtube.com/watch?v=${directYtId}`,
                            duration: 240
                        });
                    }
                } catch (_) {}
            }

            // Determine best storefront (prioritize IN for Indian / Bollywood / Regional hits)
            const isDesi = /bollywood|hindi|punjabi|desi|romantic|lofi|south|tamil|telugu|arijit|shreya|anirudh|diljit|sidhu|badshah|honey|darshan/i.test(term) || selectedMood.includes('Desi') || selectedMood.includes('Romantic') || selectedMood.includes('Punjabi');
            const countryParam = isDesi ? '&country=IN' : '';

            // 1. iTunes Songs API for Audio
            try {
                const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25${countryParam}`);
                const itunesData = await itunesRes.json();
                if (itunesData.results && Array.isArray(itunesData.results)) {
                    const songsMapped = itunesData.results
                        .filter((r: any) => r.previewUrl)
                        .map((r: any) => ({
                            id: `juke_${r.trackId}`,
                            title: r.trackName,
                            artist: r.artistName,
                            mood: r.primaryGenreName || 'Trending',
                            coverUrl: r.artworkUrl100?.replace('100x100bb', '600x600bb') || r.artworkUrl100,
                            audioUrl: r.previewUrl,
                            videoUrl: '',
                            duration: 30 // iTunes preview audio is strictly 30 seconds
                        }));
                    mapped.push(...songsMapped);
                }
            } catch (e) {
                console.warn('[Jukebox] iTunes song search error:', e);
            }

            // 2. iTunes Music Videos API for HD Videos
            try {
                const videoRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=musicVideo&limit=8${countryParam}`);
                const videoData = await videoRes.json();
                if (videoData.results && Array.isArray(videoData.results)) {
                    const videoMapped = videoData.results
                        .filter((r: any) => r.previewUrl)
                        .map((r: any) => ({
                            id: `vid_${r.trackId}`,
                            title: `${r.trackName} (Video)`,
                            artist: r.artistName,
                            mood: 'HD Music Video',
                            coverUrl: r.artworkUrl100?.replace('100x100bb', '600x600bb') || r.artworkUrl100,
                            audioUrl: r.previewUrl,
                            videoUrl: r.previewUrl,
                            duration: 30
                        }));
                    mapped.unshift(...videoMapped);
                }
            } catch (e) {
                console.warn('[Jukebox] iTunes video search error:', e);
            }

            if (mapped.length > 0) {
                setTracks(mapped);
                if (!activeTrack) {
                    // Pre-select top track without unprompted autoplay to respect browser audio policies
                    setActiveTrack(mapped[0]);
                    setDuration(mapped[0].duration || 30);
                }
            }
        } catch (e) {
            console.warn('[Jukebox] Search error:', e);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (searchQuery.trim().length > 1) {
            searchTimeoutRef.current = setTimeout(() => {
                searchMusicAPI(searchQuery);
            }, 300);
        } else if (searchQuery.trim().length === 0) {
            const mood = JUKEBOX_MOODS.find(m => m.name === selectedMood);
            if (mood) {
                if (mood.query === 'SAVED') {
                    setTracks(savedTracks);
                } else {
                    searchMusicAPI(mood.query);
                }
            }
        }
    }, [searchQuery, selectedMood, savedTracks]);

    const handleSelectMood = (moodName: string, query: string) => {
        setSelectedMood(moodName);
        setSearchQuery('');
        if (query === 'SAVED') {
            setTracks(savedTracks);
        } else {
            searchMusicAPI(query);
        }
    };

    const handlePlayTrack = (track: Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) => {
        setActiveTrack(track);
        setDuration(track.duration || 210);

        if (activeTab === 'video') {
            stopAudioPlayback();
            return;
        }

        stopAudioPlayback();

        const audio = new Audio(track.audioUrl);
        audioRef.current = audio;
        audio.volume = isMuted ? 0 : volume;

        audio.onloadedmetadata = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.onended = () => {
            setIsPlaying(false);
        };

        audio.onerror = (e) => {
            console.warn('[Jukebox] Play error:', e);
            setIsPlaying(false);
        };

        audio.play().then(() => {
            setIsPlaying(true);
        }).catch((err) => {
            console.warn('[Jukebox] Play failed:', err);
            setIsPlaying(false);
        });
    };

    const resolveFullVideoTrack = async (track: Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) => {
        const existingYt = getYoutubeId(track.videoUrl || '') || getYoutubeId(track.audioUrl || '');
        if (existingYt) {
            return `https://www.youtube.com/watch?v=${existingYt}`;
        }

        setIsLoadingFullVideo(true);
        try {
            const query = `${track.artist} ${track.title} official video`;
            const res = await api.interactions.searchYoutubeVideo(query);
            const videoId = res?.videoId || res?.data?.videoId || res?.data?.data?.videoId;
            if (videoId) {
                const fullYtUrl = `https://www.youtube.com/watch?v=${videoId}`;
                const updated = { ...track, videoUrl: fullYtUrl, duration: 240 };
                setActiveTrack(updated);
                setTracks(prev => prev.map(t => (t.id === track.id ? { ...t, videoUrl: fullYtUrl, duration: 240 } : t)));
                return fullYtUrl;
            }
        } catch (err) {
            console.warn('[Jukebox] Failed to resolve full YouTube video ID:', err);
        } finally {
            setIsLoadingFullVideo(false);
        }
        return track.videoUrl;
    };

    const handleSelectVideoTab = () => {
        if (!isUnlocked) {
            setPendingTrackForVideo(activeTrack);
            setShowRewardModal(true);
            return;
        }
        setActiveTab('video');
        stopAudioPlayback();
        if (activeTrack) {
            resolveFullVideoTrack(activeTrack);
        }
    };

    const handleWatchTrackVideo = (track: Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) => {
        if (!isUnlocked) {
            setPendingTrackForVideo(track);
            setShowRewardModal(true);
            return;
        }
        setActiveTrack(track);
        setActiveTab('video');
        stopAudioPlayback();
        resolveFullVideoTrack(track);
    };

    const handleAdRewardEarned = () => {
        setRemainingMins(45);
        setActiveTab('video');
        const target = pendingTrackForVideo || activeTrack;
        if (target) {
            setActiveTrack(target);
            resolveFullVideoTrack(target);
        }
        setPendingTrackForVideo(null);
    };

    const handleShareTrack = async (track: Omit<StoryMusicData, 'startOffset'> & { videoUrl?: string }) => {
        if (!onShareTrackToChat) return;

        let finalVideoUrl = track.videoUrl || '';
        // If it doesn't have a YouTube video URL yet, resolve it so the chat gets the full official video!
        if (!getYoutubeId(finalVideoUrl)) {
            try {
                const query = `${track.artist} ${track.title} official video`;
                const res = await api.interactions.searchYoutubeVideo(query);
                const videoId = res?.videoId || res?.data?.videoId || res?.data?.data?.videoId;
                if (videoId) {
                    finalVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                }
            } catch (_) {}
        }

        onShareTrackToChat({
            title: track.title,
            artist: track.artist,
            coverUrl: track.coverUrl,
            audioUrl: track.audioUrl,
            videoUrl: finalVideoUrl
        });
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
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            }
        }
    };

    const handleSeek = (newTime: number) => {
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const handleVolumeChange = (newVol: number) => {
        setVolume(newVol);
        if (isMuted && newVol > 0) setIsMuted(false);
        if (audioRef.current) {
            audioRef.current.volume = newVol;
        }
    };

    const handleToggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (audioRef.current) {
            audioRef.current.volume = nextMuted ? 0 : volume;
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
        <div className="fixed inset-0 z-[999999] w-screen h-screen w-full h-full min-h-[100vh] bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
            <div className="w-full h-full flex flex-col justify-between bg-gradient-to-b from-white via-slate-50 to-pink-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-gray-900 dark:text-white overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/90 border-b border-gray-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
                    <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/25">
                            {activeTab === 'audio' ? <Music className="w-5 h-5 fill-white" /> : <Tv className="w-5 h-5" />}
                        </span>
                        <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                                <span>Chat Vibe Music & Video Player</span>
                                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Preview songs, watch HD music videos & vibe together in chat</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isUserVip ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 px-2.5 py-1 rounded-full shadow-sm">
                                👑 VIP Unlimited
                            </span>
                        ) : remainingMins > 0 ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1 rounded-full shadow-sm">
                                ✨ Unlocked ({remainingMins}m)
                            </span>
                        ) : (
                            <button
                                onClick={() => setShowRewardModal(true)}
                                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-pink-700 dark:text-pink-300 bg-pink-100 hover:bg-pink-200 dark:bg-pink-500/10 dark:hover:bg-pink-500/20 border border-pink-300 dark:border-pink-500/30 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-sm"
                            >
                                🎁 Unlock 45m Full HD
                            </button>
                        )}
                        <button
                            onClick={handleCloseModal}
                            className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
                            title="Close Jukebox"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* View Mode Switcher Tabs */}
                <div className="flex items-center justify-center p-3 bg-gray-50/80 dark:bg-slate-950 border-b border-gray-200/80 dark:border-slate-900 gap-3">
                    <button
                        onClick={() => {
                            setActiveTab('audio');
                            if (activeTrack) handlePlayTrack(activeTrack);
                        }}
                        className={`flex-1 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm ${
                            activeTab === 'audio'
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25 scale-[1.01]'
                                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
                        }`}
                    >
                        <Music className="w-4 h-4" />
                        <span>Music Player</span>
                    </button>

                    <button
                        onClick={handleSelectVideoTab}
                        className={`flex-1 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm ${
                            activeTab === 'video'
                                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-md shadow-amber-500/25 scale-[1.01]'
                                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
                        }`}
                    >
                        <Tv className="w-4 h-4" />
                        <span>Watch In-Chat Video</span>
                        {!isUnlocked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold ml-1">
                                45m PASS
                            </span>
                        )}
                    </button>
                </div>

                {/* Search & Mood Chips Header */}
                <div className="p-3.5 sm:p-4 pb-2 bg-white/80 dark:bg-slate-950 border-b border-gray-200/70 dark:border-slate-900/50">
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 dark:text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            placeholder="Search any song or video to vibe with in chat..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100/90 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl pl-11 pr-11 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:bg-white dark:focus:bg-slate-900 transition-colors shadow-inner"
                        />
                        {isSearching && <Loader2 className="w-5 h-5 text-pink-500 animate-spin absolute right-3.5 top-2.5" />}
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-3 pb-1">
                        {JUKEBOX_MOODS.map(chip => (
                            <button
                                key={chip.name}
                                onClick={() => handleSelectMood(chip.name, chip.query)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                                    selectedMood === chip.name
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25 scale-105'
                                        : 'bg-white hover:bg-gray-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
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
                    tracks.length === 0 && !isSearching ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-slate-400 space-y-3">
                            <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-pink-500 dark:text-pink-400 border border-gray-200 dark:border-slate-800 shadow-xl">
                                <Music className="w-8 h-8" />
                            </div>
                            {selectedMood === '🔖 Saved' ? (
                                <>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">No saved tracks yet</p>
                                    <p className="text-xs max-w-xs text-gray-500 dark:text-slate-400">Tap the heart icon (💖) on any song to bookmark your favorite tunes for quick access!</p>
                                    <button
                                        onClick={() => handleSelectMood('🔥 Top Hits', 'pop hits')}
                                        className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                                    >
                                        Explore Top Hits 🔥
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">No tracks found</p>
                                    <p className="text-xs max-w-xs text-gray-500 dark:text-slate-400">
                                        {searchQuery ? `We couldn't find any songs matching "${searchQuery}".` : 'No songs available in this category right now.'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            handleSelectMood('🔥 Top Hits', 'pop hits');
                                        }}
                                        className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
                                    >
                                        Reset & Browse Hits 🔥
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto no-scrollbar px-3 sm:px-4 py-2 space-y-2.5">
                            {tracks.map(track => {
                                const isCurrent = activeTrack?.id === track.id;

                                return (
                                    <div
                                        key={track.id}
                                        onClick={() => handlePlayTrack(track)}
                                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all ${
                                            isCurrent
                                                ? 'bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-2 border-pink-500 shadow-md shadow-pink-500/15'
                                                : 'bg-white dark:bg-slate-900/60 hover:bg-pink-50/40 dark:hover:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1 pr-1.5">
                                            <img
                                                src={track.coverUrl}
                                                alt={track.title}
                                                className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover shadow-md bg-gray-100 dark:bg-slate-800 flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-full">{track.title}</h4>
                                                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium truncate max-w-full">{track.artist}</p>
                                                <span className="inline-block mt-0.5 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md bg-pink-100/90 dark:bg-slate-800 text-pink-700 dark:text-pink-400 font-bold border border-pink-200/80 dark:border-transparent">
                                                    {track.mood} • 30s HD Preview
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSaveTrack(track);
                                                }}
                                                className={`p-1.5 sm:p-2.5 rounded-full transition-colors shadow-sm ${
                                                    savedTracks.some(t => t.id === track.id || (t.title === track.title && t.artist === track.artist))
                                                        ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400'
                                                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                                title="Bookmark Song to Favorites 💖"
                                            >
                                                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedTracks.some(t => t.id === track.id || (t.title === track.title && t.artist === track.artist)) ? 'fill-pink-500 dark:fill-pink-400' : ''}`} />
                                            </button>

                                            {onCreateStoryWithTrack && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        stopAudioPlayback();
                                                        onCreateStoryWithTrack({
                                                            title: track.title,
                                                            artist: track.artist,
                                                            coverUrl: track.coverUrl,
                                                            audioUrl: track.audioUrl
                                                        });
                                                        onClose();
                                                    }}
                                                    className="p-1.5 sm:p-2.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-transparent transition-colors shadow-sm cursor-pointer"
                                                    title="Create Instant Story with this Song 📸"
                                                >
                                                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            )}

                                            {onStartSyncTrack && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        stopAudioPlayback();
                                                        onStartSyncTrack({
                                                            title: track.title,
                                                            artist: track.artist,
                                                            coverUrl: track.coverUrl,
                                                            audioUrl: track.audioUrl,
                                                            videoUrl: track.videoUrl || ''
                                                        });
                                                        onClose();
                                                    }}
                                                    className="p-1.5 sm:p-2.5 rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-transparent transition-colors shadow-sm cursor-pointer"
                                                    title="Sync Live with Match 🎧 (Listen Together)"
                                                >
                                                    <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            )}

                                            {onShareTrackToChat && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShareTrack(track);
                                                    }}
                                                    className="p-1.5 sm:p-2.5 rounded-full bg-pink-50 hover:bg-pink-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-400 border border-pink-200/60 dark:border-transparent transition-colors shadow-sm cursor-pointer"
                                                    title="Share Song & Video to Chat"
                                                >
                                                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleWatchTrackVideo(track);
                                                }}
                                                className="p-1.5 sm:p-2.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-transparent transition-colors shadow-sm cursor-pointer"
                                                title="Watch Full HD Video Song 🎬"
                                            >
                                                <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isCurrent) {
                                                        if (isPlaying) {
                                                            stopAudioPlayback();
                                                        } else {
                                                            handlePlayTrack(track);
                                                        }
                                                    } else {
                                                        handlePlayTrack(track);
                                                    }
                                                }}
                                                className={`p-1.5 sm:p-2.5 rounded-full transition-transform active:scale-95 shadow-md cursor-pointer ${
                                                    isCurrent
                                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                                                        : 'bg-gray-100 hover:bg-pink-500 dark:bg-slate-800 text-gray-700 hover:text-white dark:text-slate-300 dark:hover:text-white'
                                                }`}
                                            >
                                                {isCurrent && isPlaying ? (
                                                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* Native In-Chat Video Player & Video Catalog */
                    <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 bg-slate-100/70 dark:bg-black overflow-y-auto no-scrollbar space-y-4">
                        {activeTrack ? (
                            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col flex-shrink-0">
                                {/* Value-Exchange Pass Status */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-950/80 border-b border-gray-200 dark:border-slate-800 text-xs">
                                    <span className="text-gray-700 dark:text-slate-400 font-bold flex items-center gap-1.5">🎬 Full HD Video Stream</span>
                                    {isUserVip ? (
                                        <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                                            👑 VIP Ad-Free Active
                                        </span>
                                    ) : remainingMins > 0 ? (
                                        <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                                            ✨ Unlocked Pass ({remainingMins}m remaining)
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setShowRewardModal(true)}
                                            className="flex items-center gap-1 font-bold text-pink-700 dark:text-pink-400 bg-pink-100 hover:bg-pink-200 dark:bg-pink-500/10 dark:hover:bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-300 dark:border-pink-500/30 transition-all cursor-pointer"
                                        >
                                            🎁 Extend 45m Pass
                                        </button>
                                    )}
                                </div>

                                {/* Video Display Container */}
                                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                    {isLoadingFullVideo ? (
                                        <div className="flex flex-col items-center justify-center p-6 space-y-3">
                                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                                            <p className="text-xs text-slate-300 font-medium">Finding Full Official HD Music Video...</p>
                                        </div>
                                    ) : (getYoutubeId(activeTrack.videoUrl || '') || getYoutubeId(activeTrack.audioUrl || '')) ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${getYoutubeId(activeTrack.videoUrl || '') || getYoutubeId(activeTrack.audioUrl || '')}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://lifepartnerai.in')}&playsinline=1&rel=0`}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={activeTrack.title}
                                        />
                                    ) : activeTrack.videoUrl && (activeTrack.videoUrl.startsWith('http://') || activeTrack.videoUrl.startsWith('https://')) && !activeTrack.videoUrl.includes('video-ssl') && (activeTrack.videoUrl.includes('.mp4') || activeTrack.videoUrl.includes('.webm') || activeTrack.videoUrl.includes('.ogg')) ? (
                                        <video
                                            src={activeTrack.videoUrl}
                                            controls
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-contain bg-black"
                                        />
                                    ) : (
                                        <div className="p-4 text-center flex flex-col items-center justify-center space-y-3 h-full w-full bg-slate-950 text-white">
                                            <Tv size={32} className="text-pink-400 animate-pulse" />
                                            <p className="text-xs font-semibold px-2 text-slate-200">Full Video for "{activeTrack.title}"</p>
                                            <button
                                                onClick={() => resolveFullVideoTrack(activeTrack)}
                                                className="py-2 px-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center space-x-2 cursor-pointer"
                                            >
                                                <Play className="w-3.5 h-3.5 fill-white" />
                                                <span>Play Full HD Video Song</span>
                                            </button>
                                            <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${activeTrack.artist} ${activeTrack.title} official video`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1.5"
                                            >
                                                <span>▶ Open in YouTube App</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* YouTube Deep Link Bar */}
                                {(getYoutubeId(activeTrack.videoUrl || '') || getYoutubeId(activeTrack.audioUrl || '')) && (
                                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-950 flex items-center justify-between border-t border-gray-200 dark:border-slate-800/60 text-[11px] text-gray-500 dark:text-slate-400">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">● Full HD Song Streaming</span>
                                        <a
                                            href={`https://www.youtube.com/watch?v=${getYoutubeId(activeTrack.videoUrl || '') || getYoutubeId(activeTrack.audioUrl || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-200 dark:border-red-500/20"
                                        >
                                            <span>Open in YouTube App</span>
                                            <Tv size={12} />
                                        </a>
                                    </div>
                                )}

                                {/* Video Info & Share Action */}
                                <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <img src={activeTrack.coverUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm bg-gray-100 dark:bg-slate-800" />
                                        <div className="min-w-0">
                                            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{activeTrack.title}</h4>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{activeTrack.artist} • In-Chat Video</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {onStartSyncTrack && (
                                            <button
                                                onClick={() => {
                                                    stopAudioPlayback();
                                                    onStartSyncTrack({
                                                        title: activeTrack.title,
                                                        artist: activeTrack.artist,
                                                        coverUrl: activeTrack.coverUrl,
                                                        audioUrl: activeTrack.audioUrl,
                                                        videoUrl: activeTrack.videoUrl || ''
                                                    });
                                                    onClose();
                                                }}
                                                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
                                                title="Listen together in real-time"
                                            >
                                                <Headphones className="w-4 h-4" />
                                                <span className="hidden sm:inline">Sync Live</span>
                                            </button>
                                        )}

                                        {onShareTrackToChat && (
                                            <button
                                                onClick={() => handleShareTrack(activeTrack)}
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-pink-500/25 flex-shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                            >
                                                <Send className="w-4 h-4" />
                                                <span>Share Video to Chat</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 dark:text-slate-500 font-medium text-sm py-8">Select a track from the list to play its video!</div>
                        )}

                        {/* Videos Catalog List */}
                        <div className="w-full max-w-2xl space-y-2">
                            <h4 className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider px-1">Select Video Track:</h4>
                            {tracks.map(track => {
                                const isCurrent = activeTrack?.id === track.id;

                                return (
                                    <div
                                        key={track.id}
                                        onClick={() => handleWatchTrackVideo(track)}
                                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                                            isCurrent
                                                ? 'bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 dark:bg-slate-900 border-2 border-pink-500 shadow-xl'
                                                : 'bg-white dark:bg-slate-900/60 hover:bg-gray-50 dark:hover:bg-slate-900 border border-gray-200 dark:border-slate-800/80 shadow-sm hover:shadow'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3.5 min-w-0">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={track.coverUrl}
                                                    alt={track.title}
                                                    className="w-14 h-14 rounded-2xl object-cover shadow-md bg-gray-100 dark:bg-slate-800"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                                                    <Tv className="w-5 h-5 text-white drop-shadow-md" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{track.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate">{track.artist}</p>
                                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-400 font-bold border border-pink-200/60 dark:border-transparent">
                                                    {track.mood}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleWatchTrackVideo(track);
                                            }}
                                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-transform active:scale-95 flex items-center space-x-1.5 shadow-sm cursor-pointer ${
                                                isCurrent
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                                    : 'bg-gray-100 hover:bg-pink-500 dark:bg-slate-800 text-gray-700 hover:text-white dark:text-slate-300 dark:hover:text-white'
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
                    <div className="p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-slate-800 shadow-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0">
                                <img src={activeTrack.coverUrl} className="w-12 h-12 rounded-2xl object-cover shadow-md flex-shrink-0 bg-gray-100 dark:bg-slate-800" />
                                <div className="min-w-0">
                                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{activeTrack.title}</h4>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">{activeTrack.artist}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-slate-800/80 px-2 py-1 rounded-full border border-gray-200 dark:border-slate-700/60 shadow-inner">
                                    <button
                                        onClick={handleToggleMute}
                                        className="p-1 rounded-full text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-pink-500" />}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={isMuted ? 0 : volume}
                                        onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                                        className="w-14 sm:w-20 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                                    />
                                </div>

                                {onStartSyncTrack && (
                                    <button
                                        onClick={() => {
                                            stopAudioPlayback();
                                            onStartSyncTrack({
                                                title: activeTrack.title,
                                                artist: activeTrack.artist,
                                                coverUrl: activeTrack.coverUrl,
                                                audioUrl: activeTrack.audioUrl,
                                                videoUrl: activeTrack.videoUrl || ''
                                            });
                                            onClose();
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1 shadow-md active:scale-95 transition-transform cursor-pointer"
                                        title="Sync Live with Match (Listen Together)"
                                    >
                                        <Headphones className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Sync</span>
                                    </button>
                                )}

                                {onShareTrackToChat && (
                                    <button
                                        onClick={() => handleShareTrack(activeTrack)}
                                        className="p-2 rounded-full bg-gray-100 hover:bg-pink-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-pink-600 dark:text-pink-400 transition-colors shadow-sm cursor-pointer"
                                        title="Share Song & Video to Chat"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    onClick={handleTogglePlay}
                                    className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 active:scale-95 hover:scale-105 transition-all cursor-pointer"
                                >
                                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-slate-400">
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
                                className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Value Exchange Rewarded Video Modal */}
            <RewardedAdModal
                isOpen={showRewardModal}
                onClose={() => {
                    setShowRewardModal(false);
                    setPendingTrackForVideo(null);
                }}
                onUnlocked={handleAdRewardEarned}
                partnerName={partnerName}
                songTitle={pendingTrackForVideo?.title || activeTrack?.title || 'Full HD Music Video'}
            />
        </div>
    );

    if (mounted && typeof document !== 'undefined') {
        return createPortal(modalMarkup, document.body);
    }

    return modalMarkup;
}
