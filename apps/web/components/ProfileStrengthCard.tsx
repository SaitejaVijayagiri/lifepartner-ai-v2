'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Award, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface MissingSection {
    key: string;
    label: string;
    points: number;
    actionUrl: string;
}

interface ProfileStrengthCardProps {
    completenessScore?: number;
    missingSections?: MissingSection[];
    badgeLevel?: string;
    onEditProfile?: () => void;
}

export default function ProfileStrengthCard({
    completenessScore = 40,
    missingSections = [],
    badgeLevel = 'Basic',
    onEditProfile
}: ProfileStrengthCardProps) {

    const isGold = completenessScore >= 80;
    const isSilver = completenessScore >= 50 && completenessScore < 80;

    const handleOpenEdit = () => {
        if (onEditProfile) {
            onEditProfile();
        } else {
            window.location.href = '/dashboard?tab=profile&edit=true';
        }
    };

    return (
        <div className="w-full bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden my-6">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[70px] -z-10"></div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                {/* Left: Score & Progress */}
                <div className="flex items-center gap-5">
                    <div className="relative flex items-center justify-center">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="34"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-white/10"
                                fill="transparent"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="34"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeDasharray={213}
                                strokeDashoffset={213 - (213 * Math.min(completenessScore, 100)) / 100}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ${
                                    isGold ? 'text-amber-400' : isSilver ? 'text-indigo-400' : 'text-rose-400'
                                }`}
                                fill="transparent"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-extrabold tracking-tight">{completenessScore}%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white tracking-tight">Profile Strength</h3>
                            {isGold ? (
                                <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Gold Verified (1.5x Match Boost)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full">
                                    <Award className="w-3.5 h-3.5" /> {badgeLevel} Level
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-indigo-200/80 font-medium">
                            {isGold
                                ? '🎉 Outstanding! Your complete profile gets 5x higher responses & top placement in AI recommendations.'
                                : 'Complete missing details to unlock higher AI compatibility matches & bonus coins.'}
                        </p>
                    </div>
                </div>

                {/* Right CTA */}
                {!isGold && (
                    <button
                        onClick={handleOpenEdit}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.03] flex-shrink-0 cursor-pointer"
                    >
                        <span>Complete Profile</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Actionable Chips for Missing Sections */}
            {missingSections && missingSections.length > 0 && !isGold && (
                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider mr-2">Quick Add:</span>
                    {missingSections.slice(0, 3).map((item) => (
                        <button
                            key={item.key}
                            onClick={handleOpenEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white transition-all backdrop-blur-sm cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>+{item.points}% {item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
