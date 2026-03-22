
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api';

export const Notifications = {
    init: async () => {
        if (!Capacitor.isNativePlatform()) {
            // console.log("Push Notifications: Web Platform (Skipping)");
            return;
        }

        try {
            if (!Capacitor.isPluginAvailable('PushNotifications')) {
                alert(`CRITICAL FATAL: Push Native Bridge is missing! Capacitor sees this as: ${Capacitor.getPlatform()}. Did you sync gradle in Android Studio?`);
                return;
            }
            // 1. Request Permissions
            const result = await PushNotifications.requestPermissions();
            if (result.receive === 'granted') {
                // 2. Register
                await PushNotifications.register();
            } else {
                alert("Push Permissions Denied by User/System.");
            }
        } catch (e: any) {
            alert("Push Init Error: " + (e.message || String(e)));
        }
    },

    setupListeners: () => {
        if (!Capacitor.isNativePlatform()) return;

        // On Registration Success
        PushNotifications.addListener('registration', (token) => {
            // alert('Push Registered! Token: ' + token.value.substring(0, 15) + '...');
            
            localStorage.setItem('device_token', token.value);
            // Send to Backend
            api.notifications.register(token.value, Capacitor.getPlatform())
                .catch((e) => alert('Backend Token Save Failed: ' + String(e)));
        });

        // On Registration Error
        PushNotifications.addListener('registrationError', (error: any) => {
            alert('Push Registration Error (Google Play Services): ' + (error.error || String(error)));
        });

        // On Receive (Foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push Received:', notification);
            // toast(notification.title || "New Notification"); // Removed to avoid dependency
        });

        // On Action (Tap)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push Action:', notification);
            // Navigate if needed (e.g. notification.data.url)
            if (notification.notification.data.url) {
                window.location.href = notification.notification.data.url;
            }
        });
    }
};
