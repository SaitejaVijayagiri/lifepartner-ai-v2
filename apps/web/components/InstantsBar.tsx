'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Zap, Plus, Check, Eye, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import InstantCameraModal from './InstantCameraModal';
import InstantViewerModal from './InstantViewerModal';

interface InstantItem {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    caption?: string;
    createdAt: string;
    hasViewed: boolean;
    isOwn: boolean;
    mediaUrl?: string | null;
}

interface InstantsBarProps {
    onSelectMatchForSnap?: (matchId: string) => void;
}

export default function InstantsBar({ onSelectMatchForSnap }: InstantsBarProps) {
    const [instants, setInstants] = useState<InstantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [viewingInstantId, setViewingInstantId] = useState<string | null>(null);

    const fetchInstants = async () => {
        try {
            const res = await api.get('/instants/feed');
            if (res?.success && Array.isArray(res.instants)) {
                setInstants(res.instants);
            }
        } catch (err) {
            console.warn('[InstantsBar] Failed to load instants feed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstants();
    }, []);

    const handleInstantViewed = (viewedId: string) => {
        setInstants(prev =>
            prev.map(item => (item.id === viewedId ? { ...item, hasViewed: true, mediaUrl: null } : item))
        );
    };

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400">
                        <Zap className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                    </span>
                    <h3 className="font-bold text-xs tracking-wide uppercase text-slate-800 dark:text-slate-200">
                        Instants • View Once
                    </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Disappears when opened</span>
            </div>

            <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-1 px-1">
                {/* Take Snap Button */}
                <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                    <button
                        onClick={() => setShowCamera(true)}
                        className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 p-[2px] shadow-md hover:scale-105 transition-transform"
                    >
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white">
                            <Camera className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                <Plus className="w-3 h-3 text-black font-bold" />
                            </span>
                        </div>
                    </button>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Take Snap</span>
                </div>

                {/* Instant Items */}
                {instants.map(instant => {
                    const isViewed = instant.hasViewed;

                    return (
                        <div
                            key={instant.id}
                            className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
                            onClick={() => {
                                if (isViewed && !instant.isOwn) return;
                                setViewingInstantId(instant.id);
                            }}
                        >
                            <div
                                className={`relative w-14 h-14 rounded-full p-[2px] transition-transform ${
                                    isViewed
                                        ? 'bg-slate-300 dark:bg-slate-700 opacity-60'
                                        : 'bg-gradient-to-tr from-amber-400 via-pink-500 to-rose-500 animate-pulse shadow-md group-hover:scale-105'
                                }`}
                            >
                                <img
                                    src={instant.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instant.senderName}`}
                                    alt={instant.senderName}
                                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900 bg-slate-100"
                                />

                                {/* Icon Overlay Badge */}
                                <div
                                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold ${
                                        isViewed
                                            ? 'bg-slate-400 text-white'
                                            : 'bg-amber-500 text-slate-950 shadow-sm'
                                    }`}
                                >
                                    {isViewed ? <Lock className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5 fill-slate-950" />}
                                </div>
                            </div>

                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[60px] truncate text-center">
                                {instant.isOwn ? 'Your Snap' : instant.senderName.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}

                {/* Empty State message if no active feed snaps */}
                {!loading && instants.length === 0 && (
                    <div className="flex items-center space-x-2 text-xs text-slate-400 pl-2">
                        <span>No new snaps. Tap <strong>Take Snap</strong> to send one! ⚡</span>
                    </div>
                )}
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <InstantCameraModal
                    onClose={() => setShowCamera(false)}
                    onSuccess={() => {
                        fetchInstants();
                    }}
                />
            )}

            {/* Viewer Modal */}
            {viewingInstantId && (
                <InstantViewerModal
                    instantId={viewingInstantId}
                    onClose={() => setViewingInstantId(null)}
                    onViewed={handleInstantViewed}
                />
            )}
        </div>
    );
}
