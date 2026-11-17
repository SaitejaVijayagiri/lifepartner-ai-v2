'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Notifications, isNativePlatform, getNativeBridge } from '@/lib/notifications';

function persistAuthenticatedSession(data: { token: string; userId?: string; user?: any }) {
    if (data.userId) localStorage.setItem('userId', data.userId);
    localStorage.setItem('token', data.token);
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.gender) {
            localStorage.setItem('pendingUserGender', data.user.gender);
        }
    }
    const bridge = getNativeBridge();
    if (bridge) {
        if (typeof bridge.setAuthToken === 'function') bridge.setAuthToken(data.token);
        if (typeof bridge.loginUser === 'function' && (data.userId || data.user?.id)) {
            bridge.loginUser(data.userId || data.user.id);
        }
    }
    Notifications.init().catch(console.error);
}

function GoogleCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('Authenticating with Google...');
    const [nativeDeepLink, setNativeDeepLink] = useState<string | null>(null);

    useEffect(() => {
        // 1. Native Chrome Custom Tab handoff via #native_token=...
        if (typeof window !== 'undefined' && window.location.hash.includes('native_token=')) {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const nativeToken = hashParams.get('native_token');
            if (nativeToken) {
                const userId = hashParams.get('userId') || undefined;
                const rawNext = hashParams.get('next');
                const safeNext = rawNext === '/onboarding' ? '/onboarding' : '/dashboard';
                let parsedUser: any = undefined;
                const rawUser = hashParams.get('user');
                if (rawUser) {
                    try { parsedUser = JSON.parse(rawUser); } catch (_) {}
                }
                persistAuthenticatedSession({ token: nativeToken, userId, user: parsedUser });
                try {
                    if (safeNext === '/onboarding') {
                        localStorage.removeItem('onboarding_completed');
                    } else {
                        localStorage.setItem('onboarding_completed', 'true');
                    }
                } catch (_) {}
                setStatus('Success! Redirecting...');
                router.replace(safeNext);
                return;
            }
        }

        const code = searchParams.get('code');
        if (!code) {
            setStatus('No code received from Google.');
            return;
        }

        const exchangeCode = async () => {
            try {
                const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                const envUrl = process.env.NEXT_PUBLIC_API_URL;
                const apiUrl = (envUrl && !envUrl.includes('onrender.com')) ? envUrl : (isLocal ? 'http://localhost:4000' : 'https://lifepartner-backend-295663053086.asia-south1.run.app');
                // Dynamic redirect URI to match what initiated the flow
                const redirect_uri = window.location.origin + '/auth/callback/google';

                let stateGender: string | undefined;
                let stateAge: string | undefined;
                let initiatedFromNative = false;
                const rawState = searchParams.get('state');
                if (rawState) {
                    try {
                        const parsedState = JSON.parse(decodeURIComponent(rawState));
                        if (parsedState?.gender && (parsedState.gender === 'Female' || parsedState.gender === 'Male')) {
                            stateGender = parsedState.gender;
                        }
                        if (parsedState?.age) stateAge = String(parsedState.age);
                        if (parsedState?.native === true) initiatedFromNative = true;
                    } catch (_) {}
                }

                // Only trust gender explicitly passed in this OAuth session state to prevent stale localStorage cross-contamination
                const pendingGender = stateGender;
                const pendingAge = stateAge || undefined;
                try {
                    localStorage.removeItem('pendingUserGender');
                    localStorage.removeItem('pendingUserAge');
                } catch (_) {}

                const res = await axios.post(`${apiUrl}/auth/google`, {
                    code,
                    redirect_uri,
                    gender: pendingGender,
                    age: pendingAge
                });

                if (res.data.token) {
                    const nextRoute = (res.data.requiresOnboarding || res.data.isNewUser) ? '/onboarding' : '/dashboard';

                    // If OAuth ran in Chrome Custom Tab for the Android app, return session to MainActivity
                    if (initiatedFromNative && !isNativePlatform()) {
                        const appParams = new URLSearchParams({
                            token: res.data.token,
                            userId: String(res.data.userId || ''),
                            next: nextRoute
                        });
                        if (res.data.user) {
                            appParams.set('user', JSON.stringify(res.data.user));
                        }
                        const appReturnUrl = `lifepartner://auth-callback?${appParams.toString()}`;
                        setNativeDeepLink(appReturnUrl);
                        setStatus('Returning to LifePartner AI app...');
                        window.location.href = appReturnUrl;
                        return;
                    }

                    persistAuthenticatedSession(res.data);
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
        <div className="h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl font-semibold text-gray-700">{status}</p>
                {nativeDeepLink && (
                    <a
                        href={nativeDeepLink}
                        className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg"
                    >
                        Open LifePartner AI App
                    </a>
                )}
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
