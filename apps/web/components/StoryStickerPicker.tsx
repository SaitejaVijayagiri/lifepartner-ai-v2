import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Smile, Tag, MapPin, MessageSquareText, Hourglass, Camera, AtSign, Hash, Clock, Gift, Image as ImageIcon, Flame, Heart } from 'lucide-react';

export interface StickerItem {
    type: 'giphy' | 'aesthetic_text' | 'doodle' | 'image' | 'emoji' | 'location' | 'question' | 'slider' | 'countdown' | 'addyours' | 'mention' | 'hashtag' | 'time' | 'badge';
    content: string;
    subtext?: string;
    bgColor?: string;
    textColor?: string;
    extraData?: any;
    imageUrl?: string;
}

interface StoryStickerPickerProps {
    onSelectSticker: (sticker: StickerItem) => void;
    onClose: () => void;
}

// Curated Aesthetic Calligraphy & Hand-Drawn Doodle Stickers (Matching Screenshots)
const AESTHETIC_CALLIGRAPHY_STICKERS: StickerItem[] = [
    // 🎂 Birthday Aesthetic (Screenshot 1)
    { type: 'aesthetic_text', content: 'happy birthday', subtext: 'cursive pink', textColor: 'text-pink-300', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'birthday girl ♡', subtext: 'handwritten white', textColor: 'text-white', extraData: { font: 'font-mono', style: 'bold' } },
    { type: 'aesthetic_text', content: 'Birthday BOY ✨', subtext: 'aesthetic white', textColor: 'text-white', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'HAPPY BIRTHDAY', subtext: 'pastel mint', textColor: 'text-emerald-300', extraData: { font: 'font-sans', style: 'bold' } },
    { type: 'aesthetic_text', content: 'celebrate 🎉', subtext: 'cursive gold', textColor: 'text-amber-300', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'make a wish ✨', subtext: 'cream white', textColor: 'text-orange-200', extraData: { font: 'font-mono', style: 'normal' } },

    // ☕ Cozy & Boho Doodles (Screenshot 2 & 3)
    { type: 'aesthetic_text', content: 'thank you!', subtext: 'handwritten orange', textColor: 'text-orange-400', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'new post ☀️', subtext: 'bold yellow sun', textColor: 'text-amber-400', extraData: { font: 'font-mono', style: 'bold' } },
    { type: 'aesthetic_text', content: 'MY MORNING ☕', subtext: 'hand-drawn beige', textColor: 'text-[#d4a373]', extraData: { font: 'font-serif', style: 'bold' } },
    { type: 'aesthetic_text', content: 'currently ✨', subtext: 'cursive white', textColor: 'text-white/90', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'YUM! 🍰', subtext: 'hand-lettered white', textColor: 'text-pink-200', extraData: { font: 'font-mono', style: 'bold' } },
    { type: 'aesthetic_text', content: 'to do 📝', subtext: 'cursive chalk', textColor: 'text-slate-200', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'HELLO 🌸', subtext: 'aesthetic white', textColor: 'text-white', extraData: { font: 'font-mono', style: 'bold' } },
    { type: 'aesthetic_text', content: 'good morning 🌅', subtext: 'pastel gold', textColor: 'text-yellow-200', extraData: { font: 'font-serif', style: 'italic' } },

    // 💘 Love & Matrimony Hand-lettering
    { type: 'aesthetic_text', content: 'Nice to meet you ♡', subtext: 'cute pink cursive', textColor: 'text-rose-300', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'Dream a little dream ✨', subtext: 'handwritten cream', textColor: 'text-amber-200', extraData: { font: 'font-serif', style: 'italic' } },
    { type: 'aesthetic_text', content: 'best seller 👑', subtext: 'chic coral', textColor: 'text-[#f07167]', extraData: { font: 'font-mono', style: 'bold' } },
    { type: 'aesthetic_text', content: 'green flags only 🌿', subtext: 'handwritten mint', textColor: 'text-emerald-300', extraData: { font: 'font-sans', style: 'bold' } },
    { type: 'aesthetic_text', content: '98% Vibe Match 💖', subtext: 'glowing rose', textColor: 'text-rose-400', extraData: { font: 'font-sans', style: 'bold' } },
];

