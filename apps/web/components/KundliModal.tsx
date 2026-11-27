'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Sparkles, Heart, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AstroSummary {
    nakshatra?: string;
    zodiacSign?: string;
    rashi?: string;
    manglik?: string;
}

interface KundliModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        score?: number;
        total?: number;
        verdict?: string;
        astroA?: AstroSummary;
        astroB?: AstroSummary;
        manglikCompatible?: boolean;
        gothraCompatible?: boolean | null;
        details?: any[];
    } | null;
    names: { me: string; partner: string };
}

function formatGunaValue(value: unknown, fallback = 0): string {
    const num = Number(value);
    if (!Number.isFinite(num)) return String(fallback);
    return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(1)));
}

export default function KundliModal({ isOpen, onClose, data, names }: KundliModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const total = Number(data?.total) > 0 ? Number(data?.total) : 36;
    const rawScore = Number(data?.score);
    const score = Number.isFinite(rawScore) ? Math.min(total, Math.max(0, rawScore)) : 0;
    const scoreRatio = score / total;
    const percentage = Math.round(scoreRatio * 100);
    const details = Array.isArray(data?.details) ? data.details : [];
    const circumference = 2 * Math.PI * 60; // ~377 for r=60 in viewBox 0 0 144 144

    let verdict = 'Excellent Match';
    let verdictIcon = <CheckCircle size={16} className="shrink-0" />;
    let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800/60';
    let ringColor = '#10b981';

    if (score < 18) {
        verdict = 'Needs Consideration';
        verdictIcon = <XCircle size={16} className="shrink-0" />;
        colorClass = 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-800/60';
        ringColor = '#ef4444';
    } else if (score < 24) {
        verdict = 'Good Match';
        verdictIcon = <AlertCircle size={16} className="shrink-0" />;
        colorClass = 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800/60';
        ringColor = '#f59e0b';
    } else if (score < 30) {
        verdict = 'Auspicious Match';
    }

    const myName = names?.me?.trim() || 'You';
    const partnerName = names?.partner?.trim() || 'Partner';
    const astroA = data?.astroA;
    const astroB = data?.astroB;
    const hasAstroPair = Boolean(astroA?.nakshatra || astroB?.nakshatra);

    const modalContent = (
        <div
            className="fixed inset-0 z-[10050] flex items-center justify-center p-2.5 sm:p-4 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Vedic Kundli Compatibility"
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl border border-white/15 dark:border-gray-800 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sticky Compact Header */}
                <div className="relative shrink-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 pt-4 px-11 pb-4 sm:pt-5 sm:px-12 sm:pb-5 text-center overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 mb-2 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-md ring-2 ring-white/30">
                            🕉️
                        </div>
                        <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-sm">Vedic Compatibility</h2>
                        <p className="text-white/95 text-xs sm:text-sm mt-1 flex flex-wrap items-center justify-center gap-1.5 leading-snug max-w-full">
                            <Heart size={13} fill="currentColor" className="shrink-0" />
                            <span className="truncate max-w-[115px] sm:max-w-[140px] font-semibold">{myName}</span>
                            <span>&amp;</span>
                            <span className="truncate max-w-[115px] sm:max-w-[140px] font-semibold">{partnerName}</span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        aria-label="Close Kundli modal"
                        className="absolute top-3 right-3 z-20 text-white hover:text-white bg-black/20 hover:bg-black/35 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors backdrop-blur-sm cursor-pointer active:scale-95"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Single Scrollable Body — guarantees full reachability on any phone screen */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-5 py-4 space-y-4">
                    {/* Score Summary Card */}
                    <div className="bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center border border-gray-100 dark:border-gray-700/70 shadow-sm">
                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="60"
                                    className="stroke-gray-200 dark:stroke-gray-700"
                                    strokeWidth="10"
                                    fill="none"
                                />
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="60"
                                    stroke={ringColor}
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference * (1 - scoreRatio)}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none">
                                    {formatGunaValue(score)}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    out of {total}
                                </span>
                            </div>
                        </div>

                        <div className={`mt-3 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 border text-center ${colorClass}`}>
                            {verdictIcon}
                            <span>{data?.verdict || verdict}</span>
                            <span className="opacity-70 text-[11px]">({percentage}%)</span>
                        </div>

                        {/* Manglik & Gothra Pills */}
                        {(data?.manglikCompatible !== undefined || data?.gothraCompatible !== null && data?.gothraCompatible !== undefined) && (
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                                {data?.manglikCompatible !== undefined && (
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                        data.manglikCompatible
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                                    }`}>
                                        {data.manglikCompatible ? '🪐 Manglik Aligned' : '🪐 Manglik Mismatch'}
                                    </span>
                                )}
                                {data?.gothraCompatible !== null && data?.gothraCompatible !== undefined && (
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                        data.gothraCompatible
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                                    }`}>
                                        {data.gothraCompatible ? '🕉️ Distinct Gothra' : '🕉️ Same Gothra'}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Side-by-Side Nakshatra & Rashi Cards */}
                    {hasAstroPair && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-orange-50/70 dark:bg-orange-950/25 border border-orange-200/70 dark:border-orange-900/50 rounded-2xl p-2.5 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 truncate">
                                    {myName}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                                    {astroA?.nakshatra || '-'}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                    {[astroA?.zodiacSign, astroA?.rashi].filter(Boolean).join(' · ') || 'Moon Sign'}
                                </p>
                            </div>
                            <div className="bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl p-2.5 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                                    {partnerName}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                                    {astroB?.nakshatra || '-'}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                    {[astroB?.zodiacSign, astroB?.rashi].filter(Boolean).join(' · ') || 'Moon Sign'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Ashta Kuta Breakdown List */}
                    <div>
                        <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                            <Sparkles size={12} className="text-amber-500" />
                            <span>Ashta Kuta Details</span>
                        </h3>

                        {details.length > 0 ? (
                            <div className="space-y-2.5">
                                {details.map((item: any, idx: number) => {
                                    const kutaTotal = Number(item?.t) > 0 ? Number(item.t) : 1;
                                    const kutaScore = Number.isFinite(Number(item?.s)) ? Math.max(0, Number(item.s)) : 0;
                                    const barPct = Math.min(100, Math.round((kutaScore / kutaTotal) * 100));
                                    const isFull = kutaScore >= kutaTotal;
                                    const isZero = kutaScore === 0;

                                    return (
                                        <div
                                            key={item?.name || idx}
                                            className="flex flex-col gap-1.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/70"
                                        >
                                            <div className="flex justify-between items-start gap-2 text-xs sm:text-sm">
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {item?.name}
                                                    </span>
                                                    {item?.v1 && item?.v2 && (
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 break-words">
                                                            {item.v1} ↔ {item.v2}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                                    <div className="w-16 sm:w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                isFull ? 'bg-emerald-500' : isZero ? 'bg-rose-400' : 'bg-amber-400'
                                                            }`}
                                                            style={{ width: `${barPct}%` }}
                                                        />
                                                    </div>
                                                    <span
                                                        className={`font-bold min-w-[2.5rem] text-right text-xs sm:text-sm ${
                                                            isFull
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : isZero
                                                                ? 'text-rose-500 dark:text-rose-400'
                                                                : 'text-amber-600 dark:text-amber-400'
                                                        }`}
                                                    >
                                                        {formatGunaValue(kutaScore)}/{formatGunaValue(kutaTotal, 1)}
                                                    </span>
                                                </div>
                                            </div>
                                            {item?.desc && (
                                                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                Detailed 8-Koota breakdown is calculated from both partners&apos; date of birth, Nakshatra, and Rashi.
                            </div>
                        )}
                    </div>
                </div>

                {/* Compact Footer */}
                <div className="shrink-0 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-orange-50/70 dark:from-gray-900 dark:to-orange-950/20 text-center">
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                        <Star size={11} className="text-amber-500 shrink-0" />
                        <span>Based on Nakshatra &amp; Moon Sign Analysis</span>
                        <Star size={11} className="text-amber-500 shrink-0" />
                    </p>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
