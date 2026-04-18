'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, MapPin, Briefcase, Heart, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PROMPTS = [
    "Software engineer in Hyderabad who loves hiking",
    "Doctor in Mumbai looking for a serious relationship",
    "Life partner whose gothra is Bharadwaja and vegetarian",
    "Creative designer who speaks fluent Telugu and loves pets"
];

const MOCK_RESULTS = [
    [
        { name: "Vikram S.", role: "Sr. Software Engineer", loc: "Hyderabad", match: "98%", img: "/images/avatars/user-1.jpg" },
        { name: "Arjun R.", role: "Tech Lead", loc: "Hyderabad", match: "95%", img: "/images/avatars/user-2.jpg" }
    ],
    [
        { name: "Dr. Anisha M.", role: "Pediatrician", loc: "Mumbai", match: "99%", img: "/images/avatars/user-3.jpg" },
        { name: "Dr. Rohan K.", role: "Surgeon", loc: "Mumbai", match: "94%", img: "/images/avatars/user-4.jpg" }
    ]
];

export default function AnimatedSearchSection() {
    const router = useRouter();
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
        if (isInteractive) return; // Stop animation if user took over

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

        // Simulate network delay
        setTimeout(() => {
            setIsSearching(false);
            setUserSearchActive(true);
        }, 1500);
    };

    return (
        <section className="py-24 relative overflow-hidden bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
            {/* Background Decor */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold uppercase tracking-widest text-xs mb-6 shadow-sm">
                        <Sparkles size={14} className="text-indigo-500" /> AI Matchmaker
                    </div>
                    <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
                        Just tell us what you're looking for.
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 max-w-2xl mx-auto font-medium">
                        Our proprietary NLP engine translates natural language into deep-filtered matches instantly. Try it out right here.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch}>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            onClick={handleContainerClick}
                            className={`bg-white dark:bg-gray-950 rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border ${isInteractive ? 'border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900/50' : 'border-gray-200 dark:border-gray-800'} flex items-center gap-4 relative z-20 cursor-text transition-all`}
                        >
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Search className="text-indigo-500" size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden pr-4 min-h-[40px] flex items-center">
                                {isInteractive ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Type your ideal match..."
                                        className="w-full text-xl md:text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
                                    />
                                ) : (
                                    <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-500 bg-clip-text text-transparent break-words">
                                        {displayedText}
                                        <span className="inline-block w-[3px] h-[24px] bg-indigo-500 ml-1 translate-y-[4px] animate-[pulse_1s_infinite]"></span>
                                    </span>
                                )}
                            </div>
                            <div className="hidden md:flex shrink-0 pr-2">
                                <button type="submit" className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-black transition-all shadow-md">
                                    {isSearching ? 'Analyzing...' : 'Search Matches'}
                                </button>
                            </div>
                        </motion.div>
                    </form>

                    {/* Results Container */}
                    <div className="mt-8 relative min-h-[220px]">
                        <AnimatePresence mode="wait">
                            {/* Auto-rotating mock results (Before user interacts) */}
                            {showResults && !isInteractive && !userSearchActive && (
                                <motion.div
                                    key={promptIndex + "_auto"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.5, staggerChildren: 0.1 }}
                                    className="flex w-full overflow-x-auto md:grid md:grid-cols-2 gap-6 pb-4 md:pb-0 px-2 no-scrollbar"
                                >
                                    {MOCK_RESULTS[promptIndex % MOCK_RESULTS.length].map((res, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="w-full min-w-[300px] shrink-0 bg-white/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex gap-5 items-center relative overflow-hidden group hover:border-indigo-200 transition-colors"
                                        >
                                            <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                                                {res.match} Match
                                            </div>

                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                    <img src={res.img} alt={res.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-[3px] border-white flex items-center justify-center">
                                                    <CheckCircle size={10} className="text-white" />
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{res.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
                                                    <Briefcase size={12} className="text-indigo-400" /> {res.role}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 font-medium">
                                                    <MapPin size={12} className="text-rose-400" /> {res.loc}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* User Search loading state */}
                            {isSearching && (
                                <motion.div
                                    key="searching"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center"
                                >
                                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                    <p className="text-indigo-600 font-bold uppercase tracking-wider text-sm animate-pulse">Running Neural Matching...</p>
                                </motion.div>
                            )}

                            {/* User interactive results (Blurred CTA) */}
                            {userSearchActive && (
                                <motion.div
                                    key="interactive_results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative w-full"
                                >
                                    <div className="flex w-full overflow-x-auto md:grid md:grid-cols-2 gap-6 pb-4 md:pb-0 px-2 no-scrollbar filter blur-[6px] opacity-60 select-none">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="w-full min-w-[300px] shrink-0 bg-white/80 border border-gray-100 p-5 rounded-3xl flex gap-5 items-center">
                                                <div className="w-20 h-20 rounded-2xl bg-gray-300"></div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4">
                                        <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/40 p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full transform -translate-y-4">
                                            <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-6 text-pink-600">
                                                <Lock size={32} />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">We found 8 highly compatible matches!</h3>
                                            <p className="text-gray-500 mb-8 font-medium text-sm">Join LifePartner AI for free to view their profiles and send a message.</p>
                                            
                                            <Link href="/register" className="block w-full">
                                                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] transition-all">
                                                    Unlock My Matches
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
