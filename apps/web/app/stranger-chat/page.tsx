'use client';

import React from 'react';
import AnonymousStrangerChat from '@/components/AnonymousStrangerChat';
import { useRouter } from 'next/navigation';

export default function StrangerChatPage() {
    const router = useRouter();

    return (
        <AnonymousStrangerChat
            onClose={() => router.push('/dashboard')}
        />
    );
}
