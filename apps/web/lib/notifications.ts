import { Capacitor } from '@capacitor/core';
import { api } from './api';
import { requestWebPushPermission, onMessageListener } from './firebasePlugin';

export const isNativePlatform = () => {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return true;
    const w = window as any;
    if (w.AndroidBridge || w.androidBridge) return true;
    return false;
};

export const getNativeBridge = () => {
    if (typeof window !== 'undefined') {
        const w = window as any;
        return w.AndroidBridge || w.androidBridge || null;
    }
    return null;
};

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Cache auth token in CacheStorage so Service Worker can send replies
 * and likes from notifications even if the website tab is completely closed.
 */
export const cacheAuthTokenForWorker = async (token: string | null) => {
    if (typeof window === 'undefined' || !token) return;
    try {
        if ('caches' in window) {
            const cache = await caches.open('auth-token');
            await cache.put('/token', new Response(token));
        }
    } catch (_) {}
};

/**
 * Notifications module:
 * 
 * 1. Mobile APK (Android Capacitor / WebView):
 *    Uses AndroidBridge to register auth token and push tokens.
 *    Supports OneSignal user mapping and lockscreen quick replies.
 * 
 * 2. Web (Chrome, Edge, Firefox, Safari, PWA):
 *    - Primary: Standard W3C Web Push (VAPID) via /sw.js (zero third-party dependency, full support for reply & like actions)
 *    - Optional: OneSignal Web SDK (if ONESIGNAL_APP_ID is configured)
 *    - Fallback: Firebase Web Push
 */
