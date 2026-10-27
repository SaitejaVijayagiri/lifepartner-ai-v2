'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Crown, X, Volume2, VolumeX, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { grantMediaUnlockReward } from '@/lib/adRewards';
import { useToast } from '@/components/ui/Toast';

interface RewardedAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlocked: () => void;
    partnerName?: string;
    songTitle?: string;
}

export default function RewardedAdModal({
    isOpen,
    onClose,
    onUnlocked,
    partnerName = 'your match',
    songTitle = 'Full Video Song'
}: RewardedAdModalProps) {
    const [isPlayingAd, setIsPlayingAd] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(12);
    const [isMuted, setIsMuted] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) {
            setIsPlayingAd(false);
            setSecondsLeft(12);
        }
    }, [isOpen]);

    // Handle Native Android Bridge Callback
    useEffect(() => {
        if (typeof window === 'undefined') return;

        (window as any).onNativeAdRewardEarned = () => {
            grantMediaUnlockReward(45);
            toast.success("🎉 Full Video & Music Unlocked for 45 Minutes!");
            setIsPlayingAd(false);
            onUnlocked();
            onClose();
        };

        (window as any).onNativeAdFallback = () => {
            // Fall back to web sponsor video
            setIsPlayingAd(true);
        };

        return () => {
            delete (window as any).onNativeAdRewardEarned;
            delete (window as any).onNativeAdFallback;
        };
    }, [onUnlocked, onClose, toast]);

    // Countdown timer for Web Sponsor Video
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (isPlayingAd && secondsLeft > 0) {
            timer = setTimeout(() => {
                setSecondsLeft(prev => prev - 1);
            }, 1000);
        } else if (isPlayingAd && secondsLeft === 0) {
            grantMediaUnlockReward(45);
            toast.success("🎉 Full Video & Music Unlocked for 45 Minutes!");
            setIsPlayingAd(false);
            onUnlocked();
            onClose();
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isPlayingAd, secondsLeft, onUnlocked, onClose, toast]);

    if (!isOpen) return null;

    const handleStartAd = () => {
        // 1. Try Native Android AdMob Rewarded Video first
        if (typeof window !== 'undefined' && (window as any).AndroidBridge?.showRewardedVideoAd) {
            try {
                (window as any).AndroidBridge.showRewardedVideoAd();
                return;
            } catch (_) {}
        }

        // 2. Fall back to Web Sponsor Video experience
        setIsPlayingAd(true);
        setSecondsLeft(12);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-gray-900 to-slate-950 text-white rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden p-6 space-y-5">
                
                {/* Close Button */}
                {!isPlayingAd && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Content: Value Exchange Offer OR Active Sponsor Video */}
                {!isPlayingAd ? (
                    <>
                        <div className="text-center space-y-2 pt-2">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 shadow-lg shadow-pink-500/30 text-white mb-1">
                                <Play size={28} fill="currentColor" className="ml-1" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white">
                                Unlock Full Video & Music
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                                Stream full 4–5 minute HD songs and videos with <span className="font-bold text-pink-400">{partnerName}</span> without 30-second cutoffs!
                            </p>
                        </div>

                        {/* Perks Box */}
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                            <div className="flex items-center gap-2.5 text-xs text-slate-200">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span>Full-length songs & official HD video clips</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-200">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span>Synchronized playback in chat with {partnerName}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-200">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span>Uninterrupted 45-minute listening session</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-1">
                            <button
                                onClick={handleStartAd}
                                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play size={18} fill="currentColor" />
                                <span>Watch 15s Sponsor Video (Free)</span>
                            </button>

                            <button
                                onClick={() => {
                                    onClose();
                                    window.location.href = '/dashboard?tab=membership';
                                }}
                                className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-amber-300 hover:text-amber-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                <Crown size={15} />
                                <span>Upgrade to VIP (Always Ad-Free & Unlimited)</span>
                            </button>
                        </div>

                        <p className="text-[10px] text-center text-slate-400">
                            100% Opt-In • Ad plays only when you choose to unlock
                        </p>
                    </>
                ) : (
                    /* In-Modal Sponsor Video Countdown */
                    <div className="space-y-4 py-2 text-center animate-in fade-in duration-300">
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-indigo-500/30 flex flex-col items-center justify-center p-4">
                            {/* Ambient Sponsor Glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-pink-900/40" />
                            
                            <div className="relative z-10 flex flex-col items-center space-y-2">
                                <Sparkles className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                                <h4 className="font-extrabold text-sm text-white">Sponsor Spotlight: LifePartner AI</h4>
                                <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                                    Connecting hearts through verified biodatas, Kundli matching & interactive live dates.
                                </p>
                            </div>

                            {/* Sound Toggle */}
                            <button
                                onClick={() => setIsMuted(prev => !prev)}
                                className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 text-xs flex items-center gap-1 z-20"
                            >
                                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                        </div>

                        {/* Progress Bar & Countdown */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                                <span>Unlocking full video for {partnerName}...</span>
                                <span className="text-amber-400 font-mono text-sm">{secondsLeft}s</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
                                    style={{ width: `${((12 - secondsLeft) / 12) * 100}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                            <ShieldCheck size={14} />
                            <span>Your 45-minute uninterrupted pass will activate automatically</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
