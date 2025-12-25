'use client';

import { useState } from 'react';
import { Video, Phone } from 'lucide-react';
import VideoCallModal from './VideoCallModal';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ui/Toast';
interface VideoCallButtonProps {
    targetUserId: string;
    targetUserName: string;
    targetUserPhoto?: string;
    className?: string;
    showLabel?: boolean;
    mode?: 'audio' | 'video';
}

export default function VideoCallButton({ targetUserId, targetUserName, targetUserPhoto, className, showLabel = true, mode = 'video' }: VideoCallButtonProps) {
    const [isCalling, setIsCalling] = useState(false);
    const { isConnected } = useSocket();
    const toast = useToast();

    const handleStartCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isConnected) {
            toast.error("You are offline. Cannot make calls.");
            return;
        }
        setIsCalling(true);
    };

    return (
        <>
            <button
                onClick={handleStartCall}
                className={className || "flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"}
                title={mode === 'video' ? 'Video Call' : 'Audio Call'}
            >
                {mode === 'video' ? <Video size={18} /> : <Phone size={18} />}
                {showLabel && <span>{mode === 'video' ? 'Video Call' : 'Audio Call'}</span>}
            </button>

            {isCalling && (
                <VideoCallModal
                    connectionId={targetUserId}
                    partner={{
                        id: targetUserId,
                        name: targetUserName,
                        photoUrl: targetUserPhoto || `https://ui-avatars.com/api/?name=${targetUserName}`,
                    }}
                    onEndCall={() => setIsCalling(false)}
                    mode={mode}
                />
            )}
        </>
    );
}
