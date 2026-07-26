'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Sparkles, Send, Upload, Image as ImageIcon, Zap, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface InstantCameraModalProps {
    onClose: () => void;
    onSuccess: () => void;
    recipientId?: string;
    recipientName?: string;
}

const FILTERS = [
    { name: 'Normal', filter: 'none' },
    { name: 'Warm 🌅', filter: 'sepia(0.2) saturate(1.2)' },
    { name: 'Vibrant ✨', filter: 'saturate(1.4) contrast(1.1)' },
    { name: 'B&W 📸', filter: 'grayscale(1) contrast(1.2)' },
    { name: 'Glam 🌸', filter: 'brightness(1.1) saturate(1.1) contrast(0.95)' },
    { name: 'Vintage 🎞️', filter: 'sepia(0.3) contrast(1.1) brightness(0.95)' }
];

export default function InstantCameraModal({
    onClose,
    onSuccess,
    recipientId,
    recipientName
}: InstantCameraModalProps) {
    const toast = useToast();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [isUploading, setIsUploading] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Initialize camera stream
    useEffect(() => {
        let currentStream: MediaStream | null = null;

        async function startCamera() {
            if (capturedImage) return; // Don't restart camera if already captured photo

            try {
                setCameraError(null);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }

                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1080 },
                        height: { ideal: 1920 }
                    },
                    audio: false
                });

                currentStream = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
            } catch (err: any) {
                console.warn('[InstantCamera] Camera access failed:', err);
                setCameraError('Unable to access camera. You can upload a photo from your gallery instead.');
            }
        }

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, capturedImage]);

    // Flip front/back camera
    const toggleCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    // Take snapshot from video stream
    const takeSnap = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Apply filter to canvas if selected
        if (selectedFilter !== 'none') {
            ctx.filter = selectedFilter;
        }

        // Handle mirror flipping for selfie camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setCapturedImage(dataUrl);

        // Stop stream once snapshot is taken
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // Handle File Upload Fallback
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            toast.error('File size exceeds 15MB limit.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setCapturedImage(event.target.result as string);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    // Retake snap
    const retakeSnap = () => {
        setCapturedImage(null);
        setCaption('');
        setSelectedFilter('none');
    };

    // Post / Send Instant Snap
    const submitInstant = async () => {
        if (!capturedImage) return;

        setIsUploading(true);
        try {
            const res = await api.post('/instants', {
                mediaUrl: capturedImage,
                caption: caption.trim(),
                receiverId: recipientId || null
            });

            if (res.data?.success) {
                toast.success(recipientName ? `Instant Snap sent to ${recipientName}! ⚡` : 'Instant Snap posted! ⚡');
                onSuccess();
                onClose();
            } else {
                toast.error(res.data?.error || 'Failed to send Instant Snap.');
            }
        } catch (err: any) {
            console.error('[InstantCamera] Upload error:', err);
            toast.error(err.response?.data?.error || 'Failed to send Instant Snap.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md h-[88vh] max-h-[850px] bg-slate-950 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
                {/* Header */}
                <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white">
                    <div className="flex items-center space-x-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <Zap className="w-4 h-4 fill-amber-400" />
                        </span>
                        <div>
                            <h3 className="font-bold text-sm leading-tight text-slate-100">
                                {recipientName ? `Snap to ${recipientName}` : 'Instant Snap'}
                            </h3>
                            <p className="text-[10px] text-amber-300 font-medium">View Once • 24h Expire</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* View Finder / Captured Image Display */}
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    {capturedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                            <img
                                src={capturedImage}
                                alt="Captured Snap"
                                style={{ filter: selectedFilter }}
                                className="w-full h-full object-cover"
                            />
                            {caption && (
                                <div className="absolute bottom-20 inset-x-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-center text-white text-sm font-medium border border-white/10 shadow-lg">
                                    {caption}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                            {cameraError ? (
                                <div className="px-6 text-center text-slate-300 space-y-4">
                                    <Camera className="w-12 h-12 mx-auto text-slate-500" />
                                    <p className="text-sm text-slate-400">{cameraError}</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-semibold shadow-md flex items-center justify-center space-x-2 mx-auto"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>Choose Photo from Device</span>
                                    </button>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ filter: selectedFilter }}
                                    className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                                />
                            )}
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Filter Selector Bar (when photo taken) */}
                    {capturedImage && (
                        <div className="absolute top-16 inset-x-0 z-10 flex items-center justify-start space-x-2 px-4 py-2 overflow-x-auto no-scrollbar bg-black/40 backdrop-blur-sm">
                            {FILTERS.map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => setSelectedFilter(f.filter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                        selectedFilter === f.filter
                                            ? 'bg-amber-500 text-black font-semibold ring-2 ring-amber-300 shadow-md'
                                            : 'bg-black/50 text-white hover:bg-black/80'
                                    }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Footer Controls */}
                <div className="relative z-20 p-4 bg-slate-950 border-t border-slate-900 flex flex-col space-y-3">
                    {capturedImage ? (
                        <>
                            {/* Caption Input */}
                            <input
                                type="text"
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                maxLength={100}
                                className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60"
                            />

                            <div className="flex items-center justify-between space-x-3 pt-1">
                                <button
                                    onClick={retakeSnap}
                                    disabled={isUploading}
                                    className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-slate-800"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Retake</span>
                                </button>

                                <button
                                    onClick={submitInstant}
                                    disabled={isUploading}
                                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Send Snap ⚡</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-around py-2">
                            {/* Gallery Pick Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 rounded-full bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                                title="Upload Photo"
                            >
                                <ImageIcon className="w-6 h-6" />
                            </button>

                            {/* Shutter Capture Button */}
                            <button
                                onClick={takeSnap}
                                className="relative group p-1.5 rounded-full border-4 border-amber-500 hover:border-amber-400 transition-all active:scale-90"
                            >
                                <span className="block w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 group-hover:scale-95 transition-transform" />
                            </button>

                            {/* Camera Switcher Button */}
                            <button
                                onClick={toggleCamera}
                                className="p-3 rounded-full bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                                title="Flip Camera"
                            >
                                <RefreshCw className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