export const Notifications = {
    init: async () => {
        if (typeof window === 'undefined') return;

        // Retrieve auth token
        let authToken = localStorage.getItem('token');
        if (!authToken || authToken === 'null') {
            try {
                const tokenRes = await api.auth.getToken();
                if (tokenRes?.token) {
                    authToken = tokenRes.token;
                    localStorage.setItem('token', tokenRes.token);
                }
            } catch (_) {}
        }

        // Cache token for service worker quick replies
        if (authToken && authToken !== 'null') {
            await cacheAuthTokenForWorker(authToken);
        }

        // ----------------------------------------------------
        // A. Native Android Platform (Capacitor / Website APK)
        // ----------------------------------------------------
        if (isNativePlatform()) {
            try {
                let bridge = getNativeBridge();
                let retries = 0;
                while (!bridge && retries < 10) {
                    await new Promise(r => setTimeout(r, 300));
                    bridge = getNativeBridge();
                    retries++;
                }

                if (!bridge) {
                    console.warn('[Push Native] AndroidBridge not found after retries');
                    return;
                }

                if (typeof bridge.enablePush === 'function') {
                    bridge.enablePush();
                }

                if (authToken && authToken !== 'null') {
                    if (typeof bridge.setAuthToken === 'function') {
                        bridge.setAuthToken(authToken);
                    }

                    // Sync OneSignal App ID & User ID with native layer
                    try {
                        const config = await api.notifications.getConfig();
                        if (config?.onesignalAppId && typeof bridge.setOneSignalAppId === 'function') {
                            bridge.setOneSignalAppId(config.onesignalAppId);
                        }
                        let storedUserId = localStorage.getItem('userId');
                        if (!storedUserId) {
                            try {
                                const u = localStorage.getItem('user');
                                if (u) storedUserId = JSON.parse(u).id;
                            } catch (_) {}
                        }
                        if (storedUserId && typeof bridge.loginUser === 'function') {
                            bridge.loginUser(storedUserId);
                        }
                    } catch (_) {}

                    // Poll for native token
                    let tokenRetries = 0;
                    const checkAndRegisterNative = async () => {
                        try {
                            const nativeToken = typeof bridge.getFcmToken === 'function' ? bridge.getFcmToken() : null;
                            if (nativeToken && nativeToken.length > 10) {
                                await api.notifications.register(nativeToken, 'android');
                                console.log('[Push Native] Native token successfully registered.');
                                return true;
                            }
                        } catch (err) {
                            console.warn('[Push Native] Registration check failed:', err);
                        }
                        return false;
                    };

                    const registered = await checkAndRegisterNative();
                    if (!registered) {
                        const interval = setInterval(async () => {
                            tokenRetries++;
                            const ok = await checkAndRegisterNative();
                            if (ok || tokenRetries >= 8) {
                                clearInterval(interval);
                            }
                        }, 1000);
                    }
                }
            } catch (e: any) {
                console.error('Push init error (Native):', e.message || String(e));
            }
            return;
        }

        // ----------------------------------------------------
        // B. Web Platform (Browsers, PWA, Desktop & Mobile Web)
        // ----------------------------------------------------
        try {
            // 1. Fetch server notification config (VAPID public key & OneSignal app ID)
            const config = await api.notifications.getConfig();
            const vapidPublicKey = config?.vapidPublicKey || "BMQfQTBi_LHLqDi6iTOwkYV9gF24ojGfuW3RVNQsUD47SaONbnwI4oPV0GngxhStO7n717a_7eorxEtnNiVpyuE";
            const onesignalAppId = config?.onesignalAppId || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

            // 2. Initialize OneSignal Web SDK if configured
            if (onesignalAppId) {
                try {
                    const w = window as any;
                    w.OneSignalDeferred = w.OneSignalDeferred || [];
                    w.OneSignalDeferred.push(async function(OneSignal: any) {
                        await OneSignal.init({
                            appId: onesignalAppId,
                            allowLocalhostAsSecureOrigin: true,
                            notifyButton: { enable: false }
                        });
                        let storedUserId = localStorage.getItem('userId');
                        if (!storedUserId) {
                            try {
                                const u = localStorage.getItem('user');
                                if (u) storedUserId = JSON.parse(u).id;
                            } catch (_) {}
                        }
                        if (storedUserId) {
                            await OneSignal.login(storedUserId);
                        }
                        console.log('[OneSignal Web] Initialized successfully ✓');
                    });
                } catch (osErr) {
                    console.warn('[OneSignal Web] Init failed, proceeding with Web Push:', osErr);
                }
            }

            // 3. Register Standard W3C Web Push (VAPID) Service Worker
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                if (Notification.permission === 'default') {
                    // Let the explicit UI prompt or user action request permission
                    console.log('[Web Push] Notification permission is default; waiting for user grant.');
                }

                if (Notification.permission === 'granted' || Notification.permission === 'default') {
                    const swReg = await navigator.serviceWorker.register('/sw.js');
                    await navigator.serviceWorker.ready;

                    if (Notification.permission === 'granted' && vapidPublicKey) {
                        let subscription = await swReg.pushManager.getSubscription();
                        if (!subscription) {
                            try {
                                subscription = await swReg.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                                });
                            } catch (subErr) {
                                console.warn('[Web Push] VAPID subscribe error:', subErr);
                            }
                        }

                        if (subscription) {
                            await api.notifications.registerSubscription(subscription.toJSON(), 'webpush');
                            console.log('[Web Push] W3C VAPID subscription registered with backend ✓');
                            return;
                        }
                    }
                }
            }

            // 4. Legacy Firebase Web Push Fallback (if browser couldn't subscribe via VAPID)
            const fbToken = await requestWebPushPermission();
            if (fbToken) {
                await api.notifications.register(fbToken, 'web');
                console.log('[Web Push] Firebase fallback token registered.');
            }
        } catch (webErr: any) {
            console.error('[Web Push] Initialization failed:', webErr?.message || webErr);
        }
    },

    /**
     * Explicitly prompt the user for notification permissions and complete subscription.
     */
    requestPermission: async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false;
        if (!('Notification' in window)) return false;

        try {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                await Notifications.init();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to request notification permission:', err);
            return false;
        }
    },

    setupListeners: () => {
        if (!isNativePlatform()) {
            onMessageListener().then((payload) => {
                console.log('[Web Push] Foreground notification:', payload);
                Notifications.setupListeners();
            }).catch(err => console.log('failed web listener', err));
        }
    },

    getToken: (): string | null => {
        if (isNativePlatform()) {
            const bridge = getNativeBridge();
            if (bridge && typeof bridge.getFcmToken === 'function') {
                return bridge.getFcmToken() || null;
            }
        }
        return null;
    },

    unregister: async () => {
        try {
            if (isNativePlatform()) {
                const bridge = getNativeBridge();
                if (bridge && typeof bridge.disablePush === 'function') {
                    bridge.disablePush();
                }
                const token = Notifications.getToken();
                if (!token) return;
                await api.notifications.unregister(token);
            } else if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    await sub.unsubscribe();
                    await api.notifications.unregister(JSON.stringify(sub.toJSON()));
                }
            }
        } catch (e) {
            console.error("Failed to unregister push", e);
        }
    }
};
