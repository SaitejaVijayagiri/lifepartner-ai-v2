'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Lock, AlertCircle, ShieldAlert, Eye, Users, Clock, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface InstantViewerModalProps {
    instantId: string;
    initialMediaUrl?: string | null;
    onClose: () => void;
    onViewed?: (instantId: string) => void;
    onDeleted?: (instantId: string) => void;
    onSnapBack?: (senderId: string, senderName: string) => void;
    isOwn?: boolean;
}

export default function InstantViewerModal({
    instantId,
    initialMediaUrl,
    onClose,
    onViewed,
    onDeleted,
    onSnapBack,
    isOwn
}: InstantViewerModalProps) {
    const toast = useToast();
    const [mediaUrl, setMediaUrl] = useState<string | null>(initialMediaUrl || null);
    const [caption, setCaption] = useState<string | null>(null);
    const [senderId, setSenderId] = useState<string | null>(null);
    const [senderName, setSenderName] = useState<string>('User');
    const [loading, setLoading] = useState(!initialMediaUrl);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(100);
    const [viewerZoom, setViewerZoom] = useState<number>(1);
    const [showViewers, setShowViewers] = useState(false);
    const [viewersList, setViewersList] = useState<any[]>([]);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const [isScreenBlurred, setIsScreenBlurred] = useState(false);
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

    const handleDeleteInstant = async () => {
        if (!confirm('Delete this Instant snap? It will be permanently removed for everyone.')) return;

        try {
            const res = await api.instants.delete(instantId);
            if (res?.success) {
                toast.success('Instant snap deleted.');
                if (onDeleted) onDeleted(instantId);
                handleClose();
            } else {
                toast.error(res?.error || 'Failed to delete instant snap.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete instant snap.');
        }
    };

    useEffect(() => {
        let isMounted = true;

        async function fetchAndViewInstant() {
            try {
                if (!initialMediaUrl) setLoading(true);
                setError(null);

                const res = await api.post(`/instants/${instantId}/view`);
                if (!isMounted) return;

                if (res?.success && res?.instant?.mediaUrl) {
                    setMediaUrl(res.instant.mediaUrl);
                    setCaption(res.instant.caption || null);
                    setSenderId(res.instant.senderId);
                    setSenderName(res.instant.senderName || 'User');
                    if (onViewed) onViewed(instantId);
                } else if (res?.error) {
                    if (initialMediaUrl) {
                        setMediaUrl(initialMediaUrl);
                    } else {
                        setError(res.error);
                    }
                } else {
                    if (initialMediaUrl) {
                        setMediaUrl(initialMediaUrl);
                    } else {
                        setError('This Instant snap has already been viewed or expired.');
                    }
                }
            } catch (err: any) {
                console.error('[InstantViewer] View error:', err);
                if (initialMediaUrl) {
                    setMediaUrl(initialMediaUrl);
                } else if (err.status === 410) {
                    setError('This Instant snap has already been viewed and expired.');
                } else {
                    setError(err.message || 'Failed to open Instant snap.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchAndViewInstant();

        // Privacy Blur Guard: blur snap if window loses focus / app goes background
        const handleBlur = () => setIsScreenBlurred(true);
        const handleFocus = () => setIsScreenBlurred(false);
        const handleVisibility = () => {
            if (document.hidden) setIsScreenBlurred(true);
            else setIsScreenBlurred(false);
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            isMounted = false;
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
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

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const content = (
        <div className="fixed inset-0 z-[99999] w-screen h-screen w-full h-full min-h-[100vh] flex flex-col justify-between bg-black overflow-hidden select-none animate-in fade-in duration-200">
            <div className="relative w-full h-full flex-1 flex flex-col justify-between bg-black overflow-hidden">
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

                        <div className="flex items-center space-x-2">
                            {(isOwn || Boolean(senderId)) && (
                                <button
                                    onClick={handleDeleteInstant}
                                    className="p-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 transition-colors"
                                    title="Delete Instant Snap"
                                >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                </button>
                            )}

                            <button
                                onClick={handleClose}
                                className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
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
                                className={`w-full h-full object-cover select-none pointer-events-none transition-all ${isScreenBlurred ? 'blur-2xl opacity-20' : ''}`}
                                onContextMenu={e => e.preventDefault()}
                            />

                            {/* Screen Unfocused Privacy Overlay */}
                            {isScreenBlurred && (
                                <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
                                    <ShieldAlert className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
                                    <h4 className="text-white font-bold text-base">Snap Hidden for Privacy</h4>
                                    <p className="text-xs text-slate-400 mt-1 max-w-xs">Return focus to this tab to resume viewing.</p>
                                </div>
                            )}

                            {/* Caption Overlay */}
                            {caption && !isScreenBlurred && (
                                <div className="absolute bottom-16 inset-x-6 bg-black/70 backdrop-blur-md px-4 py-3 rounded-2xl text-center text-white text-sm font-medium border border-white/10 shadow-2xl">
                                    {caption}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Security & Actions Footer */}
                <div className="relative z-30 px-4 py-3 bg-black/90 border-t border-slate-900 text-center text-[10px] text-slate-400 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Once Active</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {!isOwn && senderId && onSnapBack && (
                            <button
                                onClick={() => {
                                    handleClose();
                                    onSnapBack(senderId, senderName);
                                }}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shadow-lg transition-transform active:scale-95"
                            >
                                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                                <span>Snap Back</span>
                            </button>
                        )}

                        <button
                            onClick={handleOpenViewers}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors border border-slate-800"
                        >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Viewers</span>
                        </button>
                    </div>
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

    if (mounted && typeof document !== 'undefined') {
        return createPortal(content, document.body);
    }
    return content;
}
