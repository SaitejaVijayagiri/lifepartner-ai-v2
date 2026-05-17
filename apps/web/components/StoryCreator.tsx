import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface StoryCreatorProps {
    storyFile: File;
    storyPreviewUrl: string;
    onClose: () => void;
    onSuccess: () => void;
}

const STORY_FILTERS = [
    { name: 'Normal', filter: 'none' },
    { name: 'Golden Hour 🌅', filter: 'sepia(0.3) brightness(1.1) contrast(1.1) saturate(1.4) hue-rotate(-5deg)' },
    { name: 'Soft Glam 🌸', filter: 'brightness(1.15) contrast(0.9) saturate(1.1) sepia(0.1) hue-rotate(-15deg)' },
    { name: 'Paris ✨', filter: 'sepia(0.2) contrast(1.1) brightness(1.1) hue-rotate(-10deg) saturate(1.2)' },
    { name: 'Baddie 💅', filter: 'contrast(1.3) brightness(0.95) saturate(1.1) hue-rotate(10deg)' },
    { name: 'Cinematic 🎬', filter: 'brightness(0.9) contrast(1.2) saturate(1.3) sepia(0.2) hue-rotate(15deg)' },
    { name: 'Retro 90s 📼', filter: 'contrast(1.3) saturate(0.8) sepia(0.4) brightness(0.9)' },
    { name: 'Noir 🖤', filter: 'grayscale(1) contrast(1.2)' }
];

