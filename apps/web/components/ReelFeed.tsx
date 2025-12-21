'use client';
import { useToast } from '@/components/ui/Toast';
import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Share2, Volume2, VolumeX, Gift } from 'lucide-react';
import axios from 'axios';
import AdCard, { AdItem } from './AdCard';
import GoogleAdCard from './GoogleAdCard';
import GiftModal from './GiftModal';
import ReelItem from './ReelItem';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Interface moved to export at bottom

type FeedItem = Reel | AdItem;

export default function ReelFeed() {
    const toast = useToast();
    const [reels, setReels] = useState<FeedItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showComments, setShowComments] = useState<number | null>(null); // Index
    const [commentText, setCommentText] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [giftModal, setGiftModal] = useState<{ isOpen: boolean; userId: string; userName: string } | null>(null);

    // Animation state for double tap
    const [heartAnim, setHeartAnim] = useState<number | null>(null);
    const lastTap = useRef<number>(0);

    // Fetch Feed on Mount
    useEffect(() => {
        loadFeed();
    }, []);

    // Intersection Observer for Active Index
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        setActiveIndex(index);
                    }
                });
            },
            { threshold: 0.6 } // Trigger when 60% visible
        );

        // We need to wait for elements to be rendered. 
        // A simple timeout or dependency change handles this for now.
        const elements = document.querySelectorAll('.snap-child');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [reels.length]);

    const loadFeed = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/reels/feed`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawReels: Reel[] = res.data;
            const mixedFeed: FeedItem[] = [];

            rawReels.forEach((reel, index) => {
                mixedFeed.push(reel);
                // Inject Ad after every 5 reels (e.g. after index 4, 9, 14)
                if ((index + 1) % 5 === 0) {
                    mixedFeed.push({
                        id: `ad-google-${index}`,
                        type: 'google_ad',
                        title: "Sponsored",
                        description: "",
                        advertiserName: "Google",
                        advertiserAvatar: "",
                        contentUrl: "",
                        ctaLink: "",
                        ctaText: ""
                    } as any);
                }
            });

            setReels(mixedFeed);
        } catch (e) {
            console.error("Failed to load reels", e);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
            toast.error('Invalid file format. MP4, MOV, WEBM only.');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File too large (Max 100MB)');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('video', file);
            const token = localStorage.getItem('token');

            await axios.post(`${API_URL}/reels/upload`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Reel uploaded! 🚀');
            loadFeed(); // Refresh feed
        } catch (err: any) {
            toast.error(`Upload failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleLike = async (idx: number, reelId: string) => {
        // Optimistic UI Update
        setReels(prev => prev.map((r, i) => {
            if (i === idx) {
                if ('type' in r && r.type === 'ad') return r; // Skip Ad
                const reel = r as Reel;
                return {
                    ...reel,
                    isLiked: !reel.isLiked,
                    likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
                };
            }
            return r;
        }));

        // API Call
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/reels/${reelId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Like failed", e);
        }
    };

    const showHeartAnimation = (idx: number) => {
        setHeartAnim(idx);
        setTimeout(() => setHeartAnim(null), 800);
    };

    const handleDoubleTap = (idx: number, reelId: string) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            handleLike(idx, reelId);
            showHeartAnimation(idx); // Visual feedback
        }
        lastTap.current = now;
    };

    const toggleComments = async (idx: number, reelId: string) => {
        if ('type' in reels[idx] && (reels[idx] as any).type === 'ad') return;

        if (showComments === idx) {
            setShowComments(null);
        } else {
            setShowComments(idx);
            // Lazy load comments if not present
            const currentReel = reels[idx] as Reel;
            if (!currentReel.comments) {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/reels/${reelId}/comments`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setReels(prev => prev.map((r, i) => i === idx ? { ...r, comments: res.data } : r));
                } catch (e) { console.error(e); }
            }
        }
    };

    const handleComment = async (idx: number, reelId: string) => {
        if (!commentText.trim()) return;

        const text = commentText;
        setCommentText('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/reels/${reelId}/comment`, { text }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newComment = {
                id: res.data.id,
                text: res.data.text,
                user: 'You',
                userAvatar: ''
            };

            setReels(prev => prev.map((r, i) => {
                if (i === idx) {
                    if ('type' in r && r.type === 'ad') return r;
                    const reel = r as Reel;
                    return {
                        ...reel,
                        comments: [newComment, ...(reel.comments || [])],
                        commentCount: reel.commentCount + 1
                    };
                }
                return r;
            }));

        } catch (e) {
            toast.error("Failed to post comment");
        }
    };

    if (reels.length === 0) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center bg-gray-900 rounded-xl text-white relative overflow-hidden">
                {isUploading ? (
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                ) : (
                    <>
                        <p className="text-xl font-bold">No Reels Yet</p>
                        <p className="text-gray-400 mb-4">Be the first to post a vibe!</p>
                        <label className="cursor-pointer bg-gradient-to-r from-pink-500 to-red-500 px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                            <span>📹 Post First Reel</span>
                            <input type="file" className="hidden" onChange={handleUpload} />
                        </label>
                    </>
                )}
            </div>
        );
    }

    // Export interface for reuse
    return (
        <div className="relative h-full w-full max-w-[450px] mx-auto bg-black sm:rounded-2xl overflow-hidden shadow-2xl touch-pan-y">
            {/* Feed */}
            <div
                ref={scrollRef}
                className="h-full overflow-y-scroll snap-y snap-mandatory snap-always scrollbar-hide overscroll-contain"
            >
                {reels.map((item, idx) => {
                    const isItemActive = idx === activeIndex;

                    if ('type' in item && (item as any).type === 'google_ad') {
                        return (
                            <div key={item.id} data-index={idx} className="h-full w-full snap-start snap-child relative bg-black">
                                <GoogleAdCard isActive={isItemActive} />
                            </div>
                        );
                    }

                    if ('type' in item && item.type === 'ad') {
                        return (
                            <div key={item.id} data-index={idx} className="h-full w-full snap-start snap-child relative bg-black">
                                <AdCard ad={item} isActive={isItemActive} />
                            </div>
                        );
                    }

                    const reel = item as Reel;
                    return (
                        <div key={item.id} data-index={idx} className="h-full w-full snap-start snap-child relative bg-black">
                            <ReelItem
                                reel={reel}
                                isActive={isItemActive}
                                isMuted={isMuted}
                                toggleMute={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                handleDoubleTap={handleDoubleTap}
                                handleLike={handleLike}
                                toggleComments={toggleComments}
                                setGiftModal={setGiftModal}
                                index={idx}
                                showComments={showComments === idx}
                                setShowComments={setShowComments}
                                commentText={commentText}
                                setCommentText={setCommentText}
                                handleComment={handleComment}
                                heartAnim={heartAnim === idx}
                            />
                        </div>
                    );
                })}
            </div>

            {isUploading && (
                <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white">
                    <div className="animate-spin text-4xl mb-4">⏳</div>
                    <p className="font-bold">Uploading Reel...</p>
                </div>
            )}

            {giftModal && (
                <GiftModal
                    isOpen={giftModal.isOpen}
                    onClose={() => setGiftModal(null)}
                    toUserId={giftModal.userId}
                    toUserName={giftModal.userName}
                />
            )}

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .snap-child { scroll-snap-stop: always; }
            `}</style>
        </div>
    );
}

// Export Interfaces if needed by Item
export interface Reel {
    id: string;
    url: string;
    caption?: string;
    user: {
        id: string;
        name: string;
        photoUrl: string;
        age?: number;
        location?: { city: string };
        career?: { profession: string };
    };
    isMe: boolean;
    likes: number;
    isLiked: boolean;
    commentCount: number;
    comments?: { id: string; user: string; text: string; userAvatar?: string }[];
}
