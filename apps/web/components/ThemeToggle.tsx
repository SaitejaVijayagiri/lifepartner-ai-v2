'use client';

import * as React from 'react';
import { Moon, Sun, X, Maximize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isMinimized, setIsMinimized] = React.useState(false);
    const dragControls = useDragControls();

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
        // Load preference
        const savedState = localStorage.getItem('theme-toggle-minimized');
        if (savedState === 'true') {
            setIsMinimized(true);
        }
    }, []);

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = !isMinimized;
        setIsMinimized(newState);
        localStorage.setItem('theme-toggle-minimized', String(newState));
    };

    if (!mounted) {
        return null;
    }

    const isDark = theme === 'dark';

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
                // Slight delay to prevent firing onClick immediately after drop
                setTimeout(() => setIsDragging(false), 100);
            }}
            whileDrag={{ scale: 1.1, cursor: "grabbing" }}
            initial={false}
            animate={isMinimized ? "minimized" : "expanded"}
            className="fixed z-[9999] bottom-24 right-4 md:bottom-6 md:right-6 group touch-none"
            style={{ touchAction: 'none' }}
        >
            <div className="relative flex items-center justify-center">

                <AnimatePresence mode="wait">
                    {!isMinimized ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
                            className="relative"
                        >
                            {/* Minimize Button (Shows on Hover/Active) */}
                            <button
                                onClick={toggleMinimize}
                                className={`absolute -top-2 -right-2 p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-300 dark:hover:bg-gray-600 scale-75 cursor-pointer border border-gray-300 dark:border-gray-600`}
                                title="Minimize theme toggle"
                            >
                                <X size={14} strokeWidth={3} />
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
                        </motion.div>
                    ) : (
                        <motion.button
                            key="minimized"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
                            onClick={toggleMinimize}
                            title="Restore Theme Toggle"
                            className={`
                                w-8 h-8 rounded-full shadow-md border flex items-center justify-center cursor-pointer transition-colors
                                \${isDark 
                                    ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700' 
                                    : 'bg-white border-gray-300 text-gray-400 hover:text-black hover:bg-gray-100'
                                }
                            `}
                        >
                            <Maximize2 size={12} strokeWidth={3} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
