'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Zap, Lock, AlertCircle, ShieldAlert, Eye, Users, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface InstantViewerModalProps {
    instantId: string;
    onClose: () => void;
    onViewed?: (instantId: string) => void;
}

export default function InstantViewerModal({
    instantId,
    onClose,
    onViewed
}: InstantViewerModalProps) {
    const toast = useToast();
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState<string | null>(null);
    const [senderId, setSenderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(100);
    const [viewerZoom, setViewerZoom] = useState<number>(1);
    const [showViewers, setShowViewers] = useState(false);
    const [viewersList, setViewersList] = useState<any[]>([]);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const touchDistRef = useRef<number | null>(null);

    const VIEW_DURATION_MS = 7000; // 7 seconds viewing time

    const handleOpenViewers = async () => {
        setShowViewers(true);
        setLoadingViewers(true);
        try {
            const res = await api.instants.getViewers(instantId);
            if (res?.success && Array.isArray(res.viewers)) {
                setViewersList(res.viewers);
            }
        } catch (err) {
            console.warn('[InstantViewer] Failed to load viewers:', err);
        } finally {
            setLoadingViewers(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        async function fetchAndViewInstant() {
            try {
                setLoading(true);
                setError(null);

                const res = await api.post(`/instants/${instantId}/view`);
                if (!isMounted) return;

                if (res.data?.success && res.data?.instant?.mediaUrl) {
                    setMediaUrl(res.data.instant.mediaUrl);
                    setCaption(res.data.instant.caption || null);
                    setSenderId(res.data.instant.senderId);
                    if (onViewed) onViewed(instantId);
                } else if (res.data?.error) {
                    setError(res.data.error);
                } else {
                    setError('This Instant snap has already been viewed or expired.');
                }
            } catch (err: any) {
                console.error('[InstantViewer] View error:', err);
                if (err.response?.status === 410) {
                    setError('This Instant snap has already been viewed and expired.');
                } else {
                    setError(err.response?.data?.error || 'Failed to open Instant snap.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchAndViewInstant();

        return () => {
            isMounted = false;
        };
    }, [instantId]);

    // Timer countdown progress bar
    useEffect(() => {
        if (!mediaUrl || loading || error) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remainingPercent = Math.max(0, 100 - (elapsed / VIEW_DURATION_MS) * 100);
            setProgress(remainingPercent);

            if (remainingPercent <= 0) {
                clearInterval(interval);
                handleClose();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [mediaUrl, loading, error]);

    const handleClose = () => {
        // Clear media URL state immediately on close
        setMediaUrl(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-lg p-0 sm:p-4 select-none animate-in fade-in duration-200">
            <div className="relative w-full h-full sm:max-w-md sm:h-[85vh] sm:max-h-[800px] bg-black sm:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-slate-900">
                {/* Top Progress Bar */}
                <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                    <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-3">
                        <div
                            className="bg-amber-400 h-full transition-all ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/30 text-amber-400 border border-amber-400/40">
                                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                            </span>
                            <span className="text-xs font-bold tracking-wide uppercase text-amber-300">
                                Instant Snap • View Once
                            </span>
                        </div>

                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative flex-1 flex items-center justify-center bg-black">
                    {loading ? (
                        <div className="flex flex-col items-center space-y-3 text-amber-400">
                            <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                            <span className="text-xs font-medium tracking-wide">Opening Instant Snap...</span>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center max-w-xs space-y-4">
                            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                                <Lock className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base">Snap Expired</h4>
                                <p className="text-xs text-slate-400 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    ) : (
                        <div
                            className="relative w-full h-full flex items-center justify-center overflow-hidden"
                            onDoubleClick={() => setViewerZoom(prev => (prev === 1 ? 2 : 1))}
                            onTouchStart={(e) => {
                                if (e.touches.length === 2) {
                                    const dist = Math.hypot(
                                        e.touches[0].clientX - e.touches[1].clientX,
                                        e.touches[0].clientY - e.touches[1].clientY
                                    );
                                    touchDistRef.current = dist;
                                }
                            }}
                            onTouchMove={(e) => {
                                if (e.touches.length === 2 && touchDistRef.current) {
                                    const dist = Math.hypot(
                                        e.touches[0].clientX - e.touches[1].clientX,
                                        e.touches[0].clientY - e.touches[1].clientY
                                    );
                                    const scale = dist / touchDistRef.current;
                                    setViewerZoom(Math.min(3, Math.max(1, scale)));
                                }
                            }}
                            onTouchEnd={() => { touchDistRef.current = null; }}
                        >
                            <img
                                src={mediaUrl!}
                                alt="Instant View Once"
                                style={{
                                    transform: `scale(${viewerZoom})`,
                                    transition: 'transform 0.15s ease-out'
                                }}
                                className="w-full h-full object-cover select-none pointer-events-none"
                                onContextMenu={e => e.preventDefault()}
                            />

                            {/* Caption Overlay */}
                            {caption && (
                                <div className="absolute bottom-16 inset-x-6 bg-black/70 backdrop-blur-md px-4 py-3 rounded-2xl text-center text-white text-sm font-medium border border-white/10 shadow-2xl">
                                    {caption}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Security Footer */}
                <div className="relative z-30 px-4 py-3 bg-black/90 border-t border-slate-900 text-center text-[10px] text-slate-400 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Once Security Active</span>
                    </div>

                    <button
                        onClick={handleOpenViewers}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors border border-slate-800"
                    >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Viewers</span>
                    </button>
                </div>

                {/* Viewers Bottom Sheet Drawer */}
                {showViewers && (
                    <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 rounded-t-3xl p-5 max-h-[60vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                            <div className="flex items-center space-x-2 text-white">
                                <Eye className="w-4 h-4 text-amber-400" />
                                <h4 className="font-bold text-sm">Snap Viewers</h4>
                            </div>
                            <button
                                onClick={() => setShowViewers(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {loadingViewers ? (
                            <div className="py-8 text-center text-xs text-amber-400">Loading viewers...</div>
                        ) : viewersList.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">No views recorded yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {viewersList.map(v => (
                                    <div key={v.id} className="flex items-center justify-between py-1">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={v.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.name}`}
                                                alt={v.name}
                                                className="w-9 h-9 rounded-full object-cover bg-slate-800"
                                            />
                                            <span className="font-semibold text-xs text-slate-200">{v.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                            {v.viewedAt ? new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Viewed'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
