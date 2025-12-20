import { useEffect, useState } from 'react';
import { Trash2, X, ChevronLeft, ChevronRight, Heart, Send, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

interface Story {
    id: string;
    url: string;
    type: 'image' | 'video';
    createdAt: string;
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
}

const StoryModal = ({ stories, initialIndex, user, onClose, currentUser, onDelete }: StoryModalProps) => {
    const { socket } = useSocket() as any;
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const story = stories[currentIndex];

    // Auto-advance Timer
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 100;
                return prev + 1;
            });
        }, 40);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused]);

    // Handle Story Completion
    useEffect(() => {
        if (progress >= 100) {
            if (currentIndex < stories.length - 1) {
                setCurrentIndex((prev: number) => prev + 1);
                setProgress(0);
            } else {
                onClose();
            }
        }
    }, [progress, currentIndex, stories.length, onClose]);

    const goNext = () => {
        if (currentIndex < stories.length - 1) {
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
        <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center animate-in fade-in duration-300">
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
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={avatarUrl}
                                className="w-11 h-11 rounded-full border-2 border-white shadow-lg object-cover"
                                alt={displayName}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div className="text-white">
                            <span className="font-bold text-sm drop-shadow-md">{displayName}</span>
                            <div className="flex items-center gap-1 text-xs text-white/70">
                                <span>{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>{currentIndex + 1}/{stories.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {user.id === currentUser?.id && (
                            <button
                                onClick={() => onDelete(story.id)}
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
                            src={story.url}
                            className="w-full h-full object-contain"
                            autoPlay
                            playsInline
                            muted={false}
                        />
                    ) : (
                        <img
                            src={story.url}
                            className="w-full h-full object-contain"
                            alt="Story"
                        />
                    )}
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
                {user.id !== currentUser?.id && (
                    <div className="absolute bottom-6 left-4 right-4 z-30">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder={`Reply to ${displayName}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-white/50 px-4 py-3 rounded-full border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                                onClick={(e) => e.stopPropagation()}
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
            </div>

            {/* Hidden helper functions */}
            {null}
        </div>
    );

    // Handler functions
    async function handleSendReply() {
        if (!replyText.trim() || isSending) return;

        setIsSending(true);
        try {
            // Send as a direct message via socket
            const storyContext = `📸 Replying to your story: "${replyText}"`;

            if (socket) {
                socket.emit('directMessage', {
                    to: user.id,
                    message: storyContext,
                    from: currentUser?.id
                });
            }

            setReplyText('');
            // Show brief success feedback
            setTimeout(() => setIsSending(false), 500);
        } catch (error) {
            console.error('Failed to send reply:', error);
            setIsSending(false);
        }
    }

    function handleLikeStory() {
        setIsLiked(!isLiked);

        // Send like notification via socket
        if (socket && !isLiked) {
            socket.emit('storyLike', {
                to: user.id,
                from: currentUser?.id,
                storyId: story?.id
            });
        }
    }
};

export default StoryModal;

