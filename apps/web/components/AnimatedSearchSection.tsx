'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, MapPin, Briefcase, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const PROMPTS = [
    "Software engineer in Hyderabad who loves hiking",
    "Doctor in Mumbai looking for a serious relationship",
    "Life partner whose gothra is Bharadwaja and vegetarian",
    "Creative designer who speaks Telugu and loves pets"
];

const MOCK_RESULTS = [
    [
        { name: "Vikram S.", role: "Sr. Software Engineer", loc: "Hyderabad", match: "98%", img: "https://i.pravatar.cc/150?u=vikram" },
        { name: "Arjun R.", role: "Tech Lead", loc: "Hyderabad", match: "95%", img: "https://i.pravatar.cc/150?u=arjun" }
    ],
    [
        { name: "Dr. Anisha M.", role: "Pediatrician", loc: "Mumbai", match: "99%", img: "https://i.pravatar.cc/150?u=anisha" },
        { name: "Dr. Rohan K.", role: "Surgeon", loc: "Mumbai", match: "94%", img: "https://i.pravatar.cc/150?u=rohan" }
    ]
];

export default function AnimatedSearchSection() {
    const [promptIndex, setPromptIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Interactive State
    const [isInteractive, setIsInteractive] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [userSearchActive, setUserSearchActive] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isInteractive) return;

        const typingSpeed = 50;
        const deletingSpeed = 30;
        const pauseTime = 3000;
        const currentPrompt = PROMPTS[promptIndex];
        let timeout: NodeJS.Timeout;

        if (!isDeleting && displayedText !== currentPrompt) {
            setShowResults(false);
            timeout = setTimeout(() => {
                setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
            }, typingSpeed);
        } else if (!isDeleting && displayedText === currentPrompt) {
            setShowResults(true);
            timeout = setTimeout(() => {
                setIsDeleting(true);
                setShowResults(false);
            }, pauseTime);
        } else if (isDeleting && displayedText !== '') {
            timeout = setTimeout(() => {
                setDisplayedText(currentPrompt.slice(0, displayedText.length - 1));
            }, deletingSpeed);
        } else if (isDeleting && displayedText === '') {
            setIsDeleting(false);
            setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
        }

        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, promptIndex, isInteractive]);

    const handleContainerClick = () => {
        if (!isInteractive) {
            setIsInteractive(true);
            setUserInput('');
            setShowResults(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        setIsSearching(true);
        setUserSearchActive(false);
        setTimeout(() => {
            setIsSearching(false);
            setUserSearchActive(true);
        }, 1500);
    };

    return (
        <section className="py-14 md:py-24 relative overflow-visible bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
            {/* Background Decor — hidden on mobile to avoid overflow */}
            <div className="hidden md:block absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="hidden md:block absolute bottom-0 left-1/4 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="text-center mb-10 md:mb-16 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold uppercase tracking-widest text-xs mb-5 shadow-sm">
                        <Sparkles size={14} className="text-indigo-500" /> AI Matchmaker
                    </div>
                    <h2 className="text-3xl md:text-5xl font-heading font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight leading-tight">
                        Just tell us what<br className="md:hidden" /> you're looking for.
                    </h2>
                    <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium px-2">
                        Our AI translates natural language into deep-filtered matches instantly. Try it right here.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Search Bar + Submit — unified layout on all screen sizes */}
                    <form onSubmit={handleSearch}>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            onClick={handleContainerClick}
                            className={`bg-white dark:bg-gray-950 rounded-2xl md:rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border ${isInteractive ? 'border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900/50' : 'border-gray-200 dark:border-gray-800'} transition-all cursor-text`}
                        >
                            {/* Top row: icon + input */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                    <Search className="text-indigo-500" size={20} />
                                </div>
                                <div className="flex-1 min-h-[36px] flex items-center overflow-hidden">
                                    {isInteractive ? (
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder="e.g. Doctor in Pune who loves music..."
                                            className="w-full text-base md:text-xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:font-normal placeholder:text-gray-400"
                                        />
                                    ) : (
                                        <span className="text-base md:text-xl font-semibold text-gray-700 dark:text-gray-300 truncate">
                                            {displayedText}
                                            <span className="inline-block w-[2px] h-[18px] bg-indigo-500 ml-0.5 translate-y-[3px] animate-[pulse_1s_infinite]"></span>
                                        </span>
                                    )}
                                </div>
                                {/* Desktop search button — inline */}
                                <div className="hidden md:block shrink-0">
                                    <button
                                        type="submit"
                                        className="bg-gray-900 text-white px-7 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-md whitespace-nowrap"
                                    >
                                        {isSearching ? 'Analyzing...' : 'Search Matches'}
                                    </button>
                                </div>
                            </div>

                            {/* Mobile search button — full-width, below input */}
                            {isInteractive && (
                                <div className="md:hidden mt-3">
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-95 transition-all"
                                    >
                                        {isSearching ? 'Analyzing...' : '🔍 Find My Match'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </form>

                    {/* Results Container */}
                    <div className="mt-6 md:mt-8 relative min-h-[200px]">
                        <AnimatePresence mode="wait">

                            {/* Auto-rotating demo results */}
                            {showResults && !isInteractive && !userSearchActive && (
                                <motion.div
                                    key={promptIndex + "_auto"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    {MOCK_RESULTS[promptIndex % MOCK_RESULTS.length].map((res, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm flex gap-4 items-center relative overflow-hidden"
                                        >
                                            <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {res.match}
                                            </div>

                                            <div className="relative shrink-0">
                                                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                    <img src={res.img} alt={res.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                                                    <CheckCircle size={8} className="text-white" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">{res.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 truncate">
                                                    <Briefcase size={11} className="text-indigo-400 shrink-0" />
                                                    <span className="truncate">{res.role}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                                                    <MapPin size={11} className="text-rose-400 shrink-0" />
                                                    <span>{res.loc}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Loading spinner */}
                            {isSearching && (
                                <motion.div
                                    key="searching"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-12"
                                >
                                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                                    <p className="text-indigo-600 font-bold uppercase tracking-wider text-xs animate-pulse">Running Neural Matching...</p>
                                </motion.div>
                            )}

                            {/* Blurred results + unlock CTA */}
                            {userSearchActive && (
                                <motion.div
                                    key="interactive_results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative w-full"
                                >
                                    {/* Blurred skeleton cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 filter blur-[5px] opacity-50 select-none pointer-events-none">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 p-4 rounded-2xl flex gap-4 items-center">
                                                <div className="w-16 h-16 rounded-xl bg-gray-300 shrink-0"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Centered CTA — sits over the blurred cards, no negative translate */}
                                    <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
                                        <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/40 p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-2xl text-center w-full max-w-sm">
                                            <div className="mx-auto w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-4 text-pink-600">
                                                <Lock size={26} />
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">
                                                We found 8 matches! 🎉
                                            </h3>
                                            <p className="text-gray-500 mb-5 text-sm leading-relaxed">
                                                Join LifePartner AI for free to view their full profiles and send a message.
                                            </p>
                                            <Link href="/register" className="block">
                                                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg active:scale-95 transition-all">
                                                    Unlock My Matches →
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
