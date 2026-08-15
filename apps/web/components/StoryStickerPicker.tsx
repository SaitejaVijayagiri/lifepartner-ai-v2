import React, { useState } from 'react';
import { X, Search, Sparkles, Smile, Tag, Heart, MapPin, MessageSquare, Clock } from 'lucide-react';

export interface StickerItem {
    type: 'emoji' | 'badge';
    content: string;
    subtext?: string;
    bgColor?: string;
    textColor?: string;
    styleVariant?: 'glass' | 'gold' | 'neon' | 'aesthetic' | 'prompt' | 'badge' | 'clock';
}

interface StoryStickerPickerProps {
    onSelectSticker: (sticker: StickerItem) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = [
    {
        name: 'Love & Romance',
        icon: '❤️',
        emojis: ['❤️', '💖', '💕', '💗', '💓', '💘', '💞', '💍', '🌹', '💐', '💋', '😘', '😍', '🥰', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👩‍❤️‍💋‍👨', '💌', '❣️']
    },
    {
        name: 'Vibes & Sparkles',
        icon: '✨',
        emojis: ['✨', '🌟', '💫', '⭐', '⚡', '🌈', '👑', '💎', '🔮', '🦄', '🎈', '🥂', '🍾', '🔥', '💯', '🌸', '🪷', '🦋', '🕶️', '🕊️']
    },
    {
        name: 'Party & Fun',
        icon: '🎉',
        emojis: ['🎉', '🥳', '🎊', '🍹', '🍿', '🍰', '🎂', '💃', '🕺', '🎶', '🎧', '🎸', '🥁', '🏆', '🥇', '🍕', '🍻', '🚀', '🎁', '🎯']
    },
    {
        name: 'Expressions & Moods',
        icon: '😊',
        emojis: ['😂', '🤣', '🤩', '😎', '😋', '😜', '🤪', '🤠', '😇', '🤖', '👻', '🙈', '🤩', '🥹', '😏', '🫡', '🤗', '🥳', '🙌', '🫣']
    },
    {
        name: 'Desi & Matrimony',
        icon: '🪔',
        emojis: ['💍', '👰', '🤵', '🕉️', '🧿', '🪔', '🌸', '🪷', '🥁', '🎶', '🇮🇳', '💐', '👑', '💎', '🌺', '🥭', '🎆', '✨', '🕌', '🦚']
    }
];

const PREMADE_STICKERS: StickerItem[] = [
    // 🌸 Aesthetic & Romantic Vibes
    { type: 'badge', content: '✧ Aesthetic Vibe ✧', subtext: 'frosted glow', bgColor: 'bg-white/20 backdrop-blur-xl border border-white/40', textColor: 'text-white font-serif tracking-widest', styleVariant: 'aesthetic' },
    { type: 'badge', content: '♡ Main Character ♡', subtext: 'feeling special', bgColor: 'bg-pink-500/25 backdrop-blur-xl border border-pink-400/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]', textColor: 'text-pink-100 font-sans', styleVariant: 'aesthetic' },
    { type: 'badge', content: 'golden hour ✨', subtext: 'sun-kissed energy', bgColor: 'bg-amber-500/30 backdrop-blur-xl border border-amber-300/40', textColor: 'text-amber-100 font-serif italic', styleVariant: 'aesthetic' },
    { type: 'badge', content: 'soulmate energy 🔮', subtext: 'written in the stars', bgColor: 'bg-purple-900/40 backdrop-blur-xl border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.4)]', textColor: 'text-purple-200 font-sans', styleVariant: 'aesthetic' },
    { type: 'badge', content: 'cherished moments 🎞️', subtext: 'vintage memory', bgColor: 'bg-stone-900/60 backdrop-blur-md border border-stone-400/30', textColor: 'text-stone-200 font-mono', styleVariant: 'aesthetic' },
    { type: 'badge', content: 'cozy coffee date ☕', subtext: 'good vibes & warm talks', bgColor: 'bg-amber-900/40 backdrop-blur-md border border-amber-500/30', textColor: 'text-amber-200', styleVariant: 'aesthetic' },
    
    // 💘 Compatibility & Matrimony Seals
    { type: 'badge', content: '98% Vibe Match 💖', subtext: 'High Compatibility', bgColor: 'bg-gradient-to-r from-pink-600 via-rose-500 to-red-500 border border-white/30 shadow-[0_0_25px_rgba(244,63,94,0.5)]', textColor: 'text-white font-extrabold', styleVariant: 'gold' },
    { type: 'badge', content: 'Approved by Mom & Dad 👨‍👩‍👧‍👦', subtext: 'Desi Blessing Seal', bgColor: 'bg-gradient-to-r from-emerald-600 to-teal-700 border border-amber-300/60 shadow-lg', textColor: 'text-amber-100 font-bold', styleVariant: 'gold' },
    { type: 'badge', content: 'Kundali Matched 🔮 100%', subtext: 'Celestial Blessing', bgColor: 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-700 border border-amber-300/80 shadow-[0_0_30px_rgba(245,158,11,0.6)]', textColor: 'text-amber-100 font-bold', styleVariant: 'gold' },
    { type: 'badge', content: 'Looking for My Forever 💍', subtext: 'Serious Connection', bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-800 border border-blue-300/40', textColor: 'text-blue-100 font-bold', styleVariant: 'badge' },
    { type: 'badge', content: 'Marry Me Material 👑', subtext: 'Wife/Husband Vibe', bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600 border border-yellow-200/70', textColor: 'text-slate-950 font-black', styleVariant: 'gold' },
    { type: 'badge', content: 'Future Homie 🏡', subtext: 'Home & Heart', bgColor: 'bg-gradient-to-r from-orange-600 to-red-600 border border-orange-300/40', textColor: 'text-white font-bold', styleVariant: 'badge' },

    // 💬 Aesthetic Q&A & Prompts
    { type: 'badge', content: 'ask me anything 💬', subtext: 'Tap to reply in DM', bgColor: 'bg-white/15 backdrop-blur-2xl border border-white/40 shadow-2xl', textColor: 'text-white font-semibold', styleVariant: 'prompt' },
    { type: 'badge', content: 'ideal first date? ☕', subtext: 'Coffee or Sunset Walk?', bgColor: 'bg-indigo-900/40 backdrop-blur-xl border border-indigo-400/40', textColor: 'text-indigo-200', styleVariant: 'prompt' },
    { type: 'badge', content: 'green flags only 🌿', subtext: 'Kindness, Humor & Respect', bgColor: 'bg-emerald-950/40 backdrop-blur-xl border border-emerald-400/40', textColor: 'text-emerald-300', styleVariant: 'prompt' },

    // 📍 Aesthetic City Vibe Badges
    { type: 'badge', content: 'HYDERABAD BIRYANI & CHAI 🥘', subtext: 'City of Nawabs', bgColor: 'bg-gradient-to-r from-amber-600 to-red-700 border border-amber-300/50', textColor: 'text-amber-100 font-bold', styleVariant: 'badge' },
    { type: 'badge', content: 'NAMMA BENGALURU ☕', subtext: 'Garden City Vibe', bgColor: 'bg-gradient-to-r from-emerald-600 to-teal-800 border border-emerald-300/50', textColor: 'text-emerald-100 font-bold', styleVariant: 'badge' },
    { type: 'badge', content: 'DILWALI DILLI 🏛️', subtext: 'Capital Romance', bgColor: 'bg-gradient-to-r from-rose-600 to-pink-700 border border-rose-300/50', textColor: 'text-rose-100 font-bold', styleVariant: 'badge' },
    { type: 'badge', content: 'AMCHI MUMBAI 🌊', subtext: 'Sea Breeze & Dreams', bgColor: 'bg-gradient-to-r from-cyan-600 to-blue-800 border border-cyan-300/50', textColor: 'text-cyan-100 font-bold', styleVariant: 'badge' },

    // 🕒 Live Stamp
    { type: 'badge', content: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ☀️`, subtext: 'LIVE STAMP', bgColor: 'bg-black/60 backdrop-blur-xl border border-white/30', textColor: 'text-white font-mono font-bold', styleVariant: 'clock' },
];

export default function StoryStickerPicker({ onSelectSticker, onClose }: StoryStickerPickerProps) {
    const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPremade = PREMADE_STICKERS.filter(s => 
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subtext && s.subtext.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col justify-end animate-in fade-in duration-200">
            <div className="bg-[#121215] border-t border-white/15 rounded-t-3xl h-[80%] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1c1c20]">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-pink-400 animate-pulse" />
                        <h2 className="text-white font-bold text-lg tracking-wide">Aesthetic Story Stickers</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#121215] px-4 pt-2">
                    <button
                        onClick={() => setActiveTab('stickers')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'stickers' 
                                ? 'border-pink-500 text-pink-400' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Tag size={18} />
                        Aesthetic Cards & Stickers
                    </button>
                    <button
                        onClick={() => setActiveTab('emojis')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'emojis' 
                                ? 'border-pink-500 text-pink-400' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Smile size={18} />
                        Curated Emojis
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-[#121215]">
                    <div className="relative flex items-center">
                        <Search size={18} className="absolute left-3.5 text-white/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={activeTab === 'stickers' ? "Search aesthetic cards, vibes, matrimony seals..." : "Type any emoji or search..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#202025] text-white placeholder-white/40 pl-10 pr-12 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500/50 text-sm"
                        />
                        {searchQuery.trim().length > 0 && activeTab === 'emojis' && (
                            <button
                                onClick={() => {
                                    onSelectSticker({ type: 'emoji', content: searchQuery.trim() });
                                    onClose();
                                }}
                                className="absolute right-2 text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg transition-all"
                            >
                                Add Emoji
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                    {activeTab === 'stickers' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {filteredPremade.map((sticker, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onSelectSticker(sticker);
                                        onClose();
                                    }}
                                    className={`p-4 rounded-2xl ${sticker.bgColor} ${sticker.textColor} shadow-xl hover:scale-[1.03] active:scale-95 transition-all text-left flex flex-col justify-between cursor-pointer group relative overflow-hidden`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="font-bold text-sm tracking-wide drop-shadow-md">{sticker.content}</span>
                                        <Sparkles size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    {sticker.subtext && (
                                        <span className="text-[11px] opacity-75 font-medium mt-1 tracking-wider uppercase drop-shadow-sm">
                                            {sticker.subtext}
                                        </span>
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
