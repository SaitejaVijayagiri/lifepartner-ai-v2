import React, { useState } from 'react';
import { Heart, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toast';

interface SpeedDateFeedbackModalProps {
    partnerId: string;
    onClose: () => void;
}

export default function SpeedDateFeedbackModal({ partnerId, onClose }: SpeedDateFeedbackModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<'MATCH' | 'NO_MATCH' | null>(null);
    const toast = useToast();

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
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
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
                        <Button 
                            onClick={onClose}
                            className="w-full bg-white text-purple-600 hover:bg-gray-100 rounded-full h-14 font-bold text-lg shadow-lg transition-transform hover:scale-105"
                        >
                            Go to Chat
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 w-10 h-10" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Time's Up!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Did you feel a connection over the call?
                </p>

                <div className="flex gap-4">
                    <button 
                        onClick={() => handleChoice(false)}
                        disabled={submitting}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-2xl transition-colors disabled:opacity-50"
                    >
                        Pass
                    </button>
                    <button 
                        onClick={() => handleChoice(true)}
                        disabled={submitting}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                    >
                        Like
                    </button>
                </div>
            </div>
        </div>
    );
}
