'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Download, Trash2, X, PlusCircle, CheckCircle2, Store, Heart, ArrowLeft, ArrowRight, Move } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const DEMO_STICKER_STORE = [
    // 52 100% Verified, Active Animated WebP Emojis
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.webp", // Heart Eyes
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/512.webp", // Alien
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f498/512.webp", // Heart with Arrow
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.webp", // Robot
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp", // Fire
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp", // Party
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp", // Laughing Tears
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp", // Heart Eyes 2
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.webp", // Kissing Heart
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92a/512.webp", // Zany Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp", // Party Horn Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp", // Loudly Crying
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.webp", // Pouting/Angry
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f431/512.webp", // Cat
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/512.webp", // Unicorn
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a5/512.webp", // Collision/Explosion
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp", // 100 symbol
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f649/512.webp", // Hear no evil
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64a/512.webp", // Speak no evil
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.webp", // See no evil
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f97a/512.webp", // Pleading face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp", // Star struck
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.webp", // Ghost
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a9/512.webp", // Poo
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp", // Rocket
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f6f8/512.webp", // Flying saucer
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1fae0/512.webp", // Melting Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp", // Sunglasses Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49e/512.webp", // Revolving Hearts
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4e3/512.webp", // Megaphone
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f485/512.webp", // Nail Polish
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.webp", // Hugging Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.webp", // Rolling on Floor Laughing
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92c/512.webp", // Swearing Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f971/512.webp", // Yawning Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f979/512.webp", // Holding Back Tears
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4ac/512.webp", // Speech Balloon
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4c8/512.webp", // Chart Increasing
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f50e/512.webp", // Magnifying Glass Right
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f480/512.webp", // Skull
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.webp", // Sparkling Heart
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49d/512.webp", // Heart with Ribbon
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92d/512.webp", // Face with Hand Over Mouth
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp", // Exploding Head
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f9e1/512.webp", // Orange Heart
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bb/512.webp", // Laptop
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48b/512.webp", // Kiss Mark
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp", // Grinning Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f606/512.webp", // Laughing Squint Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.webp", // Winking Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f61c/512.webp", // Winking Face with Tongue
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60f/512.webp"  // Smirking Face
];

export const getStickerAnimation = (url: string) => {
    // Native WebP animations are used now, no extra CSS needed.
    return '';
};

const LazySticker = ({ url, isSaved, isDragging }: { url: string; isSaved?: boolean; isDragging?: boolean }) => {
    return (
        <div className="w-full h-full flex items-center justify-center p-1">
            <img
                src={url}
                loading="lazy"
                decoding="async"
                width={128}
                height={128}
                className={`w-full h-full object-contain transition-all duration-300 ease-out transform group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-2 ${isSaved ? 'opacity-40' : 'opacity-100'} ${isDragging ? 'opacity-30' : ''}`}
                style={{
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.06))'
                }}
                alt="sticker"
            />
        </div>
    );
};

