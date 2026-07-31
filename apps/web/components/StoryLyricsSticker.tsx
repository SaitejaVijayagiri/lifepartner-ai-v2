'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Languages, Type, ZoomIn, ZoomOut, Palette, SlidersHorizontal, ChevronDown, ChevronUp, Move } from 'lucide-react';

export interface LyricLine {
    time: number; // in seconds
    text: string;
}

export type LanguageCode =
    | 'hindi'
    | 'telugu'
    | 'tamil'
    | 'punjabi'
    | 'malayalam'
    | 'kannada'
    | 'marathi'
    | 'bengali'
    | 'english_hinglish';

// Exact Phonetic Sung Lines Catalog across Native Scripts
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
            { time: 24, text: "ஹர் துவா மே மைனே துஜே மாங்கா வை 🙏" }
        ],
        'punjabi': [
            { time: 0, text: "ਮੁਝਕੋ ਕਿਤਨਾ ਪਿਆਰ ਹੈ ਤੁਮਸੇ... 💖" },
            { time: 3, text: "ਕੇਸਰੀਆ ਤੇਰਾ ਇਸ਼ਕ ਹੈ ਪਿਆ 💖" },
            { time: 7, text: "ਰੰਗ ਜਾਵਾਂ ਜੋ ਮੈਂ ਹੱਥ ਲਗਾਵਾਂ ✨" },
            { time: 11, text: "ਦਿਨ ਬੀਤੇ ਸਾਰਾ ਤੇਰੀ ਫ਼ਿਕਰ ਵਿੱਚ 🌅" },
            { time: 15, text: "ਰੈਣ ਸਾਰੀ ਤੇਰੀ ਖ਼ੈਰ ਮਨਾਵਾਂ 🌙" }
        ],
        'malayalam': [
            { time: 0, text: "മുജ്കോ കിത്നാ പ്യാർ ഹൈ തുമ്സേ... 💖" },
            { time: 3, text: "കേസരിയാ തേരാ ഇഷ്ക് ഹൈ പിയാ 💖" },
            { time: 7, text: "രംഗ് ജാഊൻ ജോ മൈ ഹാത് ലഗാഊൻ ✨" },
            { time: 11, text: "ദിൻ ബീതേ സാരാ തേരി ഫികർ മേ 🌅" }
        ],
        'kannada': [
            { time: 0, text: "ಮುಜ್ಕೋ ಕಿತ್ನಾ ಪ್ಯಾರ್ ಹೈ ತುಮ್ಸೆ... 💖" },
            { time: 3, text: "ಕೇಸರಿಯಾ ತೇರಾ ಇಷ್ಕ್ ಹೈ ಪಿಯಾ 💖" },
            { time: 7, text: "ರಂಗ್ ಜಾವೂನ್ ಜೋ ಮೈ ಹಾಥ್ ಲಗಾವೂನ್ ✨" },
            { time: 11, text: "ದಿನ್ ಬೀತೆ ಸಾರಾ ತೇರೀ ಫಿಕ್ರ್ ಮೇ 🌅" }
        ],
        'marathi': [
            { time: 0, text: "मुझको कितना प्यार है तुमसे... 💖" },
            { time: 3, text: "केसरिया तेरा इश्क है पिया 💖" },
            { time: 7, text: "रंग जाऊं जो मैं हाथ लगाऊं ✨" },
            { time: 11, text: "दिन बीते सारा तेरी फिक्र में 🌅" }
        ],
        'bengali': [
            { time: 0, text: "মুঝকো কিতনা পেয়ার হ্যায় তুমসে... 💖" },
            { time: 3, text: "কেসরিয়া তোরা ইশক হ্যায় পিয়া 💖" },
            { time: 7, text: "রং জাওঁ জো মে হাথ লগাওঁ ✨" },
            { time: 11, text: "দিন বীতে তারা তোর ফিকর মে 🌅" }
        ],
        'english_hinglish': [
            { time: 0, text: "Mujhko kitna pyar hai tumse..." },
            { time: 3, text: "Kesariya tera ishq hai piya 💖" },
            { time: 7, text: "Rang jaaun jo main haath lagaun ✨" },
            { time: 11, text: "Din beete saara teri fikr mein 🌅" },
            { time: 15, text: "Rain saari teri khair manaun 🌙" },
            { time: 19, text: "Kesariya tera ishq hai piya..." }
        ]
    },
    'romantic': {
        'hindi': [
            { time: 0, text: "तुम ही हो अब तुम ही हो... 💖" },
            { time: 3, text: "ज़िंदगी अब तुम ही हो ✨" },
            { time: 7, text: "चैन भी, मेरा दर्द भी 🌅" },
            { time: 11, text: "मेरी आशिकी तुम ही हो 🌙" }
        ],
        'telugu': [
            { time: 0, text: "తుమ్ హీ హో అబ్ తుమ్ హీ హో... 💖" },
            { time: 3, text: "జిందగీ అబ్ తుమ్ హీ హో ✨" },
            { time: 7, text: "చైన్ భీ, మేరా దర్ద్ భీ 🌅" },
            { time: 11, text: "మేరీ ఆషికి తుమ్ హీ హో 🌙" }
        ],
        'tamil': [
            { time: 0, text: "தும் ஹி ஹோ அப தும் ஹி ஹோ... 💖" },
            { time: 3, text: "ஜிந்தகி அப தும் ஹி ஹோ ✨" },
            { time: 7, text: "சைன் பி, மேரா தர்த் பி 🌅" }
        ],
        'punjabi': [
            { time: 0, text: "ਤੂੰ ਹੀ ਹੋ ਅਬ ਤੂੰ ਹੀ ਹੋ... 💖" },
            { time: 3, text: "ਜ਼ਿੰਦਗੀ ਅਬ ਤੂੰ ਹੀ ਹੋ ✨" }
        ],
        'malayalam': [
            { time: 0, text: "തും ഹി ഹോ അബ് തും ഹി ഹോ... 💖" },
            { time: 3, text: "ജിന്ദഗി അബ് തും ഹി ഹോ ✨" }
        ],
        'kannada': [
            { time: 0, text: "ತುಮ್ ಹೀ ಹೋ ಅಬ್ ತುಮ್ ಹೀ ಹೋ... 💖" },
            { time: 3, text: "ಜಿಂದಗೀ ಅಬ್ ತುಮ್ ಹೀ ಹೋ ✨" }
        ],
        'marathi': [
            { time: 0, text: "तुम ही हो अब तुम ही हो... 💖" },
            { time: 3, text: "जिंदगी अब तुम ही हो ✨" }
        ],
        'bengali': [
            { time: 0, text: "তুমি হি হো আব তুমি হি হো... 💖" },
            { time: 3, text: "জিন্দগি আব তুমি হি হো ✨" }
        ],
        'english_hinglish': [
            { time: 0, text: "Tum hi ho ab tum hi ho... 💖" },
            { time: 3, text: "Zindagi ab tum hi ho ✨" },
            { time: 7, text: "Chain bhi, mera dard bhi 🌅" }
        ]
    },
    'bollywood': {
        'hindi': [
            { time: 0, text: "अपना बना ले मुझे अपना बना ले पिया... 🌹" },
            { time: 4, text: "दिल के सफ़र में तू मेरा हमराही बने ✨" },
            { time: 8, text: "तेरी बाहों में सुकून मिले 💖" }
        ],
        'telugu': [
            { time: 0, text: "అప్నా బనా లే ముజే అప్నా బనా లే పియా... 🌹" },
            { time: 4, text: "దిల్ కే సఫర్ మే తూ మేరా హమ్రాహీ బనే ✨" },
            { time: 8, text: "తేరీ బాహోం మే సుకూన్ మిలే 💖" }
        ],
        'tamil': [
            { time: 0, text: "அப்னா பனா லே முஜே அப்னா பனா லே பியா... 🌹" },
            { time: 4, text: "தில் கே சஃபர் மே தூ மேரா ஹம்ராஹி பனே ✨" }
        ],
        'punjabi': [
            { time: 0, text: "ਅਪਣਾ ਬਣਾ ਲੈ ਮੈਨੂੰ ਅਪਣਾ ਬਣਾ ਲੈ ਪਿਆ... 🌹" }
        ],
        'malayalam': [
            { time: 0, text: "അപ്നാ ബനാ ലേ മുജേ അപ്നാ ബനാ ലേ പിയാ... 🌹" }
        ],
        'kannada': [
            { time: 0, text: "అప్నా బనా లే ముజే అప్నా బనా లే పియా... 🌹" }
        ],
        'marathi': [
            { time: 0, text: "अपना बना ले मुझे अपना बना ले पिया... 🌹" }
        ],
        'bengali': [
            { time: 0, text: "আপনা বনা লে আমাকে আপনা বনা লে পিয়া... 🌹" }
        ],
        'english_hinglish': [
            { time: 0, text: "Apna bana le mujhe apna bana le piya... 🌹" },
            { time: 4, text: "Dil ke safar mein tu mera hamraahi bane ✨" }
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
            { time: 4, text: "ధీమీ హవాయేం, మీఠీ ధున్ ✨" }
        ],
        'tamil': [
            { time: 0, text: "தேர் ராத் கி காமோஷி அவ்ர் தேரி யா தேன் ☕" }
        ],
        'punjabi': [
            { time: 0, text: "ਦੇਰ ਰਾਤ ਦੀ ਖ਼ਾਮੋਸ਼ੀ ਤੇ ਤੇਰੀਆਂ ਯਾਦਾਂ ☕" }
        ],
        'malayalam': [
            { time: 0, text: "ദേർ രാത് കീ കാമോഷീ ഔർ തേരി യാദേം ☕" }
        ],
        'kannada': [
            { time: 0, text: "ದೇರ್ ರಾತ್ ಕೀ ಖಾಮೋಶೀ ಔರ್ ತೇರೀ ಯಾದೇಂ ☕" }
        ],
        'marathi': [
            { time: 0, text: "देर रात की ख़ामोशी और तेरी यादें ☕" }
        ],
        'bengali': [
            { time: 0, text: "দের রাত কি খামোশী আর তোর ইয়াদেঁ ☕" }
        ],
        'english_hinglish': [
            { time: 0, text: "Late night silence & sweet lofi vibes ☕" },
            { time: 4, text: "Watching the stars shine together ✨" }
        ]
    },
    'upbeat': {
        'hindi': [
            { time: 0, text: "सुबह होने न दे, साथ खोने न दे... 🕺" },
            { time: 4, text: "एक दूसरे को हम सोने न दे ✨" },
            { time: 8, text: "डांस करो पूरे दिल से आज ⚡" }
        ],
        'telugu': [
            { time: 0, text: "సుబహ్ హోనే న దే, సాథ్ ఖోనే న దే... 🕺" },
            { time: 4, text: "ఏక్ దూస్రే కో హమ్ సోనే న దే ✨" }
        ],
        'tamil': [
            { time: 0, text: "சுபஹ் ஹோனே ந தே, சாத் கோனே ந தே... 🕺" }
        ],
        'punjabi': [
            { time: 0, text: "ਸੁਬਹ ਹੋਣੇ ਨਾ ਦੇ, ਸਾਥ ਖੋਣੇ ਨਾ ਦੇ... 🕺" }
        ],
        'malayalam': [
            { time: 0, text: "സുബഹ് ഹോനേ ന ദേ, സാത് ഖോനേ ന ദേ... 🕺" }
        ],
        'kannada': [
            { time: 0, text: "ಸುಬಹ್ ಹೋನೇ ನ ದೇ, ಸಾಥ್ ಖೋನೇ ನ ದೇ... 🕺" }
        ],
        'marathi': [
            { time: 0, text: "सुबह होने न दे, साथ खोने न दे... 🕺" }
        ],
        'bengali': [
            { time: 0, text: "সুবহ হোনে না দে, সাথ খোনে না দে... 🕺" }
        ],
        'english_hinglish': [
            { time: 0, text: "Subha hone na de, saath khone na de... 🕺" },
            { time: 4, text: "Dance like nobody is watching tonight ⚡" }
        ]
    },
    'acoustic': {
        'hindi': [
            { time: 0, text: "रातां लंबियां लंबियां रे कटे तेरे संगियां... 🎸" },
            { time: 4, text: "तेरी यादों में खो जाऊं मैं ✨" },
            { time: 8, text: "दिल दीयां गल्लां करांगे नाल बह के 💖" }
        ],
        'telugu': [
            { time: 0, text: "రాతాం లంబియాం లంబియాం రే... 🎸" },
            { time: 4, text: "తేరీ యాదోం మే ఖో జావూన్ మై ✨" }
        ],
        'tamil': [
            { time: 0, text: "ராதான் லம்பியான் லம்பியான் ரே... 🎸" }
        ],
        'punjabi': [
            { time: 0, text: "ਰਾਤਾਂ ਲੰਬੀਆਂ ਲੰਬੀਆਂ ਰੇ ਕੱਟੇ ਤੇਰੇ ਸੰਗੀਆਂ... 🎸" }
        ],
        'malayalam': [
            { time: 0, text: "രാതാം ലംബിയാം ലംബിയാം റേ... 🎸" }
        ],
        'kannada': [
            { time: 0, text: "ರಾತಾಂ ಲಂಬಿಯಾಂ ಲಂಬಿಯಾಂ ರೇ... 🎸" }
        ],
        'marathi': [
            { time: 0, text: "रातां लंबियां लंबियां रे कटे तेरे संगियां... 🎸" }
        ],
        'bengali': [
            { time: 0, text: "রাতাঁ লম্বিয়াঁ লম্বিয়াঁ রে কাটে তোর সঙ্গিয়াঁ... 🎸" }
        ],
        'english_hinglish': [
            { time: 0, text: "Raataan lambiyan lambiyan re kate tere sangiyan... 🎸" },
            { time: 4, text: "Acoustic guitar melodies & soft love ✨" }
        ]
    }
};

