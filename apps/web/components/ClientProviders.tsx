
'use client';

import { useEffect, useState } from 'react';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from '@/components/ui/Toast';
import { CallProvider } from '@/context/CallContext';
import GlobalCallUI from '@/components/GlobalCallUI';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function ProvidersContent({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    return (
        <SocketProvider userId={user?.id}>
            <CallProvider>
                {children}
                <GlobalCallUI />
            </CallProvider>
            <Toaster />
        </SocketProvider>
    );
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ProvidersContent>
                {children}
            </ProvidersContent>
        </AuthProvider>
    );
}
