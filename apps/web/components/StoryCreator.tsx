import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface StoryCreatorProps {
    storyFiles: File[];
    storyPreviewUrls: string[];
    onClose: () => void;
    onSuccess: () => void;
}

const STORY_FILTERS = [
    { name: 'Normal', filter: 'none' },
    { name: 'Warm Sunset 🌅', filter: 'sepia(0.15) saturate(1.25) contrast(1.1) brightness(1.02)' },
    { name: 'Soft Glam 🌸', filter: 'brightness(1.12) contrast(0.92) saturate(1.05) sepia(0.05)' },
    { name: 'Classic Film 🎬', filter: 'contrast(1.15) saturate(1.1) brightness(0.98) sepia(0.08)' },
    { name: 'Bright & Airy ☀️', filter: 'brightness(1.15) contrast(1.05) saturate(1.12)' },
    { name: 'Moody Matte 🖤', filter: 'contrast(1.15) saturate(0.85) brightness(0.96) sepia(0.05)' },
    { name: 'Golden Hour 🌇', filter: 'sepia(0.25) saturate(1.3) contrast(1.05) brightness(1.03)' },
    { name: 'Monochrome 📸', filter: 'grayscale(1) contrast(1.25) brightness(0.98)' },
    { name: 'Lofi Portrait 🎞️', filter: 'contrast(1.18) saturate(1.15) brightness(0.97) sepia(0.05)' },
    { name: 'Cool Light ❄️', filter: 'contrast(1.08) saturate(1.1) brightness(1.04) hue-rotate(-3deg)' },
    { name: 'Warm Bronze 🤎', filter: 'sepia(0.2) saturate(1.2) contrast(1.12) brightness(0.95)' },
    { name: 'Natural Glow ✨', filter: 'saturate(1.2) contrast(1.06) brightness(1.02)' }
];

