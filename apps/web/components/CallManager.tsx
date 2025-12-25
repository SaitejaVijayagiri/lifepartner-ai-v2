'use client';
import { useSocket } from '@/context/SocketContext';
import VideoCallModal from '@/components/VideoCallModal';

export default function CallManager() {
    const { incomingCall, clearIncomingCall } = useSocket();

    if (!incomingCall) return null;

    return (
        <VideoCallModal
            incomingCall={incomingCall}
            onEndCall={clearIncomingCall}
        />
    );
}
