'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';

interface FloatingMobileSignupBarProps {
    onSignupClick?: () => void;
}

export default function FloatingMobileSignupBar({ onSignupClick }: FloatingMobileSignupBarProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (token && userId) {
            setIsLoggedIn(true);
            return;
        }

        const handleScroll = () => {
            // Show bar after scrolling past top hero (250px)
            if (window.scrollY > 250) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isLoggedIn || !isVisible) return null;

    const handleClick = () => {
        if (onSignupClick) {
            onSignupClick();
        } else {
            const heroForm = document.getElementById('hero-signup-widget');
            if (heroForm) {
                heroForm.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = '/register?new=true';
            }
        }
    };

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:hidden animate-in slide-in-from-bottom duration-300 pointer-events-none">
            <div className="max-w-md mx-auto bg-gray-900/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-white pointer-events-auto ring-1 ring-white/10">
                <div className="flex flex-col min-w-0 pl-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                        <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                        <span>100% Free Signup</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-300 truncate">
                        Join 100k+ Verified Singles
                    </span>
                </div>

                <button
                    onClick={handleClick}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all shrink-0 flex items-center gap-1.5 border border-white/20"
                >
                    <UserPlus size={14} />
                    <span>Sign Up Free</span>
                    <ArrowRight size={13} />
                </button>
            </div>
        </div>
    );
}
