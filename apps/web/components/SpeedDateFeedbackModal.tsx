import React, { useState } from 'react';
import { Heart, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface SpeedDateFeedbackModalProps {
    partnerId: string;
    onClose: () => void;
}

export default function SpeedDateFeedbackModal({ partnerId, onClose }: SpeedDateFeedbackModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<'MATCH' | 'NO_MATCH' | null>(null);
    const toast = useToast();
    const router = useRouter();

    const handleChoice = async (liked: boolean) => {
        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/interactions/speed-date/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId: partnerId, liked })
            });
            const data = await res.json();
            
            if (data.isMatch) {
                setResult('MATCH');
                // Play match sound
                new Audio('/sounds/match.mp3').play().catch(() => {});
            } else {
                if (liked) {
                    toast.success("Interest sent! If they also say yes, it's a match.");
                }
                onClose();
            }
        } catch (e: any) {
            toast.error("Failed to submit feedback");
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    if (result === 'MATCH') {
        return (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 border border-white/20">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
                            <Heart className="text-pink-500 fill-pink-500 w-12 h-12" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">It's a Match!</h2>
                        <p className="text-white/90 text-lg mb-8 font-medium">
                            You both felt the spark! Check your chat list to message them.
                        </p>
                        <button 
                            onClick={() => {
                                onClose();
                                router.push(`/dashboard?chatId=${partnerId}`);
                            }}
                            className="w-full bg-white text-purple-700 !text-purple-700 hover:bg-gray-100 rounded-full h-14 font-extrabold text-lg shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                        >
                            Go to Chat
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="w-20 h-20 bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 relative">
                    <Sparkles className="text-pink-400 w-10 h-10 animate-pulse" />
                    <Heart className="absolute w-4 h-4 text-rose-500 fill-rose-500 -top-1 -right-1 animate-bounce" />
                </div>
                
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-indigo-200 mb-2 tracking-tight">Time's Up! ⚡</h2>
                <p className="text-gray-300 text-sm font-medium mb-8 leading-relaxed">
                    Did you feel the spark over the blind call? Choose your reaction to reveal your match!
                </p>

                <div className="flex gap-4">
                    <button 
                        onClick={() => handleChoice(false)}
                        disabled={submitting}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all active:scale-95 disabled:opacity-50 text-sm tracking-wide shadow-inner"
                    >
                        Pass ✕
                    </button>
                    <button 
                        onClick={() => handleChoice(true)}
                        disabled={submitting}
                        className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 text-sm tracking-wide"
                    >
                        Like 💖
                    </button>
                </div>
            </div>
        </div>
    );
}
