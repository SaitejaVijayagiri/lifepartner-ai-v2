'use client';

import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Sparkles, Languages } from 'lucide-react';

export interface LyricLine {
    time: number; // in seconds
    text: string;
}

export type LanguageCode = 'hindi' | 'telugu' | 'tamil' | 'punjabi' | 'english_hinglish';

// Multi-Language Native Script Lyrics Catalog
export const MULTI_LANG_LYRICS: Record<string, Record<LanguageCode, LyricLine[]>> = {
    'kesariya': {
        'hindi': [
            { time: 0, text: "मुझको कितना प्यार है तुमसे..." },
            { time: 3, text: "केसरिया तेरा इश्क है पिया 💖" },
            { time: 7, text: "रंग जाऊं जो मैं हाथ लगाऊं ✨" },
            { time: 11, text: "दिन बीते सारा तेरी फिक्र में 🌅" },
            { time: 15, text: "रैन सारी तेरी खैर मनाऊं 🌙" },
            { time: 19, text: "केसरिया तेरा इश्क है पिया..." },
            { time: 24, text: "हर दुआ में मैंने तुझे मांगा है 🙏" },
            { time: 28, text: "तू ही मेरा चैन, तू ही मेरी राहत 💫" }
        ],
        'telugu': [
            { time: 0, text: "నీతోనే నా ప్రతి అడుగు... 💖" },
            { time: 3, text: "కేసరియా నీ ప్రేమే ప్రియా ✨" },
            { time: 7, text: "మదిలో నిండిన మధురమైన కళ 🌅" },
            { time: 11, text: "ప్రతి క్షణం నీ ధ్యానమే 🌙" },
            { time: 15, text: "నా ఆశలకి నువ్వే వెలుగు 💫" },
            { time: 19, text: "కేసరియా నీ ప్రేమే ప్రియా..." },
            { time: 24, text: "ప్రతి ప్రార్థనలో నిన్నే కోరుకున్నా 🙏" },
            { time: 28, text: "నువ్వే నా శాంతి, నువ్వే నా ఊపిరి 🌹" }
        ],
        'tamil': [
            { time: 0, text: "உன்னோடு வாழும் ஒவ்வொரு நொடியும்... 💖" },
            { time: 3, text: "கேசரியா உன் காதலே பிரியா ✨" },
            { time: 7, text: "மனதில் நிறைந்து வழியும் கவிதை 🌅" },
            { time: 11, text: "நாள் முழுவதும் உன் நினைவே 🌙" },
            { time: 15, text: "என் இரவின் வெளிச்சம் நீயே 💫" },
            { time: 19, text: "கேசரியா உன் காதலே பிரியா..." },
            { time: 24, text: "என் ஒவ்வொரு பிரார்த்தனையிலும் நீ 🙏" }
        ],
        'punjabi': [
            { time: 0, text: "ਤੇਰੇ ਨਾਲ ਹੀ ਮੇਰੀ ਦੁਨੀਆਂ 💖" },
            { time: 3, text: "ਕੇਸਰੀਆ ਤੇਰਾ ਇਸ਼ਕ ਹੈ ਪਿਆ 🌹" },
            { time: 7, text: "ਦਿਲ ਵਿੱਚ ਵੱਸਦੀ ਏ ਤੇਰੀ ਯਾਦ ✨" },
            { time: 11, text: "ਦਿਨ ਬੀਤੇ ਤੇਰੇ ਖ਼ਿਆਲਾਂ ਵਿੱਚ 🌅" },
            { time: 15, text: "ਤੂੰ ਹੀ ਮੇਰਾ ਸੁਫ਼ਨਾ, ਤੂੰ ਹੀ ਚੈਨ 💫" }
        ],
        'english_hinglish': [
            { time: 0, text: "Mujhko kitna pyar hai tumse..." },
            { time: 3, text: "Kesariya tera ishq hai piya 💖" },
            { time: 7, text: "Rang jaaun jo main haath lagaun ✨" },
            { time: 11, text: "Din beete saara teri fikr mein 🌅" },
            { time: 15, text: "Rain saari teri khair manaun 🌙" },
            { time: 19, text: "Kesariya tera ishq hai piya..." },
            { time: 24, text: "Har dua mein maine tujhe maanga hai 🙏" },
            { time: 28, text: "Tu hi mera chain, tu hi meri raahat 💫" }
        ]
    },
    'lofi_chill': {
        'hindi': [
            { time: 0, text: "देर रात की कॉफी और ख़ामोश ख्याल ☕" },
            { time: 4, text: "तारों से सजा आसमां ✨" },
            { time: 8, text: "धीमी सी लो-फाई धुन 🎧" },
            { time: 12, text: "सिर्फ तुम्हारी बातें और यादें 💭" },
            { time: 16, text: "सुकून भरे ये हसीन पल 🌊" }
        ],
        'telugu': [
            { time: 0, text: "రాత్రి కాఫీ & ప్రశాంతమైన ఆలోచనలు ☕" },
            { time: 4, text: "మిలమిల మెరిసే నక్షత్రాలు ✨" },
            { time: 8, text: "మధురమైన లోఫై సంగీతం 🎧" },
            { time: 12, text: "నీ తీపి జ్ఞాపకాలు 💭" }
        ],
        'tamil': [
            { time: 0, text: "இரவு காபி மற்றும் அமைதியான எண்ணங்கள் ☕" },
            { time: 4, text: "மின்னு நட்சத்திரங்கள் ✨" },
            { time: 8, text: "மெல்லிய இசை 🎧" }
        ],
        'punjabi': [
            { time: 0, text: "ਰਾਤ ਦੀ ਕੌਫ਼ੀ ਤੇ ਤੇਰੀਆਂ ਯਾਦਾਂ ☕" },
            { time: 4, text: "ਤਾਰਿਆਂ ਦੀ ਛਾਂ ਹੇਠ ✨" }
        ],
        'english_hinglish': [
            { time: 0, text: "Late night coffee & quiet thoughts ☕" },
            { time: 4, text: "Watching the stars shine bright ✨" },
            { time: 8, text: "Soft lofi beats in the background 🎧" },
            { time: 12, text: "Thinking about you all night long 💭" },
            { time: 16, text: "Peaceful moments, quiet soul 🌊" }
        ]
    }
};

