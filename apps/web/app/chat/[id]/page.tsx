'use client';

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
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
    const queryName = searchParams.get('partnerName') || searchParams.get('name') || searchParams.get('callerName') || searchParams.get('senderName') || '';
    const queryPhoto = searchParams.get('partnerPhoto') || searchParams.get('photo') || searchParams.get('callerPhoto') || searchParams.get('avatarUrl') || '';
    const partnerRole = searchParams.get('role') || 'Online';
    const action = searchParams.get('action');
    const callType = (searchParams.get('callType') as 'audio' | 'video') || 'video';

    const hasCheckedCall = useRef(false);

    // 0ms instant cache lookup from local storage
    const cachedPartner = useMemo(() => {
        if (typeof window === 'undefined' || !connectionId) return { name: '', photoUrl: '' };
        try {
            // 1. Try connections cache
            const cachedConns = localStorage.getItem('connections_cache_v1');
            if (cachedConns) {
                const conns = JSON.parse(cachedConns);
                if (Array.isArray(conns)) {
                    const match = conns.find((c: any) => 
                        c?.partner?.id === connectionId || 
                        c?.partner?.userId === connectionId || 
                        c?.interactionId === connectionId ||
                        c?.id === connectionId
                    );
                    if (match?.partner) {
                        return {
                            name: match.partner.name || match.partner.full_name || '',
                            photoUrl: match.partner.photoUrl || match.partner.avatar_url || ''
                        };
                    }
                }
            }

            // 2. Try matches cache if not in connections
            const cachedMatches = localStorage.getItem('matches_cache_v2');
            if (cachedMatches) {
                const matches = JSON.parse(cachedMatches);
                if (Array.isArray(matches)) {
                    const match = matches.find((m: any) => m?.id === connectionId || m?.userId === connectionId);
                    if (match) {
                        return {
                            name: match.name || match.full_name || '',
                            photoUrl: match.photoUrl || match.avatar_url || (Array.isArray(match.photos) ? match.photos[0] : '')
                        };
                    }
                }
            }
        } catch (e) {}
        return { name: '', photoUrl: '' };
    }, [connectionId]);

    const initialName = queryName || cachedPartner.name || '';
    const initialPhoto = queryPhoto || cachedPartner.photoUrl || '';

    const [partner, setPartner] = useState({
        id: connectionId,
        name: initialName,
        photoUrl: initialPhoto,
        role: partnerRole
    });

    // If name or photo is still unknown or placeholder, fetch authentic profile immediately
    useEffect(() => {
        if (!connectionId) return;

        const isNamePlaceholder = !partner.name || partner.name === 'Partner' || partner.name === 'User' || partner.name === 'Member';
        const isPhotoPlaceholder = !partner.photoUrl || 
            partner.photoUrl.includes('ui-avatars.com') || 
            partner.photoUrl.includes('initials/svg') || 
            partner.photoUrl.includes('dicebear.com');

        if (isNamePlaceholder || isPhotoPlaceholder) {
            api.profile.getById(connectionId).then((data: any) => {
                if (data) {
                    setPartner(prev => ({
                        ...prev,
                        name: data.name || data.full_name || prev.name || 'Member',
                        photoUrl: data.photoUrl || data.avatar_url || (Array.isArray(data.photos) ? data.photos[0] : prev.photoUrl)
                    }));
                }
            }).catch(() => {});
        }
    }, [connectionId, partner.name, partner.photoUrl]);

    // When navigated here via "Answer Call" push notification
    useEffect(() => {
        if (action === 'answer_call' && !hasCheckedCall.current) {
            hasCheckedCall.current = true;
            console.log("[ChatContent] Launched via Answer Call notification for partner:", partner.name);

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
    }, [action, socket, partner.name]);

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
