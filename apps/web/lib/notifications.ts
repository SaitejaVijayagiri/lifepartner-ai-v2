import { Capacitor } from '@capacitor/core';
import { api } from './api';
import { requestWebPushPermission, onMessageListener } from './firebasePlugin';

const isNativePlatform = () => {
    if (Capacitor.isNativePlatform()) return true;
    if (typeof window !== 'undefined') {
        const w = window as any;
        if (w.AndroidBridge || w.androidBridge) return true;
    }
    return false;
};

const getNativeBridge = () => {
    if (typeof window !== 'undefined') {
        const w = window as any;
        return w.AndroidBridge || w.androidBridge || null;
    }
    return null;
};

/**
 * Notifications module.
 * 
 * On Android (Capacitor or Website APK WebView): Uses native AndroidBridge (JavascriptInterface injected by MainActivity.java)
 * to register the FCM token with the backend.
 * 
 * On Web: Requests Web Push Permission and registers standard FCM web token.
 */
export const Notifications = {
    init: async () => {
        // Native Android Bridge Handling (Works for Capacitor & Website APK WebView)
        if (isNativePlatform()) {
            try {
                let bridge = getNativeBridge();
                let retries = 0;
                while (!bridge && retries < 5) {
                    await new Promise(r => setTimeout(r, 500));
                    bridge = getNativeBridge();
                    retries++;
                }

                if (!bridge) {
                    console.warn('[Push Native] AndroidBridge not injected after retries');
                    return;
                }

                if (typeof bridge.enablePush === 'function') {
                    bridge.enablePush();
                }

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

                if (authToken && authToken !== 'null') {
                    console.log('[Push Native] Registering auth token with native AndroidBridge...');
                    if (typeof bridge.setAuthToken === 'function') {
                        bridge.setAuthToken(authToken);
                    }

                    // Fallback: If bridge already has an FCM token, register it via JS API as well
                    const fcmToken = typeof bridge.getFcmToken === 'function' ? bridge.getFcmToken() : null;
                    if (fcmToken && fcmToken.length > 10) {
                        api.notifications.register(fcmToken, 'android').catch(err => {
                            console.warn('[Push Native] JS fallback FCM token registration failed:', err);
                        });
                    }
                } else {
                    console.warn('[Push Native] No valid auth token available for native push registration');
                }
            } catch (e: any) {
                console.error('Push init error (Native):', e.message || String(e));
            }
            return;
        }

        // --- Web Push Handling (PWA / Browser) ---
        try {
            console.log('[Web Push] Initializing...');
            const token = await requestWebPushPermission();
            if (token) {
                // Register token with backend specifically for web
                await api.notifications.register(token, 'web');
                console.log('[Web Push] Successfully registered web token.');
            }
        } catch (e: any) {
            console.error('Push init error (Web):', e.message || String(e));
        }
    },

    setupListeners: () => {
        if (!isNativePlatform()) {
            // Setup Foreground Web Message Listener
            onMessageListener().then((payload) => {
                console.log('[Web Push] Foreground notification received:', payload);
                // The browser may or may not show it natively if the tab is focused, 
                // but any custom UI toast could go here.
                
                // Keep listening
                Notifications.setupListeners();
            }).catch(err => console.log('failed web listener', err));
        }
        // Native push handling is done in MyFirebaseMessagingService.java via Android System.
    },

    /**
     * Get the FCM token from native storage (for debugging).
     */
    getToken: (): string | null => {
        if (isNativePlatform()) {
            const bridge = getNativeBridge();
            if (bridge && typeof bridge.getFcmToken === 'function') {
                return bridge.getFcmToken() || null;
            }
        }
        // Web token is returned directly from init, not currently cached here
        return null;
    },

    /**
     * Unregister notifications.
     */
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
            } else {
                console.log("Web push unregister triggered.");
            }
        } catch (e) {
            console.error("Failed to unregister push", e);
        }
    }
};
