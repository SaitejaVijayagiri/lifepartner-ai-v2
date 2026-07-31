'use client';

import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Sparkles, Languages, Type, ZoomIn, ZoomOut, Move } from 'lucide-react';

export interface LyricLine {
    time: number; // in seconds
    text: string;
}

export type LanguageCode = 'hindi' | 'telugu' | 'tamil' | 'punjabi' | 'english_hinglish';

// Exact Phonetic Sung Lines Catalog across All Native Scripts
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
            { time: 0, text: "ముజ్కో కిత్నా ప్యార్ హై తుమ్సే... 💖" },
            { time: 3, text: "కేసరియా తేరా ఇష్క్ హై పియా 💖" },
            { time: 7, text: "రంగ్ జావూన్ జో మై హాథ్ లగావూన్ ✨" },
            { time: 11, text: "దిన్ బీతే సారా తేరీ ఫిక్ర్ మే 🌅" },
            { time: 15, text: "రైన్ సారీ తేరీ ఖైర్ మనావూన్ 🌙" },
            { time: 19, text: "కేసరియా తేరా ఇష్క్ హై పియా..." },
            { time: 24, text: "హర్ దువా మే మైనే తుజే మాంగా హై 🙏" },
            { time: 28, text: "తూ హీ మేరా చైన్, తూ హీ మేరీ రాహత్ 💫" }
        ],
        'tamil': [
            { time: 0, text: "முஜ்கோ கித்னா பியார் ஹை தும்ஸே... 💖" },
            { time: 3, text: "கேசரியா தேரா இஷ்க் ஹை பியா 💖" },
            { time: 7, text: "ரங் ஜாவூன் ஜோ மை ஹாத் லாகாவூன் ✨" },
            { time: 11, text: "தின் பீதே சாரா தேரி ஃபிக்ர் மே 🌅" },
            { time: 15, text: "ரைன் சாரி தேரி கைர் மனாவூன் 🌙" },
            { time: 19, text: "கேசரியா தேரா இஷ்க் ஹை பியா..." },
            { time: 24, text: "ஹர் துவா மே மைனே துஜே மாங்கா ஹை 🙏" },
            { time: 28, text: "தூ ஹி மேரா சைன், தூ ஹி மேரி ராஹத் 💫" }
        ],
        'punjabi': [
            { time: 0, text: "ਮੁਝਕੋ ਕਿਤਨਾ ਪਿਆਰ ਹੈ ਤੁਮਸੇ... 💖" },
            { time: 3, text: "ਕੇਸਰੀਆ ਤੇਰਾ ਇਸ਼ਕ ਹੈ ਪਿਆ 💖" },
            { time: 7, text: "ਰੰਗ ਜਾਵਾਂ ਜੋ ਮੈਂ ਹੱਥ ਲਗਾਵਾਂ ✨" },
            { time: 11, text: "ਦਿਨ ਬੀਤੇ ਸਾਰਾ ਤੇਰੀ ਫ਼ਿਕਰ ਵਿੱਚ 🌅" },
            { time: 15, text: "ਰੈਣ ਸਾਰੀ ਤੇਰੀ ਖ਼ੈਰ ਮਨਾਵਾਂ 🌙" },
            { time: 19, text: "ਕੇਸਰੀਆ ਤੇਰਾ ਇਸ਼ਕ ਹੈ ਪਿਆ..." },
            { time: 24, text: "ਹਰ ਦੁਆ ਵਿੱਚ ਮੈਂ ਤੈਨੂੰ ਮੰਗਿਆ 🙏" },
            { time: 28, text: "ਤੂੰ ਹੀ ਮੇਰਾ ਚੈਨ, ਤੂੰ ਹੀ ਮੇਰੀ ਰਾਹਤ 💫" }
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
    'romantic': {
        'hindi': [
            { time: 0, text: "तुम ही हो अब तुम ही हो... 💖" },
            { time: 3, text: "ज़िंदगी अब तुम ही हो ✨" },
            { time: 7, text: "चैन भी, मेरा दर्द भी 🌅" },
            { time: 11, text: "मेरी आवारगी तुम ही हो 🌙" },
            { time: 15, text: "तेरे लिए ही जिया मैं 💫" }
        ],
        'telugu': [
            { time: 0, text: "తుమ్ హీ హో అబ్ తుమ్ హీ హో... 💖" },
            { time: 3, text: "జిందగీ అబ్ తుమ్ హీ హో ✨" },
            { time: 7, text: "చైన్ భీ, మేరా దర్ద్ భీ 🌅" },
            { time: 11, text: "మేరీ ఆవారగీ తుమ్ హీ హో 🌙" },
            { time: 15, text: "తేరే లియే హీ జియా మై 💫" }
        ],
        'tamil': [
            { time: 0, text: "தும் ஹி ஹோ அப தும் ஹி ஹோ... 💖" },
            { time: 3, text: "ஜிந்தகி அப தும் ஹி ஹோ ✨" },
            { time: 7, text: "சைன் பி, மேரா தர்த் பி 🌅" },
            { time: 11, text: "மேரி ஆவாரகி தும் ஹி ஹோ 🌙" }
        ],
        'punjabi': [
            { time: 0, text: "ਤੂੰ ਹੀ ਹੋ ਅਬ ਤੂੰ ਹੀ ਹੋ... 💖" },
            { time: 3, text: "ਜ਼ਿੰਦਗੀ ਅਬ ਤੂੰ ਹੀ ਹੋ ✨" },
            { time: 7, text: "ਚੈਨ ਵੀ, ਮੇਰਾ ਦਰਦ ਵੀ 🌅" }
        ],
        'english_hinglish': [
            { time: 0, text: "Tum hi ho ab tum hi ho... 💖" },
            { time: 3, text: "Zindagi ab tum hi ho ✨" },
            { time: 7, text: "Chain bhi, mera dard bhi 🌅" },
            { time: 11, text: "Meri aashiqui tum hi ho 🌙" }
        ]
    },
    'bollywood': {
        'hindi': [
            { time: 0, text: "अपना बना ले मुझे अपना बना ले पिया... 🌹" },
            { time: 4, text: "दिल के सफ़र में तू मेरा हमराही बने ✨" },
            { time: 8, text: "तेरी बाहों में सुकून मिले 💖" },
            { time: 12, text: "हर जनम में तू ही मिले 💫" }
        ],
        'telugu': [
            { time: 0, text: "అప్నా బనా లే ముజే అప్నా బనా లే పియా... 🌹" },
            { time: 4, text: "దిల్ కే సఫర్ మే తూ మేరా హమ్రాహీ బనే ✨" },
            { time: 8, text: "తేరీ బాహోం మే సుకూన్ మిలే 💖" },
            { time: 12, text: "హర్ జనం మే తూ హీ మిలే 💫" }
        ],
        'tamil': [
            { time: 0, text: "அப்னா பனா லே முஜே அப்னா பனா லே பியா... 🌹" },
            { time: 4, text: "தில் கே சஃபர் மே தூ மேரா ஹம்ராஹி பனே ✨" },
            { time: 8, text: "தேரி பாஹோன் மே சுகூன் மிலே 💖" }
        ],
        'punjabi': [
            { time: 0, text: "ਅਪਣਾ ਬਣਾ ਲੈ ਮੈਨੂੰ ਅਪਣਾ ਬਣਾ ਲੈ ਪਿਆ... 🌹" },
            { time: 4, text: "ਦਿਲ ਦੇ ਫ਼ਰ ਵਿੱਚ ਤੂੰ ਮੇਰਾ ਹਮਰਾਹੀ ਬਣੇ ✨" }
        ],
        'english_hinglish': [
            { time: 0, text: "Apna bana le mujhe apna bana le piya... 🌹" },
            { time: 4, text: "Dil ke safar mein tu mera hamraahi bane ✨" },
            { time: 8, text: "Teri baahon mein sukoon mile 💖" }
        ]
    },
    'devotional': {
        'hindi': [
            { time: 0, text: "अच्युतम केशवं कृष्ण दामोदरं 🕉️" },
            { time: 4, text: "राम नारायणं जानकी वल्लभम् ✨" },
            { time: 8, text: "कौन कहता है भगवान आते नहीं 🙏" },
            { time: 12, text: "तुम मीरा के जैसे बुलाते नहीं 💫" }
        ],
        'telugu': [
            { time: 0, text: "అచ్యుతం కేశవం కృష్ణ దామోదరం 🕉️" },
            { time: 4, text: "రామ నారాయణం జానకీ వల్లభమ్ ✨" },
            { time: 8, text: "కౌన్ కహతా హై భగవాన్ ఆతే నహీం 🙏" },
            { time: 12, text: "తుమ్ మీరా కే జైసే బులాతే నహీం 💫" }
        ],
        'tamil': [
            { time: 0, text: "அச்யுதம் கேசவம் க்ருஷ்ண தாமோதரம் 🕉️" },
            { time: 4, text: "ராம நாராயணம் ஜானகீ வல்லபம் ✨" },
            { time: 8, text: "கவுன் கஹதா ஹை பகவான் ஆதே நஹீன் 🙏" }
        ],
        'punjabi': [
            { time: 0, text: "ਅਚਯੁਤਮ ਕੇਸ਼ਵਮ ਕ੍ਰਿਸ਼ਨ ਦਾਮੋਦਰਮ 🕉️" },
            { time: 4, text: "ਰਾਮ ਨਾਰਾਇਣਮ ਜਾਨਕੀ ਵੱਲਭਮ ✨" }
        ],
        'english_hinglish': [
            { time: 0, text: "Achyutam Keshavam Krishna Damodaram 🕉️" },
            { time: 4, text: "Rama Narayanam Janaki Vallabham ✨" },
            { time: 8, text: "Kaun kehta hai Bhagwan aate nahi 🙏" }
        ]
    },
    'lofi': {
        'hindi': [
            { time: 0, text: "देर रात की ख़ामोशी और तेरी यादें ☕" },
            { time: 4, text: "धीमी हवाएं, मीठी धुन ✨" },
            { time: 8, text: "तारों तले तेरा और मेरा साथ 🎧" }
        ],
        'telugu': [
            { time: 0, text: "దేర్ రాత్ కీ ఖామోషీ ఔర్ తేరీ యాదేం ☕" },
            { time: 4, text: "ధీమీ హవాయేం, మీఠీ ధున్ ✨" },
            { time: 8, text: "తారోం తలే తేరా ఔర్ మేరా సాథ్ 🎧" }
        ],
        'tamil': [
            { time: 0, text: "தேர் ராத் கி காமோஷி அவ்ர் தேரி யா தேன் ☕" },
            { time: 4, text: "தீமி ஹவாயேன், மீட்டி துன் ✨" }
        ],
        'punjabi': [
            { time: 0, text: "ਦੇਰ ਰਾਤ ਦੀ ਖ਼ਾਮੋਸ਼ੀ ਤੇ ਤੇਰੀਆਂ ਯਾਦਾਂ ☕" },
            { time: 4, text: "ਮੀਠੀ ਧੁਨ, ਸ਼ਾਂਤ ਹਵਾਵਾਂ ✨" }
        ],
        'english_hinglish': [
            { time: 0, text: "Late night silence & sweet lofi vibes ☕" },
            { time: 4, text: "Watching the stars shine together ✨" }
        ]
    }
};

