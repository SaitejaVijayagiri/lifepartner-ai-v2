import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX, Trash2, X, ChevronLeft, ChevronRight, Heart, Send, MessageCircle, Eye, Star, MapPin, MessageSquareText, Hourglass, Camera, AtSign, Hash, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import StoryMusicSticker from './StoryMusicSticker';
import { MUSIC_CATALOG } from './StoryMusicStudio';
import { useToast } from '@/components/ui/Toast';

interface Story {
    id: string;
    url: string;
    type: 'image' | 'video';
    createdAt: string;
    expiresAt?: string;
    music?: string;
    isHighlight?: boolean;
    views?: { userId: string, name: string, photoUrl: string, viewedAt: string }[];
    likes?: { userId: string, name: string, likedAt: string }[];
    reactions?: { userId: string, name: string, emoji: string, reactedAt: string }[];
}

interface User {
    id: string;
    name: string;
    photoUrl?: string;
    avatar_url?: string;
    full_name?: string;
}

interface StoryModalProps {
    stories: Story[];
    initialIndex?: number;
    user: User;
    currentUser: any;
    onClose: () => void;
    onDelete?: (storyId: string) => void;
    onViewProfile?: (userId: string, userName?: string, userPhotoUrl?: string) => void;
    onStoryViewed?: (storyId: string, targetUserId: string) => void;
    onHighlightToggle?: (storyId: string, isHighlight: boolean) => void;
}

