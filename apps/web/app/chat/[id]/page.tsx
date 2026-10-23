'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useRef } from 'react';
import { useCall } from '@/context/CallContext';
import { useSocket } from '@/context/SocketContext';
import { api } from '@/lib/api';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), { ssr: false });

function ChatContent() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const { startCall, callState } = useCall();
    const { socket } = useSocket();

    const connectionId = params?.id as string;
    const partnerName = searchParams.get('callerName') || searchParams.get('name') || 'Partner';
    const partnerPhoto = searchParams.get('callerPhoto') || searchParams.get('photo') || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(partnerName));
    const partnerRole = searchParams.get('role') || 'Online';
    const action = searchParams.get('action');
    const callType = (searchParams.get('callType') as 'audio' | 'video') || 'video';

    const hasCheckedCall = useRef(false);

    const partner = {
        id: connectionId,
        name: partnerName,
        photoUrl: partnerPhoto,
        role: partnerRole
    };

    // When navigated here via "Answer Call" push notification
    useEffect(() => {
        if (action === 'answer_call' && !hasCheckedCall.current) {
            hasCheckedCall.current = true;
            console.log("[ChatContent] Launched via Answer Call notification for partner:", partnerName);

            // Signal socket to deliver active pending call offer
            if (socket) {
                socket.emit('checkPendingCall');
            }

            // Also check REST endpoint in case socket connection was slow to initialize
            api.calls.getPending().then((res: any) => {
                if (res?.hasPendingCall && res?.call) {
                    console.log("[ChatContent] Active pending call found via API:", res.call);
                    if (socket) {
                        socket.emit('checkPendingCall');
                    }
                }
            }).catch(() => {});
        }
    }, [action, socket, partnerName]);

    if (!connectionId) return <div className="h-screen flex items-center justify-center">Invalid Chat</div>;

    return (
        <div className="h-screen w-full bg-slate-100 flex items-center justify-center p-0 md:p-4">
            <ChatWindow
                connectionId={connectionId}
                partner={partner}
                className="w-full h-full md:max-w-2xl md:h-[90vh] bg-white shadow-xl rounded-none md:rounded-2xl flex flex-col overflow-hidden"
                onClose={() => router.push('/dashboard')}
                onVideoCall={() => startCall(partner, 'video', connectionId)}
                onAudioCall={() => startCall(partner, 'audio', connectionId)}
            />
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Chat...</div>}>
            <ChatContent />
        </Suspense>
    );
}