// Smart Lookup Function to match songId or songTitle to exact sung lines
export function resolveLyrics(songId: string, songTitle: string, lang: LanguageCode): LyricLine[] {
    const sId = (songId || '').toLowerCase().trim();
    const sTitle = (songTitle || '').toLowerCase().trim();

    // 1. Direct match in MULTI_LANG_LYRICS
    if (MULTI_LANG_LYRICS[sId]) {
        return MULTI_LANG_LYRICS[sId][lang] || MULTI_LANG_LYRICS[sId]['english_hinglish'];
    }

    // 2. Search by key in title or ID
    for (const key of Object.keys(MULTI_LANG_LYRICS)) {
        if (sId.includes(key) || sTitle.includes(key)) {
            return MULTI_LANG_LYRICS[key][lang] || MULTI_LANG_LYRICS[key]['english_hinglish'];
        }
    }

    // 3. Fallback to Kesariya or default phonetic lines
    if (sTitle.includes('kesariya') || sTitle.includes('arijit')) {
        return MULTI_LANG_LYRICS['kesariya'][lang] || MULTI_LANG_LYRICS['kesariya']['english_hinglish'];
    }

    return getFallbackLyrics(songTitle, lang);
}

export function getFallbackLyrics(title: string, lang: LanguageCode): LyricLine[] {
    const cleanTitle = title.replace(/[^\w\s]/gi, '').trim() || "Love & Music";
    
    if (lang === 'hindi') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "दिल की धड़कन में तेरा ही नाम 💖" },
            { time: 7, text: "हर लम्हा तेरे संग खास है ✨" },
            { time: 11, text: "तेरे बिना जीना भी क्या जीना 🌅" },
            { time: 15, text: "तू ही मेरी मंज़िल, तू ही मेरा प्यार 💫" }
        ];
    } else if (lang === 'telugu') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "దిల్ కీ ధడ్కన్ మే తేరా హీ నామ్ 💖" },
            { time: 7, text: "హర్ లమ్హా తేరే సంగ్ ఖాస్ హై ✨" },
            { time: 11, text: "తేరే బినా జీనా భీ క్యా జీనా 🌅" },
            { time: 15, text: "తూ హీ మేరీ మంజిల్, తూ హీ మేరా ప్యార్ 💫" }
        ];
    } else if (lang === 'tamil') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "தில் கி தட்கன் மே தேரா ஹி நாம் 💖" },
            { time: 7, text: "ஹர் லம்பா தேரே சங் காஸ் ஹை ✨" },
            { time: 11, text: "தேரே பினா ஜீனா பி க்யா ஜீனா 🌅" }
        ];
    } else if (lang === 'punjabi') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ਦਿਲ ਦੀ ਧੜਕਣ ਵਿੱਚ ਤੇਰਾ ਹੀ ਨਾਂ 💖" },
            { time: 7, text: "ਹਰ ਪਲ ਤੇਰੇ ਨਾਲ ਖ਼ਾਸ ਹੈ ✨" },
            { time: 11, text: "ਤੇਰੇ ਬਿਨਾਂ ਜੀਣਾ ਵੀ ਕੀ ਜੀਣਾ 🌅" }
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

