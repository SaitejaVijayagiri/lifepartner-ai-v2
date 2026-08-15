import React, { useState } from 'react';
import { X, Search, Sparkles, Smile, Tag, MapPin, MessageSquareText, SlidersHorizontal, Hourglass, Camera, AtSign, Hash, Clock } from 'lucide-react';

export interface StickerItem {
    type: 'emoji' | 'location' | 'question' | 'slider' | 'countdown' | 'addyours' | 'mention' | 'hashtag' | 'time' | 'badge';
    content: string;
    subtext?: string;
    bgColor?: string;
    textColor?: string;
    extraData?: any;
}

interface StoryStickerPickerProps {
    onSelectSticker: (sticker: StickerItem) => void;
    onClose: () => void;
}

const INSTAGRAM_STICKERS: StickerItem[] = [
    // 📍 Location Stickers
    { type: 'location', content: 'HYDERABAD', subtext: 'INDIA', bgColor: 'bg-white text-[#e1306c]', styleVariant: 'location' } as any,
    { type: 'location', content: 'BENGALURU', subtext: 'KARNATAKA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'MUMBAI', subtext: 'MAHARASHTRA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'DELHI', subtext: 'INDIA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'GOA VIBES', subtext: 'BEACH PARADISE', bgColor: 'bg-white text-[#e1306c]' } as any,

    // 💬 Question Box Widgets
    { type: 'question', content: 'Ask me a question! 💬', subtext: 'Type your question...', bgColor: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]' } as any,
    { type: 'question', content: 'Ideal first date? ☕', subtext: 'Coffee or Sunset Walk?', bgColor: 'from-[#4158D0] via-[#C850C0] to-[#FFCC70]' } as any,
    { type: 'question', content: 'Green flags only 🌿', subtext: 'What is your green flag?', bgColor: 'from-[#11998e] to-[#38ef7d]' } as any,

    // 😍 Emoji Reaction Sliders
    { type: 'slider', content: 'Rate this vibe! 🔥', extraData: { emoji: '😍', value: 80 } } as any,
    { type: 'slider', content: 'How cute is this? 💖', extraData: { emoji: '💖', value: 95 } } as any,
    { type: 'slider', content: 'Weekend mood 🥂', extraData: { emoji: '🥂', value: 90 } } as any,

    // ⏳ Countdown Timers
    { type: 'countdown', content: 'Date Night 🍷', extraData: { days: '02', hours: '14', mins: '35' } } as any,
    { type: 'countdown', content: 'Wedding Bell 🔔', extraData: { days: '12', hours: '08', mins: '40' } } as any,

    // 📸 Add Yours
    { type: 'addyours', content: 'Add Yours 📷', subtext: 'Share your smile' } as any,
    { type: 'addyours', content: 'Weekend Photo 🌅', subtext: 'Your current vibe' } as any,

    // 🏷️ Mentions & Hashtags
    { type: 'mention', content: '@soulmate', bgColor: 'from-pink-500 to-rose-600' } as any,
    { type: 'mention', content: '@lifepartner_ai', bgColor: 'from-purple-600 to-indigo-600' } as any,
    { type: 'hashtag', content: '#LoveInTheAir', bgColor: 'bg-[#262626]' } as any,
    { type: 'hashtag', content: '#PerfectMatch', bgColor: 'bg-[#262626]' } as any,

    // ⏰ Time Stamp
    { type: 'time', content: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } as any,
];

const EMOJI_CATEGORIES = [
    {
        name: 'Love & Romance',
        icon: '❤️',
        emojis: ['❤️', '💖', '💕', '💗', '💓', '💘', '💞', '💍', '🌹', '💐', '💋', '😘', '😍', '🥰', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👩‍❤️‍💋‍👨', '💌', '❣️']
    },
    {
        name: 'Sparkles & Vibes',
        icon: '✨',
        emojis: ['✨', '🌟', '💫', '⭐', '⚡', '🌈', '👑', '💎', '🔮', '🦄', '🎈', '🥂', '🍾', '🔥', '💯', '🌸', '🪷', '🦋', '🕶️', '🕊️']
    },
    {
        name: 'Party & Fun',
        icon: '🎉',
        emojis: ['🎉', '🥳', '🎊', '🍹', '🍿', '🍰', '🎂', '💃', '🕺', '🎶', '🎧', '🎸', '🥁', '🏆', '🥇', '🍕', '🍻', '🚀', '🎁', '🎯']
    },
    {
        name: 'Expressions & Reaction',
        icon: '😊',
        emojis: ['😂', '🤣', '🤩', '😎', '😋', '😜', '🤪', '🤠', '😇', '🤖', '👻', '🙈', '🤩', '🥹', '😏', '🫡', '🤗', '🥳', '🙌', '🫣']
    },
    {
        name: 'Desi Matrimony Special',
        icon: '🪔',
        emojis: ['💍', '👰', '🤵', '🕉️', '🧿', '🪔', '🌸', '🪷', '🥁', '🎶', '🇮🇳', '💐', '👑', '💎', '🌺', '🥭', '🎆', '✨', '🕌', '🦚']
    }
];

export default function StoryStickerPicker({ onSelectSticker, onClose }: StoryStickerPickerProps) {
    const [activeTab, setActiveTab] = useState<'ig_stickers' | 'emojis'>('ig_stickers');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStickers = INSTAGRAM_STICKERS.filter(s => 
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subtext && s.subtext.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col justify-end animate-in fade-in duration-200">
            <div className="bg-[#18181c] border-t border-white/15 rounded-t-3xl h-[82%] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#222228]">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-[#e1306c] animate-pulse" />
                        <h2 className="text-white font-extrabold text-lg tracking-wide">Instagram Story Stickers</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#18181c] px-4 pt-2">
                    <button
                        onClick={() => setActiveTab('ig_stickers')}
                        className={`flex-1 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'ig_stickers' 
                                ? 'border-[#e1306c] text-[#e1306c]' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Tag size={18} />
                        Instagram Widgets & Stickers
                    </button>
                    <button
                        onClick={() => setActiveTab('emojis')}
                        className={`flex-1 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'emojis' 
                                ? 'border-[#e1306c] text-[#e1306c]' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Smile size={18} />
                        Pure Emojis
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-[#18181c]">
                    <div className="relative flex items-center">
                        <Search size={18} className="absolute left-3.5 text-white/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={activeTab === 'ig_stickers' ? "Search Location, Question Box, Countdown..." : "Type any emoji or search..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#26262e] text-white placeholder-white/40 pl-10 pr-12 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#e1306c]/50 text-sm"
                        />
                        {searchQuery.trim().length > 0 && activeTab === 'emojis' && (
                            <button
                                onClick={() => {
                                    onSelectSticker({ type: 'emoji', content: searchQuery.trim() });
                                    onClose();
                                }}
                                className="absolute right-2 text-xs font-bold bg-[#e1306c] hover:bg-[#fd1d1d] text-white px-3 py-1.5 rounded-lg transition-all"
                            >
                                Add Emoji
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
                    {activeTab === 'ig_stickers' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredStickers.map((sticker, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onSelectSticker(sticker);
                                        onClose();
                                    }}
                                    className="hover:scale-[1.03] active:scale-95 transition-all cursor-pointer text-left flex justify-center items-center"
                                >
                                    {/* 📍 Location Sticker Render */}
                                    {sticker.type === 'location' && (
                                        <div className="bg-white text-[#e1306c] px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 shadow-xl border border-pink-100">
                                            <MapPin size={18} fill="currentColor" />
                                            <span className="tracking-wide uppercase">{sticker.content}</span>
                                        </div>
                                    )}

                                    {/* 💬 Question Box Widget Render */}
                                    {sticker.type === 'question' && (
                                        <div className="w-full max-w-[260px] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                                            <div className={`bg-gradient-to-r ${sticker.bgColor} p-3 text-white font-extrabold text-xs text-center flex flex-col items-center gap-1`}>
                                                <MessageSquareText size={18} />
                                                <span>{sticker.content}</span>
                                            </div>
                                            <div className="bg-white p-2.5 text-center text-gray-400 text-[11px] font-semibold">
                                                {sticker.subtext}
                                            </div>
                                        </div>
                                    )}

                                    {/* 😍 Emoji Reaction Slider Widget Render */}
                                    {sticker.type === 'slider' && (
                                        <div className="w-full max-w-[260px] bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 p-3.5 rounded-2xl text-white shadow-2xl border border-white/20 flex flex-col gap-2">
                                            <div className="font-extrabold text-xs text-center">{sticker.content}</div>
                                            <div className="bg-black/30 backdrop-blur-md rounded-full h-6 px-2 flex items-center relative">
                                                <div className="w-full bg-white/30 h-1.5 rounded-full relative">
                                                    <div className="absolute right-2 -top-2.5 text-lg animate-bounce">
                                                        {sticker.extraData?.emoji || '😍'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ⏳ Countdown Widget Render */}
                                    {sticker.type === 'countdown' && (
                                        <div className="w-full max-w-[260px] bg-[#1a1a24] text-white p-3.5 rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400">
                                                <Hourglass size={14} className="animate-spin" />
                                                <span>{sticker.content}</span>
                                            </div>
                                            <div className="flex gap-2 text-center">
                                                <div className="bg-white/10 px-2 py-1 rounded-lg">
                                                    <div className="font-extrabold text-sm text-white">{sticker.extraData?.days}</div>
                                                    <div className="text-[9px] text-white/50">DAYS</div>
                                                </div>
                                                <div className="text-white/40 self-center font-bold">:</div>
                                                <div className="bg-white/10 px-2 py-1 rounded-lg">
                                                    <div className="font-extrabold text-sm text-white">{sticker.extraData?.hours}</div>
                                                    <div className="text-[9px] text-white/50">HRS</div>
                                                </div>
                                                <div className="text-white/40 self-center font-bold">:</div>
                                                <div className="bg-white/10 px-2 py-1 rounded-lg">
                                                    <div className="font-extrabold text-sm text-white">{sticker.extraData?.mins}</div>
                                                    <div className="text-[9px] text-white/50">MINS</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 📸 Add Yours Widget Render */}
                                    {sticker.type === 'addyours' && (
                                        <div className="bg-black/60 backdrop-blur-xl border border-white/30 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 flex items-center justify-center text-white">
                                                <Camera size={16} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-extrabold text-xs">{sticker.content}</div>
                                                <div className="text-[10px] text-white/60">{sticker.subtext}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 🏷️ Mention Sticker */}
                                    {sticker.type === 'mention' && (
                                        <div className={`bg-gradient-to-r ${sticker.bgColor} text-white px-4 py-2 rounded-xl font-extrabold text-sm shadow-xl flex items-center gap-1 border border-white/20`}>
                                            <AtSign size={16} />
                                            <span>{sticker.content.replace('@', '')}</span>
                                        </div>
                                    )}

                                    {/* # Hashtag Sticker */}
                                    {sticker.type === 'hashtag' && (
                                        <div className="bg-[#262626] text-white px-4 py-2 rounded-xl font-black text-sm shadow-xl border border-white/20 flex items-center gap-1">
                                            <Hash size={16} className="text-pink-500" />
                                            <span>{sticker.content.replace('#', '')}</span>
                                        </div>
                                    )}

                                    {/* ⏰ Time Stamp */}
                                    {sticker.type === 'time' && (
                                        <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl font-mono font-black text-lg shadow-xl border border-white/30 flex items-center gap-2">
                                            <Clock size={18} className="text-amber-400" />
                                            <span>{sticker.content}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        EMOJI_CATEGORIES.map((category) => {
                            const filtered = category.emojis.filter(e => !searchQuery || e.includes(searchQuery));
                            if (filtered.length === 0) return null;
                            return (
                                <div key={category.name} className="space-y-3">
                                    <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <span>{category.icon}</span>
                                        <span>{category.name}</span>
                                    </h3>
                                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                                        {filtered.map((emoji, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    onSelectSticker({ type: 'emoji', content: emoji });
                                                    onClose();
                                                }}
                                                className="w-12 h-12 text-3xl flex items-center justify-center rounded-2xl hover:bg-white/15 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-white/5 border border-white/10 shadow-md"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
