'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`
                fixed z-[9999] p-3 rounded-full shadow-lg border transition-all duration-300 hover:scale-110 active:scale-95
                bottom-24 right-4 md:bottom-6 md:right-6 \${
                isDark 
                    ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700 hover:shadow-yellow-500/20' 
                    : 'bg-white border-gray-200 text-indigo-600 hover:bg-gray-50 hover:shadow-indigo-500/20'
                }
            `}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    );
}
