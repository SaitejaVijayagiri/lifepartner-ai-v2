'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Clock, AlertCircle, Camera, ShieldCheck, Upload, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

function compressImageToDataUrl(file: File, maxDimension = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the selected image file.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Invalid image file. Please select a JPG, PNG, or WebP image.'));
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

export default function RequestVerificationButton() {
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'REJECTED' | 'APPROVED'>('IDLE');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => {
        checkStatus();
    }, []);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload a JPG, PNG, or WebP photo.');
            return;
        }
        try {
            const dataUrl = await compressImageToDataUrl(file);
            setPreviewDataUrl(dataUrl);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to process image.');
        }
    };

    const handleSubmit = async () => {
        if (!previewDataUrl) {
            toast.error('Please capture or upload a clear selfie photo first.');
            return;
        }
        setSubmitting(true);
        try {
            await api.verification.request(previewDataUrl);
            setStatus('PENDING');
            setModalOpen(false);
            setPreviewDataUrl('');
            toast.success('Verification submitted! Our safety team will review shortly.');
        } catch (e: any) {
            toast.error(e?.message || 'Verification submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;
    if (status === 'APPROVED') return null;

    if (status === 'PENDING') {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 text-amber-600 border-amber-200 bg-amber-50">
                <Clock size={16} /> Selfie Verification Pending
            </Button>
        );
    }

    return (
        <>
            {status === 'REJECTED' ? (
                <Button onClick={() => setModalOpen(true)} variant="outline" size="sm" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
                    <AlertCircle size={16} /> Verification Rejected (Retry)
                </Button>
            ) : (
                <Button onClick={() => setModalOpen(true)} variant="outline" size="sm" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                    <BadgeCheck size={16} /> Get Selfie Verified
                </Button>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Selfie Verification</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Private review by our safety team — never shown publicly</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            Take or upload a clear, well-lit selfie showing your face. Our safety team manually reviews each submission. Approved profiles earn the blue Verified badge and get higher visibility in matches.
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
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                <img src={previewDataUrl} alt="Verification preview" className="w-full max-h-60 object-contain" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold flex items-center gap-1"
                                >
                                    <Camera size={13} /> Change Photo
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-10 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                            >
                                <Upload size={26} />
                                <span className="text-sm font-bold">Take or Upload a Clear Selfie</span>
                                <span className="text-[11px] text-gray-500">JPG, PNG, or WebP</span>
                            </button>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!previewDataUrl || submitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Checking...</> : 'Submit for Review'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
