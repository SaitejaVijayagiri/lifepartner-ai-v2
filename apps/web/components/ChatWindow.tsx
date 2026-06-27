'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import GameModal from './GameModal';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Video, Phone, Gift, Send, X, Check, CheckCheck, SmilePlus, Trash2, Camera, Mic, Square, Image as ImageIcon, Reply, CalendarClock, MoreVertical, Maximize2, RotateCw, Sliders, Download } from 'lucide-react';
import Cropper from 'react-easy-crop';
import GiftModal from './GiftModal';
import ProfileModal from './ProfileModal';
import VideoCallButton from './VideoCallButton';
import StickerPicker from './StickerPicker';
import { useToast } from '@/components/ui/Toast';

interface ChatWindowProps {
    connectionId: string;
    partner: {
        id: string;
        name: string;
        photoUrl: string;
        role?: string;
    };
    onClose?: () => void;
    onVideoCall?: () => void;
    onAudioCall?: () => void;
    className?: string;
    isCallMode?: boolean;
    onMessagesRead?: () => void;
    onMessageSent?: () => void;
}

const FILTER_PRESETS = [
    { name: 'Normal', value: 'none' },
    { name: 'Golden Hour 🌅', value: 'sepia(0.3) brightness(1.1) contrast(1.1) saturate(1.4) hue-rotate(-5deg)' },
    { name: 'Soft Glam 🌸', value: 'brightness(1.15) contrast(0.9) saturate(1.1) sepia(0.1) hue-rotate(-15deg)' },
    { name: 'Paris ✨', value: 'sepia(0.2) contrast(1.1) brightness(1.1) hue-rotate(-10deg) saturate(1.2)' },
    { name: 'Baddie 💅', value: 'contrast(1.3) brightness(0.95) saturate(1.1) hue-rotate(10deg)' },
    { name: 'Cinematic 🎬', value: 'brightness(0.9) contrast(1.2) saturate(1.3) sepia(0.2) hue-rotate(15deg)' },
    { name: 'Retro 90s 📼', value: 'contrast(1.3) saturate(0.8) sepia(0.4) brightness(0.9)' },
    { name: 'Noir 🖤', value: 'grayscale(1) contrast(1.2)' },
    { name: 'Dreamy ☁️', value: 'blur(0.5px) brightness(1.1) contrast(0.9) saturate(1.2)' },
    { name: 'Cyberpunk 🌆', value: 'contrast(1.4) saturate(1.5) hue-rotate(30deg) brightness(0.9)' },
    { name: 'Vintage 🎞️', value: 'sepia(0.5) contrast(1.1) brightness(0.9) saturate(1.2)' },
    { name: 'Emerald Forest 🌿', value: 'contrast(1.2) saturate(1.3) hue-rotate(-15deg) brightness(0.95) sepia(0.1)' },
    { name: 'Ocean Breeze 🌊', value: 'contrast(1.1) saturate(1.4) hue-rotate(180deg) brightness(1.05)' },
    { name: 'Midnight Glow 🌌', value: 'brightness(0.8) contrast(1.3) saturate(1.5) hue-rotate(-45deg)' },
    { name: 'Fairy Dust ✨', value: 'brightness(1.2) saturate(1.2) contrast(0.95) sepia(0.15) hue-rotate(15deg) blur(0.3px)' },
    { name: 'Warm Sunset 🌅', value: 'sepia(0.4) saturate(1.6) brightness(1.05) contrast(1.1) hue-rotate(-10deg)' },
    { name: 'Cool Mint 🍃', value: 'contrast(1.05) saturate(1.25) hue-rotate(120deg) brightness(1.02)' },
    { name: 'Gothic Punk 🧛', value: 'grayscale(0.6) contrast(1.5) brightness(0.85) sepia(0.1)' },
    { name: 'Barbie Core 🎀', value: 'hue-rotate(320deg) saturate(1.6) brightness(1.1) contrast(1.05)' },
    { name: 'Teal & Orange 🍊', value: 'contrast(1.2) saturate(1.3) sepia(0.1) hue-rotate(-5deg) brightness(0.98)' },
    { name: 'Noir Dark 🩸', value: 'contrast(1.6) grayscale(1) brightness(0.9)' }
];

const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;
    return {
        width: Math.abs(Math.sin(rotRad) * height) + Math.abs(Math.cos(rotRad) * width),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
};

const getCroppedImg = (
    imageSrc: string,
    pixelCrop: any,
    rotation: number = 0,
    filter: string = 'none'
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('No 2d context'));
                return;
            }

            const rotRad = (rotation * Math.PI) / 180;
            const { width: bWidth, height: bHeight } = rotateSize(
                image.width,
                image.height,
                rotation
            );

            canvas.width = bWidth;
            canvas.height = bHeight;

            ctx.translate(bWidth / 2, bHeight / 2);
            ctx.rotate(rotRad);
            ctx.translate(-image.width / 2, -image.height / 2);

            ctx.drawImage(image, 0, 0);

            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            if (!croppedCtx) {
                reject(new Error('No 2d context for crop'));
                return;
            }

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

            croppedCanvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 0.9);
        };
        image.onerror = (err) => reject(err);
    });
};

