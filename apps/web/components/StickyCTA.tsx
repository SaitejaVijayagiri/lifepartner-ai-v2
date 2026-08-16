
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Smartphone, Download } from 'lucide-react';
import DownloadAppModal from './DownloadAppModal';

export default function StickyCTA() {
    const [isVisible, setIsVisible] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const pathname = usePathname();

    // Only show on public pages
    const isPublicPage = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show when scrolled down past hero (e.g., 400px)
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
        <>
            <div className="fixed bottom-0 left-0 right-0 p-3 pb-5 z-40 md:hidden animate-in slide-in-from-bottom duration-300">
                <div className="bg-gray-950/95 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl border border-purple-500/30 flex items-center justify-between gap-2">
                    <button
                        onClick={() => setIsDownloadModalOpen(true)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2.5 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Smartphone size={15} />
                        <span>Download App</span>
                    </button>
                    <Link href="/register?new=true" className="flex-1">
                        <button className="w-full bg-white text-gray-900 px-3 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1">
                            <span>Free Sign Up</span>
                            <ArrowRight size={14} />
                        </button>
                    </Link>
                </div>
            </div>
            <DownloadAppModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
        </>
    );
}
