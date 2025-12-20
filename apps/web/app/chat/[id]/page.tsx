'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import { useToast } from '@/components/ui/Toast';

export default function ChatPage({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useToast();

    const partnerName = searchParams.get('name') || 'Partner';
    const partnerPhoto = searchParams.get('photo') || 'https://i.pravatar.cc/150?u=' + params.id;
    const partnerRole = searchParams.get('role') || 'Online';

    return (
        <div className="h-screen w-full bg-slate-100 flex items-center justify-center p-0 md:p-4">
            <ChatWindow
                connectionId={params.id}
                partner={{
                    id: 'unknown', // Ideally we resolve this from connectionId or params
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
