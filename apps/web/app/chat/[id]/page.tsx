'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/Toast';
import { Suspense } from 'react';

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), { ssr: false });

function ChatContent() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const toast = useToast();

    const connectionId = params?.id as string;
    const partnerName = searchParams.get('name') || 'Partner';
    const partnerPhoto = searchParams.get('photo') || 'https://i.pravatar.cc/150?u=' + connectionId;
    const partnerRole = searchParams.get('role') || 'Online';

    if (!connectionId) return <div className="h-screen flex items-center justify-center">Invalid Chat</div>;

    return (
        <div className="h-screen w-full bg-slate-100 flex items-center justify-center p-0 md:p-4">
            <ChatWindow
                connectionId={connectionId}
                partner={{
                    id: connectionId,
                    name: partnerName,
                    photoUrl: partnerPhoto,
                    role: partnerRole
                }}
                className="w-full h-full md:max-w-2xl md:h-[90vh] bg-white shadow-xl rounded-none md:rounded-2xl flex flex-col overflow-hidden"
                onClose={() => router.push('/dashboard')}
                onVideoCall={() => toast.info("Video Call feature coming soon!")}
                onAudioCall={() => toast.info("Audio Call feature coming soon!")}
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