const StoryModal = ({ stories = [], initialIndex = 0, user, onClose, currentUser, onDelete, onViewProfile, onStoryViewed, onHighlightToggle }: StoryModalProps) => {
    const router = useRouter();
    const toast = useToast();
    const { socket, onlineUsers } = useSocket() as any;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isViewsOpen, setIsViewsOpen] = useState(false);
    const [localLikes, setLocalLikes] = useState(0);
    const [storiesList, setStoriesList] = useState<Story[]>(stories);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);

    useEffect(() => {
        setStoriesList(stories);
    }, [stories]);

    const story = (storiesList && storiesList[currentIndex]) ? (storiesList[currentIndex] as any) : null;
    const [isHighlighted, setIsHighlighted] = useState(Boolean(story?.isHighlight));
    const [flyingReactions, setFlyingReactions] = useState<{ id: number, emoji: string, left: number }[]>([]);

    useEffect(() => {
        if (story) {
            setIsHighlighted(Boolean(story.isHighlight));
        }
    }, [story?.id]);

    const triggerReaction = async (emoji: string) => {
        const id = Date.now() + Math.random();
        const left = Math.floor(Math.random() * 60) + 20;
        setFlyingReactions(prev => [...prev, { id, emoji, left }]);

        setTimeout(() => {
            setFlyingReactions(prev => prev.filter(r => r.id !== id));
        }, 1500);

        try {
            await api.profile.reactToStory(user.id, story.id, emoji);
            toast.success(`Reacted ${emoji}`);
        } catch (e) {}

        if (socket) {
            socket.emit('storyReaction', {
                to: user.id,
                from: currentUser?.id || currentUser?.userId,
                storyId: story.id,
                emoji
            });
        }
    };

    // Resolve currentUser's ID — backend /profile/me returns 'userId', not 'id'
    const currentUserId = currentUser?.id || currentUser?.userId || currentUser?._id;
    const storyUserId = user?.id || (user as any)?.userId || (user as any)?._id || story?.userId || story?.user_id;
    const isOwner = Boolean(
        (currentUserId && storyUserId && String(currentUserId) === String(storyUserId)) ||
        storyUserId === 'me' ||
        currentUserId === 'me' ||
        user?.name === 'You' ||
        (currentUser && (user?.name === currentUser?.name || user?.name === currentUser?.full_name))
    );
    
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    // Audio and Video Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const MUSIC_TRACKS: Record<string, { name: string, url: string }> = {
        'lofi': { name: 'Chill Lo-Fi ☕', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
        'romantic': { name: 'Romantic Piano 💖', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3' },
        'upbeat': { name: 'Upbeat Pop 🕺', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
        'cinematic': { name: 'Epic Vibe 🎬', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
        'acoustic': { name: 'Acoustic Guitar 🎸', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3' },
        'electronic': { name: 'Electronic 🎧', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3' },
        'bollywood': { name: 'Desi Beats 🥁', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
        'devotional': { name: 'Devotional Flute 🕉️', url: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_9bc6b3a0cc.mp3' },
        'pop': { name: 'Summer Pop ☀️', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
        'jazz': { name: 'Midnight Jazz 🎷', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3' },
        'retro': { name: 'Synthwave Retro ⚡', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
        'classical': { name: 'Symphony Classic 🎻', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3' },
        'rock': { name: 'Energetic Rock 🎸', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
        'chillout': { name: 'Ambient Chillout 🌊', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
        'party': { name: 'Club Party Beat 🔥', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getParsedMusic = () => {
        if (!story?.music) return null;
        if (typeof story.music === 'object') return story.music;
        if (typeof story.music === 'string') {
            if (story.music.startsWith('{')) {
                try { return JSON.parse(story.music); } catch (e) {}
            }
            const match = MUSIC_CATALOG.find(m => m.id === story.music);
            if (match) return { ...match, startOffset: 0 };
            if (MUSIC_TRACKS[story.music]) {
                return { title: MUSIC_TRACKS[story.music].name, artist: 'Story Music', audioUrl: MUSIC_TRACKS[story.music].url, startOffset: 0 };
            }
        }
        return null;
    };

    const parsedMusic = getParsedMusic();

    // Handle Music Playback with Metadata Ready Listener
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (parsedMusic && parsedMusic.audioUrl) {
            const audio = new Audio(parsedMusic.audioUrl);
            audio.volume = 0.8;
            audio.loop = true;
            audioRef.current = audio;

            const startOffset = parsedMusic.startOffset || 0;

            audio.ontimeupdate = () => {
                setAudioCurrentTime(audio.currentTime);
            };

            const handleReady = () => {
                try {
                    if (startOffset > 0 && audio.duration > startOffset) {
                        audio.currentTime = startOffset;
                    }
                } catch (e) {}
                if (!isPaused) {
                    audio.play()
                        .then(() => setIsAudioMuted(false))
                        .catch(e => {
                            console.log('Audio autoplay prevented:', e);
                            setIsAudioMuted(true);
                        });
                }
            };

            audio.addEventListener('canplay', handleReady);
            audio.addEventListener('loadeddata', handleReady);

            audio.play().then(() => {
                try {
                    if (startOffset > 0 && audio.duration > startOffset) {
                        audio.currentTime = startOffset;
                    }
                } catch (e) {}
                setIsAudioMuted(false);
            }).catch(e => {
                console.log('Audio play catch:', e);
                setIsAudioMuted(true);
            });

            return () => {
                audio.removeEventListener('canplay', handleReady);
                audio.removeEventListener('loadeddata', handleReady);
                audio.pause();
                audioRef.current = null;
            };
        }
    }, [story?.id, story?.music]);

    // Handle Pause Toggle for Music and Video
    useEffect(() => {
        if (audioRef.current) {
            if (isPaused) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.log('Audio play prevented:', e));
            }
        }
        
        if (videoRef.current) {
            if (isPaused) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => console.log('Video play prevented:', e));
            }
        }
    }, [isPaused]);

    // Auto-advance Timer for Images (Syncs with music audio if music is present, falls back to 7s timer)
    useEffect(() => {
        if (!story || isPaused || story.type === 'video') return;

        const parsedMusic = getParsedMusic();
        const audio = audioRef.current;

        if (parsedMusic && audio) {
            const handleTimeUpdate = () => {
                if (audio.duration > 0) {
                    const pct = (audio.currentTime / audio.duration) * 100;
                    setProgress(Math.min(100, pct));
                }
            };

            const handleEnded = () => {
                setProgress(100);
            };

            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);

            return () => {
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
            };
        } else {
            // Normal image story (7 seconds total viewing duration)
            const timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) return 100;
                    return prev + 1.4;
                });
            }, 100);

            return () => clearInterval(timer);
        }
    }, [currentIndex, isPaused, story?.type, story?.id, story?.music, audioRef.current]);

    // Advanced Multi-Asset Preloader Engine (Pre-fetches +1 and +2 story assets)
    useEffect(() => {
        if (!stories || stories.length === 0) return;

        [1, 2].forEach(offset => {
            const targetStory = stories[currentIndex + offset];
            if (targetStory?.url) {
                if (targetStory.type === 'video') {
                    const video = document.createElement('video');
                    video.src = targetStory.url;
                    video.preload = 'auto';
                    video.load();
                } else {
                    const img = new Image();
                    img.src = targetStory.url;
                    if ('decode' in img) {
                        img.decode().catch(() => {});
                    }
                }
            }
        });
    }, [currentIndex, stories]);

    // Track View when Story Changes
    useEffect(() => {
        if (!story || !story.id) return;
        setIsViewsOpen(false); // Close views panel if story changes
        if (currentUser && !isOwner) {
            // Optimistically update views array locally for instant UI response
            if (currentUserId) {
                if (!story.views) story.views = [];
                if (!story.views.some((v: any) => (v.userId || v.user_id) === currentUserId)) {
                    story.views.push({
                        userId: currentUserId,
                        name: currentUser.full_name || currentUser.name || 'You',
                        photoUrl: currentUser.photoUrl || currentUser.avatar_url || '',
                        viewedAt: new Date().toISOString()
                    });
                }
            }
            if (onStoryViewed) {
                onStoryViewed(story.id, user.id);
            }
            // Emit real-time socket view event
            if (socket) {
                socket.emit('storyView', { to: user.id, storyId: story.id });
            }
            api.profile.trackStoryView(user.id, story.id).catch(console.error);
        }
    }, [story?.id, user.id, currentUserId]);

    // Handle Story Completion
    useEffect(() => {
        if (progress >= 100) {
            if (stories && stories.length > 0 && currentIndex < stories.length - 1) {
                setCurrentIndex((prev: number) => prev + 1);
                setProgress(0);
            } else {
                onClose();
            }
        }
    }, [progress, currentIndex, stories?.length, onClose]);

    const goNext = () => {
        if (stories && stories.length > 0 && currentIndex < stories.length - 1) {
            setCurrentIndex((prev: number) => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev: number) => prev - 1);
            setProgress(0);
        }
    };

    if (!story) return null;

    const displayName = user.name || user.full_name || "User";
    const avatarUrl = user.photoUrl || user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

    const modalMarkup = (
        <div
            className="fixed inset-0 z-[99999] bg-black w-screen h-screen w-full h-full min-h-[100vh] flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200"
            onClick={() => {
                if (audioRef.current && audioRef.current.paused) {
                    audioRef.current.play().catch(() => {});
                }
            }}
        >
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none z-10"></div>

            {/* Story Container */}
            <div
                className="relative w-full h-full flex-1 flex flex-col justify-between overflow-hidden"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Progress Bars - Instagram Style */}
                <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-30">
                    {stories.map((s: any, idx: number) => (
                        <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className="h-full bg-white rounded-full transition-all ease-linear"
                                style={{
                                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                                    transitionDuration: idx === currentIndex ? '40ms' : '0ms'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-30">
                    {(() => {
                        const isOnline = Array.isArray(onlineUsers) && onlineUsers.includes(user.id);
                        return (
                            <div 
                                className={`flex items-center gap-3 ${onViewProfile && !isOwner ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all group/header' : ''}`}
                                onClick={() => {
                                    if (onViewProfile && !isOwner) {
                                        setIsPaused(true);
                                        onViewProfile(user.id, user.name || user.full_name, user.photoUrl || user.avatar_url);
                                    }
                                }}
                            >
                                <div className="relative">
                                    <img
                                        src={avatarUrl}
                                        className="w-11 h-11 rounded-full border-2 border-white shadow-lg object-cover"
                                        alt={displayName}
                                    />
                                    {isOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" title="Online"></div>
                                    )}
                                </div>
                                <div className="text-white text-left">
                                    <span className="font-bold text-sm drop-shadow-md block group-hover/header:underline">{displayName}</span>
                                    <div className="flex items-center gap-1 text-xs text-white/70">
                                        <span>{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>•</span>
                                        <span>{currentIndex + 1}/{stories.length}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    <div className="flex items-center gap-2">
                        {parsedMusic && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (audioRef.current) {
                                        const nextMuteState = !isAudioMuted;
                                        audioRef.current.muted = nextMuteState;
                                        if (nextMuteState) {
                                            audioRef.current.pause();
                                        } else {
                                            audioRef.current.play().catch(err => console.log('Audio play error:', err));
                                        }
                                        setIsAudioMuted(nextMuteState);
                                    }
                                }}
                                className={`p-2.5 rounded-full text-white backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${
                                    isAudioMuted ? 'bg-rose-500/80 animate-bounce' : 'bg-white/20 hover:bg-white/30'
                                }`}
                                title={isAudioMuted ? "Click to play song" : "Mute song"}
                            >
                                {isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
                            </button>
                        )}
                        {isOwner && (
                            <>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const res = await api.profile.toggleStoryHighlight(story.id);
                                            if (res?.success) {
                                                setIsHighlighted(res.isHighlight);
                                                story.isHighlight = res.isHighlight;
                                                if (onHighlightToggle) {
                                                    onHighlightToggle(story.id, res.isHighlight);
                                                }
                                                toast.success(res.isHighlight ? 'Added to Profile Highlights ⭐' : 'Removed from Highlights');
                                            }
                                        } catch (err: any) {
                                            toast.error(err.message || 'Failed to update highlight');
                                        }
                                    }}
                                    className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                                        isHighlighted ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                                    title={isHighlighted ? "Remove from Highlights" : "Save to Profile Highlights ⭐"}
                                >
                                    <Star size={18} fill={isHighlighted ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsConfirmingDelete(true);
                                    }}
                                    className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-full text-white backdrop-blur-sm transition-colors cursor-pointer"
                                    title="Delete Story"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Floating Music Badge */}
                {parsedMusic && !parsedMusic.hideSticker && (
                    <div className="absolute top-20 left-4 z-30 pointer-events-none">
                        <StoryMusicSticker music={parsedMusic} isPlaying={!isPaused && !isAudioMuted} />
                    </div>
                )}

                {/* Story Content & Fullscreen Media */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    {/* Ambient Blurred Background */}
                    {story.url && story.type !== 'video' && (
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-45 scale-110 pointer-events-none transition-all duration-500"
                            style={{ backgroundImage: `url(${story.url})` }}
                        />
                    )}

                    {/* Centered Media Container */}
                    <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
                        {story.type === 'video' ? (
                            <video
                                ref={videoRef}
                                src={story.url}
                                className="max-w-full max-h-full object-contain select-none shadow-2xl"
                                autoPlay
                                playsInline
                                muted={false}
                                onTimeUpdate={(e) => {
                                    const t = e.currentTarget.currentTime;
                                    const d = e.currentTarget.duration;
                                    if (d > 0) setProgress((t / d) * 100);
                                }}
                                onEnded={() => {
                                    setProgress(100);
                                }}
                            />
                        ) : (
                            <img
                                src={story.url}
                                className="max-w-full max-h-full object-contain select-none shadow-2xl"
                                alt="Story"
                            />
                        )}
                    </div>

                    {/* Left / Right Fullscreen Tap Navigation Overlay */}
                    <div className="absolute inset-0 z-20 flex">
                        <div className="w-1/3 h-full cursor-pointer select-none" onClick={goPrev} />
                        <div className="w-2/3 h-full cursor-pointer select-none" onClick={goNext} />
                    </div>
                    
                    {/* Dynamic Text Overlays for Video Stories (Images have text burned in) */}
                    {story.texts && Array.isArray(story.texts) && story.texts.map((t: any, i: number) => (
                        <div key={i} className="absolute top-1/2 left-1/2 pointer-events-none" style={{ zIndex: 20, transform: `translate(${t.x}px, ${t.y}px)` }}>
                            <div 
                                style={{ 
                                    transform: 'translate(-50%, -50%)',
                                    color: t.bgStyle === 'highlight' ? (t.color === 'white' ? 'black' : 'white') : t.color,
                                    backgroundColor: t.bgStyle === 'highlight' ? t.color : 'transparent',
                                    textShadow: t.bgStyle === 'neon' ? `0 0 10px ${t.color}, 0 0 20px ${t.color}, 0 0 30px ${t.color}` : (t.bgStyle === 'plain' ? '0px 2px 15px rgba(0,0,0,0.8)' : 'none'),
                                    fontSize: `clamp(${1.5 * t.scale}rem, ${6 * t.scale}vw, ${3 * t.scale}rem)`,
                                    fontFamily: t.fontFamily,
                                    fontWeight: 'bold',
                                    whiteSpace: 'pre-wrap',
                                    padding: t.bgStyle === 'highlight' ? '10px 20px' : '0',
                                    borderRadius: t.bgStyle === 'highlight' ? '12px' : '0',
                                    textAlign: 'center'
                                }}
                            >
                                {t.text}
                            </div>
                        </div>
                    ))}

                    {/* Dynamic Sticker & Emoji Overlays */}
                    {story.stickers && Array.isArray(story.stickers) && story.stickers.map((s: any, i: number) => (
                        <div key={i} className="absolute top-1/2 left-1/2 pointer-events-none" style={{ zIndex: 22, transform: `translate(${s.x}px, ${s.y}px)` }}>
                            <div style={{ transform: `translate(-50%, -50%) scale(${s.scale || 1})`, transformOrigin: 'center center' }}>
                                {/* Transparent GIPHY / Image Sticker */}
                                {(s.type === 'giphy' || s.type === 'image') && s.imageUrl && (
                                    <img 
                                        src={s.imageUrl} 
                                        alt={s.content} 
                                        className="max-w-[180px] max-h-[180px] object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'https://media.giphy.com/media/l4KibW1bB5Fq4uPf2/giphy.gif';
                                        }}
                                    />
                                )}

                                {/* Aesthetic Calligraphy / Hand-Drawn Quote Sticker */}
                                {s.type === 'aesthetic_text' && (
                                    <div className={`text-2xl font-bold ${s.textColor || 'text-white'} ${s.extraData?.font || 'font-serif'} ${s.extraData?.style || 'normal'} drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] tracking-wide whitespace-nowrap`}>
                                        {s.content}
                                    </div>
                                )}

                                {/* Pure Emoji */}
                                {s.type === 'emoji' && (
                                    <div 
                                        style={{ 
                                            fontSize: '3.5rem',
                                            filter: 'drop-shadow(0px 6px 14px rgba(0,0,0,0.6))',
                                            lineHeight: 1
                                        }}
                                    >
                                        {s.content}
                                    </div>
                                )}

                                {/* 📍 Location Sticker */}
                                {s.type === 'location' && (
                                    <div className="bg-white text-[#e1306c] px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 shadow-2xl border border-pink-100 whitespace-nowrap">
                                        <MapPin size={18} fill="currentColor" />
                                        <span className="tracking-wide uppercase">{s.content}</span>
                                    </div>
                                )}

                                {/* 💬 Question Box Widget */}
                                {s.type === 'question' && (
                                    <div className="w-[240px] rounded-2xl overflow-hidden shadow-2xl border border-white/30 whitespace-normal">
                                        <div className={`bg-gradient-to-r ${s.bgColor || 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]'} p-3 text-white font-extrabold text-xs text-center flex flex-col items-center gap-1`}>
                                            <MessageSquareText size={18} />
                                            <span>{s.content}</span>
                                        </div>
                                        <div className="bg-white p-2.5 text-center text-gray-400 text-[11px] font-semibold">
                                            {s.subtext || 'Type something...'}
                                        </div>
                                    </div>
                                )}

                                {/* 😍 Emoji Reaction Slider Widget */}
                                {s.type === 'slider' && (
                                    <div className="w-[240px] bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 p-3 rounded-2xl text-white shadow-2xl border border-white/30 flex flex-col gap-2">
                                        <div className="font-extrabold text-xs text-center">{s.content}</div>
                                        <div className="bg-black/30 backdrop-blur-md rounded-full h-6 px-2 flex items-center relative">
                                            <div className="w-full bg-white/30 h-1.5 rounded-full relative">
                                                <div className="absolute right-2 -top-2.5 text-lg">
                                                    {s.extraData?.emoji || '😍'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ⏳ Countdown Widget */}
                                {s.type === 'countdown' && (
                                    <div className="w-[240px] bg-[#1a1a24] text-white p-3 rounded-2xl border border-white/30 shadow-2xl flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
                                            <Hourglass size={14} className="animate-spin" />
                                            <span>{s.content}</span>
                                        </div>
                                        <div className="flex gap-2 text-center">
                                            <div className="bg-white/10 px-2 py-1 rounded-lg">
                                                <div className="font-extrabold text-xs text-white">{s.extraData?.days || '02'}</div>
                                                <div className="text-[8px] text-white/50">DAYS</div>
                                            </div>
                                            <div className="text-white/40 self-center font-bold text-xs">:</div>
                                            <div className="bg-white/10 px-2 py-1 rounded-lg">
                                                <div className="font-extrabold text-xs text-white">{s.extraData?.hours || '14'}</div>
                                                <div className="text-[8px] text-white/50">HRS</div>
                                            </div>
                                            <div className="text-white/40 self-center font-bold text-xs">:</div>
                                            <div className="bg-white/10 px-2 py-1 rounded-lg">
                                                <div className="font-extrabold text-xs text-white">{s.extraData?.mins || '35'}</div>
                                                <div className="text-[8px] text-white/50">MINS</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 📸 Add Yours Widget */}
                                {s.type === 'addyours' && (
                                    <div className="bg-black/70 backdrop-blur-xl border border-white/40 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 whitespace-nowrap">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 flex items-center justify-center text-white">
                                            <Camera size={16} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-extrabold text-xs">{s.content}</div>
                                            <div className="text-[10px] text-white/60">{s.subtext}</div>
                                        </div>
                                    </div>
                                )}

                                {/* 🏷️ Mention Sticker */}
                                {s.type === 'mention' && (
                                    <div className={`bg-gradient-to-r ${s.bgColor || 'from-pink-500 to-rose-600'} text-white px-4 py-2 rounded-xl font-extrabold text-sm shadow-2xl flex items-center gap-1 border border-white/20 whitespace-nowrap`}>
                                        <AtSign size={16} />
                                        <span>{s.content.replace('@', '')}</span>
                                    </div>
                                )}

                                {/* # Hashtag Sticker */}
                                {s.type === 'hashtag' && (
                                    <div className="bg-[#262626] text-white px-4 py-2 rounded-xl font-black text-sm shadow-2xl border border-white/30 flex items-center gap-1 whitespace-nowrap">
                                        <Hash size={16} className="text-pink-500" />
                                        <span>{s.content.replace('#', '')}</span>
                                    </div>
                                )}

                                {/* ⏰ Time Stamp */}
                                {s.type === 'time' && (
                                    <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl font-mono font-black text-lg shadow-2xl border border-white/30 flex items-center gap-2 whitespace-nowrap">
                                        <Clock size={18} className="text-amber-400" />
                                        <span>{s.content}</span>
                                    </div>
                                )}

                                {/* Badge / Fallback */}
                                {s.type === 'badge' && (
                                    <div 
                                        className={`p-3 px-5 rounded-2xl shadow-2xl ${s.bgColor || 'bg-pink-500'} ${s.textColor || 'text-white'} font-bold border border-white/30 flex flex-col justify-center items-center text-center whitespace-nowrap`}
                                    >
                                        <span className="text-sm font-extrabold tracking-wide drop-shadow-md">{s.content}</span>
                                        {s.subtext && (
                                            <span className="text-[10px] opacity-80 font-medium tracking-widest uppercase mt-0.5 drop-shadow-sm">
                                                {s.subtext}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Tap Zones */}
                <div
                    className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer flex items-center justify-start pl-2"
                    onClick={goPrev}
                >
                    {currentIndex > 0 && (
                        <div className="opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ChevronLeft size={20} className="text-white" />
                            </div>
                        </div>
                    )}
                </div>
                <div
                    className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer flex items-center justify-end pr-2"
                    onClick={goNext}
                >
                    {currentIndex < stories.length - 1 && (
                        <div className="opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ChevronRight size={20} className="text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Flying Emoji Micro-Animations Container */}
                <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                    {flyingReactions.map(r => (
                        <div
                            key={r.id}
                            className="absolute bottom-24 text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] transition-all duration-1000 ease-out"
                            style={{
                                left: `${r.left}%`,
                                transform: 'translateY(-120px) scale(1.4)',
                                opacity: 0.95
                            }}
                        >
                            {r.emoji}
                        </div>
                    ))}
                </div>

                {/* Bottom Actions (for other users' stories) */}
                {!isOwner && (
                    <div 
                        className="absolute bottom-6 left-4 right-4 z-30"
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Quick Story Emoji Reactions */}
                        <div className="flex items-center justify-center gap-3 mb-2.5">
                            {['❤️', '🔥', '😂', '😮', '👏'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerReaction(emoji);
                                    }}
                                    className="w-10 h-10 rounded-full bg-black/50 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-all shadow-lg border border-white/10 cursor-pointer"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder={`Reply to ${displayName}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-white/50 px-4 py-3 rounded-full border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onFocus={() => setIsPaused(true)}
                                onBlur={() => setIsPaused(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && replyText.trim()) {
                                        handleSendReply();
                                    }
                                }}
                            />
                            <button
                                className={`p-3 backdrop-blur-md rounded-full transition-all ${isLiked ? 'bg-pink-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                onClick={handleLikeStory}
                            >
                                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                                onClick={handleSendReply}
                                disabled={!replyText.trim() || isSending}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        {/* Feedback Toast */}
                        {isSending && (
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full">
                                Sending...
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Actions (for own stories) */}
                {isOwner && (
                    <div className="absolute bottom-6 left-4 right-4 z-30 flex justify-between items-center gap-3">
                        {/* Expiry Badge */}
                        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white/80 px-4 py-2.5 rounded-full border border-white/10 text-xs font-semibold shadow-lg">
                            <span>⏳</span>
                            <span>
                                {(() => {
                                    const exp = (story as any).expiresAt;
                                    if (!exp) return 'Expires in 24h';
                                    const ms = new Date(exp).getTime() - Date.now();
                                    if (ms <= 0) return 'Expired';
                                    const h = Math.floor(ms / 3600000);
                                    const m = Math.floor((ms % 3600000) / 60000);
                                    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
                                })()}
                            </span>
                        </div>

                        {/* Views Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsViewsOpen(true); }}
                            className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-5 py-2.5 rounded-full hover:bg-black/70 transition-all border border-white/10 shadow-lg"
                        >
                            <Eye size={18} />
                            <span className="font-bold text-sm">{story.views?.length || 0} views</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Viewers Panel Overlay */}
            {isViewsOpen && (
                <div 
                    className="absolute inset-x-0 bottom-0 h-[60%] bg-black/95 backdrop-blur-xl rounded-t-3xl z-[1200] flex flex-col animate-in slide-in-from-bottom-full border-t border-white/10"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent story pausing
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-5 border-b border-white/10">
                        <div className="flex items-center gap-3 text-white">
                            <Eye size={20} />
                            <h3 className="font-bold">Viewers</h3>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{story.views?.length || 0} 👁️</span>
                            {(story.likes?.length > 0 || localLikes > 0) && (
                                <span className="bg-pink-500/30 px-2 py-0.5 rounded-full text-xs font-bold text-pink-300">
                                    {story.likes?.length || localLikes} ❤️
                                </span>
                            )}
                        </div>
                        <button onClick={() => setIsViewsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
                        {(!story.views || story.views.length === 0) ? (
                            <div className="flex flex-col items-center justify-center mt-16 gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                    <Eye size={28} className="text-white/40" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">No views yet</p>
                                    <p className="text-white/40 text-sm mt-1">Be patient — people are watching! 👀</p>
                                </div>
                            </div>
                        ) : (
                            [...story.views].reverse().map((viewer: any, idx: number) => {
                                // Relative time helper
                                const relTime = (() => {
                                    const ms = Date.now() - new Date(viewer.viewedAt).getTime();
                                    const m = Math.floor(ms / 60000);
                                    const h = Math.floor(m / 60);
                                    const d = Math.floor(h / 24);
                                    if (d > 0) return `${d}d ago`;
                                    if (h > 0) return `${h}h ago`;
                                    if (m > 0) return `${m}m ago`;
                                    return 'Just now';
                                })();
                                const exactTime = new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div 
                                        key={idx} 
                                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            if (viewer.userId) {
                                                setIsViewsOpen(false);
                                                if (onViewProfile) {
                                                    onViewProfile(viewer.userId);
                                                } else {
                                                    onClose();
                                                    router.push(`/profile/${viewer.userId}`);
                                                }
                                            }
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={viewer.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewer.name || 'User')}`}
                                                alt={viewer.name}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-white/20 bg-gray-800"
                                                onError={(e) => { const t = e.target as HTMLImageElement; t.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewer.name || 'U')}`; }}
                                            />
                                            {/* Online indicator dot */}
                                            {Array.isArray(onlineUsers) && onlineUsers.includes(viewer.userId) && (
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black animate-pulse" title="Online"></div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white text-sm truncate">{viewer.name}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-white/60 text-xs font-medium">{relTime}</span>
                                                <span className="text-white/30 text-xs">·</span>
                                                <span className="text-white/40 text-xs">{exactTime}</span>
                                            </div>
                                        </div>

                                        {/* View Profile Button */}
                                        {viewer.userId && (
                                            <span className="flex-shrink-0 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-full transition-all border border-indigo-500/30">
                                                View
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isConfirmingDelete && (
                <div 
                    className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-[#1e1e24] border border-white/20 p-6 rounded-3xl max-w-xs w-full text-center space-y-4 shadow-2xl">
                        <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-white font-extrabold text-lg">Delete Story?</h3>
                            <p className="text-white/60 text-xs mt-1">This story will be permanently removed from your profile and feed.</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsConfirmingDelete(false)}
                                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setIsConfirmingDelete(false);
                                    if (story?.id) {
                                        try {
                                            if (onDelete) {
                                                await onDelete(story.id);
                                            } else {
                                                await api.profile.deleteStory(story.id);
                                            }
                                            toast.success('Story deleted! 🗑️');
                                            
                                            const remaining = storiesList.filter(s => String(s.id) !== String(story.id));
                                            if (remaining.length > 0) {
                                                setStoriesList(remaining);
                                                setCurrentIndex(prev => Math.min(prev, remaining.length - 1));
                                            } else {
                                                onClose();
                                            }
                                        } catch (err: any) {
                                            toast.error(err.message || 'Failed to delete story');
                                        }
                                    }
                                }}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/30 cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden helper functions */}
            {null}
        </div>
    );

    async function handleSendReply() {
        if (!replyText.trim() || isSending) return;

        setIsSending(true);
        try {
            // Put encoded story texts inside the bracket as a third parameter (pristine story.url)
            const textsVal = story.texts && story.texts.length > 0 ? encodeURIComponent(JSON.stringify(story.texts)) : '';
            const cId = user.id;
            const cName = encodeURIComponent(user.name || user.full_name || 'User');
            const cPhoto = encodeURIComponent(user.photoUrl || user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`);
            const storyUrlEncoded = encodeURIComponent(story.url);
            const storyContext = `[STORY_REPLY:${storyUrlEncoded}:${story.type}:${textsVal}:${cId}:${cName}:${cPhoto}]${replyText}`;
            
            // Use Direct Message API (handles 3-message limit for unconnected users)
            await api.interactions.sendDirectMessage(user.id, storyContext);

            setReplyText('');
            toast.success('Reply sent! 🚀');
            setTimeout(() => setIsSending(false), 500);
        } catch (error: any) {
            console.error('Failed to send reply:', error);
            setIsSending(false);
            toast.error(error.message || 'Failed to send reply. Please try again.');
        }
    }

    async function handleLikeStory() {
        const newLiked = !isLiked;
        setIsLiked(newLiked);

        // Track likes count locally for optimistic UI
        setLocalLikes(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));

        // Persist to backend
        try {
            await api.profile.likeStory(user.id, story?.id, newLiked);
        } catch (e) {
            // Revert on error
            setIsLiked(!newLiked);
            setLocalLikes(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
        }

        // Also send real-time socket notification
        if (socket && newLiked) {
            socket.emit('storyLike', {
                to: user.id,
                from: currentUser?.id || currentUser?.userId,
                storyId: story?.id
            });
        }
    }

    if (mounted && typeof document !== 'undefined') {
        return createPortal(modalMarkup, document.body);
    }

    return modalMarkup;
};

export default StoryModal;

