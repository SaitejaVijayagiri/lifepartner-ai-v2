
import { Capacitor } from '@capacitor/core';
import { api } from './api';

/**
 * Notifications module.
 * 
 * On Android: Uses native AndroidBridge (JavascriptInterface injected by MainActivity.java)
 * to register the FCM token with the backend. The token is generated and managed
 * entirely by the native Firebase SDK - no Capacitor plugin bridge needed.
 * 
 * On Web: Does nothing (push not supported on web in this app).
 */
export const Notifications = {
    init: async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            // Check if native Android bridge is available
            const bridge = (window as any).AndroidBridge;
            if (!bridge) {
                // Bridge not injected yet - wait a moment and retry
                setTimeout(() => Notifications.init(), 1000);
                return;
            }

            // Pass auth token to native so it can register the FCM token with backend
            const authToken = localStorage.getItem('token');
            if (authToken) {
                bridge.setAuthToken(authToken);
            }
        } catch (e: any) {
            console.error('Push init error:', e.message || String(e));
        }
    },

    setupListeners: () => {
        // No-op: all push handling is done natively in MyFirebaseMessagingService.java
        // The native service shows notifications and registers tokens automatically.
    },

    /**
     * Get the FCM token from native storage (for debugging).
     */
    getToken: (): string | null => {
        const bridge = (window as any).AndroidBridge;
        if (bridge) {
            return bridge.getFcmToken() || null;
        }
        return null;
    },

    /**
     * Unregister notifications.
     */
    unregister: async () => {
        try {
            const token = Notifications.getToken();
            if (!token) return;
            await api.notifications.unregister(token);
        } catch (e) {
            console.error("Failed to unregister push natively", e);
        }
    }
};
