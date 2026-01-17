'use client';
import { useCall } from '@/context/CallContext';
import VideoCallModal from '@/components/VideoCallModal';

export default function GlobalCallUI() {
    const { callState, endCall } = useCall();

    if (!callState.isOpen) return null;

    return (
        <VideoCallModal
            connectionId={callState.connectionId}
            partner={callState.partner}
            incomingCall={callState.incomingCallData}
            mode={callState.mode}
            onEndCall={endCall}
        />
    );
}
