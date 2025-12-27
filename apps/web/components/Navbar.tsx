'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200">
                        <Sparkles size={18} fill="white" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">
                        LifePartner AI
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-8 items-center">
                    {['Success Stories', 'How it Works', 'App Features'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                            className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors tracking-wide"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/login" className="text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                        Log In
                    </Link>
                    <Link href="/register">
                        <button className="group relative px-6 py-2.5 font-bold text-white rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95">
                            <span className="relative flex items-center gap-2 text-sm uppercase tracking-wide">
                                Get Started <ArrowRight size={14} />
                            </span>
                        </button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl animate-in slide-in-from-top-5 duration-200">
                    <div className="px-6 py-8 flex flex-col gap-6">
                        {['Success Stories', 'How it Works', 'App Features'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                                className="text-lg font-medium text-gray-800 hover:text-indigo-600"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item}
                            </a>
                        ))}
                        <hr className="border-gray-100" />
                        <Link
                            href="/login"
                            className="text-lg font-bold text-gray-700 hover:text-indigo-600"
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
