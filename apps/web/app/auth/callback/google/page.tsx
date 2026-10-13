'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Notifications } from '@/lib/notifications';

import { Suspense } from 'react';

function GoogleCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('Authenticating with Google...');

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            setStatus('No code received from Google.');
            return;
        }

        const exchangeCode = async () => {
            try {
                const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isLocal ? 'http://localhost:4000' : 'https://lifepartner-ai.onrender.com');
                // Dynamic redirect URI to match what initiated the flow
                const redirect_uri = window.location.origin + '/auth/callback/google';

                let stateGender: string | undefined;
                let stateAge: string | undefined;
                const rawState = searchParams.get('state');
                if (rawState) {
                    try {
                        const parsedState = JSON.parse(decodeURIComponent(rawState));
                        if (parsedState?.gender && (parsedState.gender === 'Female' || parsedState.gender === 'Male')) {
                            stateGender = parsedState.gender;
                        }
                        if (parsedState?.age) stateAge = String(parsedState.age);
                    } catch (_) {}
                }

                const rawStoredGender = localStorage.getItem('pendingUserGender');
                const validStoredGender = (rawStoredGender === 'Female' || rawStoredGender === 'Male') ? rawStoredGender : undefined;
                const pendingGender = stateGender || validStoredGender || undefined;
                const pendingAge = localStorage.getItem('pendingUserAge') || stateAge || undefined;
                if (pendingGender) localStorage.setItem('pendingUserGender', pendingGender);
                if (pendingAge) localStorage.setItem('pendingUserAge', pendingAge);

                const res = await axios.post(`${apiUrl}/auth/google`, {
                    code,
                    redirect_uri,
                    gender: pendingGender,
                    age: pendingAge
                });

                if (res.data.token) {
                    // Token is now secured via HttpOnly Cookie (and localStorage for 3rd party fallback)
                    localStorage.setItem('userId', res.data.userId);
                    localStorage.setItem('token', res.data.token);
                    if (res.data.user) {
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                        if (res.data.user.gender) {
                            localStorage.setItem('pendingUserGender', res.data.user.gender);
                        }
                    }
                    // Automatically collect push notification token
                    Notifications.init().catch(console.error);
                    if (res.data.requiresOnboarding || res.data.isNewUser) {
                        try {
                            localStorage.removeItem('onboarding_completed');
                        } catch (_) {}
                        setStatus('Welcome! Setting up your profile & photo upload...');
                        setTimeout(() => router.replace('/onboarding'), 400);
                    } else {
                        try {
                            localStorage.setItem('onboarding_completed', 'true');
                        } catch (_) {}
                        setStatus('Success! Redirecting...');
                        setTimeout(() => router.replace('/dashboard'), 400);
                    }
                }
            } catch (err: any) {
                console.error("Google Auth Error", err);
                setStatus(`Login Failed: ${err.response?.data?.error || err.message}`);
                setTimeout(() => router.push('/login'), 3000);
            }
        };

        exchangeCode();
    }, [searchParams, router]);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl font-semibold text-gray-700">{status}</p>
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GoogleCallbackContent />
        </Suspense>
    );
}
