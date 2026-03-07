'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Download, Trash2, X, PlusCircle, CheckCircle2, Store, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const DEMO_STICKER_STORE = [
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.webp", // Heart Eyes
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/512.webp", // Alien
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f498/512.webp", // Heart with Arrow
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.webp", // Robot
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f427/512.webp", // Penguin
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp", // Fire
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp", // Party
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp", // Laughing Tears
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp", // Heart Eyes 2
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.webp", // Kissing Heart
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92a/512.webp", // Zany Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp", // Party Horn Face
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp", // Loudly Crying
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/512.webp", // Pouting/Angry
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f436/512.webp", // Dog
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f431/512.webp", // Cat
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/512.webp", // Unicorn
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a5/512.webp", // Collision/Explosion
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3b5/512.webp", // Musical Notes
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp"  // 100 symbol
];

export const getStickerAnimation = (url: string) => {
    // Native WebP animations are used now, no extra CSS needed.
    return '';
};

export default function StickerPicker({ onSelect, onClose }: { onSelect: (url: string) => void, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'mine' | 'store'>('mine');
    const [savedStickers, setSavedStickers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

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
        toast.success("Sticker saved!");

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

    return (
        <div className="absolute bottom-20 right-4 left-4 md:left-auto md:w-80 bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden z-[110] animate-in slide-in-from-bottom-5">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-gray-100 p-2 bg-gray-50/50">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('mine')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'mine' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Heart size={14} className={activeTab === 'mine' ? 'fill-indigo-500' : ''} />
                        My Stickers
                    </button>
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'store' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Store size={14} />
                        Store
                    </button>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                    <X size={16} />
                </button>
            </div>

            {/* Grid Area */}
            <div className="h-64 overflow-y-auto p-3 bg-gray-50/30">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activeTab === 'mine' ? (
                    savedStickers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <Store size={32} className="opacity-50" />
                            <p className="text-sm font-medium">No saved stickers</p>
                            <button
                                onClick={() => setActiveTab('store')}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mt-2"
                            >
                                Browse Store
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {savedStickers.map((url, i) => (
                                <div
                                    key={i}
                                    className="relative group aspect-square rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                                    onClick={() => onSelect(url)}
                                >
                                    <img src={url} className={`w-full h-full object-contain p-1 ${getStickerAnimation(url)}`} />

                                    {/* Delete Button (Visible on Hover in Desktop, always accessible via long press logic in mobile, but we use explicit button for simplicity) */}
                                    <button
                                        onClick={(e) => deleteSticker(url, e)}
                                        className="absolute top-1 right-1 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                                        title="Remove Sticker"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            ))}
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
                                    className={`relative group aspect-square rounded-xl bg-white border ${isSaved ? 'border-indigo-200' : 'border-gray-100'} overflow-hidden shadow-sm hover:shadow-md transition-all`}
                                >
                                    <img src={url} className={`w-full h-full object-contain p-1 ${getStickerAnimation(url)} ${isSaved ? 'opacity-50' : ''}`} />

                                    {isSaved ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                                            <CheckCircle2 size={24} className="text-green-500 drop-shadow-md" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => downloadSticker(url)}
                                            className="absolute bottom-1 right-1 p-1.5 bg-indigo-600 text-white rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                            title="Save Sticker"
                                        >
                                            <Download size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-2 text-center border-t border-gray-100 bg-gray-50/50">
                <p className="text-[10px] text-gray-400 font-medium">Click a sticker in your library to send it instantly.</p>
            </div>
        </div>
    );
}
