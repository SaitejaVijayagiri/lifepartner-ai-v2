import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, ChevronLeft, ChevronRight, Heart, Send, MessageCircle, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

interface Story {
    id: string;
    url: string;
    type: 'image' | 'video';
    createdAt: string;
    expiresAt?: string;
    music?: string;
    views?: { userId: string, name: string, photoUrl: string, viewedAt: string }[];
    likes?: { userId: string, name: string, likedAt: string }[];
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
    initialIndex: number;
    user: User;
    currentUser: any;
    onClose: () => void;
    onDelete: (storyId: string) => void;
    onViewProfile?: (userId: string, userName?: string, userPhotoUrl?: string) => void;
}

const StoryModal = ({ stories = [], initialIndex = 0, user, onClose, currentUser, onDelete, onViewProfile }: StoryModalProps) => {
    const router = useRouter();
    const { socket, onlineUsers } = useSocket() as any;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isViewsOpen, setIsViewsOpen] = useState(false);
    const [localLikes, setLocalLikes] = useState(0);
    const story = (stories && stories[currentIndex]) ? (stories[currentIndex] as any) : null;

    // Resolve currentUser's ID — backend /profile/me returns 'userId', not 'id'
    const currentUserId = currentUser?.id || currentUser?.userId;
    // isOwner = true when this story belongs to the logged-in user
    const isOwner = !!currentUserId && (user.id === currentUserId);
    
    // Audio and Video Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const MUSIC_TRACKS: Record<string, { name: string, url: string }> = {
        'lofi': { name: 'Chill Lo-Fi ☕', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
        'romantic': { name: 'Romantic Piano 💖', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3' },
        'upbeat': { name: 'Upbeat Pop 🕺', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
        'cinematic': { name: 'Epic Vibe 🎬', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
        'acoustic': { name: 'Acoustic Guitar 🎸', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3' },
        'electronic': { name: 'Electronic 🎧', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
        'bollywood': { name: 'Desi Beats 🥁', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
        'devotional': { name: 'Devotional Flute 🕉️', url: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_9bc6b3a0cc.mp3' },
        'pop': { name: 'Summer Pop ☀️', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        'jazz': { name: 'Midnight Jazz 🎷', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
        'retro': { name: 'Synthwave Retro ⚡', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
        'classical': { name: 'Symphony Classic 🎻', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
        'rock': { name: 'Energetic Rock 🎸', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
        'chillout': { name: 'Ambient Chillout 🌊', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
        'party': { name: 'Club Party Beat 🔥', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
    };

    // Handle Music Playback
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (story && story.music && MUSIC_TRACKS[story.music]) {
            const track = MUSIC_TRACKS[story.music];
            audioRef.current = new Audio(track.url);
            audioRef.current.volume = 0.5;
            audioRef.current.loop = true;
            
            if (!isPaused) {
                audioRef.current.play().catch(e => console.log('Audio autoplay prevented:', e));
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
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

    // Auto-advance Timer (Only for Images)
    useEffect(() => {
        if (!story || isPaused || story.type === 'video') return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 100;
                return prev + 1;
            });
        }, 40);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused, story?.type]);

    // Track View when Story Changes
    useEffect(() => {
        if (!story || !story.id) return;
        setIsViewsOpen(false); // Close views panel if story changes
        if (currentUser && !isOwner) {
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

    return (
        <div className="fixed inset-0 z-[1100] bg-black flex items-center justify-center animate-in fade-in duration-300">
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none z-10"></div>

            {/* Story Container */}
            <div
                className="relative w-full h-full max-w-lg mx-auto flex flex-col"
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
                                    {story.music && MUSIC_TRACKS[story.music] && (
                                        <div className="flex items-center gap-1 text-[10px] text-white mt-0.5 overflow-hidden w-32">
                                            <span className="animate-pulse">🎵</span>
                                            <div className="whitespace-nowrap animate-[marquee_5s_linear_infinite]">
                                                {MUSIC_TRACKS[story.music].name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    <div className="flex gap-2">
                        {isOwner && (
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this story?')) {
                                        onDelete(story.id);
                                    }
                                }}
                                className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-full text-white backdrop-blur-sm transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Story Content */}
                <div className="flex-1 flex items-center justify-center">
                    {story.type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={story.url}
                            className="w-full h-full object-contain"
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
                            className="w-full h-full object-contain"
                            alt="Story"
                        />
                    )}
                    
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
            const storyContext = `[STORY_REPLY:${story.url}:${story.type}:${textsVal}:${cId}:${cName}:${cPhoto}]${replyText}`;
            
            // Use Direct Message API (handles 3-message limit for unconnected users)
            await api.interactions.sendDirectMessage(user.id, storyContext);

            setReplyText('');
            // Show brief success feedback
            setTimeout(() => setIsSending(false), 500);
        } catch (error: any) {
            console.error('Failed to send reply:', error);
            setIsSending(false);
            if (error.message) {
                alert(error.message); // Show the "Limit Reached" message
            } else {
                alert('Failed to send reply. Please try again.');
            }
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
};

export default StoryModal;

