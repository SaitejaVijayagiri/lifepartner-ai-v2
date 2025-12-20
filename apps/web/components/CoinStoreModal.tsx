'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, Coins, Sparkles, Crown, Zap, Star, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { load } from '@cashfreepayments/cashfree-js';

const COIN_BUNDLES = [
    { id: 'starter', coins: 100, price: 99, label: 'Starter', emoji: '💫', popular: false },
    { id: 'popular', coins: 500, price: 399, label: 'Popular', emoji: '⭐', popular: true, bonus: '+50 Bonus' },
    { id: 'pro', coins: 1000, price: 699, label: 'Pro', emoji: '💎', popular: false, bonus: '+150 Bonus' },
];

export default function CoinStoreModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'coins' | 'premium'>('coins');
    const toast = useToast();

    if (!isOpen) return null;

    const handlePurchase = async (item: any, type: 'COINS' | 'PREMIUM') => {
        setLoading(true);
        try {
            const orderRes = await api.payments.createOrder(
                item.price,
                type,
                item.coins || 0
            );

            if (!orderRes.payment_session_id) {
                throw new Error("Failed to create payment session");
            }

            const cashfree = await load({
                mode: "sandbox"
            });

            await cashfree.checkout({
                paymentSessionId: orderRes.payment_session_id,
                redirectTarget: "_self"
            });

        } catch (e: any) {
            console.error(e);
            toast.error("Failed to initiate payment: " + (e.message || "Unknown error"));
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Premium Header */}
                <div className="relative p-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white flex justify-between items-center flex-shrink-0 overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Coins className="fill-white text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">Premium Store</h3>
                            <p className="text-white/70 text-xs">Upgrade your experience</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-50 p-1.5 mx-4 mt-4 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('coins')}
                        className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'coins'
                            ? 'bg-white text-amber-600 shadow-md'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Coins size={16} />
                        Coins
                    </button>
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'premium'
                            ? 'bg-white text-indigo-600 shadow-md'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Crown size={16} />
                        Premium
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    {activeTab === 'coins' ? (
                        <div className="space-y-3">
                            {COIN_BUNDLES.map((bundle) => (
                                <div
                                    key={bundle.id}
                                    onClick={() => !loading && handlePurchase(bundle, 'COINS')}
                                    className={`
                                        relative flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300
                                        ${bundle.popular
                                            ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg shadow-amber-100'
                                            : 'border-gray-100 hover:border-amber-200 hover:bg-amber-50/50'}
                                        ${loading ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02] active:scale-[0.98]'}
                                    `}
                                >
                                    {bundle.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                            <Star size={10} fill="currentColor" />
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${bundle.popular ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-200' : 'bg-amber-100'}`}>
                                            {bundle.emoji}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-gray-900">{bundle.coins} <span className="text-sm font-medium text-gray-500">Coins</span></h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-500 text-sm">{bundle.label}</p>
                                                {bundle.bonus && (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{bundle.bonus}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button className={`px-5 py-2.5 rounded-xl font-bold transition-all ${bundle.popular
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                                        ₹{bundle.price}
                                    </button>
                                </div>
                            ))}

                            {/* Coin usage hint */}
                            <div className="bg-gray-50 rounded-2xl p-4 mt-4">
                                <p className="text-xs text-gray-500 text-center">
                                    Use coins for <span className="font-semibold text-gray-700">Super Likes</span>, <span className="font-semibold text-gray-700">Profile Boosts</span>, and <span className="font-semibold text-gray-700">Gifts</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Premium Card */}
                            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white overflow-hidden">
                                {/* Decorative */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                                <div className="relative z-10 text-center space-y-3">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-amber-300 to-yellow-400 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-4 ring-4 ring-white/20">
                                        <span className="text-4xl">👑</span>
                                    </div>
                                    <h3 className="text-2xl font-black">Premium Member</h3>
                                    <p className="text-white/70 text-sm max-w-xs mx-auto">Unlock exclusive features and find your soulmate faster</p>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: <Zap size={18} />, label: "Unlimited Views", color: "text-amber-500 bg-amber-50" },
                                    { icon: <Star size={18} />, label: "See Who Liked", color: "text-pink-500 bg-pink-50" },
                                    { icon: <Sparkles size={18} />, label: "5 Super Likes/Day", color: "text-purple-500 bg-purple-50" },
                                    { icon: <Shield size={18} />, label: "Priority Support", color: "text-blue-500 bg-blue-50" },
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className={`p-2 rounded-lg ${feat.color}`}>
                                            {feat.icon}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">{feat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => !loading && handlePurchase({ price: 499, coins: 0 }, 'PREMIUM')}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Crown size={20} />
                                Get Premium — ₹499/year
                            </button>

                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><CheckCircle size={12} /> Secure Payment</span>
                                <span className="flex items-center gap-1"><CheckCircle size={12} /> Cancel Anytime</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 flex-shrink-0 border-t border-gray-100">
                    <span className="flex items-center justify-center gap-2">
                        <Shield size={12} />
                        Secure payments powered by Cashfree
                    </span>
                </div>
            </div>
        </div>
    );
}