const INSTAGRAM_WIDGETS: StickerItem[] = [
    // 📍 Location Stickers
    { type: 'location', content: 'HYDERABAD', subtext: 'INDIA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'BENGALURU', subtext: 'KARNATAKA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'MUMBAI', subtext: 'MAHARASHTRA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'DELHI', subtext: 'INDIA', bgColor: 'bg-white text-[#e1306c]' } as any,
    { type: 'location', content: 'GOA VIBES', subtext: 'BEACH PARADISE', bgColor: 'bg-white text-[#e1306c]' } as any,

    // 💬 Question Box Widgets
    { type: 'question', content: 'Ask me a question! 💬', subtext: 'Type your question...', bgColor: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]' } as any,
    { type: 'question', content: 'Ideal first date? ☕', subtext: 'Coffee or Sunset Walk?', bgColor: 'from-[#4158D0] via-[#C850C0] to-[#FFCC70]' } as any,

    // 😍 Emoji Reaction Sliders
    { type: 'slider', content: 'Rate this vibe! 🔥', extraData: { emoji: '😍', value: 80 } } as any,
    { type: 'slider', content: 'How cute is this? 💖', extraData: { emoji: '💖', value: 95 } } as any,

    // ⏳ Countdown Timers
    { type: 'countdown', content: 'Date Night 🍷', extraData: { days: '02', hours: '14', mins: '35' } } as any,

    // 📸 Add Yours
    { type: 'addyours', content: 'Add Yours 📷', subtext: 'Share your smile' } as any,

    // 🏷️ Mentions & Hashtags
    { type: 'mention', content: '@soulmate', bgColor: 'from-pink-500 to-rose-600' } as any,
    { type: 'hashtag', content: '#LoveInTheAir', bgColor: 'bg-[#262626]' } as any,

    // ⏰ Time Stamp
    { type: 'time', content: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } as any,
];

const EMOJI_CATEGORIES = [
    {
        name: 'Love & Romance',
        icon: '❤️',
        emojis: ['❤️', '💖', '💕', '💗', '💓', '💘', '💞', '💍', '🌹', '💐', '💋', '😘', '😍', '🥰', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💌', '❣️']
    },
    {
        name: 'Sparkles & Vibes',
        icon: '✨',
        emojis: ['✨', '🌟', '💫', '⭐', '⚡', '🌈', '👑', '💎', '🔮', '🦄', '🎈', '🥂', '🍾', '🔥', '💯', '🌸', '🪷', '🦋', '🕶️', '🕊️']
    },
    {
        name: 'Party & Birthday',
        icon: '🎉',
        emojis: ['🎉', '🥳', '🎊', '🍹', '🍿', '🍰', '🎂', '💃', '🕺', '🎶', '🎧', '🎸', '🥁', '🏆', '🥇', '🍕', '🍻', '🚀', '🎁', '🎯']
    }
];

export default function StoryStickerPicker({ onSelectSticker, onClose }: StoryStickerPickerProps) {
    const [activeTab, setActiveTab] = useState<'giphy' | 'aesthetic' | 'widgets' | 'emojis'>('giphy');
    const [searchQuery, setSearchQuery] = useState('');
    const [giphyStickers, setGiphyStickers] = useState<any[]>([]);
    const [isLoadingGiphy, setIsLoadingGiphy] = useState(false);

    // GIPHY API Live Fetch Engine with Key Failover & Fallback Stickers
    useEffect(() => {
        const fetchGiphy = async () => {
            setIsLoadingGiphy(true);
            const apiKeys = ['sX4weYiBswuAbMuZ1ch57Ut6ld2BhTyG', 'dc6zaTOxFJmzC', '0UFbTzO8zL1k3fK9XJg0zL8L13f'];
            let loadedStickers: any[] | null = null;

            const queryTerm = searchQuery.trim().length > 0 ? searchQuery : 'happy birthday aesthetic';

            for (const key of apiKeys) {
                try {
                    const endpoint = `https://api.giphy.com/v1/stickers/search?api_key=${key}&q=${encodeURIComponent(queryTerm)}&limit=36&rating=g`;
                    const res = await fetch(endpoint);
                    const data = await res.json();
                    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                        loadedStickers = data.data;
                        break;
                    }
                } catch (err) {
                    console.error('GIPHY key attempt failed:', err);
                }
            }

            if (loadedStickers && loadedStickers.length > 0) {
                setGiphyStickers(loadedStickers);
            } else {
                // Expanded high quality transparent animated GIF stickers collection
                setGiphyStickers([
                    { id: 'fb1', title: 'Happy Birthday', images: { original: { url: 'https://media.giphy.com/media/l4KibW1bB5Fq4uPf2/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/l4KibW1bB5Fq4uPf2/giphy.gif' } } },
                    { id: 'fb2', title: 'Birthday Girl', images: { original: { url: 'https://media.giphy.com/media/3o7TKr3nzbh5WgC6BI/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7TKr3nzbh5WgC6BI/giphy.gif' } } },
                    { id: 'fb3', title: 'Celebrate', images: { original: { url: 'https://media.giphy.com/media/g5R6FxUXt4m76/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/g5R6FxUXt4m76/giphy.gif' } } },
                    { id: 'fb4', title: 'Sparkles', images: { original: { url: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif' } } },
                    { id: 'fb5', title: 'Coffee Time', images: { original: { url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif' } } },
                    { id: 'fb6', title: 'Love & Vibes', images: { original: { url: 'https://media.giphy.com/media/l2R013mIf1ZXdvoyI/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/l2R013mIf1ZXdvoyI/giphy.gif' } } },
                    { id: 'fb7', title: 'Hearts', images: { original: { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' } } },
                    { id: 'fb8', title: 'New Post', images: { original: { url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif' } } },
                    { id: 'fb9', title: 'Party Time', images: { original: { url: 'https://media.giphy.com/media/26tP3M3i03hoIyl6o/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/26tP3M3i03hoIyl6o/giphy.gif' } } },
                    { id: 'fb10', title: 'Gold Crown', images: { original: { url: 'https://media.giphy.com/media/l4FGBOiK78uPIx3wI/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/l4FGBOiK78uPIx3wI/giphy.gif' } } },
                    { id: 'fb11', title: 'Dancing', images: { original: { url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif' } } },
                    { id: 'fb12', title: 'Glowing Stars', images: { original: { url: 'https://media.giphy.com/media/3o6Zt8b8J5xG1o56lW/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o6Zt8b8J5xG1o56lW/giphy.gif' } } },
                    { id: 'fb13', title: 'Pink Heart', images: { original: { url: 'https://media.giphy.com/media/l0HlVJ1fG75mX3Jpm/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/l0HlVJ1fG75mX3Jpm/giphy.gif' } } },
                    { id: 'fb14', title: 'Weekend Vibes', images: { original: { url: 'https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7TKDkDbIDJieKbVm/giphy.gif' } } },
                    { id: 'fb15', title: 'Fireworks', images: { original: { url: 'https://media.giphy.com/media/26tPqYCMw50EwTp72/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/26tPqYCMw50EwTp72/giphy.gif' } } }
                ]);
            }
            setIsLoadingGiphy(false);
        };

        const timer = setTimeout(() => {
            if (activeTab === 'giphy') {
                fetchGiphy();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    return (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col justify-end animate-in fade-in duration-200">
            <div className="bg-[#18181c] border-t border-white/15 rounded-t-3xl h-[84%] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#222228]">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-[#e1306c] animate-pulse" />
                        <h2 className="text-white font-extrabold text-lg tracking-wide">Instagram Stickers & GIPHY</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 bg-[#18181c] px-2 pt-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('giphy')}
                        className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'giphy' 
                                ? 'border-[#e1306c] text-[#e1306c]' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <ImageIcon size={16} />
                        GIPHY Stickers 🎬
                    </button>
                    <button
                        onClick={() => setActiveTab('aesthetic')}
                        className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'aesthetic' 
                                ? 'border-[#e1306c] text-[#e1306c]' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Sparkles size={16} />
                        Aesthetic Calligraphy ✍️
                    </button>
                    <button
                        onClick={() => setActiveTab('widgets')}
                        className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'widgets' 
                                ? 'border-[#e1306c] text-[#e1306c]' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Tag size={16} />
                        Instagram Widgets 📍
                    </button>
                    <button
                        onClick={() => setActiveTab('emojis')}
                        className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'emojis' 
                                ? 'border-[#e1306c] text-[#e1306c]' 
                                : 'border-transparent text-white/50 hover:text-white/80'
                        }`}
                    >
                        <Smile size={16} />
                        Emojis 😊
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-[#18181c]">
                    <div className="relative flex items-center">
                        <Search size={18} className="absolute left-3.5 text-white/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'giphy' ? "Search GIPHY (e.g. happy birthday aesthetic, gladdest, @chxrrypie)..." :
                                "Type keyword to filter stickers..."
                            }
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

                    {/* Quick Search Chips */}
                    {activeTab === 'giphy' && (
                        <div className="flex gap-2 overflow-x-auto mt-3 no-scrollbar pb-1">
                            {[
                                { label: '🎂 Birthday', query: 'happy birthday aesthetic' },
                                { label: '❤️ Love', query: 'love heart aesthetic' },
                                { label: '🔥 Vibes', query: 'vibe aesthetic' },
                                { label: '✨ Sparkles', query: 'sparkles glow' },
                                { label: '☕ Coffee', query: 'coffee morning' },
                                { label: '🎉 Party', query: 'party celebrate' },
                                { label: '👑 Luxury', query: 'gold crown luxury' },
                                { label: '🌸 Doodles', query: 'cute doodles' },
                                { label: '💃 Dancing', query: 'dancing vibe' },
                                { label: '📸 New Post', query: 'new post' },
                                { label: '🏖️ Summer', query: 'summer beach' }
                            ].map(chip => (
                                <button
                                    key={chip.label}
                                    onClick={() => setSearchQuery(chip.query)}
                                    className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                                        searchQuery === chip.query
                                            ? 'bg-[#e1306c] text-white border-[#e1306c] shadow-lg scale-105'
                                            : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border-white/10'
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
                    {/* GIPHY Live Stickers Grid */}
                    {activeTab === 'giphy' && (
                        <div>
                            {isLoadingGiphy ? (
                                <div className="flex flex-col items-center justify-center py-12 text-white/50 gap-2">
                                    <Sparkles size={28} className="animate-spin text-[#e1306c]" />
                                    <span className="text-xs font-bold">Loading GIPHY stickers...</span>
                                </div>
                            ) : giphyStickers.length === 0 ? (
                                <div className="text-center py-12 text-white/50 text-xs font-bold">
                                    No GIPHY stickers found for "{searchQuery}". Try another keyword!
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {giphyStickers.map((item) => {
                                        const imgUrl = item.images?.fixed_height?.url || item.images?.original?.url || item.images?.fixed_width_small?.url;
                                        if (!imgUrl) return null;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    onSelectSticker({
                                                        type: 'giphy',
                                                        content: item.title || 'Sticker',
                                                        imageUrl: imgUrl
                                                    });
                                                    onClose();
                                                }}
                                                className="aspect-square bg-white/5 hover:bg-white/15 p-2 rounded-2xl border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group shadow-lg"
                                            >
                                                <img 
                                                    src={imgUrl} 
                                                    alt={item.title || 'Sticker'} 
                                                    className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:drop-shadow-xl"
                                                    loading="lazy"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aesthetic Calligraphy & Hand-Drawn Doodles */}
                    {activeTab === 'aesthetic' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {AESTHETIC_CALLIGRAPHY_STICKERS
                                .filter(s => !searchQuery || s.content.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((sticker, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onSelectSticker(sticker);
                                            onClose();
                                        }}
                                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl text-center flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xl group"
                                    >
                                        <span className={`text-2xl font-bold ${sticker.textColor} ${sticker.extraData?.font || 'font-serif'} ${sticker.extraData?.style || 'normal'} drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-wide group-hover:scale-110 transition-transform`}>
                                            {sticker.content}
                                        </span>
                                        <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-1">
                                            {sticker.subtext}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    )}

                    {/* Instagram Widgets */}
                    {activeTab === 'widgets' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {INSTAGRAM_WIDGETS.map((sticker, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onSelectSticker(sticker);
                                        onClose();
                                    }}
                                    className="hover:scale-[1.03] active:scale-95 transition-all cursor-pointer text-left flex justify-center items-center"
                                >
                                    {/* 📍 Location Sticker */}
                                    {sticker.type === 'location' && (
                                        <div className="bg-white text-[#e1306c] px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 shadow-xl border border-pink-100">
                                            <MapPin size={18} fill="currentColor" />
                                            <span className="tracking-wide uppercase">{sticker.content}</span>
                                        </div>
                                    )}

                                    {/* 💬 Question Box Widget */}
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

                                    {/* 😍 Emoji Reaction Slider Widget */}
                                    {sticker.type === 'slider' && (
                                        <div className="w-full max-w-[260px] bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 p-3.5 rounded-2xl text-white shadow-2xl border border-white/20 flex flex-col gap-2">
                                            <div className="font-extrabold text-xs text-center">{sticker.content}</div>
                                            <div className="bg-black/30 backdrop-blur-md rounded-full h-6 px-2 flex items-center relative">
                                                <div className="w-full bg-white/30 h-1.5 rounded-full relative">
                                                    <div className="absolute right-2 -top-2.5 text-lg">
                                                        {sticker.extraData?.emoji || '😍'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ⏳ Countdown Widget */}
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

                                    {/* 📸 Add Yours */}
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

                                    {/* 🏷️ Mention */}
                                    {sticker.type === 'mention' && (
                                        <div className={`bg-gradient-to-r ${sticker.bgColor} text-white px-4 py-2 rounded-xl font-extrabold text-sm shadow-xl flex items-center gap-1 border border-white/20`}>
                                            <AtSign size={16} />
                                            <span>{sticker.content.replace('@', '')}</span>
                                        </div>
                                    )}

                                    {/* # Hashtag */}
                                    {sticker.type === 'hashtag' && (
                                        <div className="bg-[#262626] text-white px-4 py-2 rounded-xl font-black text-sm shadow-xl border border-white/20 flex items-center gap-1">
                                            <Hash size={16} className="text-pink-500" />
                                            <span>{sticker.content.replace('#', '')}</span>
                                        </div>
                                    )}

                                    {/* ⏰ Time */}
                                    {sticker.type === 'time' && (
                                        <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl font-mono font-black text-lg shadow-xl border border-white/30 flex items-center gap-2">
                                            <Clock size={18} className="text-amber-400" />
                                            <span>{sticker.content}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Emojis Grid */}
                    {activeTab === 'emojis' && (
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