const getYoutubeId = (text: string): string | null => {
    if (!text) return null;
    const standardMatch = text.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    if (standardMatch) return standardMatch[1];
    
    const shortsMatch = text.match(/youtube\.com\/shorts\/([^"&?\/ ]{11})/i);
    if (shortsMatch) return shortsMatch[1];

    return null;
};

const YoutubeEmbedCard = ({ videoId, onFullscreen }: { videoId: string, onFullscreen: (id: string) => void }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="relative w-[260px] h-[146px] sm:w-[320px] sm:h-[180px] rounded-xl overflow-hidden bg-black/10 border border-black/10 dark:border-white/10 shadow-sm mt-1 shrink-0 group">
            {isPlaying ? (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    className="w-full h-full rounded-xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            ) : (
                <div className="relative w-full h-full cursor-pointer" onClick={() => setIsPlaying(true)}>
                    <img 
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        alt="YouTube Video Thumbnail"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                        <div className="w-14 h-10 bg-red-600/90 group-hover:bg-red-600 hover:scale-110 text-white rounded-xl flex items-center justify-center transition-all shadow-lg">
                            <span className="text-xl leading-none">▶</span>
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFullscreen(videoId);
                        }}
                        className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all border border-white/20 shadow-md flex items-center justify-center cursor-pointer"
                        title="Play in fullscreen modal"
                    >
                        <Maximize2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default function ChatWindow({ connectionId, partner, onClose, onVideoCall, onAudioCall, className, isCallMode = false, onMessagesRead, onMessageSent }: ChatWindowProps) {
    const { socket, onlineUsers } = useSocket() as any;
    const { user, login } = useAuth() as any;
    const toast = useToast();
    
    // Media & Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    
    // Internal state for partner info to handle missing query params
    const [partnerInfo, setPartnerInfo] = useState(partner);

    // Mute State
    const [isMuted, setIsMuted] = useState<boolean>(() => {
        const mutedUsers = user?.muted_users || [];
        return mutedUsers.includes(partner.id);
    });
    const [isMuting, setIsMuting] = useState(false);

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [fullscreenMedia, setFullscreenMedia] = useState<{ 
        url: string; 
        type: 'image' | 'video'; 
        texts?: any[];
        creator?: { id: string; name: string; photoUrl: string };
    } | null>(null);
    const [fullscreenYoutubeId, setFullscreenYoutubeId] = useState<string | null>(null);
    const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
    const [deleteMenuMsgId, setDeleteMenuMsgId] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<{ id: string; text: string; senderName: string } | null>(null);
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const lastEmitTypingRef = useRef<number>(0);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [activeFilter, setActiveFilter] = useState('none');
    const [isEditingImage, setIsEditingImage] = useState(false);

    // Garbage collect staged object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (stagedPreviewUrl) {
                URL.revokeObjectURL(stagedPreviewUrl);
            }
        };
    }, [stagedPreviewUrl]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveEditedImage = async (shouldSend: boolean = false) => {
        if (!croppedAreaPixels || isEditingImage || !stagedPreviewUrl || !stagedFile) return;
        setIsEditingImage(true);
        
        let fileToUpload: File | null = null;
        let previewToClear: string | null = stagedPreviewUrl;
        
        try {
            const croppedBlob = await getCroppedImg(
                stagedPreviewUrl,
                croppedAreaPixels,
                rotation,
                activeFilter
            );
            
            fileToUpload = new File([croppedBlob], stagedFile.name || 'edited-image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            if (shouldSend) {
                setShowImageEditor(false);
                setIsUploadingMedia(true);
                setUploadProgress(0);
                
                try {
                    const res = await api.chat.uploadMedia(fileToUpload, (percent) => setUploadProgress(percent));
                    if (res.url) {
                        setStagedFile(null);
                        setStagedPreviewUrl(null);
                        if (previewToClear) {
                            URL.revokeObjectURL(previewToClear);
                        }
                        
                        await handleSend(undefined, `[IMAGE]${res.url}`);
                        if (inputText.trim()) {
                            await handleSend(undefined, inputText);
                        }
                        toast.success("Attachment edited and sent!");
                    }
                } catch (uploadErr: any) {
                    toast.error(`Direct send failed: ${uploadErr.message || 'Unknown error'}`);
                    setStagedFile(fileToUpload);
                    setStagedPreviewUrl(URL.createObjectURL(croppedBlob));
                } finally {
                    setIsUploadingMedia(false);
                    setUploadProgress(null);
                }
            } else {
                if (stagedPreviewUrl) {
                    URL.revokeObjectURL(stagedPreviewUrl);
                }
                setStagedFile(fileToUpload);
                setStagedPreviewUrl(URL.createObjectURL(croppedBlob));
                toast.success("Image edited successfully");
                setShowImageEditor(false);
            }
        } catch (err: any) {
            toast.error(`Editing failed: ${err.message || 'Unknown error'}`);
            console.error("Image editing error:", err);
        } finally {
            setIsEditingImage(false);
        }
    };

    const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '🤩'];

    // Scroll to a message and blink-highlight it
    const scrollToMessage = (msgId: string) => {
        const el = document.querySelector(`[data-msg-id="${msgId}"]`) as HTMLElement | null;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMsgId(msgId);
        // Remove the highlight after animation completes
        setTimeout(() => setHighlightedMsgId(null), 1500);
    };

    const getStickerAnimation = (url: string) => {
        return '';
    };

    const handleDownloadWebpChat = async (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const parts = url.split('/');
            const emojiId = parts[parts.length - 2] || 'sticker';
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `sticker_${emojiId}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            toast.success("Downloaded sticker to your device!");
        } catch (error) {
            console.error("Failed to download sticker file", error);
            window.open(url, '_blank');
        }
    };

    const [showGame, setShowGame] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [showStickers, setShowStickers] = useState(false);

    // Profile View State
    const [showProfile, setShowProfile] = useState(false);
    const [fullProfile, setFullProfile] = useState<any>(null);

    // AI Wingman State
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    
    // Safety & Date Mode
    const [showDateModal, setShowDateModal] = useState(false);
    const [dateForm, setDateForm] = useState({ location: '', date: '' });
    const [dateLoading, setDateLoading] = useState(false);

    const [showHeaderMenu, setShowHeaderMenu] = useState(false);

    const handleClearChat = async () => {
        if (!confirm("Are you sure you want to clear this chat history? This cannot be undone.")) return;
        try {
            await api.chat.clearHistory(partner.id);
            setMessages([]);
            toast.success("Chat history cleared");
        } catch (e) {
            toast.error("Failed to clear chat history");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                
                setIsUploadingMedia(true);
                setUploadProgress(0);
                try {
                    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
                    const res = await api.chat.uploadMedia(audioFile, (percent) => setUploadProgress(percent));
                    if (res.url) handleSend(undefined, `[AUDIO]${res.url}`);
                } catch (e: any) {
                    toast.error(`Audio upload failed: ${e.message || 'Unknown error'}`);
                } finally {
                    setIsUploadingMedia(false);
                    setUploadProgress(null);
                }
                
                setIsRecording(false);
                setRecordingTime(0);
                clearInterval(recordingTimerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 59) {
                        stopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (e) {
            console.error("Microphone access denied", e);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (stagedPreviewUrl) {
            URL.revokeObjectURL(stagedPreviewUrl);
        }
        
        setStagedFile(file);
        setStagedPreviewUrl(URL.createObjectURL(file));
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleViewAnyProfile = async (targetUserId: string, fallbackName?: string, fallbackPhoto?: string) => {
        if (!targetUserId || targetUserId === 'me' || targetUserId === user?.id || targetUserId === user?.userId) {
            return; // Can't view own profile modal from here
        }
        
        // Optimistic UI: open modal instantly with basic profile details
        const isPartner = targetUserId === partner.id || targetUserId === partnerInfo.id;
        const optimisticProfile = isPartner
            ? partnerInfo
            : {
                id: targetUserId,
                name: fallbackName || 'User',
                photoUrl: fallbackPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName || 'User')}`,
                bio: 'Loading full details...'
            };

        setFullProfile(optimisticProfile);
        setShowProfile(true);

        try {
            const data = await api.profile.getById(targetUserId);
            // Confirm we are still displaying the same profile
            setFullProfile(data);
        } catch (e) {
            console.error("Failed to fetch profile", e);
            // If API failed and we had no real details, close it or keep the optimistic model
            if (!isPartner && !fallbackName) {
                setShowProfile(false);
                toast.error("Failed to load user profile");
            }
        }
    };

    const handleViewProfile = async () => {
        await handleViewAnyProfile(partner.id);
    };

    const handleIcebreaker = async () => {
        setLoadingAi(true);
        try {
            const res = await api.ai.getIcebreaker(partner.id);
            if (res.suggestions) {
                setAiSuggestions(res.suggestions);
            }
        } catch (e) {
            console.error("AI Error", e);
        } finally {
            setLoadingAi(false);
        }
    };

    const handleToggleMute = async () => {
        if (isMuting) return;
        setIsMuting(true);
        try {
            const res = await api.profile.toggleMute(partner.id);
            if (res.isMuted !== undefined) {
                setIsMuted(res.isMuted);
                
                // Update local auth context silently to persist state across dashboard views
                if (user) {
                    let newMuted = [...(user.muted_users || [])];
                    if (res.isMuted) newMuted.push(partner.id);
                    else newMuted = newMuted.filter((id) => id !== partner.id);
                    login(user.token, { ...user, muted_users: newMuted });
                }

                toast.success(res.isMuted ? "Notifications muted" : "Notifications unmuted");
            }
        } catch (err) {
            toast.error("Failed to update mute settings");
        } finally {
            setIsMuting(false);
        }
    };

    const handleDeleteMessage = async (msgId: string, mode: 'me' | 'everyone') => {
        try {
            await api.chat.deleteMessage(msgId, mode);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (e) {
            toast.error("Failed to delete message");
        }
        setDeleteMenuMsgId(null);
    };

    // Sync chat history to localStorage cache in real-time
    useEffect(() => {
        if (typeof window !== 'undefined' && partner.id) {
            try {
                localStorage.setItem(`chat_history_${partner.id}`, JSON.stringify(messages));
            } catch (e) {
                console.error("Failed to write chat history to cache", e);
            }
        }
    }, [messages, partner.id]);

    useEffect(() => {
        // Optimistic SWR: Immediately load cached chat history to paint the conversation instantly
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(`chat_history_${partner.id}`);
                if (cached) {
                    setMessages(JSON.parse(cached));
                } else {
                    setMessages([]);
                }
            } catch (e) {
                setMessages([]);
            }
        } else {
            setMessages([]);
        }

        const loadHistory = async () => {
            try {
                // Backend expects User ID (partner.id), not Interaction ID
                const history = await api.chat.getHistory(partner.id);
                if (Array.isArray(history)) {
                    setMessages(history);
                }
                // Mark messages as read
                await api.chat.markRead(partner.id);
                if (onMessagesRead) onMessagesRead();
            } catch (e: any) {
                console.error("Chat history fetch error:", e);
                // Keep the cached messages if offline/network error, don't wipe them!
            }
        };

        const loadProfileHeader = async () => {
            // Optimization: Skip backend round-trip if name & photo are already passed in props
            if (partner.name && partner.photoUrl && !partner.photoUrl.includes('initials/svg')) {
                return;
            }
            try {
                const data = await api.profile.getById(partner.id);
                if (data) {
                    setPartnerInfo(prev => ({
                        ...prev,
                        name: data.name || data.full_name || prev.name,
                        photoUrl: data.photoUrl || data.avatar_url || prev.photoUrl
                    }));
                }
            } catch (err) {
                console.error("Failed to load header profile details", err);
            }
        };

        loadHistory();
        loadProfileHeader();
    }, [partner.id]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (newMsg: any) => {
            // Ignore my own messages from socket (handled optimistically)
            if (newMsg.senderId === 'me' || newMsg.senderId === user?.id) {
                return;
            }

            if (newMsg.senderId === partner.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    // Resolve replyToId -> replyTo object so the receiver sees the reply preview
                    let enrichedMsg = { ...newMsg };
                    if (newMsg.replyToId && !newMsg.replyTo) {
                        // Prefer the replyToPreview sent directly from the backend (works even if message not yet in local state)
                        if (newMsg.replyToPreview) {
                            const myId = user?.id || user?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
                            enrichedMsg.replyTo = {
                                id: newMsg.replyToPreview.id,
                                text: newMsg.replyToPreview.text,
                                senderName: newMsg.replyToPreview.senderId === partner.id ? partnerInfo.name : 'You'
                            };
                        } else {
                            // Fallback: search local messages
                            const original = prev.find(m => m.id === newMsg.replyToId);
                            if (original) {
                                enrichedMsg.replyTo = {
                                    id: original.id,
                                    text: original.text,
                                    senderName: original.senderId === partner.id ? partnerInfo.name : 'You'
                                };
                            }
                        }
                    }
                    return [...prev, enrichedMsg];
                });
                setIsTyping(false);

                // Immediately emit delivered receipt now that we received the message
                socket.emit("messageDelivered", {
                    messageId: newMsg.id,
                    senderId: partner.id
                });

                // If chat is open and visible on screen, automatically mark as read
                if (document.visibilityState === 'visible') {
                    api.chat.markRead(partner.id).catch(err => console.error("Auto-read failed", err));
                    if (onMessagesRead) onMessagesRead();
                }
            }
        };

        const handleTyping = (data: any) => {
            if (data.from === partner.id) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
        };

        const handleStatus = (data: any) => {
            // Can be for a single messageId, or a readerMode event for ALL messages
            setMessages(prev => prev.map(msg => {
                if (data.readerMode === partner.id || msg.id === data.messageId) {
                    return { ...msg, status: data.status };
                }
                return msg;
            }));
        };

        const handleLiked = (data: any) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === data.messageId) {
                    return { ...msg, is_liked: data.isLiked };
                }
                return msg;
            }));
        };

        const handleReaction = (data: any) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
            ));
        };

        const handleDeleted = (data: any) => {
            setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("typing", handleTyping);
        socket.on("updateMessageStatus", handleStatus);
        socket.on("messageLiked", handleLiked);
        socket.on("messageReaction", handleReaction);
        socket.on("messageDeleted", handleDeleted);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("typing", handleTyping);
            socket.off("updateMessageStatus", handleStatus);
            socket.off("messageLiked", handleLiked);
            socket.off("messageReaction", handleReaction);
            socket.off("messageDeleted", handleDeleted);
        };
    }, [socket, partner.id, user]);

    const prevMsgCountRef = useRef(0);
    const isUserScrollingRef = useRef(false);

    // Track manual scroll
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            isUserScrollingRef.current = scrollHeight - scrollTop - clientHeight > 150;
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    // Smart auto-scroll to bottom
    useEffect(() => {
        if (!scrollRef.current) return;
        const isInitialLoad = prevMsgCountRef.current === 0 && messages.length > 0;
        const lastMsg = messages[messages.length - 1];
        const isMyLatest = lastMsg?.senderId === 'me' || lastMsg?.senderId === user?.id;
        // Scroll if: first load, I sent a message, or user is already near the bottom
        if (isInitialLoad || isMyLatest || !isUserScrollingRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: isInitialLoad ? 'instant' : 'smooth'
            });
        }
        prevMsgCountRef.current = messages.length;
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent, forcedText?: string) => {
        if (e) e.preventDefault();

        // High-resiliency Staged Attachment Upload & Dispatch
        if (stagedFile && !forcedText) {
            const fileToUpload = stagedFile;
            const previewToClear = stagedPreviewUrl;
            
            // Instantly clear staging states for snappy visual feedback
            setStagedFile(null);
            setStagedPreviewUrl(null);
            if (previewToClear) {
                URL.revokeObjectURL(previewToClear);
            }

            setIsUploadingMedia(true);
            setUploadProgress(0);
            try {
                const res = await api.chat.uploadMedia(fileToUpload, (percent) => setUploadProgress(percent));
                if (res.url) {
                    // Send the uploaded image attachment message
                    await handleSend(undefined, `[IMAGE]${res.url}`);
                    
                    // If the user had written text, dispatch it sequentially as a caption!
                    if (inputText.trim()) {
                        await handleSend(undefined, inputText);
                    }
                }
            } catch (err: any) {
                toast.error(`Image upload failed: ${err.message || 'Unknown error'}`);
                // High-resiliency error recovery: restore staged states
                setStagedFile(fileToUpload);
                setStagedPreviewUrl(previewToClear);
            } finally {
                setIsUploadingMedia(false);
                setUploadProgress(null);
            }
            return;
        }

        const textToSend = forcedText || inputText;
        if (!textToSend.trim()) return;

        if (!forcedText) setInputText("");

        const currentReply = replyTo;
        setReplyTo(null);

        const tempMsg = {
            id: 'temp-' + Date.now(),
            text: textToSend,
            senderId: 'me',
            timestamp: new Date(),
            status: 'sending',
            replyTo: currentReply || undefined
        };
        setMessages(prev => [...prev, tempMsg]);
        // Force scroll to bottom on send
        isUserScrollingRef.current = false;

        try {
            const response = await api.chat.sendMessage(partner.id, textToSend, currentReply?.id);
            if (response && response.message) {
                setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...response.message, replyTo: currentReply || undefined } : m));
            }
            if (onMessageSent) onMessageSent();
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    // Auto-close emoji picker after 3 seconds of inactivity
    useEffect(() => {
        if (emojiPickerMsgId) {
            const timer = setTimeout(() => {
                setEmojiPickerMsgId(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [emojiPickerMsgId]);

    const handleReact = async (msgId: string, emoji: string) => {
        setEmojiPickerMsgId(null);
        // Fallback checks for legacy authentication states
        const uid = user?.id || user?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
        if (!uid) {
            console.error("No user ID found for reaction");
            return;
        }
        // Optimistic update
        setMessages(prev => prev.map(m => {
            if (m.id !== msgId) return m;
            const reactions: Record<string, string> = { ...(m.reactions || {}) };
            if (reactions[uid] === emoji) {
                delete reactions[uid];
            } else {
                reactions[uid] = emoji;
            }
            return { ...m, reactions };
        }));
        try {
            const result = await api.chat.reactToMessage(msgId, emoji);
            if (result?.reactions) {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: result.reactions } : m));
            }
        } catch (err) {
            console.error('React failed', err);
        }
    };

    const handleProposeDate = async () => {
        if (!dateForm.location || !dateForm.date) {
            return toast.error("Please provide both location and date time");
        }
        setDateLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/propose`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiver_id: partner.id,
                    location_name: dateForm.location,
                    date_time: dateForm.date
                })
            }).then(r => r.json());
            
            if (res.success) {
                toast.success("Date proposed safely!");
                setShowDateModal(false);
                setDateForm({ location: '', date: '' });
            } else {
                toast.error(res.error || "Failed to propose date");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setDateLoading(false);
        }
    };

    const verifySafetyContact = async () => {
        try {
            const me = await api.profile.getMe();
            const md = typeof me.metadata === 'string' ? JSON.parse(me.metadata) : (me.metadata || {});
            if (!md?.emergency_contact?.email || !md?.emergency_contact?.phone) {
                toast.error("Safety First! Please add an Emergency Contact (Email & Phone) in your Profile Settings before you can schedule or accept dates.");
                return false;
            }
            return true;
        } catch (e) {
            toast.error("Failed to verify safety settings");
            return false;
        }
    };

    const handleRespondDate = async (dateId: string, status: string) => {
        if (status === 'accepted') {
            const isSafe = await verifySafetyContact();
            if (!isSafe) return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/${dateId}/respond`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            }).then(r => r.json());
            
            if (res.success) {
                toast.success(`Date ${status}!`);
            } else {
                toast.error(res.error || "Failed to respond");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleCancelProposal = async (dateId: string) => {
        if (!confirm("Are you sure you want to cancel this date proposal?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/dates/${dateId}/cancel`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }).then(r => r.json());
            
            if (res.success) {
                toast.success("Proposal cancelled!");
            } else {
                toast.error(res.error || "Failed to cancel proposal");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    // Block Partner
    const handleBlock = async () => {
        if (!confirm("Block this user? You will not see their messages again.")) return;
        try {
            await api.interactions.reportUser(partner.id, "BLOCK", "Blocked from Chat");
            toast.success("User blocked");
            onClose?.();
        } catch (e) {
            toast.error("Failed to block user");
        }
    };

    // Keep likeMessage for Android native backward compat
    const handleLikeMessage = async (msgId: string) => {
        handleReact(msgId, '❤️');
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (socket) {
            const now = Date.now();
            if (now - lastEmitTypingRef.current > 2000) {
                socket.emit("typing", { to: partner.id, from: "me" });
                lastEmitTypingRef.current = now;
            }
        }
    };

    return (
        <div className={className || "fixed inset-0 w-full h-[100dvh] md:inset-auto md:h-[600px] md:w-[400px] md:bottom-4 md:right-4 bg-white dark:bg-gray-900 md:rounded-3xl rounded-none shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden z-[2000] animate-in fade-in zoom-in-95 duration-200"}>
            <style>{`
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg) scale(1.05); }
                    75% { transform: rotate(5deg) scale(1.05); }
                }
                .animate-wiggle:hover {
                    animation: wiggle 0.45s ease-in-out infinite;
                }
            `}</style>
            {/* Premium Header */}
            {!isCallMode && (
                <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex justify-between items-center relative">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10 cursor-pointer hover:opacity-90 transition-opacity min-w-0 flex-1 mr-2" onClick={handleViewProfile}>
                        <div className="flex items-center gap-3 w-full">
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-500">
                                    <img src={partnerInfo.photoUrl} className="w-full h-full rounded-full border-2 border-white object-cover" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`;
                                    }} />
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg ${onlineUsers?.includes(partner.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-lg leading-tight truncate pr-1">{partnerInfo.name}</h3>
                                <p className="text-xs text-white/70 flex items-center gap-1">
                                    {onlineUsers?.includes(partner.id) ? (
                                        <>
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
                                            <span className="truncate">Online now</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                                            <span className="truncate">Offline</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1 relative z-10 flex-shrink-0 items-center">
                        <VideoCallButton
                            targetUserId={partner.id}
                            targetUserName={partnerInfo.name}
                            targetUserPhoto={partnerInfo.photoUrl}
                            showLabel={false}
                            className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        />
                        <VideoCallButton
                            targetUserId={partner.id}
                            targetUserName={partnerInfo.name}
                            targetUserPhoto={partnerInfo.photoUrl}
                            showLabel={false}
                            mode="audio"
                            className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        />
                        
                        <div className="relative">
                            <button
                                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                                className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {showHeaderMenu && (
                                <div className="absolute right-0 top-12 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[3000] animate-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={async () => { 
                                            setShowHeaderMenu(false); 
                                            if (await verifySafetyContact()) {
                                                setShowDateModal(true); 
                                            }
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-3 transition-colors"
                                    >
                                        <CalendarClock size={16} className="text-indigo-500" />
                                        Schedule Date
                                    </button>
                                    <button
                                        onClick={() => { setShowGiftModal(true); setShowHeaderMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/30 flex items-center gap-3 transition-colors"
                                    >
                                        <Gift size={16} className="text-pink-500" />
                                        Send Gift
                                    </button>
                                    <button
                                        onClick={() => { handleClearChat(); setShowHeaderMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Clear Chat
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={onClose} className="p-2 sm:p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* In Call Mode Header (Minimal) */}
            {isCallMode && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-gray-700 dark:text-white">Chat</span>
                </div>
            )}

            {/* Messages - Premium Design */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gradient-to-b from-slate-50 to-gray-50 dark:from-gray-950 dark:to-gray-900 space-y-3" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Say hello to {partnerInfo.name}!</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start a conversation</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    // Safe sender determination: Since it's a 1-on-1 chat, if they aren't the partner, they are me.
                    // This completely avoids mobile Capacitor / Safari localStorage sync bugs.
                    const isMe = msg.senderId !== partner.id;

                    const msgDate = msg.timestamp ? new Date(msg.timestamp) : new Date();

                    // Grouping Logic: Check if this message is on a different day than the previous one
                    let showDateHeader = false;
                    let dateHeaderText = "";
                    if (idx === 0) {
                        showDateHeader = true;
                    } else if (messages[idx - 1].timestamp) {
                        const prevDate = new Date(messages[idx - 1].timestamp);
                        if (prevDate.toDateString() !== msgDate.toDateString()) {
                            showDateHeader = true;
                        }
                    }

                    if (showDateHeader) {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (msgDate.toDateString() === today.toDateString()) {
                            dateHeaderText = "Today";
                        } else if (msgDate.toDateString() === yesterday.toDateString()) {
                            dateHeaderText = "Yesterday";
                        } else {
                            dateHeaderText = msgDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                        }
                    }

                    return (
                        <div key={idx} className="flex flex-col">
                            {showDateHeader && (
                                <div className="flex justify-center my-4">
                                    <span className="text-xs font-semibold bg-gray-200/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                        {dateHeaderText}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 mb-1 group/row items-end gap-1`}>
                                {!isMe && (
                                    <img src={partnerInfo.photoUrl} className="w-8 h-8 rounded-full mr-1 self-end mb-1 shadow-sm flex-shrink-0" alt="" onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`;
                                    }} />
                                )}

                                {/* For "my" messages: action buttons go LEFT of bubble */}
                                {isMe && msg.id && !msg.id.toString().startsWith('temp-') && (
                                    <div className={`hidden sm:flex items-center gap-0.5 mb-1 transition-opacity duration-150 ${activeMsgId === msg.id ? 'opacity-100' : 'opacity-0 md:group-hover/row:opacity-100'}`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReplyTo({ id: msg.id, text: msg.text, senderName: 'You' }); inputRef.current?.focus(); }}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                            title="Reply"
                                        >
                                            <Reply size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-sm"
                                            title="React"
                                        >😊</button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteMenuMsgId(deleteMenuMsgId === msg.id ? null : msg.id); }}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}

                                <div className={`flex flex-col relative max-w-[75%] ${isMe ? 'items-end' : 'items-start'} ${activeMsgId === msg.id || emojiPickerMsgId === msg.id ? 'z-30' : 'z-0'}`}>
                                    {/* Emoji picker popup */}
                                    {emojiPickerMsgId === msg.id && (
                                        <div
                                            className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-12 z-50 flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-2 py-1.5 shadow-xl animate-in zoom-in-95 duration-150`}
                                        >
                                            {QUICK_EMOJIS.map(e => (
                                                <button
                                                    key={e}
                                                    onClick={() => handleReact(msg.id, e)}
                                                    className={`text-lg hover:scale-125 transition-transform p-0.5 rounded-lg ${
                                                        (msg.reactions || {})[user?.id || user?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') || ''] === e
                                                            ? 'bg-indigo-100 dark:bg-indigo-900'
                                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    title={e}
                                                >{e}</button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message bubble */}
                                    <div
                                        data-msg-id={msg.id}
                                        onClick={() => msg.id && setActiveMsgId(activeMsgId === msg.id ? null : msg.id)}
                                        onDoubleClick={() => msg.id && !msg.id.toString().startsWith('temp-') && setEmojiPickerMsgId(msg.id)}
                                        className={`relative w-fit px-4 py-3 text-sm shadow-sm transition-all cursor-pointer select-none ${highlightedMsgId === msg.id ? 'ring-2 ring-amber-400 ring-offset-1 msg-highlight-blink' : ''} ${msg.text.startsWith('[STICKER]')
                                        ? 'bg-transparent shadow-none p-0 max-w-[50%]'
                                        : (isMe ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md whitespace-pre-wrap break-words' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-md whitespace-pre-wrap break-words')
                                        }`}>
                                        {/* Reply preview inside bubble — polished UI, clickable to scroll to original */}
                                        {(() => {
                                            const replyMsg = msg.replyTo || (msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null);
                                            if (!replyMsg) return null;
                                            const targetId = replyMsg.id || msg.replyToId;
                                            const rName = replyMsg.senderName || (replyMsg.senderId === 'me' || replyMsg.senderId === user?.id ? 'You' : partnerInfo.name);
                                            const rText = replyMsg.text?.startsWith('[IMAGE]') 
                                                ? '📷 Photo' 
                                                : replyMsg.text?.startsWith('[AUDIO]') 
                                                ? '🎤 Voice message' 
                                                : replyMsg.text?.startsWith('[STICKER]') 
                                                ? '🎭 Sticker' 
                                                : replyMsg.text?.startsWith('[STORY_REPLY:') 
                                                ? (() => {
                                                    const match = replyMsg.text.match(/^\[STORY_REPLY:([\s\S]+?):(video|image)(?::([\s\S]*?))?(?::([a-zA-Z0-9_-]+):([\s\S]*?):([\s\S]*?))?\]([\s\S]*)$/);
                                                    return match ? `📸 Story Reply: ${match[7]}` : '📸 Story Reply';
                                                  })()
                                                : replyMsg.text;
                                            return (
                                                <div
                                                    className={`mb-2 rounded-xl overflow-hidden border-l-[3px] cursor-pointer hover:opacity-80 active:scale-95 transition-all ${
                                                        isMe
                                                            ? 'bg-white/15 border-white/80'
                                                            : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500'
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (targetId) scrollToMessage(targetId);
                                                    }}
                                                    title="Jump to original message"
                                                >
                                                    <div className="px-2.5 py-1.5">
                                                        <p className={`text-[11px] font-semibold mb-0.5 ${
                                                            isMe ? 'text-white/90' : 'text-indigo-600 dark:text-indigo-400'
                                                        }`}>{rName}</p>
                                                        <p className={`text-[11px] truncate max-w-[200px] ${
                                                            isMe ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                                        }`}>{rText}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {msg.text.startsWith('[STICKER]') ? (
                                            <div className="relative group inline-block transition-all duration-300">
                                                <img 
                                                    src={msg.text.replace('[STICKER]', '')} 
                                                    className="w-32 h-32 object-contain drop-shadow-lg select-none transition-all duration-300 transform animate-wiggle cursor-pointer" 
                                                    alt="sticker" 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDownloadWebpChat(msg.text.replace('[STICKER]', ''), e)}
                                                    className="absolute -top-1 -right-1 p-2 bg-slate-950/80 border border-white/10 hover:bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md flex items-center justify-center cursor-pointer z-10 backdrop-blur-md"
                                                    title="Download Sticker"
                                                >
                                                    <Download size={12} />
                                                </button>
                                            </div>
                                        ) : msg.text.startsWith('[IMAGE]') ? (
                                            <img src={msg.text.replace('[IMAGE]', '')} className="max-w-[200px] sm:max-w-[250px] max-h-[300px] rounded-xl object-cover cursor-pointer hover:opacity-90 mt-1" alt="attachment" onClick={() => setFullscreenMedia({ url: msg.text.replace('[IMAGE]', ''), type: 'image' })} />
                                        ) : msg.text.startsWith('[AUDIO]') ? (
                                            <audio src={msg.text.replace('[AUDIO]', '')} controls className="max-w-[220px] h-[40px] mt-1" />
                                        ) : msg.text.startsWith('[STORY_REPLY:') ? (() => {
                                            const match = msg.text.match(/^\[STORY_REPLY:([\s\S]+?):(video|image)(?::([\s\S]*?))?(?::([a-zA-Z0-9_-]+):([\s\S]*?):([\s\S]*?))?\]([\s\S]*)$/);
                                            if (match) {
                                                const [, storyUrl, storyType, textsMetadata, cId, cNameEncoded, cPhotoEncoded, replyText] = match;
                                                const isVideo = storyType === 'video';
                                                
                                                // Extract story_texts (bracket parameter or url query parameter fallback)
                                                let storyTexts: any[] = [];
                                                if (textsMetadata) {
                                                    try {
                                                        storyTexts = JSON.parse(decodeURIComponent(textsMetadata));
                                                    } catch (e) {
                                                        console.error("Failed to parse story texts from bracket metadata", e);
                                                    }
                                                } else if (storyUrl.includes('story_texts=')) {
                                                    try {
                                                        const parts = storyUrl.split('story_texts=');
                                                        const textsStr = parts[1].split('&')[0];
                                                        storyTexts = JSON.parse(decodeURIComponent(textsStr));
                                                    } catch (err) {}
                                                }

                                                // Determine creator:
                                                // 1. If we have the encoded creator metadata, use it directly!
                                                // 2. Otherwise fall back to the dynamic evaluation.
                                                let creator: { id: string; name: string; photoUrl: string };
                                                if (cId && cNameEncoded && cPhotoEncoded) {
                                                    const nameDecoded = decodeURIComponent(cNameEncoded);
                                                    const photoDecoded = decodeURIComponent(cPhotoEncoded);
                                                    // Map 'You' to their actual full name if they are the current user
                                                    const myId = user?.id || user?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
                                                    const isMeCreator = cId === 'me' || (!!myId && cId === myId);
                                                    creator = {
                                                        id: isMeCreator ? (myId || 'me') : cId,
                                                        name: isMeCreator 
                                                            ? (user?.name || user?.full_name || nameDecoded) 
                                                            : (cId === partner.id || cId === partnerInfo.id
                                                                ? (partnerInfo.name || (partnerInfo as any).full_name || nameDecoded)
                                                                : nameDecoded),
                                                        photoUrl: photoDecoded || (isMeCreator 
                                                            ? (user?.photoUrl || user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'You')}`)
                                                            : (cId === partner.id || cId === partnerInfo.id
                                                                ? (partnerInfo.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`)
                                                                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameDecoded)}`))
                                                    };
                                                } else {
                                                    creator = isMe 
                                                        ? { 
                                                            id: partner.id, 
                                                            name: partnerInfo.name || (partnerInfo as any).full_name || 'User', 
                                                            photoUrl: partnerInfo.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}` 
                                                          }
                                                        : { 
                                                            id: user?.id || user?.userId || 'me', 
                                                            name: user?.name || user?.full_name || 'You', 
                                                            photoUrl: user?.photoUrl || user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'You')}` 
                                                          };
                                                }

                                                return (
                                                    <div className="flex flex-col gap-2 w-[180px] sm:w-[200px] mt-1 select-none">
                                                        {/* Instagram-style Tall Story Mini Card */}
                                                        <div 
                                                            className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-neutral-900 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                                            onClick={() => {
                                                                setFullscreenMedia({ 
                                                                    url: storyUrl, 
                                                                    type: isVideo ? 'video' : 'image', 
                                                                    texts: storyTexts,
                                                                    creator: creator
                                                                });
                                                            }}
                                                            title="Click to view fullscreen"
                                                        >
                                                            {/* Story Media */}
                                                            {isVideo ? (
                                                                <video src={storyUrl} className="w-full h-full object-cover" muted playsInline />
                                                            ) : (
                                                                <img src={storyUrl} className="w-full h-full object-cover" alt="story" />
                                                            )}
                                                            
                                                            {/* Translucent overlay on hover */}
                                                            <div className="absolute inset-0 bg-black/15 z-0 group-hover:bg-black/25 transition-colors"></div>

                                                            {/* Instagram Story Top Header Overlay */}
                                                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                                                                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-sm max-w-[90%]">
                                                                    <img 
                                                                        src={creator.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creator.name)}`} 
                                                                        className="w-3.5 h-3.5 rounded-full object-cover border border-white/20 shrink-0" 
                                                                        alt=""
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creator.name)}`;
                                                                        }}
                                                                    />
                                                                    <span className="text-[8px] font-bold text-white truncate drop-shadow-md">
                                                                        {creator.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] drop-shadow-md z-10 leading-none">
                                                                    {isVideo ? '▶️' : '📸'}
                                                                </span>
                                                            </div>

                                                            {/* Miniature dynamic text overlays scaled perfectly to 48% */}
                                                            {storyTexts && storyTexts.length > 0 && storyTexts.map((t: any, i: number) => (
                                                                <div 
                                                                    key={i} 
                                                                    className="absolute top-1/2 left-1/2 pointer-events-none z-10" 
                                                                    style={{ transform: `translate(-50%, -50%) translate(${t.x * 0.4}px, ${t.y * 0.4}px) scale(0.48)` }}
                                                                >
                                                                    <div 
                                                                        style={{ 
                                                                            color: t.bgStyle === 'highlight' ? (t.color === 'white' ? 'black' : 'white') : t.color,
                                                                            backgroundColor: t.bgStyle === 'highlight' ? t.color : 'transparent',
                                                                            textShadow: t.bgStyle === 'neon' ? `0 0 10px ${t.color}, 0 0 20px ${t.color}` : (t.bgStyle === 'plain' ? '0px 1px 10px rgba(0,0,0,0.8)' : 'none'),
                                                                            fontSize: '0.9rem',
                                                                            fontFamily: t.fontFamily,
                                                                            fontWeight: 'bold',
                                                                            whiteSpace: 'pre-wrap',
                                                                            padding: t.bgStyle === 'highlight' ? '4px 8px' : '0',
                                                                            borderRadius: t.bgStyle === 'highlight' ? '6px' : '0',
                                                                            textAlign: 'center',
                                                                            lineHeight: '1.2'
                                                                        }}
                                                                    >
                                                                        {t.text}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Reply Message Text underneath Story Card */}
                                                        <p className="text-sm leading-relaxed break-words px-1 font-medium text-inherit">{replyText}</p>
                                                    </div>
                                                );
                                            }
                                            return msg.text;
                                        })() : msg.text.startsWith('[DATE_INVITE:') ? (() => {
                                            const dateId = msg.text.replace('[DATE_INVITE:', '').replace(']', '');
                                            return (
                                                <div className="bg-white/10 dark:bg-black/20 p-4 rounded-xl border border-white/20 dark:border-gray-700 min-w-[200px] flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-500 rounded-full flex items-center justify-center mb-2">
                                                        <CalendarClock size={24} />
                                                    </div>
                                                    <p className="font-bold mb-1">Date Invitation</p>
                                                    <p className="text-xs opacity-80 text-center mb-3">Let's meet up!</p>
                                                    {isMe ? (
                                                        <button 
                                                            onClick={() => handleCancelProposal(dateId)} 
                                                            className="w-full py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors"
                                                        >
                                                            Cancel Proposal
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-2 w-full">
                                                            <button onClick={() => handleRespondDate(dateId, 'declined')} className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">Decline</button>
                                                            <button onClick={() => handleRespondDate(dateId, 'accepted')} className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">Accept</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })() : msg.text.startsWith('[DATE_RESPONSE:') ? (() => {
                                            const parts = msg.text.replace('[DATE_RESPONSE:', '').replace(']', '').split(':');
                                            const status = parts[1];
                                            const accepted = status === 'accepted';
                                            const cancelled = status === 'cancelled';
                                            return (
                                                <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                                                    accepted 
                                                        ? 'bg-green-50/10 border-green-200/50 text-green-700 dark:text-green-300' 
                                                        : cancelled
                                                        ? 'bg-gray-500/10 border-gray-300/40 text-gray-500 dark:text-gray-400'
                                                        : 'bg-red-50/10 border-red-200/50 text-red-700 dark:text-red-300'
                                                }`}>
                                                    <div className={`p-2 rounded-full ${
                                                        accepted 
                                                            ? 'bg-green-500' 
                                                            : cancelled
                                                            ? 'bg-gray-400 dark:bg-gray-600'
                                                            : 'bg-red-500'
                                                    } text-white`}>
                                                        {accepted ? <Check size={16} /> : <X size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">
                                                            {cancelled ? 'Meetup Cancelled' : `Date ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                                                        </p>
                                                        {accepted && <p className="text-xs opacity-80">Safety features are now active for this date.</p>}
                                                        {cancelled && <p className="text-xs opacity-80">This meetup has been cancelled.</p>}
                                                    </div>
                                                </div>
                                            );
                                        })() : (() => {
                                            const ytId = getYoutubeId(msg.text);
                                            if (ytId) {
                                                return (
                                                    <div className="flex flex-col gap-2">
                                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                                        <YoutubeEmbedCard videoId={ytId} onFullscreen={setFullscreenYoutubeId} />
                                                    </div>
                                                );
                                            }
                                            return msg.text;
                                        })()}
                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${msg.text.startsWith('[STICKER]') ? 'text-gray-500 font-medium drop-shadow-sm' : (isMe ? 'text-white/80' : 'text-gray-400')}`}>
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {isMe && (
                                                <div className="flex items-center justify-center">
                                                    {msg.status === 'sending' && <Check size={12} className="opacity-50" />}
                                                    {msg.status === 'sent' && <Check size={12} />}
                                                    {msg.status === 'delivered' && <CheckCheck size={12} />}
                                                    {msg.status === 'read' && <CheckCheck size={12} className={msg.text.startsWith('[STICKER]') ? 'text-blue-500' : 'text-blue-300'} />}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions strip */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                                        const reactionCounts: Record<string, string[]> = {};
                                        Object.entries(msg.reactions as Record<string, string>).forEach(([uid, emoji]) => {
                                            if (!reactionCounts[emoji]) reactionCounts[emoji] = [];
                                            const currentUserId = user?.id || user?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
                                            reactionCounts[emoji].push(uid === currentUserId ? 'You' : (uid === partner.id ? partner.name : uid.slice(0, 6)));
                                        });
                                        return (
                                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {Object.entries(reactionCounts).map(([emoji, users]) => (
                                                    <div key={emoji} className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleReact(msg.id, emoji)}
                                                            title={users.join(', ')}
                                                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105 ${
                                                                (msg.reactions as any)[user?.id || user?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : '') || ''] === emoji
                                                                    ? 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900 dark:border-indigo-700'
                                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                                                            }`}
                                                        >
                                                            <span>{emoji}</span>
                                                            {users.length > 1 && <span className="text-gray-600 dark:text-gray-300 font-medium">{users.length}</span>}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                    {/* Mobile-optimized Action Pill Bar */}
                                    {activeMsgId === msg.id && (
                                        <div className="flex sm:hidden items-center gap-2.5 mt-1 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full shadow-md animate-in slide-in-from-top-1 duration-150 z-10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setReplyTo({ id: msg.id, text: msg.text, senderName: isMe ? 'You' : partnerInfo.name }); inputRef.current?.focus(); setActiveMsgId(null); }}
                                                className="p-1 text-gray-500 hover:text-indigo-500 rounded-full transition-all cursor-pointer"
                                                title="Reply"
                                            >
                                                <Reply size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                                                className="p-1 text-gray-500 hover:text-amber-500 rounded-full transition-all text-xs cursor-pointer animate-pulse"
                                                title="React"
                                            >😊</button>
                                            {isMe && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteMenuMsgId(msg.id); setActiveMsgId(null); }}
                                                    className="p-1 text-gray-500 hover:text-red-500 rounded-full transition-all cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* For partner messages: action buttons go RIGHT of bubble */}
                                {!isMe && msg.id && !msg.id.toString().startsWith('temp-') && (
                                    <div className={`hidden sm:flex items-center gap-0.5 mb-1 transition-opacity duration-150 ${activeMsgId === msg.id ? 'opacity-100' : 'opacity-0 md:group-hover/row:opacity-100'}`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReplyTo({ id: msg.id, text: msg.text, senderName: partnerInfo.name }); inputRef.current?.focus(); }}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                            title="Reply"
                                        >
                                            <Reply size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-sm"
                                            title="React"
                                        >😊</button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteMenuMsgId(deleteMenuMsgId === msg.id ? null : msg.id); }}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex flex-col items-start mb-2">
                        <span className="text-[10px] text-gray-400 ml-11 mb-1">{partnerInfo.name} is typing...</span>
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <img src={partnerInfo.photoUrl} className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm" alt="" onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = () => { target.onerror = null; target.src = '/avatar-fallback.svg'; };
                                target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerInfo.name || 'User')}`;
                            }} />
                            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 rounded-bl-md shadow-sm">
                                <div className="flex gap-1.5 h-4 items-center">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Icebreaker Suggestions */}
            {aiSuggestions.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border-t border-indigo-100 dark:border-indigo-900 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-purple-500" />
                            AI Suggestions
                        </p>
                        <button onClick={() => setAiSuggestions([])} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {aiSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInputText(suggestion);
                                    setAiSuggestions([]);
                                }}
                                className="text-left text-sm bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all text-gray-700 dark:text-gray-200 shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Reply Preview Bar */}
            {replyTo && (
                <div className="flex items-center justify-between gap-2 w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border-t border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-bottom duration-200">
                    <div className="flex-1 min-w-0 border-l-4 border-indigo-500 pl-2">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{replyTo.senderName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {replyTo.text?.startsWith('[IMAGE]') 
                                ? '📷 Photo' 
                                : replyTo.text?.startsWith('[AUDIO]') 
                                ? '🎤 Voice' 
                                : replyTo.text?.startsWith('[STICKER]') 
                                ? '🎭 Sticker' 
                                : replyTo.text?.startsWith('[STORY_REPLY:') 
                                ? (() => {
                                    const match = replyTo.text.match(/^\[STORY_REPLY:([\s\S]+?):(video|image)(?::([\s\S]*?))?(?::([a-zA-Z0-9_-]+):([\s\S]*?):([\s\S]*?))?\]([\s\S]*)$/);
                                    return match ? `📸 Story Reply: ${match[7]}` : '📸 Story Reply';
                                  })()
                                : replyTo.text}
                        </p>
                    </div>
                    <button type="button" onClick={() => setReplyTo(null)} className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Staged Attachment Preview Bar */}
            {stagedPreviewUrl && stagedFile && (
                <div className="flex items-center justify-between gap-3 w-full px-4 py-3 bg-indigo-50/80 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Rounded Visual Thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/10 border border-black/10 shrink-0 shadow-inner">
                            <img src={stagedPreviewUrl} className="w-full h-full object-cover" alt="Selected attachment preview" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">Staged Attachment</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {stagedFile.name} • {Math.round(stagedFile.size / 1024)} KB
                            </p>
                        </div>
                    </div>
                    {/* Actions: Edit, Change & Cancel */}
                    <div className="flex items-center gap-2 shrink-0">
                        {stagedFile.type.startsWith('image/') && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setRotation(0);
                                    setZoom(1);
                                    setActiveFilter('none');
                                    setShowImageEditor(true);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg border border-indigo-600 transition-all shadow-sm cursor-pointer flex items-center gap-1"
                            >
                                <Sliders size={12} />
                                Edit
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 transition-all text-gray-600 dark:text-gray-300 shadow-sm cursor-pointer"
                        >
                            Change
                        </button>
                        <button 
                            type="button" 
                            onClick={() => {
                                setStagedFile(null);
                                if (stagedPreviewUrl) {
                                    URL.revokeObjectURL(stagedPreviewUrl);
                                    setStagedPreviewUrl(null);
                                }
                            }} 
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-500 rounded-full transition-all cursor-pointer"
                            title="Remove attachment"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
                <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Uploading attachment...
                    </div>
                    <div className="flex-1 max-w-[200px] h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        {uploadProgress}%
                    </span>
                </div>
            )}

            {/* Premium Message Input */}
            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleSend(e);
                }}
                className="p-2 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-1.5 sm:gap-2 items-center pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))] relative"
            >
                {showStickers && (
                    <StickerPicker
                        onClose={() => setShowStickers(false)}
                        onSelect={(url) => {
                            setShowStickers(false);
                            handleSend(undefined, `[STICKER]${url}`);
                        }}
                    />
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia || isRecording}
                    className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                    title="Send Photo"
                >
                    <Camera className="w-5 h-5 sm:w-5 sm:h-5" />
                </button>

                {isRecording ? (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 animate-pulse"
                        title="Stop Recording"
                    >
                        <Square className="w-4 h-4" fill="currentColor" />
                        <span className="text-[10px] sm:text-xs font-bold">{recordingTime}s</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={isUploadingMedia}
                        className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all disabled:opacity-50"
                        title="Record Audio"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    disabled={isUploadingMedia || isRecording}
                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 ${showStickers ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Send Sticker"
                >
                    <SmilePlus className="w-5 h-5" />
                </button>
                
                <button
                    type="button"
                    onClick={handleIcebreaker}
                    disabled={loadingAi || isRecording || isUploadingMedia}
                    className="hidden sm:block p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-2xl transition-all"
                >
                    <Sparkles size={18} className={loadingAi ? 'animate-spin' : ''} />
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={handleInput}
                    placeholder={replyTo ? `Reply to ${replyTo.senderName}...` : "Type..."}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full sm:rounded-2xl px-3 py-2 sm:px-5 sm:py-3 text-sm min-w-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all placeholder:text-gray-400 dark:placeholder-gray-500 dark:text-white"
                />

                <button
                    type="submit"
                    disabled={!inputText.trim() && !stagedFile}
                    className="p-2 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full sm:rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:hover:shadow-none transition-all flex-shrink-0 cursor-pointer"
                >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 relative -ml-0.5 sm:ml-0" />
                </button>
            </form>

            {showGame && (
                <GameModal
                    onClose={() => setShowGame(false)}
                    partnerName={partnerInfo.name}
                />
            )}
            <GiftModal isOpen={showGiftModal} onClose={() => setShowGiftModal(false)} toUserId={partner.id} toUserName={partnerInfo.name} />
            
            {/* Fullscreen Image/Video Overlay */}
            {fullscreenMedia && (
                <div className="fixed inset-0 z-[2010] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200" onClick={() => setFullscreenMedia(null)}>
                    {(() => {
                        const creator = fullscreenMedia.creator;
                        if (!creator) return null;
                        return (
                            <div 
                                className="absolute top-6 left-6 z-[2020] flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-95 transition-all bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFullscreenMedia(null);
                                    handleViewAnyProfile(creator.id, creator.name, creator.photoUrl);
                                }}
                            >
                                <img 
                                    src={creator.photoUrl} 
                                    className="w-8 h-8 rounded-full border border-white/20 object-cover" 
                                    alt={creator.name}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creator.name)}`;
                                    }}
                                />
                                <div className="flex flex-col text-left">
                                    <span className="font-bold text-xs leading-tight">{creator.name}</span>
                                    <span className="text-[9px] text-white/60">View Profile</span>
                                </div>
                            </div>
                        );
                    })()}

                    <button className="absolute top-6 right-6 sm:top-8 sm:right-8 z-[2020] p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all border border-white/30 cursor-pointer shadow-xl" onClick={(e) => { e.stopPropagation(); setFullscreenMedia(null); }}>
                        <X size={20} strokeWidth={3} />
                    </button>
                    <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {fullscreenMedia.type === 'video' ? (
                            <video src={fullscreenMedia.url} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" controls autoPlay loop />
                        ) : (
                            <img src={fullscreenMedia.url} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" alt="Fullscreen" />
                        )}

                        {/* Text Overlays rendered dynamically on top */}
                        {fullscreenMedia.texts && Array.isArray(fullscreenMedia.texts) && fullscreenMedia.texts.map((t: any, i: number) => (
                            <div key={i} className="absolute top-1/2 left-1/2 pointer-events-none" style={{ zIndex: 20, transform: `translate(${t.x}px, ${t.y}px)` }}>
                                <div 
                                    style={{ 
                                        transform: 'translate(-50%, -50%)',
                                        color: t.bgStyle === 'highlight' ? (t.color === 'white' ? 'black' : 'white') : t.color,
                                        backgroundColor: t.bgStyle === 'highlight' ? t.color : 'transparent',
                                        textShadow: t.bgStyle === 'neon' ? `0 0 10px ${t.color}, 0 0 20px ${t.color}, 0 0 30px ${t.color}` : (t.bgStyle === 'plain' ? '0px 2px 15px rgba(0,0,0,0.8)' : 'none'),
                                        fontSize: `clamp(${1.0 * t.scale}rem, ${4 * t.scale}vw, ${2.2 * t.scale}rem)`,
                                        fontFamily: t.fontFamily,
                                        fontWeight: 'bold',
                                        whiteSpace: 'pre-wrap',
                                        padding: t.bgStyle === 'highlight' ? '6px 12px' : '0',
                                        borderRadius: t.bgStyle === 'highlight' ? '8px' : '0',
                                        textAlign: 'center'
                                    }}
                                >
                                    {t.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fullscreen YouTube Modal Overlay */}
            {fullscreenYoutubeId && (
                <div 
                    className="fixed inset-0 z-[2010] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" 
                    onClick={() => setFullscreenYoutubeId(null)}
                >
                    <button 
                        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-[2020] p-2.5 bg-white/10 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all border border-white/20 cursor-pointer shadow-2xl flex items-center justify-center" 
                        onClick={(e) => { e.stopPropagation(); setFullscreenYoutubeId(null); }}
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                    <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10" onClick={(e) => e.stopPropagation()}>
                        <iframe
                            src={`https://www.youtube.com/embed/${fullscreenYoutubeId}?autoplay=1&rel=0`}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {/* Attachment Image Editor Modal */}
            {showImageEditor && stagedPreviewUrl && stagedFile && (
                <div className="fixed inset-0 z-[2015] bg-slate-950 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden animate-in fade-in duration-200">
                    <div className="w-full h-auto md:h-full flex flex-col md:flex-row relative">
                        
                        {/* Editor viewport (Left/Top) */}
                        <div className="relative w-full md:flex-1 h-[350px] sm:h-[400px] md:h-full bg-slate-950 shrink-0 md:shrink overflow-hidden">
                            {/* Applying active filter live to Cropper container style */}
                            <div className="absolute inset-0" style={{ filter: activeFilter !== 'none' ? activeFilter : 'none' }}>
                                {/* @ts-ignore */}
                                <Cropper
                                    image={stagedPreviewUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    style={{
                                        containerStyle: { background: '#090d16' },
                                    }}
                                />
                            </div>
                        </div>

                        {/* Editor Controls viewport (Right/Bottom) */}
                        <div className="w-full md:w-[360px] p-6 flex flex-col gap-6 justify-between bg-slate-900/90 md:bg-slate-900/50 backdrop-blur-lg md:backdrop-blur-none select-none text-white border-t md:border-t-0 md:border-l border-white/10 shrink-0 md:h-full md:overflow-y-auto">
                            <div className="flex flex-col gap-5">
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <h3 className="font-bold text-lg text-indigo-400">Edit Attachment</h3>
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Image</span>
                                </div>

                                {/* Rotational Control */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orientation</label>
                                    <button
                                        type="button"
                                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold text-sm cursor-pointer shadow-sm"
                                    >
                                        <RotateCw size={16} />
                                        Rotate 90° ({rotation}°)
                                    </button>
                                </div>

                                {/* Zoom Slider Control */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <span>Zoom</span>
                                        <span className="font-mono text-[10px] text-indigo-400">{zoom.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg appearance-none"
                                    />
                                </div>

                                {/* Color Filters shelf */}
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Color Filters</label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        {FILTER_PRESETS.map((f) => (
                                            <button
                                                key={f.name}
                                                type="button"
                                                onClick={() => setActiveFilter(f.value)}
                                                className={`flex flex-col items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                                                    activeFilter === f.value ? 'scale-105' : 'opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <div 
                                                    className="relative w-12 h-12 rounded-xl overflow-hidden border-2 shadow-md transition-all shrink-0 bg-neutral-800"
                                                    style={{ borderColor: activeFilter === f.value ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
                                                >
                                                    <img 
                                                        src={stagedPreviewUrl} 
                                                        className="w-full h-full object-cover" 
                                                        style={{ filter: f.value }} 
                                                        alt=""
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-semibold tracking-wide ${activeFilter === f.value ? 'text-indigo-400' : 'text-gray-400'}`}>
                                                    {f.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions View */}
                            <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleSaveEditedImage(true)}
                                    disabled={isEditingImage || !croppedAreaPixels}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-800/50 disabled:to-purple-800/50 text-white font-bold rounded-xl active:scale-[0.98] transition-all text-sm cursor-pointer shadow-md shadow-indigo-950 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isEditingImage ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            Save & Send
                                        </>
                                    )}
                                </button>
                                
                                <div className="flex gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowImageEditor(false)}
                                        disabled={isEditingImage}
                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 active:scale-95 transition-all text-sm cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSaveEditedImage(false)}
                                        disabled={isEditingImage || !croppedAreaPixels}
                                        className="flex-1 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold rounded-xl border border-indigo-500/25 active:scale-95 transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center animate-in duration-200"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Delete Message Modal */}
            {deleteMenuMsgId && (() => {
                const msgToDelete = messages.find(m => m.id === deleteMenuMsgId);
                if (!msgToDelete) return null;
                const isMyMsg = msgToDelete.senderId !== partner.id;
                
                return (
                    <div className="fixed inset-0 z-[2010] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeleteMenuMsgId(null)}>
                        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Delete Message</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">What would you like to do with this message?</p>
                            </div>
                            <div className="p-2 flex flex-col gap-1">
                                <button onClick={() => handleDeleteMessage(msgToDelete.id, 'me')} className="w-full text-center p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200 font-medium transition-all">
                                    Delete for me
                                </button>
                                {isMyMsg && (
                                    <button onClick={() => handleDeleteMessage(msgToDelete.id, 'everyone')} className="w-full text-center p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 font-bold transition-all">
                                        Delete for everyone
                                    </button>
                                )}
                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                                <button onClick={() => setDeleteMenuMsgId(null)} className="w-full text-center p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-500 font-medium transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showProfile && fullProfile && (
                <ProfileModal
                    profile={fullProfile}
                    onClose={() => setShowProfile(false)}
                    onConnect={() => { }}
                />
            )}

            {showDateModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4" onClick={() => setShowDateModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-rose-50 dark:bg-rose-950/20">
                            <h3 className="font-bold text-xl text-rose-900 dark:text-rose-100 flex items-center gap-2">
                                🛡️ Schedule a Safe Date
                            </h3>
                            <button onClick={() => setShowDateModal(false)} className="p-2 bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-700 rounded-full transition-all text-gray-500 hover:text-rose-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 space-y-3">
                                <p className="text-sm text-rose-800 dark:text-rose-200 font-medium">
                                    For your safety, all dates scheduled through the app activate the <strong>Women's Safety Kit</strong> automatically.
                                </p>
                                <details className="group cursor-pointer">
                                    <summary className="text-xs font-bold text-rose-600 dark:text-rose-400 select-none flex items-center gap-1">
                                        How it works
                                        <span className="transition group-open:rotate-180">▼</span>
                                    </summary>
                                    <ul className="mt-2 space-y-2 text-xs text-rose-700/80 dark:text-rose-300/80 list-disc pl-4">
                                        <li><strong>Date Mode:</strong> A safety overlay appears during your date, giving you one-tap access to a "Fake Call" to escape awkward situations.</li>
                                        <li><strong>Angel Check-in:</strong> 45 minutes into your date, we automatically send you a push notification asking if you're safe.</li>
                                        <li><strong>SOS Escalation:</strong> If you ignore the check-in for 15 minutes, we instantly email your exact GPS location to your Emergency Contact.</li>
                                    </ul>
                                </details>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Where are you meeting?</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Starbucks, MG Road (Public Place)"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                                    value={dateForm.location}
                                    onChange={(e) => setDateForm({ ...dateForm, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">When?</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-gray-100 focus:outline-none transition-all"
                                    value={dateForm.date}
                                    onChange={(e) => setDateForm({ ...dateForm, date: e.target.value })}
                                />
                            </div>
                            <button 
                                onClick={handleProposeDate}
                                disabled={dateLoading || !dateForm.location || !dateForm.date}
                                className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all mt-6 active:scale-[0.98]"
                            >
                                {dateLoading ? "Sending Invite..." : "Send Date Invitation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

