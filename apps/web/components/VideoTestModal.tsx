'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Video, VideoOff, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoTestModalProps {
    onClose: () => void;
}

export default function VideoTestModal({ onClose }: VideoTestModalProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [volume, setVolume] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Audio Visualizer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(mediaStream);
            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((process, current) => process + current, 0);
                const visualVolume = sum / bufferLength; // 0-255 roughly
                setVolume(Math.min(100, (visualVolume / 128) * 100)); // Normalize approx
                animationRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();

        } catch (e) {
            console.error("Camera access failed", e);
            alert("Could not access Camera/Microphone. Please check permissions.");
            onClose();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-50 duration-300">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Video size={18} /> Test Hardware
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden mb-6 group">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted // Always mute loopback to prevent feedback
                            playsInline
                            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                <VideoOff size={48} />
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs flex items-center gap-2">
                            <Volume2 size={12} />
                            <div className="w-20 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-75 ${volume > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${volume}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={toggleMute}
                            variant={isMuted ? "destructive" : "secondary"}
                            size="lg"
                            className="rounded-full w-14 h-14 p-0 shrink-0"
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </Button>
                        <Button
                            onClick={toggleVideo}
                            variant={isVideoOff ? "destructive" : "secondary"}
                            size="lg"
                            className="rounded-full w-14 h-14 p-0 shrink-0"
                        >
                            {isVideoOff ? <VideoOff /> : <Video />}
                        </Button>
                    </div>

                    <div className="mt-8 w-full">
                        <Button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            Looks Good
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