const COLOR_PALETTES = [
    { id: 'gold', name: 'Gold Glow', gradient: 'from-amber-200 via-yellow-300 to-rose-300', glow: 'rgba(251,191,36,0.95)' },
    { id: 'white', name: 'Pure White', gradient: 'from-white via-slate-100 to-white', glow: 'rgba(255,255,255,0.9)' },
    { id: 'pink', name: 'Neon Pink', gradient: 'from-pink-300 via-rose-400 to-purple-300', glow: 'rgba(244,63,94,0.95)' },
    { id: 'cyan', name: 'Cyber Cyan', gradient: 'from-cyan-300 via-teal-200 to-sky-300', glow: 'rgba(34,211,238,0.95)' },
    { id: 'sunset', name: 'Sunset Orange', gradient: 'from-orange-300 via-amber-400 to-red-400', glow: 'rgba(251,146,60,0.95)' },
    { id: 'purple', name: 'Royal Purple', gradient: 'from-purple-300 via-fuchsia-300 to-indigo-300', glow: 'rgba(192,132,252,0.95)' }
];

const FONTS_LIST = [
    { name: 'Sans', family: 'sans-serif' },
    { name: 'Serif', family: 'Georgia, serif' },
    { name: 'Cursive', family: 'cursive' },
    { name: 'Mono', family: 'monospace' }
];

