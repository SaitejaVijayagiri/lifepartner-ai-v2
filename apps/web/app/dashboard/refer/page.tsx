'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Gift, Copy, Share2, Award, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

export default function ReferralPage() {
    const toast = useToast();
    const [referralData, setReferralData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                // Since this uses the api utility which handles the base URL and auth tokens naturally
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/profile/referrals`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await response.json();
                setReferralData(data);
            } catch (error) {
                console.error("Failed to load referrals", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReferrals();
    }, []);

    const handleCopy = () => {
        const link = `https://lifepartnerai.in/register?ref=${referralData?.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const handleShare = async () => {
        const link = `https://lifepartnerai.in/register?ref=${referralData?.referralCode}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join LifePartner AI',
                    text: 'Find your perfect match on the world\'s first AI-powered offline-first matrimony app!',
                    url: link,
                });
            } catch (err) {
                console.log("Share failed", err);
            }
        } else {
            handleCopy();
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>

                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <Gift size={48} className="mb-6 opacity-90" />
                    <h1 className="text-3xl sm:text-5xl font-black mb-4">Give Love. Get Love.</h1>
                    <p className="text-indigo-100 text-lg mb-8 max-w-lg">
                        Invite your single friends to LifePartner AI. When they verify their profile, 
                        you both unlock <span className="font-bold text-white">Premium Compatibility Reports</span> for free!
                    </p>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20">
                        <div className="flex-1 font-mono text-sm sm:text-lg font-bold tracking-wider text-center sm:text-left break-all">
                            lifepartnerai.in/register?ref={referralData?.referralCode || 'LOAD'}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={handleCopy} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-bold">
                                <Copy size={18} /> Copy
                            </button>
                            <button onClick={handleShare} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl transition-all font-bold shadow-lg hover:scale-105 active:scale-95">
                                <Share2 size={18} /> Share
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-gray-700 text-indigo-500 flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Friends Joined</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-gray-100">{referralData?.totalReferrals || 0}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-gray-700 text-amber-500 flex items-center justify-center">
                            <Award size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Premium Rewards</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-gray-100">{Math.floor((referralData?.totalReferrals || 0) / 1)}</h3>
                        </div>
                    </div>
                </div>

                {/* Recent Referrals List */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Your Network</h3>
                    
                    {referralData?.referrals?.length > 0 ? (
                        <div className="space-y-4">
                            {referralData.referrals.map((ref: any, idx: number) => (
                                <div key={ref.id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 font-bold">
                                            {(ref.full_name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{ref.full_name || 'Anonymous User'}</p>
                                            <p className="text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {ref.is_verified ? (
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">Verified</span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wide">Pending</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 font-medium">You haven't invited anyone yet.</p>
                            <p className="text-sm text-gray-400 mt-2">Share your link to unlock premium rewards!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
