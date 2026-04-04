
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function StickyCTA() {
    const [isVisible, setIsVisible] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const pathname = usePathname();

    // Only show on public pages
    const isPublicPage = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show when scrolled down past hero (e.g., 300px)
            // Hide when at the very top
            if (currentScrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    if (!isVisible || !isPublicPage) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-40 md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-900/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={10} /> 2000+ Verified Users
                    </span>
                    <span className="font-bold text-sm">Find your partner today.</span>
                </div>
                <Link href="/register">
                    <button className="bg-white text-indigo-900 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                        Get Started <ArrowRight size={14} />
                    </button>
                </Link>
            </div>
        </div>
    );
}
