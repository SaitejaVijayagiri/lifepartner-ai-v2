importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBTEcc-NbugTTBb-mu9F2sQEajI1DG6NaU",
    projectId: "lifepartnerai-1d6f4",
    storageBucket: "lifepartnerai-1d6f4.firebasestorage.app",
    messagingSenderId: "909951442224",
    appId: "1:909951442224:web:firebase12345" // Using a generic web appId format if needed, but SDK infers it for messaging.
};

// Initialize Firebase app in the service worker.
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Coming In Hot';
    const senderPhoto = payload.notification?.imageUrl || payload.data?.senderPhoto || payload.data?.fromUserPhoto || null;
    
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'New Notification',
        icon: senderPhoto || '/icon.png', // Display sender's profile picture as the main avatar icon
        badge: '/icon.png', // Display app logo as the status bar badge
        data: payload.data,
        silent: false, // Explicitly tell browser/device to play default system alert sound
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicks natively for offline notifications
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');

    event.notification.close();

    // Determine target tab from payload data
    const payloadData = event.notification.data || {};
    const type = payloadData.type;
    
    let targetTab = 'matches';
    if (type === 'request') {
        targetTab = 'requests';
    } else if (type === 'match') {
        targetTab = 'connections';
    }
    
    const urlToOpen = `/dashboard?tab=${targetTab}`;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the dashboard URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('/dashboard')) {
                    // Update/Navigate the open client window to the correct tab
                    if ('navigate' in client) {
                        client.navigate(urlToOpen);
                    }
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
            }
            // If no window is open, open a new one with the target URL
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
