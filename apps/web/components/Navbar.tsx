'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, User, Moon, Sun } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import { useSocket } from '../context/SocketContext';
import { useTheme } from 'next-themes';

import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const isDark = mounted && theme === 'dark';
    const { t } = useLanguage();

    const [user, setUser] = useState<any>(null);
    const { publicStats } = useSocket();

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const checkAuth = () => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (e) { console.error(e); }
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    return (
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200">
                        <Sparkles size={18} fill="white" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">
                        LifePartner AI
                    </span>
                </Link>

                {/* Live Stats (Visible to All) */}
                {publicStats.onlineCount > 0 && (
                    <div className="hidden lg:flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 ml-4 animate-in fade-in zoom-in duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-700">{publicStats.onlineCount} Online</span>
                    </div>
                )}

                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-6 lg:space-x-8 items-center">
                    <Link
                        href="#app-features"
                        className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide"
                    >
                        {t('navFeatures')}
                    </Link>
                    <Link
                        href="#stories-snaps-music"
                        className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide flex items-center gap-1"
                    >
                        {t('navStories')} <span className="bg-pink-100 text-pink-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Snaps</span>
                    </Link>
                    <Link
                        href="#how-life-partner-connects"
                        className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide"
                    >
                        {t('navWorkflow')}
                    </Link>
                    <Link href="/blog" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide flex items-center gap-1">
                        {t('navBlog')} <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">SEO</span>
                    </Link>
                </div>

                {/* Desktop Actions + Language Selector */}
                <div className="hidden md:flex items-center gap-3">
                    <LanguageSelector />
                    {user ? (
                        <Link href="/dashboard" className="flex items-center gap-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 pl-2 pr-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} className="w-full h-full object-cover" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.name || 'User')}`;
                                    }} />
                                ) : (
                                    <User size={16} />
                                )}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                    {(user.full_name || user.name || 'Dashboard').split(' ')[0]}
                                    {user.is_verified && <VerificationBadge size={12} />}
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">
                                {t('navLogin')}
                            </Link>
                            <Link href="/register">
                                <button className="group relative px-5 py-2 font-bold text-white rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-indigo-500/30 transition-all active:scale-95">
                                    <span className="relative flex items-center gap-1.5 text-xs uppercase tracking-wide">
                                        {t('navGetStarted')} <ArrowRight size={14} />
                                    </span>
                                </button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Controls: Language + Theme Toggle + Hamburger */}
                <div className="md:hidden flex items-center gap-2">
                    <LanguageSelector />
                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-xl animate-in slide-in-from-top-5 duration-200">
                    <div className="px-6 py-6 flex flex-col gap-5">
                        <LanguageSelector isMobile={true} />
                        <hr className="border-gray-100 dark:border-gray-800" />
                        <Link
                            href="#app-features"
                            className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navFeatures')}
                        </Link>
                        <Link
                            href="#stories-snaps-music"
                            className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center gap-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navStories')} <span className="bg-pink-100 text-pink-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Snaps & Music</span>
                        </Link>
                        <Link
                            href="#how-life-partner-connects"
                            className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navWorkflow')}
                        </Link>
                        <Link
                            href="/blog"
                            className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center gap-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navBlog')} <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Top Articles</span>
                        </Link>
                        <hr className="border-gray-100 dark:border-gray-800" />
                        <Link
                            href="/login"
                            className="text-base font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navLogin')}
                        </Link>
                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                            <button className="w-full py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg active:scale-95 transition-all">
                                {t('navGetStarted')}
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
