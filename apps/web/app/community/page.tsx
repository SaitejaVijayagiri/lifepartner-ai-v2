'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CommunityChat from '@/components/CommunityChat';
import { ShieldCheck, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (_) {}
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Gated Access: Unverified / Not Logged In
    if (!user || user.is_verified === false) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
                <Navbar />
                <div className="pt-28 pb-16 px-4 sm:px-6 max-w-3xl mx-auto text-center flex-1 flex flex-col justify-center items-center">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock size={36} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                        Verified Lounge
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
                        The Verified Lounge is an exclusive live space for genuine members to connect, chat, and meet instantly in a safe environment.
                    </p>

                    <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 mb-8 max-w-md w-full text-left">
                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="bg-emerald-100 dark:bg-emerald-950/60 p-2.5 rounded-2xl">
                                <ShieldCheck size={26} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">Why Verify?</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Takes less than 10 seconds • 100% Free</p>
                            </div>
                        </div>
                        <ul className="space-y-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <li className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                                <span>Access Live Community Lounge</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                                <span>Get the Blue Verification Badge</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                                <span>3x More Profile Views & Matches</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3.5">
                        {user ? (
                            <button
                                onClick={() => router.push('/dashboard?tab=profile')}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-full font-bold text-base hover:opacity-95 hover:scale-[1.02] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={18} /> Verify Your Profile for Free <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/register')}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-full font-bold text-base hover:opacity-95 hover:scale-[1.02] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                            >
                                Create Free Account & Join <ArrowRight size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full sm:w-auto px-6 py-3 rounded-full font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-screen overflow-hidden bg-slate-100 dark:bg-gray-950 font-sans flex flex-col">
            <Navbar />
            <div className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 flex flex-col min-h-0">
                <div className="flex-1 h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                    <CommunityChat
                        currentUser={user}
                        defaultFullscreen={false}
                        onClose={() => router.push('/dashboard')}
                        onOpenStore={() => router.push('/dashboard?tab=profile')}
                        onViewProfile={(member) => {
                            const targetId = member.userId || member.id;
                            if (targetId) router.push(`/profile/${targetId}`);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
