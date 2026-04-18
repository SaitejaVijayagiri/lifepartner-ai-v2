'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, UserCheck, Sparkles, MapPin } from 'lucide-react';

const MOCK_EVENTS = [
    { type: 'verify', text: 'Priya from Hyderabad just verified her profile', icon: <UserCheck size={15} className="text-blue-500" /> },
    { type: 'match', text: 'Vikram & Anjali just matched! 💖', icon: <Heart size={15} className="text-pink-500" /> },
    { type: 'join', text: 'Someone in Bangalore just joined', icon: <MapPin size={15} className="text-green-500" /> },
    { type: 'premium', text: 'Rahul just unlocked Advanced Cosmic Matching 🚀', icon: <Sparkles size={15} className="text-amber-500" /> },
    { type: 'verify', text: 'Neha from Pune just verified her profile', icon: <UserCheck size={15} className="text-blue-500" /> },
    { type: 'match', text: 'Arjun & Sneha had a great Speed Date! ⚡', icon: <Heart size={15} className="text-indigo-500" /> },
];

export default function SocialProofToasts() {
    const [currentEventIndex, setCurrentEventIndex] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const initialDelay = setTimeout(() => {
            scheduleNextEvent();
        }, 3500);
        return () => clearTimeout(initialDelay);
    }, []);

    const scheduleNextEvent = () => {
        const randomIndex = Math.floor(Math.random() * MOCK_EVENTS.length);
        setCurrentEventIndex(randomIndex);
        setIsVisible(true);

        setTimeout(() => {
            setIsVisible(false);
            const nextInterval = Math.floor(Math.random() * 7000) + 8000;
            setTimeout(scheduleNextEvent, nextInterval);
        }, 4000);
    };

    return (
        // On mobile: sit above the bottom nav (bottom-20). On desktop: bottom-6.
        // Left padding reduced on mobile so it doesn't clip narrow screens.
        // max-w capped smaller so it never overflow a 360px wide phone.
        <div className="fixed bottom-28 md:bottom-6 left-3 md:left-6 z-50 pointer-events-none">
            <AnimatePresence>
                {isVisible && currentEventIndex >= 0 && (
                    <motion.div
                        key={currentEventIndex}
                        initial={{ opacity: 0, y: 40, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-3 flex items-center gap-3 max-w-[260px] md:max-w-[300px]"
                    >
                        <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
                            {MOCK_EVENTS[currentEventIndex].icon}
                        </div>
                        <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                            {MOCK_EVENTS[currentEventIndex].text}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
