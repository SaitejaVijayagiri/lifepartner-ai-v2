'use client';
import { useState } from 'react';
import { useCall } from '@/context/CallContext';
import VideoCallModal from '@/components/VideoCallModal';
import SpeedDateFeedbackModal from '@/components/SpeedDateFeedbackModal';

export default function GlobalCallUI() {
    const { callState, endCall } = useCall();
    const [feedbackPartnerId, setFeedbackPartnerId] = useState<string | null>(null);

    if (!callState.isOpen) {
        if (feedbackPartnerId) {
            return <SpeedDateFeedbackModal partnerId={feedbackPartnerId} onClose={() => setFeedbackPartnerId(null)} />;
        }
        return null;
    }

    return (
        <VideoCallModal
            connectionId={callState.connectionId}
            partner={callState.partner}
            incomingCall={callState.incomingCallData}
            mode={callState.mode}
            onEndCall={() => {
                if (callState.mode === 'speed_date') {
                    setFeedbackPartnerId(callState.partner.id);
                }
                endCall();
            }}
        />
    );
}
