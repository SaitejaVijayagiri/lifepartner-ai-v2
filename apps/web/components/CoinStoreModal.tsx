'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { X, Coins, Sparkles, Crown, Zap, Star, CheckCircle, Shield, Rocket, Gift, MessageCircle, HelpCircle, Flame, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { load } from '@cashfreepayments/cashfree-js';

const COIN_BUNDLES = [
    { id: 'starter', coins: 100, price: 99, label: 'Starter', emoji: '💫', popular: false },
    { id: 'popular', coins: 500, price: 399, label: 'Popular', emoji: '⭐', popular: true, bonus: '+50 Bonus' },
    { id: 'pro', coins: 1000, price: 699, label: 'Pro', emoji: '💎', popular: false, bonus: '+150 Bonus' },
];

export default function CoinStoreModal({
    isOpen,
    onClose,
    onSuccess,
    initialTab = 'spend'
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialTab?: 'spend' | 'coins' | 'premium';
}) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'spend' | 'coins' | 'premium'>(initialTab);
    const [balance, setBalance] = useState<number | null>(null);
    const [isBoosting, setIsBoosting] = useState(false);
    const [boostSuccess, setBoostSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const toast = useToast();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch latest balance whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            api.wallet.getBalance()
                .then((res: any) => {
                    if (res && res.balance !== undefined) {
                        setBalance(res.balance);
                    }
                })
                .catch(() => {});
        }
    }, [isOpen, initialTab]);

    if (!isOpen || !mounted) return null;

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

    const handleActivateBoost = async () => {
        if ((balance ?? 0) < 50) {
            toast.error("You need at least 50 coins to boost your profile!");
            setActiveTab('coins');
            return;
        }

        setIsBoosting(true);
        try {
            const res = await api.wallet.boostProfile();
            if (res.success) {
                setBoostSuccess(true);
                setBalance(prev => (prev !== null ? Math.max(0, prev - 50) : 0));
                toast.success("🚀 Profile Boosted! Your profile is now at the top of matches for 30 minutes!");
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.error || "Failed to activate boost");
            }
        } catch (e: any) {
            toast.error(e.message || "Boost failed. Please try again.");
        } finally {
            setIsBoosting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-amber-500/20">
                {/* Header with Balance */}
                <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex justify-between items-center flex-shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-lg pointer-events-none" />

                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                            <Coins className="fill-amber-200 text-amber-100" size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-xl tracking-tight">Coins & Perks Store</h3>
                            </div>
                            <p className="text-white/80 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                                <span>Current Balance:</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full font-black text-white text-xs inline-flex items-center gap-1">
                                    🪙 {balance !== null ? balance : '...'} Coins
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 3 Interactive Tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800/90 p-1.5 mx-4 mt-4 rounded-2xl gap-1">
                    <button
                        onClick={() => setActiveTab('spend')}
                        className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'spend'
                                ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <Zap size={14} className="text-amber-500" />
                        <span>Use Coins</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('coins')}
                        className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'coins'
                                ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <Coins size={14} className="text-amber-500" />
                        <span>Get Coins</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`flex-1 py-2.5 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'premium'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <Crown size={14} className="text-purple-500" />
                        <span>VIP Premium</span>
                    </button>
                </div>

                {/* Tab 1: Where & How to Use Coins */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar">
                    {activeTab === 'spend' && (
                        <div className="space-y-4">
                            {/* Explanatory Banner */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20 text-gray-800 dark:text-gray-200 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                                    <HelpCircle size={15} />
                                    <span>What are Coins?</span>
                                </div>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Coins are in-app credits you can spend on micro-interactions to stand out, get 5x more views, and send gifts to singles you like.
                                </p>
                            </div>

                            {/* Action 1: Profile Boost */}
                            <div className="p-4 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                                        🚀
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Profile Boost (30 Mins)</h4>
                                            <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">50 Coins</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                                            Places your profile at the #1 spot in matches for 30 mins to get 5x more views.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleActivateBoost}
                                    disabled={isBoosting || (balance ?? 0) < 50}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                                        boostSuccess
                                            ? 'bg-emerald-600 text-white'
                                            : (balance ?? 0) >= 50
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md active:scale-95'
                                                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isBoosting ? 'Activating...' : boostSuccess ? 'Boosted! ✓' : (balance ?? 0) >= 50 ? 'Boost Now 🚀' : 'Need 50 Coins'}
                                </button>
                            </div>

                            {/* Action 2: Virtual Gifts */}
                            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 flex items-start gap-3 shadow-sm">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                                    🎁
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Send Virtual Gifts</h4>
                                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">10 – 1000 Coins</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        Send a Rose (10), Coffee (25), Chocolate (50), or Diamond (100) on any profile or in chat. Profiles receiving gifts reply 3x faster!
                                    </p>
                                </div>
                            </div>

                            {/* Action 3: Direct Messages */}
                            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 flex items-start gap-3 shadow-sm">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                                    ⚡
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Instant Direct Message Pass</h4>
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Free / Coins</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        Skip the waiting line! Send a personalized icebreaker directly to someone&apos;s inbox before matching.
                                    </p>
                                </div>
                            </div>

                            {/* Free Daily Coins Earning Guide */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-2 border border-indigo-500/30">
                                <h4 className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                    <Sparkles size={14} />
                                    <span>How to Earn Free Coins Every Day</span>
                                </h4>
                                <ul className="text-xs text-gray-300 space-y-1.5 pl-1">
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-400 font-bold">+15 Coins:</span>
                                        <span>Vote in the <strong>Daily Chemistry Spark</strong> on Home/Matches.</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-400 font-bold">+15 to 150 Coins:</span>
                                        <span>Maintain your <strong>Daily Login Streak</strong>.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Buy Coins */}
                    {activeTab === 'coins' && (
                        <div className="space-y-3">
                            {COIN_BUNDLES.map((bundle) => (
                                <div
                                    key={bundle.id}
                                    onClick={() => !loading && handlePurchase(bundle, 'COINS')}
                                    className={`
                                        relative flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300
                                        ${bundle.popular
                                            ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-lg shadow-amber-500/10'
                                            : 'border-gray-200 dark:border-gray-800 hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'}
                                        ${loading ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.01] active:scale-[0.99]'}
                                    `}
                                >
                                    {bundle.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                            <Star size={10} fill="currentColor" />
                                            MOST POPULAR
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl ${bundle.popular ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                                            {bundle.emoji}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{bundle.coins} <span className="text-xs font-semibold text-gray-500">Coins</span></h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{bundle.label}</p>
                                                {bundle.bonus && (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">{bundle.bonus}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all ${bundle.popular
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg'
                                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800'}`}>
                                        ₹{bundle.price}
                                    </button>
                                </div>
                            ))}

                            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3.5 mt-3 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Instant balance credit • 100% Secure payment via UPI, Cards, NetBanking
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: VIP Premium */}
                    {activeTab === 'premium' && (
                        <div className="space-y-4">
                            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-5 text-white overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                <div className="relative z-10 text-center space-y-2">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-yellow-400 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-white/20">
                                        <span className="text-3xl">👑</span>
                                    </div>
                                    <h3 className="text-xl font-black">VIP Premium Membership</h3>
                                    <p className="text-white/80 text-xs max-w-xs mx-auto">
                                        Unlock unlimited views, priority placement, and connect with zero restrictions.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { icon: <Zap size={16} />, label: "Unlimited Profile Views", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
                                    { icon: <Star size={16} />, label: "See Who Liked You", color: "text-pink-500 bg-pink-50 dark:bg-pink-950/30" },
                                    { icon: <Sparkles size={16} />, label: "5 Super Likes / Day", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
                                    { icon: <Shield size={16} />, label: "Share Contact Safely", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${feat.color}`}>
                                            {feat.icon}
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">{feat.label}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => !loading && handlePurchase({ price: 499, coins: 0 }, 'PREMIUM')}
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Crown size={18} />
                                <span>Get VIP Premium — ₹499/year</span>
                            </button>

                            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><CheckCircle size={12} /> Instant Activation</span>
                                <span className="flex items-center gap-1"><CheckCircle size={12} /> Cancel Anytime</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3.5 bg-gray-50 dark:bg-gray-800/80 text-center text-[11px] text-gray-400 flex-shrink-0 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-1.5">
                    <Shield size={12} className="text-emerald-500" />
                    <span>100% Secure Payments • Instant Wallet Credit</span>
                </div>
            </div>
        </div>,
        document.body
    );
}
