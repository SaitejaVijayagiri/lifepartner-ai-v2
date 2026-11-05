'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Compass, CheckCircle2, MessageCircle, ArrowRight, Star, ShieldCheck, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface AISoulmateSpotlightProps {
    currentUser: any;
    onViewProfile?: (profile: any) => void;
    onOpenChat?: (conn: any) => void;
    onOpenCompatibility?: (targetUserId: string, targetName: string, targetPhoto?: string) => void;
}

export default function AISoulmateSpotlight({
    currentUser,
    onViewProfile,
    onOpenChat,
    onOpenCompatibility
}: AISoulmateSpotlightProps) {
    const [soulmate, setSoulmate] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchSoulmate = async () => {
            try {
                setLoading(true);
                const envUrl = process.env.NEXT_PUBLIC_API_URL;
                const apiBase = (envUrl && !envUrl.includes('onrender.com')) ? envUrl : 'https://lifepartner-backend-295663053086.asia-south1.run.app';
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                if (!token) return;

                const res = await fetch(`${apiBase}/matches/ai-perfect-match`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.perfectMatch) {
                        setSoulmate(data.perfectMatch);
                    }
                }
            } catch (err) {
                console.error("[AISoulmateSpotlight] Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSoulmate();
    }, []);

    const handleConnect = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!soulmate || isConnected || isConnecting) return;

        setIsConnecting(true);
        try {
            await api.interactions.sendInterest(soulmate.id);
            setIsConnected(true);
            toast.success(`🎉 Connection request sent to ${soulmate.name}!`);

            if (onOpenChat) {
                onOpenChat({
                    interactionId: soulmate.id,
                    initialMessage: soulmate.icebreaker,
                    partner: {
                        id: soulmate.id,
                        name: soulmate.name,
                        photoUrl: soulmate.photoUrl,
                        location: soulmate.location
                    }
                });
            }
        } catch (err) {
            toast.error("Failed to connect. Please try again.");
        } finally {
            setIsConnecting(false);
        }
    };

    if (loading) {
        return (
            <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-400/30 p-5 shadow-xl animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-400/20" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-amber-400/20 rounded w-1/3" />
                        <div className="h-3 bg-purple-400/20 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (!soulmate) return null;

    const dimensions = soulmate.dimensions || {
        personality: 94,
        values: 92,
        lifestyle: 89,
        cosmic: 95
    };

    return (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-purple-950/70 border border-amber-400/40 p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-amber-500/10 overflow-hidden">
            {/* Ambient radiant glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-purple-400 to-pink-400" />

            {/* Header pill */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
                    <Sparkles size={13} className="text-amber-400 animate-pulse" />
                    Today's #1 AI Soulmate Pick
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                    <Flame size={13} className="text-emerald-400 fill-emerald-400" />
                    {soulmate.aiScore}% Compatibility
                </div>
            </div>

            {/* Profile Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div 
                    className="flex items-start sm:items-center gap-4 cursor-pointer min-w-0"
                    onClick={() => onViewProfile && onViewProfile(soulmate)}
                >
                    <div className="relative shrink-0">
                        <img
                            src={soulmate.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(soulmate.name)}`}
                            alt={soulmate.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400/80 shadow-lg shadow-amber-500/20"
                            loading="lazy"
                        />
                        <span className="absolute -top-1.5 -right-1.5 p-1 bg-amber-400 rounded-full shadow-md text-slate-950">
                            <Star size={11} fill="currentColor" />
                        </span>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-xl font-black text-white truncate hover:text-amber-300 transition-colors">
                                {soulmate.name}, {soulmate.age}
                            </h3>
                            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                        </div>
                        <p className="text-xs text-amber-200/90 font-bold truncate">
                            {soulmate.profession} • {soulmate.location}
                        </p>
                        {soulmate.bio && (
                            <p className="text-xs text-gray-300 line-clamp-1 mt-1 max-w-lg">
                                "{soulmate.bio}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenCompatibility) {
                                onOpenCompatibility(soulmate.id, soulmate.name, soulmate.photoUrl);
                            }
                        }}
                        className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <Compass size={14} className="text-purple-400" />
                        <span>AI Radar</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleConnect}
                        disabled={isConnecting || isConnected}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-pink-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                    >
                        <MessageCircle size={14} />
                        <span>{isConnected ? "Connected! Opening Chat..." : "Say Hello 👋"}</span>
                    </button>
                </div>
            </div>

            {/* Dimensional Compatibility Matrix Mini Bars */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-purple-500/20">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-purple-500/20">
                    <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                        <span>🧠 Emotional</span>
                        <span className="text-purple-400 font-extrabold">{dimensions.personality}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${dimensions.personality}%` }} />
                    </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-pink-500/20">
                    <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                        <span>💍 Vision</span>
                        <span className="text-pink-400 font-extrabold">{dimensions.values}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${dimensions.values}%` }} />
                    </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                    <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                        <span>🥗 Lifestyle</span>
                        <span className="text-emerald-400 font-extrabold">{dimensions.lifestyle}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dimensions.lifestyle}%` }} />
                    </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-amber-500/20">
                    <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                        <span>⭐ Cosmic</span>
                        <span className="text-amber-400 font-extrabold">{dimensions.cosmic}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dimensions.cosmic}%` }} />
                    </div>
                </div>
            </div>

            {/* AI Top Match Reasons Tags */}
            {soulmate.matchReasons && soulmate.matchReasons.length > 0 && (
                <div className="relative z-10 flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">
                        Why You Click:
                    </span>
                    {soulmate.matchReasons.slice(0, 3).map((reason: string, rIdx: number) => (
                        <span
                            key={rIdx}
                            className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold"
                        >
                            {reason}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