export default function StickerPicker({ onSelect, onClose }: { onSelect: (url: string) => void, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'mine' | 'store'>('mine');
    const [savedStickers, setSavedStickers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isArrangeMode, setIsArrangeMode] = useState(false);
    const toast = useToast();

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        fetchMyStickers();
    }, []);

    const fetchMyStickers = async () => {
        try {
            const me = await api.profile.getMe();
            setSavedStickers(me.savedStickers || []);
        } catch (e) {
            console.error("Failed to fetch stickers", e);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadSticker = async (url: string) => {
        if (savedStickers.includes(url)) {
            toast.success("Already saved!");
            return;
        }

        const newStickers = [url, ...savedStickers];
        setSavedStickers(newStickers);
        toast.success("Sticker added to Library!");

        try {
            await api.profile.updateProfile({ savedStickers: newStickers });
        } catch (e) {
            toast.error("Failed to save to cloud");
            setSavedStickers(savedStickers); // Revert
        }
    };

    const deleteSticker = async (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStickers = savedStickers.filter(s => s !== url);
        setSavedStickers(newStickers);
        toast.success("Sticker removed");

        try {
            await api.profile.updateProfile({ savedStickers: newStickers });
        } catch (e) {
            toast.error("Failed to delete from cloud");
            setSavedStickers(savedStickers); // Revert
        }
    };

    const handleDownloadWebp = async (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const parts = url.split('/');
            const emojiId = parts[parts.length - 2] || 'sticker';
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `sticker_${emojiId}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            toast.success("Saved to device downloads!");
        } catch (error) {
            console.error("Failed to download sticker file", error);
            window.open(url, '_blank');
        }
    };

    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };

    const handleDragEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        const newStickers = [...savedStickers];
        const draggedItemContent = newStickers[dragItem.current];
        
        newStickers.splice(dragItem.current, 1);
        newStickers.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;
        setSavedStickers(newStickers);
        
        try {
            await api.profile.updateProfile({ savedStickers: newStickers });
        } catch (err) {
            toast.error("Failed to save custom arrangement");
        }
    };

    const shiftSticker = async (index: number, direction: 'left' | 'right', e: React.MouseEvent) => {
        e.stopPropagation();
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= savedStickers.length) return;

        const newStickers = [...savedStickers];
        const temp = newStickers[index];
        newStickers[index] = newStickers[targetIndex];
        newStickers[targetIndex] = temp;

        setSavedStickers(newStickers);

        try {
            await api.profile.updateProfile({ savedStickers: newStickers });
        } catch (err) {
            toast.error("Failed to save custom arrangement");
        }
    };

    return (
        <div className="absolute bottom-20 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[110] animate-in slide-in-from-bottom-5">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex gap-1">
                    <button
                        onClick={() => {
                            setActiveTab('mine');
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'mine' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <Heart size={14} className={activeTab === 'mine' ? 'fill-indigo-500' : ''} />
                        My Stickers
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('store');
                            setIsArrangeMode(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'store' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <Store size={14} />
                        Store
                    </button>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full cursor-pointer">
                    <X size={16} />
                </button>
            </div>

            {/* Sub-Header / Arrange Mode Console */}
            {activeTab === 'mine' && savedStickers.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100/50 dark:border-indigo-900/30 text-[11px] select-none">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Move size={12} className={isArrangeMode ? "animate-pulse" : ""} />
                        {isArrangeMode ? "Drag cards or use arrows to sort" : "Your Library"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsArrangeMode(!isArrangeMode)}
                        className={`px-2.5 py-0.5 rounded-lg font-bold transition-all active:scale-95 shadow-sm border text-[10px] cursor-pointer ${
                            isArrangeMode 
                                ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        {isArrangeMode ? "Done" : "Arrange"}
                    </button>
                </div>
            )}

            {/* Grid Area */}
            <div className="h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800/30">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activeTab === 'mine' ? (
                    savedStickers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-3">
                            <Store size={32} className="opacity-50" />
                            <p className="text-sm font-medium">No saved stickers</p>
                            <button
                                onClick={() => setActiveTab('store')}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold mt-2 cursor-pointer"
                            >
                                Browse Store
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {savedStickers.map((url, i) => {
                                const isDraggingThis = dragItem.current === i;
                                return (
                                    <div
                                        key={i}
                                        draggable={isArrangeMode}
                                        onDragStart={() => handleDragStart(i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative group aspect-square rounded-xl bg-white dark:bg-gray-900 border overflow-hidden shadow-sm transition-all duration-300 select-none ${
                                            isArrangeMode 
                                                ? 'border-dashed border-amber-400 dark:border-amber-500 cursor-grab active:cursor-grabbing hover:scale-[1.02]' 
                                                : 'border-gray-100 dark:border-gray-800 cursor-pointer hover:scale-105 active:scale-95'
                                        } ${isDraggingThis ? 'opacity-30 border-indigo-500 bg-indigo-500/5' : ''}`}
                                        onClick={() => {
                                            if (isArrangeMode) return;
                                            onSelect(url);
                                        }}
                                    >
                                        <LazySticker url={url} isDragging={isDraggingThis} />

                                        {isArrangeMode ? (
                                            /* Tactile Touchscreen / Mobile Controls Bar */
                                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-md py-1 flex items-center justify-between px-1 border-t border-white/10 text-white animate-in fade-in slide-in-from-bottom-2 duration-200 z-10">
                                                <button
                                                    type="button"
                                                    disabled={i === 0}
                                                    onClick={(e) => shiftSticker(i, 'left', e)}
                                                    className="p-1 hover:bg-white/20 active:scale-90 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                                    title="Move Left"
                                                >
                                                    <ArrowLeft size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => deleteSticker(url, e)}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 active:scale-90 rounded-md transition-all cursor-pointer"
                                                    title="Remove Sticker"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={i === savedStickers.length - 1}
                                                    onClick={(e) => shiftSticker(i, 'right', e)}
                                                    className="p-1 hover:bg-white/20 active:scale-90 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                                    title="Move Right"
                                                >
                                                    <ArrowRight size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            /* Standard Mode Action Overlays (Download WebP & Delete Library) */
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDownloadWebp(url, e)}
                                                    className="absolute top-1 left-1 p-1 bg-indigo-600/90 hover:bg-indigo-750 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md z-10 cursor-pointer flex items-center justify-center"
                                                    title="Download WebP File"
                                                >
                                                    <Download size={10} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => deleteSticker(url, e)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-650 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md z-10 cursor-pointer flex items-center justify-center"
                                                    title="Remove Sticker"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    // Store Tab
                    <div className="grid grid-cols-4 gap-3">
                        {DEMO_STICKER_STORE.map((url, i) => {
                            const isSaved = savedStickers.includes(url);
                            return (
                                <div
                                    key={i}
                                    className={`relative group aspect-square rounded-xl bg-white dark:bg-gray-900 border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                                        isSaved ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/10 dark:bg-indigo-950/10' : 'border-gray-100 dark:border-gray-800'
                                    }`}
                                >
                                    <LazySticker url={url} isSaved={isSaved} />

                                    {/* Download WebP File directly from Store card */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDownloadWebp(url, e)}
                                        className="absolute top-1 left-1 p-1 bg-slate-900/80 border border-white/10 hover:bg-slate-950 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md z-10 cursor-pointer flex items-center justify-center"
                                        title="Download Sticker File"
                                    >
                                        <Download size={10} />
                                    </button>

                                    {isSaved ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/10 backdrop-blur-[0.5px] select-none pointer-events-none">
                                            <CheckCircle2 size={22} className="text-green-500 drop-shadow-md animate-in zoom-in-50 duration-300" />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => downloadSticker(url)}
                                            className="absolute bottom-1 right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg cursor-pointer flex items-center justify-center z-10"
                                            title="Add to Library"
                                        >
                                            <PlusCircle size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-2 text-center border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Click a sticker in your library to send it instantly.</p>
            </div>
        </div>
    );
}
