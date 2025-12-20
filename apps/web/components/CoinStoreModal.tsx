'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, Coins } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { load } from '@cashfreepayments/cashfree-js';

const COIN_BUNDLES = [
    { id: 'starter', coins: 100, price: 99, label: 'Starter', popular: false },
    { id: 'popular', coins: 500, price: 399, label: 'Popular', popular: true },
    { id: 'pro', coins: 1000, price: 699, label: 'Pro', popular: false },
];

export default function CoinStoreModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'coins' | 'premium'>('coins');
    const toast = useToast();

    if (!isOpen) return null;

    const handlePurchase = async (item: any, type: 'COINS' | 'PREMIUM') => {
        setLoading(true);
        try {
            // 1. Create Order
            const orderRes = await api.payments.createOrder(
                item.price, // Amount
                type,       // Type
                item.coins || 0  // Coins count (0 for premium)
            );

            if (!orderRes.payment_session_id) {
                throw new Error("Failed to create payment session");
            }

            // 2. Load Cashfree
            const cashfree = await load({
                mode: "sandbox" // TEST Mode
            });

            // 3. Checkout
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Coins className="fill-white" /> Store
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('coins')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'coins' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Buy Coins
                    </button>
                    <button
                        onClick={() => setActiveTab('premium')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'premium' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Premium/Gold
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {activeTab === 'coins' ? (
                        <div className="space-y-4">
                            {COIN_BUNDLES.map((bundle) => (
                                <div
                                    key={bundle.id}
                                    onClick={() => handlePurchase(bundle, 'COINS')}
                                    className={`
                                        relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02]
                                        ${bundle.popular ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-indigo-100'}
                                    `}
                                >
                                    {bundle.popular && (
                                        <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="bg-yellow-100 p-3 rounded-full text-yellow-700">
                                            <Coins size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl text-gray-900">{bundle.coins} Coins</h4>
                                            <p className="text-gray-500 text-sm">{bundle.label} Pack</p>
                                        </div>
                                    </div>
                                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold">
                                        ₹{bundle.price}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-yellow-500 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                                    <span className="text-3xl">👑</span>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">Become a Member</h3>
                                <p className="text-gray-500 text-sm px-4">Unlock the full potential of AI matchmaking and find your soulmate faster.</p>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 space-y-4">
                                <ul className="space-y-3">
                                    {[
                                        "Unlimited Profile Views",
                                        "See Who Liked You",
                                        "5 Free Super Likes / Day",
                                        "Advanced AI Insights",
                                        "Priority Support"
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-bold">✓</div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handlePurchase({ price: 499, coins: 0 }, 'PREMIUM')}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                            >
                                Get Premium for ₹499/yr
                            </button>
                            <p className="text-center text-xs text-gray-400">Secure Payment • Cancel Anytime</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 flex-shrink-0">
                    Secure payments via Cashfree.
                </div>
            </div>
        </div>
    );
}
