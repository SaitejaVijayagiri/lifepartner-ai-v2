'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { X, Coins, Sparkles, Gift } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import CoinStoreModal from './CoinStoreModal';

const GIFTS = [
    { id: 'rose', name: 'Rose', icon: '🌹', cost: 10, color: 'from-rose-100 to-pink-100 border-rose-200' },
    { id: 'coffee', name: 'Coffee', icon: '☕', cost: 25, color: 'from-amber-100 to-orange-100 border-amber-200' },
    { id: 'chocolate', name: 'Chocolate', icon: '🍫', cost: 50, color: 'from-amber-100 to-yellow-100 border-amber-200' },
    { id: 'diamond', name: 'Diamond', icon: '💎', cost: 100, color: 'from-blue-100 to-cyan-100 border-blue-200' },
    { id: 'ring', name: 'Ring', icon: '💍', cost: 500, color: 'from-purple-100 to-pink-100 border-purple-200' },
    { id: 'castle', name: 'Castle', icon: '🏰', cost: 1000, color: 'from-indigo-100 to-purple-100 border-indigo-200' },
];

export default function GiftModal({
    isOpen,
    onClose,
    toUserId,
    toUserName
}: {
    isOpen: boolean;
    onClose: () => void;
    toUserId: string;
    toUserName: string;
}) {
    const [balance, setBalance] = useState<number | null>(null);
    const [sending, setSending] = useState<string | null>(null);
    const [showCoinStore, setShowCoinStore] = useState(false);
    const [selectedGift, setSelectedGift] = useState<string | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchBalance();
        }
    }, [isOpen]);

    const fetchBalance = async () => {
        try {
            const res = await api.wallet.getBalance();
            setBalance(res.balance);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSend = async (gift: typeof GIFTS[0]) => {
        if ((balance || 0) < gift.cost) {
            toast.error(`Insufficient coins! You need ${gift.cost} coins.`);
            setShowCoinStore(true);
            return;
        }

        setSending(gift.id);
        try {
            await api.wallet.sendGift(toUserId, gift.id, gift.cost);
            toast.success(`Sent ${gift.name} to ${toUserName}! 🎉`);
            setBalance(prev => (prev || 0) - gift.cost);
            setTimeout(onClose, 1000);
        } catch (e) {
            toast.error("Failed to send gift.");
        } finally {
            setSending(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Premium Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 text-white flex justify-between items-center overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Gift className="text-white" size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Send a Gift</h3>
                            <p className="text-white/70 text-xs">Make {toUserName} smile 💖</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="mx-4 -mt-3 relative z-20">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 rounded-2xl flex justify-between items-center border border-amber-200 shadow-lg">
                        <span className="text-sm text-amber-900 font-semibold flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500" />
                            Your Balance
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-amber-600 bg-white px-3 py-1 rounded-full shadow-sm">
                            <Coins size={16} className="fill-yellow-500 text-yellow-600" />
                            <span>{balance !== null ? balance : '...'}</span>
                        </div>
                    </div>
                </div>

                {/* Gift Grid */}
                <div className="p-4 pt-5 grid grid-cols-3 gap-3">
                    {GIFTS.map((gift, idx) => (
                        <button
                            key={gift.id}
                            onClick={() => handleSend(gift)}
                            disabled={!!sending}
                            className={`
                                relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 text-center
                                bg-gradient-to-br ${gift.color}
                                ${(balance || 0) < gift.cost
                                    ? 'opacity-50 grayscale cursor-not-allowed'
                                    : 'hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer'}
                                ${sending === gift.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                            `}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {sending === gift.id && (
                                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <span className="text-4xl mb-2 filter drop-shadow-md transform group-hover:scale-110 transition-transform">{gift.icon}</span>
                            <span className="text-xs font-bold text-gray-800">{gift.name}</span>
                            <span className="text-[10px] text-gray-600 bg-white/80 px-2.5 py-1 rounded-full mt-1.5 flex items-center gap-1 font-semibold shadow-sm">
                                <Coins size={10} className="text-amber-500" /> {gift.cost}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                    <button
                        className="inline-flex items-center gap-2 text-sm text-indigo-600 font-bold hover:text-indigo-700 transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50"
                        onClick={() => setShowCoinStore(true)}
                    >
                        <Coins size={16} />
                        Get More Coins
                    </button>
                </div>
            </div>

            <CoinStoreModal
                isOpen={showCoinStore}
                onClose={() => setShowCoinStore(false)}
                onSuccess={fetchBalance}
            />
        </div>
    );
}

