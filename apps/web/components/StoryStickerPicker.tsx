import React, { useState } from 'react';
import { X, Search, Sparkles, Smile, Tag } from 'lucide-react';

export interface StickerItem {
    type: 'emoji' | 'badge';
    content: string;
    bgColor?: string;
    textColor?: string;
}

interface StoryStickerPickerProps {
    onSelectSticker: (sticker: StickerItem) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = [
    {
        name: 'Love & Romance',
        icon: '❤️',
        emojis: ['❤️', '💖', '💕', '💗', '💓', '💘', '💞', '💍', '🌹', '💐', '💋', '😘', '😍', '🥰', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '👩‍❤️‍💋‍👨', '💌']
    },
    {
        name: 'Vibes & Sparkles',
        icon: '✨',
        emojis: ['✨', '🌟', '💫', '⭐', '⚡', '🌈', '👑', '💎', '🔮', '🦄', '🎈', '🥂', '🍾', '🔥', '💯', '🌸', '🪷', '🦋', '🕶️']
    },
    {
        name: 'Party & Fun',
        icon: '🎉',
        emojis: ['🎉', '🥳', '🎊', '🍹', '🍿', '🍰', '🎂', '💃', '🕺', '🎶', '🎧', '🎸', '🥁', '🏆', '🥇', '🍕', '🍻', '🚀', '🎁']
    },
    {
        name: 'Expressions',
        icon: '😊',
        emojis: ['😂', '🤣', '🤩', '😎', '😋', '😜', '🤪', '🤠', '😇', '🤖', '👻', '🙈', '🤩', '🥹', '😏', '🫡', '🤗', '🥳', '🙌']
    },
    {
        name: 'Desi & Matrimony',
        icon: '🪔',
        emojis: ['💍', '👰', '🤵', '🕉️', '🧿', '🪔', '🌸', '🪷', '🥁', '🎶', '🇮🇳', '💐', '👑', '💎', '🌺', '🥭', '🎆', '✨', '🕌']
    }
];

const PREMADE_STICKERS: StickerItem[] = [
    { type: 'badge', content: 'JUST MARRIED 💍', bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500', textColor: 'text-white' },
    { type: 'badge', content: 'PERFECT MATCH 💘', bgColor: 'bg-gradient-to-r from-purple-600 to-pink-500', textColor: 'text-white' },
    { type: 'badge', content: 'SOULMATE 💕', bgColor: 'bg-gradient-to-r from-red-500 to-pink-500', textColor: 'text-white' },
    { type: 'badge', content: 'DESI VIBES 🪷', bgColor: 'bg-gradient-to-r from-amber-500 to-orange-600', textColor: 'text-white' },
    { type: 'badge', content: 'MAIN CHARACTER 🌟', bgColor: 'bg-gradient-to-r from-yellow-400 to-amber-500', textColor: 'text-black font-extrabold' },
    { type: 'badge', content: 'QUEEN 👑', bgColor: 'bg-gradient-to-r from-fuchsia-600 to-purple-600', textColor: 'text-white' },
    { type: 'badge', content: 'KING 👑', bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-700', textColor: 'text-white' },
    { type: 'badge', content: 'GOOD VIBES ONLY ✨', bgColor: 'bg-gradient-to-r from-emerald-400 to-teal-600', textColor: 'text-white' },
    { type: 'badge', content: 'PARTY TIME 🎉', bgColor: 'bg-gradient-to-r from-violet-600 to-indigo-600', textColor: 'text-white' },
    { type: 'badge', content: 'DATE NIGHT 🥂', bgColor: 'bg-gradient-to-r from-rose-600 to-red-600', textColor: 'text-white' },
    { type: 'badge', content: 'LOVE AT FIRST SIGHT 💖', bgColor: 'bg-gradient-to-r from-pink-600 to-red-500', textColor: 'text-white' },
    { type: 'badge', content: 'VIBING 🎧', bgColor: 'bg-gradient-to-r from-cyan-500 to-blue-600', textColor: 'text-white' },
    { type: 'badge', content: 'HAPPY HOUR 🍸', bgColor: 'bg-gradient-to-r from-amber-400 to-pink-500', textColor: 'text-white' },
    { type: 'badge', content: 'FOREVER & ALWAYS ♾️', bgColor: 'bg-gradient-to-r from-slate-900 to-purple-900 border border-purple-400/30', textColor: 'text-purple-200' },
];

export default function StoryStickerPicker({ onSelectSticker, onClose }: StoryStickerPickerProps) {
    const [activeTab, setActiveTab] = useState<'emojis' | 'stickers'>('emojis');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPremade = PREMADE_STICKERS.filter(s => 
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col justify-end animate-in fade-in duration-200">
            <div className="bg-[#18181b] border-t border-white/10 rounded-t-3xl h-[75%] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#202024]">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-yellow-400" />
                        <h2 className="text-white font-bold text-lg">Stickers & Emojis</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#18181b] px-4 pt-2">
                    <button
                        onClick={() => setActiveTab('emojis')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'emojis' 
                                ? 'border-pink-500 text-pink-400' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Smile size={18} />
                        Emojis
                    </button>
                    <button
                        onClick={() => setActiveTab('stickers')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'stickers' 
                                ? 'border-pink-500 text-pink-400' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Tag size={18} />
                        Badges & Stickers
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-[#18181b]">
                    <div className="relative flex items-center">
                        <Search size={18} className="absolute left-3.5 text-white/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={activeTab === 'emojis' ? "Type any emoji or search..." : "Search stickers..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#27272a] text-white placeholder-white/40 pl-10 pr-12 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-pink-500/50 text-sm"
                        />
                        {searchQuery.trim().length > 0 && activeTab === 'emojis' && (
                            <button
                                onClick={() => {
                                    onSelectSticker({ type: 'emoji', content: searchQuery.trim() });
                                    onClose();
                                }}
                                className="absolute right-2 text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg transition-all"
                            >
                                Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                    {activeTab === 'emojis' ? (
                        EMOJI_CATEGORIES.map((category) => {
                            const filtered = category.emojis.filter(e => !searchQuery || e.includes(searchQuery));
                            if (filtered.length === 0) return null;
                            return (
                                <div key={category.name} className="space-y-3">
                                    <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <span>{category.icon}</span>
                                        <span>{category.name}</span>
                                    </h3>
                                    <div className="grid grid-cols-6 gap-3">
                                        {filtered.map((emoji, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    onSelectSticker({ type: 'emoji', content: emoji });
                                                    onClose();
                                                }}
                                                className="w-12 h-12 text-3xl flex items-center justify-center rounded-2xl hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer bg-white/5 border border-white/5"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredPremade.map((sticker, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onSelectSticker(sticker);
                                        onClose();
                                    }}
                                    className={`p-4 rounded-2xl ${sticker.bgColor} ${sticker.textColor} shadow-lg hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2 border border-white/20 cursor-pointer`}
                                >
                                    <span className="font-bold text-sm tracking-wide drop-shadow-sm">{sticker.content}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
