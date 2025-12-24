import { memo, useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Share2, Volume2, VolumeX, Gift } from 'lucide-react';
import { Reel } from './ReelFeed'; // We'll export interface from parent or redefine
import GoogleAdCard from './GoogleAdCard';
import AdCard, { AdItem } from './AdCard';

// Redefine interfaces locally if needed to avoid circular deps, or import
interface ReelItemProps {
    reel: Reel;
    isActive: boolean;
    isMuted: boolean;
    toggleMute: (e: React.MouseEvent) => void;
    handleDoubleTap: (idx: number, id: string) => void;
    handleLike: (idx: number, id: string) => void;
    toggleComments: (idx: number, id: string) => void;
    setGiftModal: (data: any) => void;
    index: number;
    showComments: boolean;
    commentText: string;
    setCommentText: (text: string) => void;
    handleComment: (idx: number, id: string) => void;
    setShowComments: (idx: number | null) => void;
    heartAnim: boolean;
    shouldPreload: boolean; // Smart Preloading control
    handleView: (id: string) => void; // Analytics
    onCheckProfile: () => void;
}

const ReelItem = memo(({
    reel, isActive, isMuted, toggleMute, handleDoubleTap,
    handleLike, toggleComments, setGiftModal, index,
    showComments, commentText, setCommentText, handleComment,
    setShowComments, heartAnim, shouldPreload, handleView, onCheckProfile
}: ReelItemProps) => {

    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);
    const viewedRef = useRef(false);

    // Smart Playback & View Tracking
    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        // console.log('Autoplay prevented/paused', e);
                    });
                }

                // Track View after 2 seconds of playback
                if (!viewedRef.current) {
                    const timer = setTimeout(() => {
                        handleView(reel.id);
                        viewedRef.current = true;
                    }, 2000);
                    return () => clearTimeout(timer);
                }
            } else {
                videoRef.current.pause();
                if (!shouldPreload) {
                    videoRef.current.currentTime = 0; // Free up decoder resources if not preloading
                }
            }
        }
    }, [isActive, shouldPreload, reel.id, handleView]);

    return (
        <div
            className="h-full w-full relative bg-gray-900 select-none"
            onClick={() => handleDoubleTap(index, reel.id)}
        >
            {hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500 z-10">
                    <VolumeX size={48} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold">Video Unavailable</p>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    src={reel.url}
                    className="w-full h-full object-cover pointer-events-none"
                    loop
                    muted={isMuted}
                    playsInline
                    preload={shouldPreload ? "auto" : "none"}
                    onError={() => setHasError(true)}
                />
            )}

            {/* Centered Heart Animation */}
            {heartAnim && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in zoom-in-50 fade-out duration-700">
                    <Heart size={100} className="fill-white text-white drop-shadow-2xl" />
                </div>
            )}

            {/* Mute Button */}
            <button
                onClick={toggleMute}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-colors"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Actions (Right) */}
            <div className="absolute right-3 bottom-24 flex flex-col gap-6 z-10 items-center pointer-events-auto">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleLike(index, reel.id);
                    }}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${reel.isLiked ? 'bg-red-500/80 scale-110' : 'bg-black/40 hover:bg-black/60'}`}>
                        <Heart size={24} className={reel.isLiked ? 'fill-white text-white' : 'text-white'} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">{reel.likes}</span>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleComments(index, reel.id);
                    }}
                    className="flex flex-col items-center gap-1"
                >
                    <div className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                        <MessageCircle size={24} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">{reel.commentCount}</span>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setGiftModal({ isOpen: true, userId: reel.user.id, userName: reel.user.name });
                    }}
                    className="flex flex-col items-center gap-1"
                >
                    <div className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                        <Gift size={24} className="text-pink-500" />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-md">Gift</span>
                </button>

                <button className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors">
                    <Share2 size={24} className="text-white" />
                </button>
            </div>

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pb-8 pointer-events-none">
                <div
                    className="flex items-center gap-3 mb-3 pointer-events-auto cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onCheckProfile(); }}
                >
                    <img src={reel.user.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.user.id}`} className="w-10 h-10 rounded-full border border-white/50" />
                    <div>
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            {reel.user.name}
                            {reel.isMe && <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">YOU</span>}
                        </h3>
                        <p className="text-xs text-gray-300">{reel.user.location?.city || "India"}</p>
                    </div>
                    {!reel.isMe && (
                        <button className="ml-auto bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-indigo-700 pointer-events-auto transition-colors">
                            Follow
                        </button>
                    )}
                </div>
                {reel.caption && <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>}
            </div>

            {/* Comments Modal */}
            {showComments && (
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-black/95 z-30 rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-300 pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-white font-bold">Comments ({reel.commentCount})</h3>
                        <button onClick={() => setShowComments(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {reel.comments?.map((c, cIdx) => (
                            <div key={cIdx} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {c.user[0]}
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-bold mb-0.5">{c.user}</p>
                                    <p className="text-white text-sm">{c.text}</p>
                                </div>
                            </div>
                        ))}
                        {(!reel.comments || reel.comments.length === 0) && (
                            <p className="text-center text-gray-500 text-sm mt-10">No comments yet.</p>
                        )}
                    </div>

                    <div className="p-3 border-t border-white/10 flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(index, reel.id)}
                        />
                        <button onClick={() => handleComment(index, reel.id)} className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ReelItem;
