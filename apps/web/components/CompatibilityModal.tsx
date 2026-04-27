import React, { useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { api } from '@/lib/api';

interface CompatibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetName: string;
}

interface ReportData {
    score: number;
    strengths: string[];
    challenges: string[];
    verdict: string;
}

export default function CompatibilityModal({ isOpen, onClose, targetUserId, targetName }: CompatibilityModalProps) {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setTimeout(() => {
                setLoading(true);
                setReport(null);
                setError(null);
            }, 300);
            return;
        }

        const fetchCompatibility = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com'}/ai/compatibility`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ targetUserId })
                });

                if (!res.ok) throw new Error('Failed to generate report');
                
                const data = await res.json();
                setReport(data);
            } catch (err: any) {
                setError(err.message || 'The stars are misaligned right now. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompatibility();
    }, [isOpen, targetUserId]);

    // Animate score from 0 to target score
    useEffect(() => {
        if (report && report.score > 0) {
            let startTimestamp: number;
            const duration = 1000; // 1 second
            
            const step = (timestamp: number) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                // easeOutQuart
                const easeProgress = 1 - Math.pow(1 - progress, 4);
                
                setDisplayScore(Math.floor(easeProgress * report.score));
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        } else {
            setDisplayScore(0);
        }
    }, [report]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content - Full screen on mobile, modal on desktop */}
            <div className="relative w-full max-w-lg md:max-h-[90dvh] h-screen h-[100dvh] md:h-auto flex flex-col bg-white dark:bg-gray-950 md:rounded-[2rem] shadow-2xl overflow-hidden border-t md:border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-500 ease-out">
                
                {/* Decorative Background for Full Page feel */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />

                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center relative z-10 shrink-0 border-b border-gray-100 dark:border-gray-800/50 backdrop-blur-sm bg-white/80 dark:bg-gray-950/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100">Cosmic Compatibility</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">AI Analysis Report</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 relative z-10 pb-24 md:pb-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                <Star className="text-amber-400 animate-pulse" size={32} fill="currentColor" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Consulting the Stars...</h4>
                            <p className="text-sm text-gray-500 text-center max-w-[280px]">Analyzing Zodiac, Nakshatra, and personality traits with {targetName.split(' ')[0]}.</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center">
                            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Oops!</h4>
                            <p className="text-sm text-gray-500">{error}</p>
                            <button onClick={onClose} className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold">Try Again Later</button>
                        </div>
                    ) : report ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            
                            {/* Score Section */}
                            <div className="flex flex-col items-center pt-4">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    {/* Pulse Rings */}
                                    <div className="absolute w-full h-full rounded-full bg-pink-500/10 animate-ping duration-1000" />
                                    <div className="absolute w-[90%] h-[90%] rounded-full bg-purple-500/10 animate-pulse" />
                                    
                                    <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
                                        <circle 
                                            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                                            strokeDasharray={`${2 * Math.PI * 45}`} 
                                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - report.score / 100)}`}
                                            className="text-indigo-600 transition-all duration-1500 ease-out" 
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center z-20">
                                        <span className="text-5xl font-black text-gray-900 dark:text-white drop-shadow-md">{displayScore}%</span>
                                        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-[0.2em]">Match</span>
                                    </div>
                                </div>
                                <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                    <p className="text-center text-sm font-semibold text-indigo-900 dark:text-indigo-200 leading-relaxed italic">
                                        "{report.verdict}"
                                    </p>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h4 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Cosmic Strengths
                                </h4>
                                <ul className="space-y-4">
                                    {report.strengths.map((str, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 size={12} className="text-green-600" />
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{str}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Challenges */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h4 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <AlertTriangle size={18} /> Points of Friction
                                </h4>
                                <ul className="space-y-4">
                                    {report.challenges.map((chal, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <AlertTriangle size={12} className="text-orange-600" />
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{chal}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Bottom Actions - Fixed on Mobile */}
                            <div className="flex gap-4 md:static fixed bottom-0 inset-x-0 p-6 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t md:border-t-0 border-gray-100 dark:border-gray-800 md:p-0 z-20">
                                <button onClick={onClose} className="flex-[2] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                                    Got It
                                </button>
                                <button 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'Cosmic Match on LifePartner AI',
                                                text: `I just got an ${report.score}% cosmic match with ${targetName.split(' ')[0]} on LifePartner AI! ✨`,
                                                url: window.location.href,
                                            }).catch(console.error);
                                        }
                                    }}
                                    className="flex-1 py-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    Share
                                </button>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