export function resolveLyrics(songId: string, songTitle: string, lang: LanguageCode): LyricLine[] {
    const sId = (songId || '').toLowerCase().trim();
    const sTitle = (songTitle || '').toLowerCase().trim();

    if (MULTI_LANG_LYRICS[sId]) {
        return MULTI_LANG_LYRICS[sId][lang] || MULTI_LANG_LYRICS[sId]['english_hinglish'];
    }

    for (const key of Object.keys(MULTI_LANG_LYRICS)) {
        if (sId.includes(key) || sTitle.includes(key)) {
            return MULTI_LANG_LYRICS[key][lang] || MULTI_LANG_LYRICS[key]['english_hinglish'];
        }
    }

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
            { time: 11, text: "तू ही मेरी मंज़िल, तू ही मेरा प्यार 💫" }
        ];
    } else if (lang === 'telugu') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "దిల్ కీ ధడ్కన్ మే తేరా హీ నామ్ 💖" },
            { time: 7, text: "హర్ లమ్హా తేరే సంగ్ ఖాస్ హై ✨" },
            { time: 11, text: "తూ హీ మేరీ మంజిల్, తూ హీ మేరా ప్యార్ 💫" }
        ];
    } else if (lang === 'tamil') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "தில் கி தட்கன் மே தேரா ஹி நாம் 💖" },
            { time: 7, text: "ஹர் லம்பா தேரே சங் காஸ் ஹை ✨" }
        ];
    } else if (lang === 'punjabi') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ਦਿਲ ਦੀ ਧੜਕਣ ਵਿੱਚ ਤੇਰਾ ਹੀ ਨਾਂ 💖" },
            { time: 7, text: "ਹਰ ਪਲ ਤੇਰੇ ਨਾਲ ਖ਼ਾਸ ਹੈ ✨" }
        ];
    } else if (lang === 'malayalam') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ദിൽ കീ ധഡ്കൻ മേ തേരാ ഹി നാം 💖" }
        ];
    } else if (lang === 'kannada') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "ದಿಲ್ ಕೀ ಧಡ್ಕನ್ ಮೇ ತೇರಾ ಹೀ ನಾಮ್ 💖" }
        ];
    } else if (lang === 'marathi') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "दिल की धड़कन में तेरा ही नाम 💖" }
        ];
    } else if (lang === 'bengali') {
        return [
            { time: 0, text: `🎵 ${cleanTitle}` },
            { time: 3, text: "দিল কি ধড়কন মে তোর হি নাম 💖" }
        ];
    }
    
    return [
        { time: 0, text: `🎵 ${cleanTitle}` },
        { time: 3, text: "Feel the music in your heartbeat 💖" },
        { time: 7, text: "Moments made forever special ✨" },
        { time: 11, text: "Life & Love in harmony 💫" }
    ];
}

