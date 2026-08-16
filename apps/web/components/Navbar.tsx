'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, User, Moon, Sun } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import { useSocket } from '../context/SocketContext';
import { useTheme } from 'next-themes';

import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { Smartphone, Download } from 'lucide-react';
import DownloadAppModal from './DownloadAppModal';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
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

                {/* Desktop Actions + Language Selector + Download App */}
                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={() => setIsDownloadModalOpen(true)}
                        className="px-4 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Smartphone size={14} className="text-purple-600 dark:text-purple-400" />
                        <span>Download App</span>
                    </button>
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

                {/* Mobile Controls: Hamburger Menu */}
                <div className="md:hidden flex items-center gap-2">
                    {publicStats.onlineCount > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/60 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-300">{publicStats.onlineCount} Online</span>
                        </div>
                    )}
                    <button
                        className="p-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition-colors rounded-xl bg-gray-100/80 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer (Scrollable & Complete Links) */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full max-h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-2xl animate-in slide-in-from-top-5 duration-200 z-50">
                    <div className="px-5 py-6 flex flex-col gap-4">
                        {/* Theme Toggle & Language Selector in Drawer */}
                        <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <LanguageSelector isMobile={true} />
                            <button
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 shrink-0"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                                <span>{isDark ? 'Light' : 'Dark'}</span>
                            </button>
                        </div>
                        <hr className="border-gray-100 dark:border-gray-800 my-1" />

                        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                            Navigation & Features
                        </div>

                        <Link
                            href="#app-features"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navFeatures')}
                        </Link>
                        <Link
                            href="#stories-snaps-music"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center justify-between px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span>{t('navStories')}</span>
                            <span className="bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-pink-200 dark:border-pink-800">Snaps & Music</span>
                        </Link>
                        <Link
                            href="#how-life-partner-connects"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navWorkflow')}
                        </Link>
                        <Link
                            href="#meet-spots"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center justify-between px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span>Offline Meetups</span>
                            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-200 dark:border-indigo-800">📍 Real Life</span>
                        </Link>
                        <Link
                            href="/stranger-chat"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center justify-between px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span>Stranger Chat</span>
                            <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-green-200 dark:border-green-800">🔥 Free Video</span>
                        </Link>

                        <hr className="border-gray-100 dark:border-gray-800 my-1" />

                        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                            Company & Community
                        </div>

                        <Link
                            href="/about"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center justify-between px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span>About & Founder Story</span>
                            <span className="bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-purple-200 dark:border-purple-800">✨ Founder</span>
                        </Link>
                        <Link
                            href="/blog"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center justify-between px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span>{t('navBlog')}</span>
                            <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-rose-200 dark:border-rose-800">📚 Articles</span>
                        </Link>
                        <Link
                            href="/community"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {t('navCommunity')}
                        </Link>
                        <Link
                            href="/contact"
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 px-1 py-1"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Contact & Support
                        </Link>

                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsDownloadModalOpen(true);
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-sm flex items-center justify-center gap-2 border border-purple-200 dark:border-purple-800"
                        >
                            <Smartphone size={18} className="text-purple-600 dark:text-purple-400" />
                            <span>Download Mobile App (APK / PWA)</span>
                        </button>

                        <hr className="border-gray-100 dark:border-gray-800 my-1" />

                        {/* Account Actions */}
                        {user ? (
                            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                <button className="w-full py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg active:scale-95 transition-all text-center">
                                    Go to Dashboard
                                </button>
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-3 pt-1 pb-4">
                                <Link
                                    href="/login"
                                    className="w-full py-3 text-center text-base font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {t('navLogin')}
                                </Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="w-full py-3.5 font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <span>{t('navGetStarted')}</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <DownloadAppModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
        </nav>
    );
}
