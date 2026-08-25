import { initializeApp, getApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBTEcc-NbugTTBb-mu9F2sQEajI1DG6NaU",
    projectId: "lifepartnerai-1d6f4",
    storageBucket: "lifepartnerai-1d6f4.firebasestorage.app",
    messagingSenderId: "909951442224",
    appId: "1:909951442224:web:firebase12345" 
};

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

/**
 * Initializes Firebase Messaging and requests permission
 * Returns the device token if successful.
 */
export const requestWebPushPermission = async (): Promise<string | null> => {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn("Firebase Messaging is not supported in this browser.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const messaging = getMessaging(app);
            // VAPID key is ideally stored in NEXT_PUBLIC_FIREBASE_VAPID_KEY
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            
            if (!vapidKey) {
                console.warn("No VAPID Key available for Firebase Web Push.");
            }

            let swRegistration: ServiceWorkerRegistration | undefined = undefined;
            if ('serviceWorker' in navigator) {
                try {
                    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('[Web Push] Service Worker registered with scope:', swRegistration.scope);
                } catch (swErr) {
                    console.warn('[Web Push] Service Worker registration failed:', swErr);
                }
            }

            const tokenOptions: any = {};
            if (vapidKey) tokenOptions.vapidKey = vapidKey;
            if (swRegistration) tokenOptions.serviceWorkerRegistration = swRegistration;

            const currentToken = await getToken(messaging, tokenOptions);

            if (currentToken) {
                console.log("[Web Push] Got FCM Token:", currentToken);
                return currentToken;
            } else {
                console.log("[Web Push] No registration token available.");
                return null;
            }
        } else {
            console.warn("[Web Push] Permission not granted.");
            return null;
        }
    } catch (err) {
        console.error("[Web Push] An error occurred while retrieving token:", err);
        return null;
    }
};

/**
 * Setup foreground listener for Firebase Messaging
 */
export const onMessageListener = () => {
    return new Promise((resolve) => {
        isSupported().then((supported) => {
            if (supported) {
                const messaging = getMessaging(app);
                onMessage(messaging, (payload) => {
                    resolve(payload);
                    console.log("[Web Push] Foreground Message:", payload);
                });
            }
        });
    });
};
