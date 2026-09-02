
'use client';

import { useEffect, useState } from 'react';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from '@/components/ui/Toast';
import { CallProvider } from '@/context/CallContext';
import GlobalCallUI from '@/components/GlobalCallUI';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import { LanguageProvider } from '@/context/LanguageContext';

import dynamic from 'next/dynamic';

import { Notifications, isNativePlatform, getNativeBridge } from '@/lib/notifications';

const WebPushPrompt = dynamic(() => import('@/components/WebPushPrompt'), { ssr: false });

function ProvidersContent({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (token && 'caches' in window) {
            caches.open('auth-token').then(cache => {
                cache.put('/token', new Response(token));
            }).catch(err => console.warn('Cache token sync failed', err));
        }

        // Pass auth token to Native Android Bridge immediately if in APK
        if (isNativePlatform()) {
            const bridge = getNativeBridge();
            if (bridge && typeof bridge.setAuthToken === 'function' && token) {
                bridge.setAuthToken(token);
            }
            Notifications.init().catch(console.error);
        } else if ('Notification' in window && Notification.permission === 'granted') {
            // In browser, if already granted, ensure token is registered on every active session
            Notifications.init().then(() => Notifications.setupListeners()).catch(console.error);
        }
    }, [user]);

    return (
        <SocketProvider userId={user?.id}>
            <CallProvider>
                {children}
                <GlobalCallUI />
                {user && <WebPushPrompt />}
            </CallProvider>
            <Toaster />
        </SocketProvider>
    );
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ProvidersContent>
                    {children}
                </ProvidersContent>
            </AuthProvider>
        </LanguageProvider>
    );
}