// Generic Fallback Generator for any track
export function getFallbackLyrics(title: string, lang: LanguageCode): LyricLine[] {
    const cleanTitle = title.replace(/[^\w\s]/gi, '').trim() || "Love & Music";
    
    if (lang === 'hindi') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "संगीत की हर धड़कन में तेरा नाम 💖" },
            { time: 7, text: "यह हसीन पल हमेशा खास रहेंगे ✨" },
            { time: 11, text: "दिल से निकली हर लकीर 🌊" },
            { time: 15, text: "साथ बिताए ये खूबसूरत लम्हे 💫" }
        ];
    } else if (lang === 'telugu') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ప్రతి గుండె చప్పుడులో నీ నామమే 💖" },
            { time: 7, text: "ఈ క్షణాలు ఎప్పటికీ మరువలేనివి ✨" },
            { time: 11, text: "మనసులో నిండిన మధురమైన జ్ఞాపకం 🌊" }
        ];
    } else if (lang === 'tamil') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ஒவ்வொரு இசைத் துடிப்பிலும் நீ 💖" },
            { time: 7, text: "இந்த அழகான தருணங்கள் என்றென்றும் ✨" }
        ];
    } else if (lang === 'punjabi') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ਹਰ ਧੜਕਣ ਵਿੱਚ ਤੇਰੀ ਹੀ ਆਵਾਜ਼ 💖" },
            { time: 7, text: "ਇਹ ਪਲ ਹਮੇਸ਼ਾ ਯਾਦ ਰਹਿਣਗੇ ✨" }
        ];
    }
    
    return [
        { time: 0, text: `🎵 ${cleanTitle}` },
        { time: 3, text: "Feel the music in your heartbeat 💖" },
        { time: 7, text: "Moments made forever special ✨" },
        { time: 11, text: "Singing along with every wave 🌊" },
        { time: 15, text: "Life & Love in harmony 💫" }
    ];
}

