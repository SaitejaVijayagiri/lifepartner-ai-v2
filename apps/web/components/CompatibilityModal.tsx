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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-white dark:bg-gray-950 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center relative z-10 shrink-0 border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                            <Sparkles size={20} />
                        </div>
                        <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100">Cosmic Compatibility</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                <Star className="text-amber-400 animate-pulse" size={32} fill="currentColor" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Consulting the Stars...</h4>
                            <p className="text-sm text-gray-500 text-center">Analyzing Zodiac, Nakshatra, and personality traits with {targetName.split(' ')[0]}.</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center">
                            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Oops!</h4>
                            <p className="text-sm text-gray-500">{error}</p>
                            <button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-full font-medium">Close</button>
                        </div>
                    ) : report ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Score Ring */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-40 h-40 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
                                        <circle 
                                            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                                            strokeDasharray={`${2 * Math.PI * 45}`} 
                                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - report.score / 100)}`}
                                            className="text-pink-500 transition-all duration-1000 ease-out" 
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm">{displayScore}%</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Match</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 px-4">
                                    {report.verdict}
                                </p>
                            </div>

                            {/* Strengths */}
                            <div>
                                <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Cosmic Strengths
                                </h4>
                                <ul className="space-y-3">
                                    {report.strengths.map((str, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-sm text-green-800 dark:text-green-200 border border-green-100 dark:border-green-900/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                                            {str}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Challenges */}
                            <div>
                                <h4 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Potential Friction
                                </h4>
                                <ul className="space-y-3">
                                    {report.challenges.map((chal, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-sm text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-900/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></span>
                                            {chal}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-[2] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-[1.02] transition-transform">
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
                                    className="flex-1 py-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
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