interface StoryLyricsStickerProps {
    songId?: string;
    songTitle?: string;
    currentTime?: number;
    language?: LanguageCode;
    fontFamily?: string;
    scale?: number;
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

    // Buttery Smooth Custom Drag Pointer State
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

    const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);
    const [currentFontIdx, setCurrentFontIdx] = useState(0);
    const [lyricsScale, setLyricsScale] = useState<number>(scale);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);
    const [isControlsOpen, setIsControlsOpen] = useState(false);

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
    const activeColor = COLOR_PALETTES[selectedColorIdx];

    // Buttery Smooth Native Pointer Drag Handlers
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggable) return;
        if ((e.target as HTMLElement).closest('button, input, select, .no-drag')) return;
        
        isDraggingRef.current = true;
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialX: pos.x,
            initialY: pos.y
        };
        try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch (err) {}
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPos({
            x: dragStartRef.current.initialX + dx,
            y: dragStartRef.current.initialY + dy
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (err) {}
        }
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                touchAction: 'none'
            }}
            className="select-none flex flex-col items-center max-w-md mx-auto pointer-events-auto cursor-grab active:cursor-grabbing z-40 relative touch-none"
        >
            {/* SLEEK COLLAPSIBLE CONTROLLER TOOLBAR */}
            {showControls && (
                <div className="flex flex-col items-center mb-2 z-50 pointer-events-auto no-drag">
                    {/* Tiny Collapsible Trigger Pill */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsControlsOpen(prev => !prev);
                        }}
                        className="px-3 py-1 bg-slate-950/85 hover:bg-slate-900 text-amber-300 rounded-full border border-amber-400/40 text-[10px] font-black flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all cursor-pointer hover:scale-105"
                    >
                        <SlidersHorizontal size={11} className="text-amber-300" />
                        <span>🎨 Customize Lyrics (Font, Color, Language)</span>
                        {isControlsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* EXPANDABLE CONTROL PANEL */}
                    {isControlsOpen && (
                        <div className="mt-1.5 flex flex-col items-center gap-2 bg-slate-950/95 backdrop-blur-xl p-2.5 rounded-2xl border border-white/25 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                            {/* Row 1: Native Script Language Buttons (9 Languages!) */}
                            <div className="flex flex-wrap items-center justify-center gap-1 max-w-xs">
                                {[
                                    { code: 'hindi', label: '🇮🇳 हिंदी' },
                                    { code: 'telugu', label: '🇮🇳 తెలుగు' },
                                    { code: 'tamil', label: '🇮🇳 தமிழ்' },
                                    { code: 'punjabi', label: '🇮🇳 ਪੰਜਾਬੀ' },
                                    { code: 'malayalam', label: '🇮🇳 മലയാളം' },
                                    { code: 'kannada', label: '🇮🇳 ಕನ್ನಡ' },
                                    { code: 'marathi', label: '🇮🇳 मराठी' },
                                    { code: 'bengali', label: '🇮🇳 বাংলা' },
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
                            </div>

                            {/* Row 2: Font Style & Color Palette Picker & Resizer */}
                            <div className="flex items-center gap-2 pt-1 border-t border-white/15 w-full justify-between">
                                {/* Font Style */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setCurrentFontIdx(prev => (prev + 1) % FONTS_LIST.length);
                                    }}
                                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-white/20"
                                    title="Change Font Style"
                                >
                                    <Type size={11} className="text-amber-300" />
                                    <span>{FONTS_LIST[currentFontIdx].name}</span>
                                </button>

                                {/* Color Palette Swatches */}
                                <div className="flex items-center gap-1">
                                    {COLOR_PALETTES.map((c, idx) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setSelectedColorIdx(idx);
                                            }}
                                            className={`w-4 h-4 rounded-full transition-all cursor-pointer border ${
                                                selectedColorIdx === idx
                                                    ? 'scale-125 border-white ring-2 ring-amber-400'
                                                    : 'border-white/30 opacity-70 hover:opacity-100'
                                            }`}
                                            style={{
                                                background: c.id === 'gold' ? '#f59e0b' : c.id === 'white' ? '#ffffff' : c.id === 'pink' ? '#ec4899' : c.id === 'cyan' ? '#06b6d4' : c.id === 'sunset' ? '#f97316' : '#a855f7'
                                            }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>

                                {/* Size Reducer & Enlarger */}
                                <div className="flex items-center gap-1">
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
                                        <ZoomOut size={11} />
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
                                        <ZoomIn size={11} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 100% CLEAN TRANSPARENT LYRICS DISPLAY */}
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
                                            ? `0 2px 10px rgba(0,0,0,0.95), 0 0 15px ${activeColor.glow}`
                                            : '0 2px 8px rgba(0,0,0,0.85)'
                                    }}
                                    className={`inline-block px-2.5 py-0.5 leading-snug transition-all ${
                                        isActive
                                            ? `text-transparent bg-clip-text bg-gradient-to-r ${activeColor.gradient} font-black scale-105`
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
}