interface StoryLyricsStickerProps {
    songId?: string;
    songTitle?: string;
    currentTime?: number;
    language?: LanguageCode;
    fontFamily?: string;
    scale?: number; // Size multiplier e.g. 0.8, 1.0, 1.2
    isDraggable?: boolean;
    onLanguageChange?: (lang: LanguageCode) => void;
}

export default function StoryLyricsSticker({
    songId = 'kesariya',
    songTitle = 'Music Vibe',
    currentTime = 0,
    language = 'hindi',
    fontFamily = 'sans-serif',
    scale = 1.0,
    isDraggable = false,
    onLanguageChange
}: StoryLyricsStickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);
    const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);

    useEffect(() => {
        setSelectedLang(language);
    }, [language]);

    // Fetch lines for selected language & song
    const songEntry = MULTI_LANG_LYRICS[songId];
    const lines: LyricLine[] = songEntry?.[selectedLang] || getFallbackLyrics(songTitle, selectedLang);

    // Determine current active index
    const activeIndex = lines.reduce((prevIdx, line, idx) => {
        if (currentTime >= line.time) return idx;
        return prevIdx;
    }, 0);

    // Auto-scroll active line smoothly
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeIndex]);

    const stickerMarkup = (
        <div className="select-none pointer-events-auto flex flex-col items-center">
            {/* Native Language Switcher Bar */}
            {onLanguageChange && (
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 mb-2 shadow-lg z-50">
                    <Languages size={12} className="text-amber-300 ml-1.5 shrink-0" />
                    {[
                        { code: 'hindi', label: '🇮🇳 हिंदी' },
                        { code: 'telugu', label: '🇮🇳 తెలుగు' },
                        { code: 'tamil', label: '🇮🇳 தமிழ்' },
                        { code: 'punjabi', label: '🇮🇳 ਪੰਜਾਬੀ' },
                        { code: 'english_hinglish', label: '🇬🇧 Eng' }
                    ].map(l => (
                        <button
                            key={l.code}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                const newLang = l.code as LanguageCode;
                                setSelectedLang(newLang);
                                onLanguageChange(newLang);
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                selectedLang === l.code
                                    ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-black shadow-sm'
                                    : 'text-white/70 hover:text-white'
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            )}

            {/* 100% TRANSPARENT BACKGROUND - NO BOX HIDING FILTERS OR IMAGE */}
            <div className="w-full max-w-sm text-center">
                <div
                    ref={containerRef}
                    className="max-h-32 overflow-y-auto no-scrollbar py-1 text-center flex flex-col items-center space-y-1.5 transition-all duration-300"
                >
                    {lines.map((line, idx) => {
                        const isActive = idx === activeIndex;
                        const isPast = idx < activeIndex;

                        return (
                            <div
                                key={idx}
                                ref={isActive ? activeLineRef : null}
                                className={`transition-all duration-300 transform ${
                                    isActive
                                        ? 'scale-105 opacity-100'
                                        : isPast
                                        ? 'scale-95 text-white/40 opacity-40 font-medium'
                                        : 'scale-95 text-white/60 opacity-60 font-medium'
                                }`}
                            >
                                <span
                                    style={{
                                        fontFamily: fontFamily,
                                        fontSize: `${1.1 * scale}rem`,
                                        textShadow: isActive
                                            ? '0 2px 10px rgba(0,0,0,0.9), 0 0 15px rgba(251,191,36,0.9), 0 0 25px rgba(244,63,94,0.7)'
                                            : '0 2px 8px rgba(0,0,0,0.8)'
                                    }}
                                    className={`inline-block px-2 py-0.5 leading-snug transition-all ${
                                        isActive
                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-rose-300 font-black scale-105'
                                            : 'text-white/80 font-bold'
                                    }`}
                                >
                                    {line.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    if (isDraggable) {
        return (
            /* @ts-ignore */
            <Draggable bounds="parent">
                <div className="cursor-move inline-block z-40">
                    {stickerMarkup}
                </div>
            </Draggable>
        );
    }

    return stickerMarkup;
}
