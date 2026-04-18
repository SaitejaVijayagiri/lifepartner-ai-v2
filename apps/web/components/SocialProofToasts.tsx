'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, UserCheck, Sparkles, MapPin } from 'lucide-react';

const MOCK_EVENTS = [
    { type: 'verify', text: 'Priya from Hyderabad just verified her profile', icon: <UserCheck size={16} className="text-blue-500" /> },
    { type: 'match', text: 'Vikram & Anjali just matched! 💖', icon: <Heart size={16} className="text-pink-500" /> },
    { type: 'join', text: 'Someone in Bangalore just joined', icon: <MapPin size={16} className="text-green-500" /> },
    { type: 'premium', text: 'Rahul just unlocked Advanced Cosmic Matching 🚀', icon: <Sparkles size={16} className="text-amber-500" /> },
    { type: 'verify', text: 'Neha from Pune just verified her profile', icon: <UserCheck size={16} className="text-blue-500" /> },
    { type: 'match', text: 'Arjun & Sneha had a great Speed Date! ⚡', icon: <Heart size={16} className="text-indigo-500" /> },
];

export default function SocialProofToasts() {
    const [currentEventIndex, setCurrentEventIndex] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Start showing events after an initial delay
        const initialDelay = setTimeout(() => {
            scheduleNextEvent();
        }, 3000);

        return () => clearTimeout(initialDelay);
    }, []);

    const scheduleNextEvent = () => {
        // Pick a random event
        const randomIndex = Math.floor(Math.random() * MOCK_EVENTS.length);
        setCurrentEventIndex(randomIndex);
        setIsVisible(true);

        // Hide it after 4 seconds
        setTimeout(() => {
            setIsVisible(false);
            
            // Schedule the NEXT event somewhere between 8 to 15 seconds later
            const nextInterval = Math.floor(Math.random() * 7000) + 8000;
            setTimeout(scheduleNextEvent, nextInterval);
        }, 4000);
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
            <AnimatePresence>
                {isVisible && currentEventIndex >= 0 && (
                    <motion.div
                        key={currentEventIndex}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3 max-w-[300px]"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
                            {MOCK_EVENTS[currentEventIndex].icon}
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                            {MOCK_EVENTS[currentEventIndex].text}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
