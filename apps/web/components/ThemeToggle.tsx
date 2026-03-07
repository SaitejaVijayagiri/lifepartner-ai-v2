'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, useDragControls } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragControls = useDragControls();

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed z-[9999] bottom-24 right-4 md:bottom-6 md:right-6 group touch-none"
            style={{ touchAction: 'none' }}
        >
            <div className="relative">
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
