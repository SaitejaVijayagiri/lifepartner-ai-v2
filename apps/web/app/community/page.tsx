'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CommunityChat from '@/components/CommunityChat';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

    // Gated Access: Unverified / Not Logged In
    if (!user || user.is_verified === false) { // Strict check
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                <Navbar />
                <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500">
                        <Lock size={48} className="text-gray-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 font-heading">
                        Verified Members Only
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        The Community Lounge is an exclusive space for verified members to connect, share stories, and find matches in a safe environment.
                    </p>

                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-10 max-w-lg mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-green-100 p-3 rounded-full">
                                <ShieldCheck size={32} className="text-green-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg text-gray-900">Why Verify?</h3>
                                <p className="text-sm text-gray-500">Short video selfie verification.</p>
                            </div>
                        </div>
                        <ul className="space-y-4 text-left">
                            <li className="flex items-center gap-3 text-gray-700 font-medium">
                                <span className="text-green-500">✓</span> Access Community Lounge
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 font-medium">
                                <span className="text-green-500">✓</span> Get the Blue Tick Badge
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 font-medium">
                                <span className="text-green-500">✓</span> 3x More Profile Views
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => {
                            console.log("Community Button Clicked. User:", user);
                            if (!user) {
                                // Guest -> Register
                                window.location.href = '/register';
                            } else {
                                // User -> Premium Store
                                window.location.href = '/dashboard?action=open_premium';
                            }
                        }}
                        className="bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 mx-auto"
                    >
                        Get Verified Now {user ? "(User)" : "(Guest)"} <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
            <Navbar />
            <div className="pt-24 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 md:px-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Community Lounge
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold tracking-wide uppercase border border-indigo-200">Verified Only</span>
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Connect with {523}+ active verified members right now.</p>
                </div>

                <div className="flex-1 flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-140px)]">
                    {/* Main Chat Area */}
                    <div className="flex-1 h-full">
                        <div className="flex-1 h-full">
                            <CommunityChat
                                currentUser={user}
                                onOpenStore={() => router.push('/dashboard?action=open_premium')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