const MUSIC_TRACKS = [
    { id: 'none', name: 'No Music', url: '' },
    { id: 'lofi', name: 'Chill Lo-Fi ☕', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'romantic', name: 'Romantic Piano 💖', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3' },
    { id: 'upbeat', name: 'Upbeat Pop 🕺', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
    { id: 'cinematic', name: 'Epic Vibe 🎬', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
    { id: 'acoustic', name: 'Acoustic Guitar 🎸', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3' },
    { id: 'electronic', name: 'Electronic 🎧', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'bollywood', name: 'Desi Beats 🥁', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { id: 'devotional', name: 'Devotional Flute 🕉️', url: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_9bc6b3a0cc.mp3' },
    { id: 'pop', name: 'Summer Pop ☀️', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'jazz', name: 'Midnight Jazz 🎷', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'retro', name: 'Synthwave Retro ⚡', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 'classical', name: 'Symphony Classic 🎻', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { id: 'rock', name: 'Energetic Rock 🎸', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 'chillout', name: 'Ambient Chillout 🌊', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    { id: 'party', name: 'Club Party Beat 🔥', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
];

function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = (rotation * Math.PI) / 180;
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    filter = 'none'
): Promise<string> {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bWidth, height: bHeight } = rotateSize(image.width, image.height, rotation);

    canvas.width = bWidth;
    canvas.height = bHeight;

    ctx.translate(bWidth / 2, bHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) throw new Error('No cropped context');

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    if (filter !== 'none') {
        croppedCtx.filter = filter;
    }

    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return croppedCanvas.toDataURL('image/jpeg', 0.85);
}

export default function StoryCreator({ storyFiles, storyPreviewUrls, onClose, onSuccess }: StoryCreatorProps) {
    const toast = useToast();
    const [activeFilter, setActiveFilter] = useState<string>('none');
    const [isUploadingStory, setIsUploadingStory] = useState(false);
    
    // Multiple files (Slideshow) State
    const isSlideshow = storyFiles.length > 1;
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    
    // Video Trimming State
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(60);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    
    // Text Overlay State
    interface TextOverlay {
        id: string;
        text: string;
        color: string;
        x: number;
        y: number;
        fontFamily: string;
        bgStyle: 'plain' | 'highlight' | 'neon';
        scale: number;
    }
    const [texts, setTexts] = useState<TextOverlay[]>([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [currentColor, setCurrentColor] = useState('white');
    const [currentFont, setCurrentFont] = useState('sans-serif');
    const [currentBgStyle, setCurrentBgStyle] = useState<'plain' | 'highlight' | 'neon'>('plain');
    const [currentScale, setCurrentScale] = useState(1);
    
    // Drag State for Trash Zone
    const [isDraggingText, setIsDraggingText] = useState(false);
    
    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Music State
    const [isSelectingMusic, setIsSelectingMusic] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState<string>('none');
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleMusicSelect = (trackId: string, trackUrl: string) => {
        setSelectedMusic(trackId);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (trackUrl) {
            audioRef.current = new Audio(trackUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(e => console.log("Audio play prevented", e));
        }
    };

    const applyFilterAndUpload = async () => {
        if (!storyFiles || storyFiles.length === 0) return;
        setIsUploadingStory(true);

        try {
            let finalData: FormData | string;

            if (isSlideshow) {
                // For Slideshows, we send all files to the backend
                const formData = new FormData();
                storyFiles.forEach(file => {
                    formData.append('media', file);
                });
                if (selectedMusic !== 'none') formData.append('music', selectedMusic);
                finalData = formData;
            } else if (storyFiles[0].type.startsWith('video')) {
                const formData = new FormData();
                formData.append('media', storyFiles[0]);
                if (selectedMusic !== 'none') formData.append('music', selectedMusic);
                
                if (videoDuration > 0) {
                    formData.append('startTime', startTime.toString());
                    formData.append('endTime', endTime.toString());
                }
                
                if (texts.length > 0) formData.append('texts', JSON.stringify(texts));
                
                finalData = formData;
            } else {
                // Apply Crop, Filter & Text (Single Image)
                let imageSrc = storyPreviewUrls[0];
                if (croppedAreaPixels) {
                    try {
                        imageSrc = await getCroppedImg(
                            storyPreviewUrls[0],
                            croppedAreaPixels,
                            rotation,
                            activeFilter
                        );
                    } catch (cropErr) {
                        console.error("Failed to crop image:", cropErr);
                    }
                }

                const img = new Image();
                img.crossOrigin = "anonymous";
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageSrc;
                });

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas not supported");

                canvas.width = img.width;
                canvas.height = img.height;

                if (!croppedAreaPixels && activeFilter !== 'none') {
                    ctx.filter = activeFilter;
                }
                ctx.drawImage(img, 0, 0);
                ctx.filter = 'none';

                // Draw Text Overlays
                if (texts.length > 0 && previewContainerRef.current) {
                    const containerRect = previewContainerRef.current.getBoundingClientRect();
                    let viewWidth = containerRect.width;
                    let viewHeight = containerRect.height;
                    
                    if (viewWidth / viewHeight > 9 / 16) {
                        viewWidth = viewHeight * (9 / 16);
                    } else {
                        viewHeight = viewWidth / (9 / 16);
                    }

                    const scaleX = canvas.width / viewWidth;
                    const scaleY = canvas.height / viewHeight;

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    texts.forEach(t => {
                        const canvasX = (canvas.width / 2) + (t.x * scaleX);
                        const canvasY = (canvas.height / 2) + (t.y * scaleY);
                        
                        const lines = t.text.split('\\n');
                        const baseFontSize = Math.floor(canvas.width * 0.08); // Base font size
                        const fontSize = baseFontSize * t.scale;
                        ctx.font = `bold ${fontSize}px ${t.fontFamily}`;
                        const lineHeight = fontSize * 1.2;
                        const startY = canvasY - ((lines.length - 1) * lineHeight) / 2;

                        if (t.bgStyle === 'neon') {
                            ctx.fillStyle = t.color;
                            ctx.shadowColor = t.color;
                            ctx.shadowBlur = 20;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            
                            // Draw multiple times to intensify neon glow
                            lines.forEach((line, index) => {
                                ctx.fillText(line, canvasX, startY + (index * lineHeight));
                                ctx.fillText(line, canvasX, startY + (index * lineHeight));
                            });
                        } else if (t.bgStyle === 'highlight') {
                            ctx.shadowColor = 'transparent';
                            ctx.shadowBlur = 0;
                            
                            // Draw background rectangles
                            ctx.fillStyle = t.color;
                            lines.forEach((line, index) => {
                                const metrics = ctx.measureText(line);
                                const paddingX = fontSize * 0.5;
                                const paddingY = fontSize * 0.2;
                                ctx.fillRect(
                                    canvasX - (metrics.width / 2) - paddingX,
                                    startY + (index * lineHeight) - (fontSize / 2) - paddingY,
                                    metrics.width + (paddingX * 2),
                                    fontSize + (paddingY * 2)
                                );
                            });

                            // Draw text on top
                            ctx.fillStyle = t.color === 'white' ? 'black' : 'white';
                            lines.forEach((line, index) => {
                                ctx.fillText(line, canvasX, startY + (index * lineHeight));
                            });
                        } else {
                            ctx.fillStyle = t.color;
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowBlur = 15;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            lines.forEach((line, index) => {
                                ctx.fillText(line, canvasX, startY + (index * lineHeight));
                            });
                        }
                    });
                }
                
                // Extract blob
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, storyFiles[0].type, 0.9));
                if (!blob) throw new Error("Failed to process image");

                const formData = new FormData();
                formData.append('media', blob, storyFiles[0].name);
                if (selectedMusic !== 'none') formData.append('music', selectedMusic);
                finalData = formData;
            }

            // Cleanup audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            await api.profile.uploadStory(finalData as FormData);
            toast.success("Story uploaded successfully!");
            onSuccess();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to upload story");
        } finally {
            setIsUploadingStory(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black backdrop-blur-sm">
            <div className="bg-black w-full h-full md:max-w-lg md:h-[90vh] md:rounded-3xl overflow-hidden flex flex-col relative">
                
                {/* Header Tools */}
                <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent">
                    <button 
                        onClick={() => {
                            if (audioRef.current) audioRef.current.pause();
                            onClose();
                        }}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsSelectingMusic(!isSelectingMusic)}
                            className={`text-white p-2 rounded-full transition-all ${selectedMusic !== 'none' || isSelectingMusic ? 'bg-indigo-500' : 'bg-black/40 hover:bg-white/20'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                        </button>
                        {!isSlideshow && (
                            <button 
                                onClick={() => setIsAddingText(!isAddingText)}
                                className={`text-white p-2 rounded-full transition-all font-serif font-bold text-xl leading-none w-10 h-10 flex items-center justify-center ${isAddingText || texts.length > 0 ? 'bg-indigo-500' : 'bg-black/40 hover:bg-white/20'}`}
                            >
                                Aa
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Preview */}
                <div 
                    className="relative flex-1 flex items-center justify-center overflow-hidden w-full h-full bg-[#111]"
                    ref={previewContainerRef}
                >
                    {isSlideshow ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                            {/* Slideshow Preview Animation */}
                            {storyPreviewUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    className="absolute w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
                                    style={{ 
                                        opacity: currentSlideIndex === index ? 1 : 0,
                                        zIndex: currentSlideIndex === index ? 10 : 1
                                    }}
                                    alt={`Slide ${index}`}
                                />
                            ))}
                            {/* Slideshow Indicator */}
                            <div className="absolute top-24 left-0 right-0 flex justify-center gap-1.5 z-[100] px-4">
                                {storyPreviewUrls.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlideIndex ? 'bg-white flex-1' : 'bg-white/30 w-3'}`} 
                                    />
                                ))}
                            </div>
                            {/* Slideshow Logic */}
                            <img src={storyPreviewUrls[0]} className="hidden" onLoad={() => {
                                // Simple interval to cycle through images
                                const interval = setInterval(() => {
                                    setCurrentSlideIndex(prev => (prev + 1) % storyPreviewUrls.length);
                                }, 3000);
                                return () => clearInterval(interval);
                            }} />
                        </div>
                    ) : storyFiles[0].type.startsWith('video') ? (
                        <div className="w-full h-full flex flex-col relative">
                            <video 
                                ref={videoRef}
                                src={storyPreviewUrls[0]} 
                                autoPlay 
                                playsInline
                                className="w-full h-full object-cover" 
                                onLoadedMetadata={(e) => {
                                    const duration = e.currentTarget.duration;
                                    setVideoDuration(duration);
                                    setEndTime(Math.min(duration, 60));
                                    e.currentTarget.play().catch(() => setIsPlaying(false));
                                }}
                                onCanPlay={(e) => {
                                    if (videoDuration === 0) {
                                        const duration = e.currentTarget.duration;
                                        setVideoDuration(duration);
                                        setEndTime(Math.min(duration, 60));
                                    }
                                }}
                                onTimeUpdate={() => {
                                    if (videoRef.current && videoRef.current.currentTime >= endTime) {
                                        videoRef.current.currentTime = startTime;
                                        if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
                                    }
                                }}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                            
                            {/* Play/Pause Overlay Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (videoRef.current) {
                                        if (isPlaying) {
                                            videoRef.current.pause();
                                        } else {
                                            videoRef.current.play().catch(() => setIsPlaying(false));
                                        }
                                    }
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors z-[5]"
                            >
                                {!isPlaying && (
                                    <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    </div>
                                )}
                            </button>
                            
                            {/* Trimming UI for Video */}
                            {!isAddingText && videoDuration > 0 && (
                                <div className="absolute bottom-24 left-4 right-4 bg-black/50 backdrop-blur-md p-4 rounded-2xl z-[100] border border-white/20 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                                    <div className="flex justify-between text-white text-xs mb-3 font-bold uppercase tracking-wider">
                                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md">Start: {startTime.toFixed(1)}s</span>
                                        <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-md">End: {endTime.toFixed(1)}s (Max 60s)</span>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="relative">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={videoDuration} 
                                                step="0.1" 
                                                value={startTime} 
                                                onChange={(e) => {
                                                    const newStart = parseFloat(e.target.value);
                                                    setStartTime(newStart);
                                                    if (endTime - newStart > 60) setEndTime(newStart + 60);
                                                    else if (newStart >= endTime) setEndTime(Math.min(newStart + 1, videoDuration));
                                                    if (videoRef.current) videoRef.current.currentTime = newStart;
                                                }} 
                                                className="w-full accent-indigo-500 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{ WebkitAppearance: 'none' }}
                                            />
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={videoDuration} 
                                                step="0.1" 
                                                value={endTime} 
                                                onChange={(e) => {
                                                    const newEnd = parseFloat(e.target.value);
                                                    setEndTime(newEnd);
                                                    if (newEnd - startTime > 60) setStartTime(newEnd - 60);
                                                    else if (newEnd <= startTime) setStartTime(Math.max(newEnd - 1, 0));
                                                    if (videoRef.current) videoRef.current.currentTime = newEnd;
                                                }} 
                                                className="w-full accent-pink-500 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{ WebkitAppearance: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative h-full aspect-[9/16] max-w-full" style={{ margin: '0 auto' }}>
                            
                            <div className="absolute inset-0">
                                {/* @ts-ignore */}
                                <Cropper
                                    image={storyPreviewUrls[0]}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={9 / 16}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    showGrid={false}
                                    style={{
                                        containerStyle: { background: '#111' },
                                        mediaStyle: { filter: activeFilter !== 'none' ? activeFilter : 'none' }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Draggable Texts Layer */}
                            {!isAddingText && texts.map((t, i) => (
                                /* @ts-ignore */
                                <Draggable
                                    key={t.id}
                                    defaultPosition={{ x: t.x, y: t.y }}
                                    onStart={() => setIsDraggingText(true)}
                                    onStop={(e, data) => {
                                        setIsDraggingText(false);
                                        // Update position in array
                                        const newTexts = [...texts];
                                        newTexts[i] = { ...newTexts[i], x: data.x, y: data.y };
                                        
                                        // Delete logic: if dragged to bottom zone
                                        if (previewContainerRef.current) {
                                            const containerRect = previewContainerRef.current.getBoundingClientRect();
                                            // Delete if in the bottom 20%
                                            if (data.y > (containerRect.height / 2) - (containerRect.height * 0.2)) {
                                                setTexts(texts.filter(text => text.id !== t.id));
                                                return;
                                            }
                                        }
                                        setTexts(newTexts);
                                    }}
                                >
                                    <div className="absolute top-1/2 left-1/2 cursor-move inline-block" style={{ zIndex: 20 }}>
                                        <div 
                                            style={{ 
                                                transform: 'translate(-50%, -50%)',
                                                color: t.bgStyle === 'highlight' ? (t.color === 'white' ? 'black' : 'white') : t.color,
                                                backgroundColor: t.bgStyle === 'highlight' ? t.color : 'transparent',
                                                textShadow: t.bgStyle === 'neon' ? `0 0 10px ${t.color}, 0 0 20px ${t.color}, 0 0 30px ${t.color}` : (t.bgStyle === 'plain' ? '0px 2px 15px rgba(0,0,0,0.8)' : 'none'),
                                                fontSize: `clamp(${1.5 * t.scale}rem, ${6 * t.scale}vw, ${3 * t.scale}rem)`,
                                                fontFamily: t.fontFamily,
                                                fontWeight: 'bold',
                                                whiteSpace: 'pre-wrap',
                                                padding: t.bgStyle === 'highlight' ? '10px 20px' : '0',
                                                borderRadius: t.bgStyle === 'highlight' ? '12px' : '0',
                                            }}
                                        >
                                            {t.text}
                                        </div>
                                    </div>
                                </Draggable>
                            ))}

                            {/* Trash Zone */}
                            {isDraggingText && (
                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white p-4 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.8)] z-50 animate-in fade-in slide-in-from-bottom-10 pointer-events-none">
                                    <Trash2 size={32} />
                                </div>
                            )}

                            {/* Text Editing Mode */}
                            {isAddingText && (
                                <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                                    
                                    {/* Style & Font Toggles */}
                                    <div className="absolute top-20 left-0 right-0 flex justify-center gap-4 px-4 pointer-events-auto">
                                        <button 
                                            onClick={() => setCurrentBgStyle(prev => prev === 'plain' ? 'highlight' : (prev === 'highlight' ? 'neon' : 'plain'))}
                                            className="text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold border border-white/20 transition-all flex items-center justify-center"
                                        >
                                            {currentBgStyle === 'plain' ? 'Aa Plain' : (currentBgStyle === 'highlight' ? 'Aa Highlight' : 'Aa Neon')}
                                        </button>
                                        <select 
                                            value={currentFont}
                                            onChange={(e) => setCurrentFont(e.target.value)}
                                            className="text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold border border-white/20 transition-all outline-none appearance-none cursor-pointer"
                                            style={{ fontFamily: currentFont }}
                                        >
                                            <option value="sans-serif" className="text-black font-sans">Classic</option>
                                            <option value="serif" className="text-black font-serif">Serif</option>
                                            <option value="monospace" className="text-black font-mono">Typewriter</option>
                                            <option value="'Comic Sans MS', cursive, sans-serif" className="text-black" style={{fontFamily: "'Comic Sans MS', cursive"}}>Playful</option>
                                            <option value="'Impact', sans-serif" className="text-black" style={{fontFamily: "'Impact', sans-serif"}}>Bold</option>
                                            <option value="'Brush Script MT', cursive, serif" className="text-black" style={{fontFamily: "'Brush Script MT', cursive"}}>Elegant</option>
                                        </select>
                                    </div>

                                    {/* Size Slider */}
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-48 w-10 bg-black/50 rounded-full backdrop-blur-md pointer-events-auto">
                                        <span className="text-white/70 text-[10px] font-bold mb-16">SIZE</span>
                                        <input 
                                            type="range" min="0.5" max="2.5" step="0.1" 
                                            value={currentScale} onChange={(e) => setCurrentScale(parseFloat(e.target.value))}
                                            className="w-32 h-1 accent-white origin-center -rotate-90"
                                        />
                                    </div>

                                    <textarea
                                        autoFocus
                                        value={currentText}
                                        onChange={(e) => setCurrentText(e.target.value)}
                                        className="bg-transparent border-none outline-none text-center font-bold resize-none w-full px-4"
                                        style={{ 
                                            color: currentBgStyle === 'highlight' ? (currentColor === 'white' ? 'black' : 'white') : currentColor,
                                            backgroundColor: currentBgStyle === 'highlight' ? currentColor : 'transparent',
                                            textShadow: currentBgStyle === 'neon' ? `0 0 10px ${currentColor}, 0 0 20px ${currentColor}, 0 0 30px ${currentColor}` : (currentBgStyle === 'plain' ? '0px 2px 15px rgba(0,0,0,0.8)' : 'none'),
                                            fontSize: `clamp(${1.5 * currentScale}rem, ${6 * currentScale}vw, ${3 * currentScale}rem)`,
                                            fontFamily: currentFont,
                                            minHeight: '150px',
                                            borderRadius: currentBgStyle === 'highlight' ? '12px' : '0',
                                        }}
                                        placeholder="Type something..."
                                    />
                                    <div className="absolute bottom-32 flex gap-4 bg-black/50 p-3 rounded-full backdrop-blur-md overflow-x-auto max-w-[90%] no-scrollbar">
                                        {['white', 'black', '#ff3b30', '#ff2d55', '#34c759', '#007aff', '#ffcc00', '#ff9500', '#af52de'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setCurrentColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-transform ${currentColor === color ? 'border-white scale-125' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (currentText.trim()) {
                                                setTexts([...texts, { 
                                                    id: Date.now().toString(), 
                                                    text: currentText, 
                                                    color: currentColor, 
                                                    fontFamily: currentFont,
                                                    bgStyle: currentBgStyle,
                                                    scale: currentScale,
                                                    x: 0, 
                                                    y: 0 
                                                }]);
                                            }
                                            setCurrentText('');
                                            setIsAddingText(false);
                                        }}
                                        className="absolute top-6 right-6 text-white font-bold bg-white/20 px-5 py-2 rounded-full hover:bg-white/30 transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                </div>

                {/* Music Selector Panel */}
                {isSelectingMusic && (
                    <div className="absolute top-20 left-0 right-0 mx-4 bg-black/80 backdrop-blur-xl rounded-2xl p-4 z-40 border border-white/10 shadow-2xl animate-in slide-in-from-top-4">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                            Add Music
                        </h4>
                        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                            {MUSIC_TRACKS.map(track => (
                                <button
                                    key={track.id}
                                    onClick={() => {
                                        handleMusicSelect(track.id, track.url);
                                        if (track.id === 'none') setIsSelectingMusic(false);
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedMusic === track.id ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                                >
                                    <span className="font-semibold">{track.name}</span>
                                    {selectedMusic === track.id && (
                                        <div className="flex gap-1 items-center h-4">
                                            <div className="w-1 h-3 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1 h-4 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1 h-2 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setIsSelectingMusic(false)}
                            className="w-full mt-4 bg-white text-black font-bold py-2 rounded-xl"
                        >
                            Done
                        </button>
                    </div>
                )}

                {/* Filters & Actions Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20 z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                        {!isSlideshow && !storyFiles[0]?.type.startsWith('video') && !isAddingText && (
                            <div className="mb-6 flex flex-col gap-4">
                                {/* Filters Carousel */}
                                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                                    {STORY_FILTERS.map(f => (
                                        <div 
                                            key={f.name}
                                            onClick={() => setActiveFilter(f.filter)}
                                            className={`flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group`}
                                        >
                                            <div className={`w-[60px] h-[60px] rounded-full overflow-hidden border-[3px] transition-all duration-300 ${activeFilter === f.filter ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent ring-1 ring-white/30 opacity-70 group-hover:opacity-100'}`}>
                                                <img 
                                                    src={storyPreviewUrls[0]} 
                                                    className="w-full h-full object-cover"
                                                    style={{ filter: f.filter !== 'none' ? f.filter : 'none' }}
                                                />
                                            </div>
                                            <span className={`text-[11px] font-medium transition-colors ${activeFilter === f.filter ? 'text-white font-bold drop-shadow-md' : 'text-white/80 drop-shadow-sm'}`}>
                                                {f.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isAddingText && (
                            <button 
                                onClick={applyFilterAndUpload}
                                disabled={isUploadingStory}
                                className="w-full py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {isUploadingStory ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>Add to Story {'>'}</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
