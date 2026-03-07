'use client';

import * as React from 'react';
import { Moon, Sun, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, useDragControls } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragControls = useDragControls();

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
        // Optional: Persist "hidden" state in sessionStorage so it doesn't reappear on every navigation
        const hiddenState = sessionStorage.getItem('theme-toggle-hidden');
        if (hiddenState === 'true') {
            setIsVisible(false);
        }
    }, []);

    const handleHide = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent theme switch
        setIsVisible(false);
        sessionStorage.setItem('theme-toggle-hidden', 'true');
    };

    if (!mounted || !isVisible) {
        return null;
    }

    const isDark = theme === 'dark';

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
                // Slight delay to prevent firing onClick immediately after drop
                setTimeout(() => setIsDragging(false), 100);
            }}
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed z-[9999] bottom-24 right-4 md:bottom-6 md:right-6 group touch-none"
            style={{ touchAction: 'none' }}
        >
            <div className="relative">
                {/* Hide Button (Shows on Hover/Active) */}
                <button
                    onClick={handleHide}
                    className={`absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 scale-75 cursor-pointer`}
                    title="Hide theme toggle"
                >
                    <X size={14} />
                </button>

                {/* Main Toggle Button */}
                <button
                    onClick={() => {
                        if (!isDragging) {
                            setTheme(isDark ? 'light' : 'dark');
                        }
                    }}
                    className={`
                        p-3 rounded-full shadow-lg border transition-colors duration-300 w-12 h-12 flex items-center justify-center
                        cursor-grab active:cursor-grabbing \${
                        isDark 
                            ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700 shadow-yellow-500/10' 
                            : 'bg-white border-gray-200 text-indigo-600 hover:bg-gray-50 shadow-indigo-500/10'
                        }
                    `}
                    title={isDark ? "Drag to move or Click to switch to Light Mode" : "Drag to move or Click to switch to Dark Mode"}
                >
                    {isDark ? <Sun size={24} /> : <Moon size={24} />}
                </button>
            </div>
        </motion.div>
    );
}
