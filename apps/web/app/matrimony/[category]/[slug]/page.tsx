'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api'; // Ensure this matches your project structure
import { Button } from '@/components/ui/button'; // Ensure this exists
import Link from 'next/link';

export default function SEOPage({ params }: { params: { category: string; slug: string } }) {
    const { category, slug } = params;
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const titleCase = (str: string) => str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const displayValue = titleCase(slug);
    const displayCategory = titleCase(category);

    useEffect(() => {
        api.matches.getPublicPreviews(category, slug)
            .then(res => {
                setMatches(res.matches || []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [category, slug]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 1. Hero Section */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white pt-24 pb-16 px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                    {displayCategory === 'Location' ? (
                        <>Matrimony in <span className="text-yellow-300">{displayValue}</span></>
                    ) : (
                        <>{displayValue} <span className="text-yellow-300">Matrimony</span></>
                    )}
                </h1>
                <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8">
                    The most trusted way to find your life partner in {displayValue}.
                    Verified profiles, secure matching, and privacy first.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/register">
                        <Button className="h-14 px-8 text-lg bg-white text-rose-600 hover:bg-gray-100 font-bold rounded-full shadow-lg transition-transform hover:scale-105">
                            Create Free Profile
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline" className="h-14 px-8 text-lg border-2 border-white text-white hover:bg-white/10 font-bold rounded-full bg-transparent">
                            Login
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 2. Stats / Trust Bar */}
            <div className="bg-white shadow-sm py-8 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-gray-700">
                    <div>
                        <div className="text-3xl font-bold text-rose-600 mb-1">100%</div>
                        <div className="text-sm uppercase tracking-wide">Verified</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-rose-600 mb-1">50k+</div>
                        <div className="text-sm uppercase tracking-wide">Active Users</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-rose-600 mb-1">Privacy</div>
                        <div className="text-sm uppercase tracking-wide">First Priority</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-rose-600 mb-1">AI</div>
                        <div className="text-sm uppercase tracking-wide">Matchmaking</div>
                    </div>
                </div>
            </div>

            {/* 3. Preview Profiles Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Latest Profiles from {displayValue}
                </h2>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Loading recent profiles...</div>
                ) : matches.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {matches.map((m: any) => (
                            <div key={m.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group relative">
                                <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                                    {/* Blurred Image Effect */}
                                    <img
                                        src={m.photoUrl}
                                        className="w-full h-full object-cover blur-[2px] opacity-80 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Register Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href="/register">
                                            <span className="bg-rose-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md">
                                                View Full Profile
                                            </span>
                                        </Link>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                                        ID: {m.id.substring(0, 5)}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 truncate">{m.name}</h3>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{m.age} Yrs • {m.role}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        📍 {m.location}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <h3 className="text-xl font-bold text-gray-600 mb-2">Join the growing community in {displayValue}</h3>
                        <p className="text-gray-500 mb-6">Be the first to create a premium profile here.</p>
                        <Link href="/register">
                            <Button>Register Now</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* 4. SEO Content (Dynamic Text) */}
            <div className="bg-white py-16 border-t">
                <div className="max-w-4xl mx-auto px-6 text-gray-700 space-y-6 leading-relaxed">
                    <h3 className="text-2xl font-bold text-gray-900">Why Choose LifePartner AI for {displayValue} Matrimony?</h3>
                    <p>
                        Finding a life partner in <strong>{displayValue}</strong> has never been easier.
                        Our AI-powered platform understands local preferences, cultural nuances of {displayCategory === 'Community' ? `the ${displayValue} community` : `people in ${displayValue}`},
                        and professional expectations.
                    </p>
                    <p>
                        Unlike traditional matrimony sites, we prioritize privacy and verification.
                        Every profile from {displayValue} goes through a strict verification process.
                        Whether you are looking for Doctors, Engineers, or detailed horoscope matching,
                        LifePartner AI is the trusted choice for thousands of families.
                    </p>
                </div>
            </div>

            {/* 5. Footer CTA */}
            <div className="bg-gray-900 text-white py-16 text-center">
                <h3 className="text-3xl font-bold mb-4">Start Your Journey Today</h3>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                    Your perfect match could be just a click away. Join thousands of happy couples who found love on LifePartner AI.
                </p>
                <Link href="/register">
                    <Button size="lg" className="bg-rose-600 hover:bg-rose-700 h-14 px-10 rounded-full text-lg">
                        Find My Match Free
                    </Button>
                </Link>
            </div>
        </div>
    );
}