const FONTS_LIST = [
    { name: 'Sans', family: 'sans-serif' },
    { name: 'Serif', family: 'Georgia, serif' },
    { name: 'Cursive', family: 'cursive' },
    { name: 'Mono', family: 'monospace' }
];

interface StoryLyricsStickerProps {
    songId?: string;
    songTitle?: string;
    currentTime?: number;
    language?: LanguageCode;
    fontFamily?: string;
    scale?: number; // Size multiplier e.g. 0.8, 1.0, 1.2
    isDraggable?: boolean;
    showControls?: boolean;
    onLanguageChange?: (lang: LanguageCode) => void;
}

export default function StoryLyricsSticker({
    songId = 'kesariya',
    songTitle = 'Music Vibe',
    currentTime = 0,
    language = 'hindi',
    fontFamily = 'sans-serif',
    scale = 1.0,
    isDraggable = true,
    showControls = true,
    onLanguageChange
}: StoryLyricsStickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);
    const draggableNodeRef = useRef<HTMLDivElement>(null);

    const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);
    const [currentFontIdx, setCurrentFontIdx] = useState(0);
    const [lyricsScale, setLyricsScale] = useState<number>(scale);

    useEffect(() => {
        setSelectedLang(language);
    }, [language]);

    useEffect(() => {
        setLyricsScale(scale);
    }, [scale]);

    // Smartly resolve exact phonetic sung lines
    const lines: LyricLine[] = resolveLyrics(songId, songTitle, selectedLang);

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

    const activeFont = FONTS_LIST[currentFontIdx].family;

    const stickerMarkup = (
        <div className="select-none flex flex-col items-center max-w-md mx-auto pointer-events-auto">
            {/* Interactive Control Panel (Language, Font Style, Size Resizer) */}
            {showControls && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/25 mb-2 shadow-2xl z-50 pointer-events-auto">
                    {/* Drag Handle Indicator */}
                    <span className="text-[10px] text-amber-300 font-extrabold flex items-center gap-0.5 px-1 cursor-grab active:cursor-grabbing">
                        <Move size={11} className="animate-pulse" /> Drag
                    </span>

                    {/* Native Script Phonetic Buttons */}
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
                                e.preventDefault();
                                const newLang = l.code as LanguageCode;
                                setSelectedLang(newLang);
                                if (onLanguageChange) onLanguageChange(newLang);
                            }}
                            className={`px-2 py-0.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                selectedLang === l.code
                                    ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-pink-400 text-slate-950 font-black shadow-md scale-105'
                                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}

                    <div className="h-3 w-px bg-white/20 mx-0.5" />

                    {/* Font Style Cycle Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setCurrentFontIdx(prev => (prev + 1) % FONTS_LIST.length);
                        }}
                        className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-white/20"
                        title="Change Lyrics Font"
                    >
                        <Type size={11} className="text-amber-300" />
                        <span>{FONTS_LIST[currentFontIdx].name}</span>
                    </button>

                    {/* Size Reducer / Enlarger Buttons */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setLyricsScale(prev => Math.max(0.6, parseFloat((prev - 0.15).toFixed(2))));
                        }}
                        className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                        title="Reduce Size"
                    >
                        <ZoomOut size={12} />
                    </button>
                    <span className="text-[10px] text-amber-300 font-mono font-bold">{Math.round(lyricsScale * 100)}%</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setLyricsScale(prev => Math.min(2.0, parseFloat((prev + 0.15).toFixed(2))));
                        }}
                        className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                        title="Increase Size"
                    >
                        <ZoomIn size={12} />
                    </button>
                </div>
            )}

            {/* 100% TRANSPARENT LYRICS DISPLAY - NO BLACK BOX HIDING FILTERS */}
            <div className="w-full text-center pointer-events-auto">
                <div
                    ref={containerRef}
                    className="max-h-36 overflow-y-auto no-scrollbar py-1 text-center flex flex-col items-center space-y-1.5 transition-all duration-300"
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
                                        fontFamily: activeFont,
                                        fontSize: `${1.15 * lyricsScale}rem`,
                                        textShadow: isActive
                                            ? '0 2px 10px rgba(0,0,0,0.95), 0 0 15px rgba(251,191,36,0.9), 0 0 25px rgba(244,63,94,0.7)'
                                            : '0 2px 8px rgba(0,0,0,0.85)'
                                    }}
                                    className={`inline-block px-2.5 py-0.5 leading-snug transition-all ${
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
            <Draggable
                nodeRef={draggableNodeRef as any}
                bounds="parent"
                cancel="button, input, select, .no-drag"
            >
                <div
                    ref={draggableNodeRef}
                    className="cursor-move inline-block z-40 touch-none select-none"
                    style={{ touchAction: 'none' }}
                >
                    {stickerMarkup}
                </div>
            </Draggable>
        );
    }

    return stickerMarkup;
}
