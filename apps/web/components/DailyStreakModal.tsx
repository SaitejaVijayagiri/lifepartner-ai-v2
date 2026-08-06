'use client';

import React, { useState } from 'react';
import { Flame, Coins, Gift, Check, Sparkles, X, Trophy } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface DailyStreakModalProps {
    streakData: {
        streakCount: number;
        canClaimToday: boolean;
        nextDay: number;
        rewardCoins: number;
        rewardsSchedule?: Record<number, number>;
    };
    onClose: () => void;
    onClaimSuccess: (newBalance: number, newStreak: number) => void;
}

export default function DailyStreakModal({ streakData, onClose, onClaimSuccess }: DailyStreakModalProps) {
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimed, setClaimed] = useState(!streakData.canClaimToday);
    const toast = useToast();

    const schedule = streakData.rewardsSchedule || { 1: 15, 2: 25, 3: 40, 4: 60, 5: 80, 6: 100, 7: 150 };

    const handleClaim = async () => {
        if (isClaiming || claimed) return;
        setIsClaiming(true);

        try {
            const res = await fetchAPI('/wallet/streak/claim', { method: 'POST' });
            if (res.success) {
                setClaimed(true);
                toast.success(`🎉 Claimed ${res.rewardCoins} Free Coins!`);
                onClaimSuccess(res.newBalance, res.streakCount);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                toast.error(res.error || 'Failed to claim reward');
            }
        } catch (e: any) {
            toast.error(e.message || 'Network error claiming reward');
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900 via-slate-900 to-black border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-white overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header Header */}
                <div className="flex flex-col items-center text-center space-y-2 mb-6">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 shadow-xl shadow-amber-500/20">
                        <Flame size={36} className="text-white animate-bounce" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                        <Trophy size={14} /> Daily Rewards Chest
                    </div>

                    <h2 className="text-2xl font-black text-white tracking-tight">
                        {streakData.streakCount > 0 ? `${streakData.streakCount} Day Streak!` : 'Start Your Daily Streak!'}
                    </h2>
                    <p className="text-xs text-gray-400 max-w-xs">
                        Log in every day to claim bonus coins and unlock VIP profile boosts!
                    </p>
                </div>

                {/* 7-Day Rewards Schedule Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const isToday = day === streakData.nextDay && streakData.canClaimToday;
                        const isPast = day < streakData.nextDay || (day === streakData.nextDay && !streakData.canClaimToday);
                        const coins = schedule[day] || 15;

                        return (
                            <div
                                key={day}
                                className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-300 ${
                                    isToday
                                        ? 'bg-gradient-to-b from-amber-500/30 via-rose-500/20 to-pink-600/30 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105 animate-pulse'
                                        : isPast
                                        ? 'bg-emerald-950/40 border-emerald-500/40 opacity-80'
                                        : 'bg-white/5 border-white/10 opacity-60'
                                }`}
                            >
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Day {day}
                                </span>

                                <div className="my-1.5 text-amber-400">
                                    {isPast ? (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-400">
                                            <Check size={14} />
                                        </div>
                                    ) : day === 7 ? (
                                        <Gift size={20} className="text-pink-400 animate-bounce" />
                                    ) : (
                                        <Coins size={18} />
                                    )}
                                </div>

                                <span className="text-xs font-black text-amber-300">
                                    +{coins}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Claim Button */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleClaim}
                        disabled={isClaiming || claimed}
                        className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                            claimed
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:scale-105 active:scale-95 text-white shadow-amber-500/30'
                        }`}
                    >
                        {isClaiming ? (
                            <span>Claiming Reward...</span>
                        ) : claimed ? (
                            <>
                                <Check size={18} />
                                <span>Claimed Today! See You Tomorrow</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                <span>Claim Day {streakData.nextDay} Reward (+{streakData.rewardCoins} Coins)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