const MUSIC_TRACKS = [
    { id: 'none', name: 'No Music', url: '' },
    { id: 'lofi', name: 'Chill Lo-Fi ☕', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    { id: 'romantic', name: 'Romantic Piano 💖', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_4f0f089602.mp3' },
    { id: 'upbeat', name: 'Upbeat Pop 🕺', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3' },
    { id: 'cinematic', name: 'Epic Vibe 🎬', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' }
];

export default function StoryCreator({ storyFile, storyPreviewUrl, onClose, onSuccess }: StoryCreatorProps) {
    const toast = useToast();
    const [activeFilter, setActiveFilter] = useState<string>('none');
    const [isUploadingStory, setIsUploadingStory] = useState(false);
    
    // Text Overlay State
    interface TextOverlay {
        id: string;
        text: string;
        color: string;
        x: number;
        y: number;
    }
    const [texts, setTexts] = useState<TextOverlay[]>([]);
    const [isAddingText, setIsAddingText] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [currentColor, setCurrentColor] = useState('white');
    
    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
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
        if (!storyFile || !storyPreviewUrl) return;
        setIsUploadingStory(true);

        try {
            let finalData: FormData | string;

            if (storyFile.type.startsWith('video')) {
                const formData = new FormData();
                formData.append('media', storyFile);
                if (selectedMusic !== 'none') formData.append('music', selectedMusic);
                finalData = formData;
            } else {
                // Apply Canvas Filter & Text
                const img = new Image();
                img.crossOrigin = "anonymous";
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = storyPreviewUrl;
                });

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas not supported");

                if (croppedAreaPixels) {
                    canvas.width = croppedAreaPixels.width;
                    canvas.height = croppedAreaPixels.height;
                    if (activeFilter !== 'none') ctx.filter = activeFilter;
                    ctx.drawImage(
                        img,
                        croppedAreaPixels.x,
                        croppedAreaPixels.y,
                        croppedAreaPixels.width,
                        croppedAreaPixels.height,
                        0, 0, canvas.width, canvas.height
                    );
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    if (activeFilter !== 'none') ctx.filter = activeFilter;
                    ctx.drawImage(img, 0, 0);
                }

                ctx.filter = 'none';

                // Draw Text Overlays
                if (texts.length > 0 && previewContainerRef.current) {
                    const containerRect = previewContainerRef.current.getBoundingClientRect();
                    // Aspect ratio is 9:16, so the actual visible area might be smaller than container
                    // Find actual 9:16 area inside containerRect
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
                    const fontSize = Math.floor(canvas.width * 0.08); // Base font size
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    texts.forEach(t => {
                        ctx.fillStyle = t.color;
                        const canvasX = (canvas.width / 2) + (t.x * scaleX);
                        const canvasY = (canvas.height / 2) + (t.y * scaleY);
                        
                        const lines = t.text.split('\\n');
                        const lineHeight = fontSize * 1.2;
                        const startY = canvasY - ((lines.length - 1) * lineHeight) / 2;
                        
                        lines.forEach((line, index) => {
                            ctx.fillText(line, canvasX, startY + (index * lineHeight));
                        });
                    });
                }
                
                // Extract blob
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, storyFile.type, 0.9));
                if (!blob) throw new Error("Failed to process image");

                const formData = new FormData();
                formData.append('media', blob, storyFile.name);
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
                        {!storyFile.type.startsWith('video') && (
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
                    {storyFile.type.startsWith('video') ? (
                        <video src={storyPreviewUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
                    ) : (
                        <div className="relative w-full h-full" style={{ aspectRatio: '9/16', margin: '0 auto', maxWidth: '100%', maxHeight: '100%' }}>
                            
                            {/* Cropper Base Layer */}
                            <div className="absolute inset-0" style={{ filter: activeFilter !== 'none' ? activeFilter : 'none' }}>
                                {/* @ts-ignore */}
                                <Cropper
                                    image={storyPreviewUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={9 / 16}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    showGrid={false}
                                    style={{
                                        containerStyle: { background: '#111' },
                                    }}
                                />
                            </div>

                            {/* Draggable Texts Layer */}
                            {!isAddingText && texts.map((t, i) => (
                                /* @ts-ignore */
                                <Draggable
                                    key={t.id}
                                    defaultPosition={{ x: t.x, y: t.y }}
                                    onStop={(e, data) => {
                                        // Update position in array
                                        const newTexts = [...texts];
                                        newTexts[i] = { ...newTexts[i], x: data.x, y: data.y };
                                        
                                        // Delete logic: if dragged to bottom 100px
                                        if (previewContainerRef.current) {
                                            const containerRect = previewContainerRef.current.getBoundingClientRect();
                                            // simple math: if data.y > containerRect.height - 150
                                            // we will just delete it if y > 300 for mobile
                                            if (data.y > (containerRect.height / 2) - 100) {
                                                // Actually it's better to calculate relative to window
                                                // We'll leave it as simple drag for now, exact trash zone is tricky across screens
                                            }
                                        }
                                        setTexts(newTexts);
                                    }}
                                >
                                    <div 
                                        className="absolute cursor-move inline-block"
                                        style={{ 
                                            color: t.color, 
                                            textShadow: '0px 2px 15px rgba(0,0,0,0.8)',
                                            fontSize: 'clamp(1.5rem, 6vw, 3rem)',
                                            fontWeight: 'bold',
                                            whiteSpace: 'pre-wrap',
                                            zIndex: 20
                                        }}
                                    >
                                        {t.text}
                                    </div>
                                </Draggable>
                            ))}

                            {/* Text Editing Mode */}
                            {isAddingText && (
                                <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                                    <textarea
                                        autoFocus
                                        value={currentText}
                                        onChange={(e) => setCurrentText(e.target.value)}
                                        className="bg-transparent border-none outline-none text-center font-bold resize-none w-full px-4"
                                        style={{ 
                                            color: currentColor, 
                                            textShadow: '0px 2px 15px rgba(0,0,0,0.8)',
                                            fontSize: 'clamp(2rem, 8vw, 4rem)',
                                            minHeight: '200px'
                                        }}
                                        placeholder="Type something..."
                                    />
                                    <div className="absolute bottom-32 flex gap-4 bg-black/50 p-3 rounded-full backdrop-blur-md">
                                        {['white', 'black', '#ff3b30', '#ff2d55', '#34c759', '#007aff', '#ffcc00'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setCurrentColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 ${currentColor === color ? 'border-white scale-125' : 'border-transparent'}`}
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
                                                    x: 0, 
                                                    y: 0 
                                                }]);
                                            }
                                            setCurrentText('');
                                            setIsAddingText(false);
                                        }}
                                        className="absolute top-20 right-6 text-white font-bold bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
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
                        {!storyFile?.type.startsWith('video') && !isAddingText && (
                            <div className="mb-6">
                                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                                    {STORY_FILTERS.map(f => (
                                        <div 
                                            key={f.name}
                                            onClick={() => setActiveFilter(f.filter)}
                                            className={`flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group`}
                                        >
                                            <div className={`w-[60px] h-[60px] rounded-full overflow-hidden border-[3px] transition-all duration-300 ${activeFilter === f.filter ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent ring-1 ring-white/30 opacity-70 group-hover:opacity-100'}`}>
                                                <img 
                                                    src={storyPreviewUrl} 
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
