import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, CheckCircle2, AlertTriangle, Star, Brain, HeartHandshake, Utensils, Compass, MessageCircle, Send } from 'lucide-react';
import { api } from '@/lib/api';

interface CompatibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetName: string;
    targetPhotoUrl?: string;
    onOpenChat?: (conn: any) => void;
}

interface ReportData {
    score: number;
    dimensions?: {
        personality: number;
        values: number;
        lifestyle: number;
        cosmic: number;
        overall: number;
    };
    strengths: string[];
    challenges: string[];
    verdict: string;
    icebreaker?: string;
}

export default function CompatibilityModal({
    isOpen,
    onClose,
    targetUserId,
    targetName,
    targetPhotoUrl,
    onOpenChat
}: CompatibilityModalProps) {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        if (!isOpen) {
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
                
                const envUrl = process.env.NEXT_PUBLIC_API_URL;
                const apiBase = (envUrl && !envUrl.includes('onrender.com')) ? envUrl : 'https://lifepartner-backend-295663053086.asia-south1.run.app';
                const res = await fetch(`${apiBase}/ai/compatibility`, {
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
            const duration = 1000;
            
            const step = (timestamp: number) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
    if (typeof window === 'undefined') return null;

    const dimensions = report?.dimensions || {
        personality: Math.min(98, Math.max(65, (report?.score || 75) + 3)),
        values: Math.min(99, Math.max(60, (report?.score || 75) - 2)),
        lifestyle: Math.min(95, Math.max(55, (report?.score || 75) - 5)),
        cosmic: Math.min(96, Math.max(60, (report?.score || 75) + 4)),
        overall: report?.score || 75
    };

    return createPortal((
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg md:max-h-[90dvh] h-screen h-[100dvh] md:h-auto flex flex-col bg-white dark:bg-gray-950 md:rounded-[2rem] shadow-2xl overflow-hidden border-t md:border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-500 ease-out">
                
                {/* Decorative Background */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />

                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center relative z-10 shrink-0 border-b border-gray-100 dark:border-gray-800/50 backdrop-blur-sm bg-white/80 dark:bg-gray-950/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-gray-100">AI Compatibility Matrix</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Multi-Dimensional Match Analysis</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 relative z-10 pb-28 md:pb-8 space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                                <Star className="text-amber-400 animate-pulse" size={32} fill="currentColor" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Compatibility Dimensions...</h4>
                            <p className="text-sm text-gray-500 text-center max-w-[280px]">
                                Evaluating psychological alignment, core values, lifestyle habits, and astrological harmony with {targetName.split(' ')[0]}.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center">
                            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Oops!</h4>
                            <p className="text-sm text-gray-500">{typeof error === 'string' ? error : 'Failed to calculate compatibility'}</p>
                            <button onClick={onClose} className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold">Try Again Later</button>
                        </div>
                    ) : report ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            
                            {/* Score Section */}
                            <div className="flex flex-col items-center pt-2">
                                <div className="relative w-44 h-44 flex items-center justify-center">
                                    <div className="absolute w-full h-full rounded-full bg-pink-500/10 animate-ping duration-1000" />
                                    <div className="absolute w-[90%] h-[90%] rounded-full bg-purple-500/10 animate-pulse" />
                                    
                                    <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
                                        <circle 
                                            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                                            strokeDasharray={`${2 * Math.PI * 45}`} 
                                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - (report.score || 75) / 100)}`}
                                            className="text-indigo-600 transition-all duration-1500 ease-out" 
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center z-20">
                                        <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white drop-shadow-md">{displayScore}%</span>
                                        <span className="text-[10px] uppercase font-black text-indigo-500 tracking-[0.2em]">Overall Match</span>
                                    </div>
                                </div>
                                <div className="mt-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/30 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm w-full">
                                    <p className="text-center text-xs sm:text-sm font-semibold text-indigo-950 dark:text-indigo-200 leading-relaxed italic">
                                        "{report.verdict}"
                                    </p>
                                </div>
                            </div>

                            {/* 4 Multi-Dimensional Match Meters */}
                            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <Compass size={16} /> Compatibility Radar Breakdown
                                </h4>

                                <div className="space-y-3.5 pt-1">
                                    {/* Personality & Emotional Resonance */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">
                                            <span className="flex items-center gap-1.5"><Brain size={14} className="text-purple-500" /> Psychological & Emotional Resonance</span>
                                            <span className="text-purple-600 dark:text-purple-400">{dimensions.personality}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${dimensions.personality}%` }} />
                                        </div>
                                    </div>

                                    {/* Values & Vision */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">
                                            <span className="flex items-center gap-1.5"><HeartHandshake size={14} className="text-pink-500" /> Core Values & Life Vision</span>
                                            <span className="text-pink-600 dark:text-pink-400">{dimensions.values}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000" style={{ width: `${dimensions.values}%` }} />
                                        </div>
                                    </div>

                                    {/* Lifestyle & Daily Habits */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">
                                            <span className="flex items-center gap-1.5"><Utensils size={14} className="text-emerald-500" /> Lifestyle & Daily Habit Chemistry</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">{dimensions.lifestyle}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${dimensions.lifestyle}%` }} />
                                        </div>
                                    </div>

                                    {/* Cosmic & Cultural Harmony */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">
                                            <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-amber-500" /> Cosmic & Cultural Harmony</span>
                                            <span className="text-amber-600 dark:text-amber-400">{dimensions.cosmic}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${dimensions.cosmic}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h4 className="text-xs font-black text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Key Mutual Strengths
                                </h4>
                                <ul className="space-y-3">
                                    {(Array.isArray(report?.strengths) ? report.strengths : []).map((str, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 size={12} className="text-green-600" />
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{str}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Challenges / Growth */}
                            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Points of Balance & Growth
                                </h4>
                                <ul className="space-y-3">
                                    {(Array.isArray(report?.challenges) ? report.challenges : []).map((chal, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <AlertTriangle size={12} className="text-amber-600" />
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{chal}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Tailored AI Icebreaker Recommendation */}
                            {report?.icebreaker && (
                                <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-indigo-900/20 border border-purple-500/30 shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black text-purple-600 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <MessageCircle size={14} /> Perfect Conversation Starter
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium italic mb-3">
                                        "{report.icebreaker}"
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            if (onOpenChat) {
                                                onOpenChat({
                                                    interactionId: targetUserId,
                                                    initialMessage: report.icebreaker,
                                                    partner: {
                                                        id: targetUserId,
                                                        name: targetName,
                                                        photoUrl: targetPhotoUrl || ''
                                                    }
                                                });
                                            }
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                                    >
                                        <Send size={13} />
                                        <span>Send This Icebreaker to {targetName.split(' ')[0]}</span>
                                    </button>
                                </div>
                            )}

                            {/* Bottom Actions */}
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={onClose} 
                                    className="flex-1 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs sm:text-sm rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-md cursor-pointer"
                                >
                                    Close Report
                                </button>
                                <button 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'AI Compatibility on LifePartner AI',
                                                text: `I just discovered an ${report.score}% AI match with ${targetName.split(' ')[0]} on LifePartner AI! ✨`,
                                                url: window.location.href,
                                            }).catch(console.error);
                                        }
                                    }}
                                    className="px-6 py-3.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm rounded-2xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    Share
                                </button>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    ), document.body);
}
