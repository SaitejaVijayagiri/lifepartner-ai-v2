'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Clock, AlertCircle, Camera, ShieldCheck, RefreshCw, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

function compressImageToDataUrl(file: File, maxDimension = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the selected image file.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Invalid image file. Please capture a valid photo.'));
            img.onload = () => {
                const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
                const width = Math.max(1, Math.round(img.width * scale));
                const height = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(String(reader.result || ''));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    });
}

interface RequestVerificationButtonProps {
    className?: string;
}

export default function RequestVerificationButton({ className = '' }: RequestVerificationButtonProps) {
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'REJECTED' | 'APPROVED'>('IDLE');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
    const [cameraStarting, setCameraStarting] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const toast = useToast();

    useEffect(() => {
        checkStatus();
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => {
                try { t.stop(); } catch {}
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
        setCameraStarting(false);
    }, []);

    const startLiveCamera = useCallback(async () => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setCameraError('Live browser camera is unavailable on this device. Tap "Open Device Camera" below.');
            setCameraActive(false);
            return;
        }
        stopCamera();
        setCameraStarting(true);
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 960 } },
                audio: false
            });
            streamRef.current = stream;
            setCameraActive(true);
            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
            });
        } catch (err: any) {
            const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
            setCameraError(
                isDenied
                    ? 'Camera permission was blocked. Allow camera access or tap "Open Device Camera" below.'
                    : 'Could not start live camera. Tap "Open Device Camera" below to take a live selfie.'
            );
            setCameraActive(false);
        } finally {
            setCameraStarting(false);
        }
    }, [stopCamera]);

    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
        }
    }, [cameraActive]);

    useEffect(() => {
        if (modalOpen && !previewDataUrl) {
            startLiveCamera();
        } else if (!modalOpen) {
            stopCamera();
        }
        return () => stopCamera();
    }, [modalOpen, previewDataUrl, startLiveCamera, stopCamera]);

    const checkStatus = async () => {
        try {
            const res = await api.verification.getStatus();
            if (res.isVerified) {
                setStatus('APPROVED');
            } else if (res.request?.status) {
                setStatus(res.request.status as any);
            } else {
                setStatus('IDLE');
            }
        } catch (e) {
            console.error('Failed to check verification status', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCaptureFrame = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) {
            toast.error('Camera is still initializing. Please wait a second.');
            return;
        }
        const maxDim = 960;
        const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
        const width = Math.max(1, Math.round(video.videoWidth * scale));
        const height = Math.max(1, Math.round(video.videoHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror horizontally to match natural front-camera preview
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        setPreviewDataUrl(dataUrl);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please capture a valid JPG, PNG, or WebP selfie photo.');
            return;
        }
        try {
            const dataUrl = await compressImageToDataUrl(file);
            stopCamera();
            setPreviewDataUrl(dataUrl);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to process captured photo.');
        } finally {
            e.target.value = '';
        }
    };

    const handleCloseModal = () => {
        stopCamera();
        setModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!previewDataUrl) {
            toast.error('Please take a clear live selfie first.');
            return;
        }
        setSubmitting(true);
        try {
            await api.verification.request(previewDataUrl);
            setStatus('PENDING');
            stopCamera();
            setModalOpen(false);
            setPreviewDataUrl('');
            toast.success('Live selfie submitted! Our safety team will review it shortly.');
        } catch (e: any) {
            toast.error(e?.message || 'Selfie verification submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;
    if (status === 'APPROVED') return null;

    if (status === 'PENDING') {
        return (
            <Button variant="outline" size="sm" disabled className={`gap-1.5 text-amber-600 border-amber-200 bg-amber-50 ${className}`}>
                <Clock size={15} className="shrink-0" /> Selfie Pending
            </Button>
        );
    }

    const verificationModal = modalOpen && typeof document !== 'undefined' ? createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Live Selfie Verification</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Private review only — never shown publicly</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Take a clear, well-lit live selfie showing your full face. Our safety team checks it against your profile photos so verified profiles get the blue badge and higher trust.
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {previewDataUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        <img src={previewDataUrl} alt="Live selfie preview" className="w-full max-h-64 object-contain" />
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewDataUrl('');
                            }}
                            className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-black/75 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                            <RefreshCw size={13} /> Retake Selfie
                        </button>
                    </div>
                ) : cameraActive ? (
                    <div className="space-y-3">
                        <div className="relative aspect-square max-h-72 mx-auto rounded-2xl overflow-hidden bg-black border-2 border-blue-500/40 shadow-inner">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-44 h-56 rounded-full border-2 border-dashed border-white/60" />
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={handleCaptureFrame}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold gap-2 h-11 rounded-xl"
                        >
                            <Camera size={18} /> Capture Live Selfie
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={cameraStarting}
                            className="w-full py-10 px-4 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer text-center"
                        >
                            {cameraStarting ? (
                                <>
                                    <Loader2 size={26} className="animate-spin" />
                                    <span className="text-sm font-bold">Starting Front Camera...</span>
                                </>
                            ) : (
                                <>
                                    <Camera size={28} />
                                    <span className="text-sm font-bold">Open Device Camera for Live Selfie</span>
                                    <span className="text-[11px] text-gray-500 max-w-xs">
                                        {cameraError || 'Center your face clearly in good lighting.'}
                                    </span>
                                </>
                            )}
                        </button>
                        {!cameraStarting && cameraError && (
                            <button
                                type="button"
                                onClick={startLiveCamera}
                                className="w-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Retry Browser Camera
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!previewDataUrl || submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : 'Submit Live Selfie'}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            {status === 'REJECTED' ? (
                <Button onClick={() => setModalOpen(true)} variant="outline" size="sm" className={`gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 ${className}`}>
                    <AlertCircle size={15} className="shrink-0" /> Retry Selfie Check
                </Button>
            ) : (
                <Button onClick={() => setModalOpen(true)} variant="outline" size="sm" className={`gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 ${className}`}>
                    <BadgeCheck size={15} className="shrink-0" /> Get Selfie Verified
                </Button>
            )}
            {verificationModal}
        </>
    );
}
