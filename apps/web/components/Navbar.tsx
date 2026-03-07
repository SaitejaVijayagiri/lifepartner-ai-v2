'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, User, Users } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [user, setUser] = useState<any>(null);
    const { publicStats } = useSocket();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Check Auth using localStorage (Simple version)
        const checkAuth = () => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (e) { console.error(e); }
        };
        checkAuth();
        // Listen for storage events (login/logout sync)
        window.addEventListener('storage', checkAuth);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    return (
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
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
                <div className="hidden md:flex space-x-8 items-center">
                    {['Success Stories', 'How it Works', 'App Features'].map((item) => (
                        <Link
                            key={item}
                            href={`/#${item.toLowerCase().replace(/ /g, '-')}`}
                            className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide"
                        >
                            {item}
                        </Link>
                    ))}
                    <Link href="/blog" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide flex items-center gap-1">
                        Blog <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">SEO</span>
                    </Link>
                    <Link href="/community" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors tracking-wide flex items-center gap-1">
                        Community <span className="bg-indigo-100 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">New</span>
                    </Link>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <Link href="/dashboard" className="flex items-center gap-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 pl-2 pr-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} className="w-full h-full object-cover" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || 'User')}`;
                                    }} />
                                ) : (
                                    <User size={16} />
                                )}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                    {user.full_name?.split(' ')[0] || 'Dashboard'}
                                    {user.is_verified && <VerificationBadge size={12} />}
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition-colors">
                                Log In
                            </Link>
                            <Link href="/register">
                                <button className="group relative px-6 py-2.5 font-bold text-white rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95">
                                    <span className="relative flex items-center gap-2 text-sm uppercase tracking-wide">
                                        Get Started <ArrowRight size={14} />
                                    </span>
                                </button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-xl animate-in slide-in-from-top-5 duration-200">
                    <div className="px-6 py-8 flex flex-col gap-6">
                        {['Success Stories', 'How it Works', 'App Features'].map((item) => (
                            <Link
                                key={item}
                                href={`/#${item.toLowerCase().replace(/ /g, '-')}`}
                                className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item}
                            </Link>
                        ))}

                        {/* Mobile Live Stats */}
                        {publicStats.onlineCount > 0 && (
                            <div className="flex items-center gap-2 px-0 py-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-bold text-green-700">{publicStats.onlineCount} People Live Now</span>
                            </div>
                        )}

                        <Link
                            href="/blog"
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center gap-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Read our SEO Blog <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Top Articles</span>
                        </Link>
                        <Link
                            href="/community"
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 flex items-center gap-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Community <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">New</span>
                        </Link>
                        <hr className="border-gray-100 dark:border-gray-800" />
                        <Link
                            href="/login"
                            className="text-lg font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Log In
                        </Link>
                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                            <button className="w-full py-4 font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
                                Get Started Free
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
