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

    // Add Accept/Decline actions only if it's an interest request containing interactionId!
    if (payload.data?.type === 'request' && payload.data?.interactionId) {
        notificationOptions.actions = [
            { action: 'accept_request', title: 'Accept ✅' },
            { action: 'decline_request', title: 'Decline ❌' }
        ];
    }

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicks natively for offline notifications
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');

    event.notification.close();

    const payloadData = event.notification.data || {};
    const interactionId = payloadData.interactionId;
    const action = event.action;

    // Check if an action button was clicked
    if (action === 'accept_request' || action === 'decline_request') {
        const actionType = action === 'accept_request' ? 'accept' : 'decline';
        const API_URL = self.location.origin.includes('localhost') 
            ? 'http://localhost:5000' 
            : 'https://lifepartner-ai.onrender.com';

        event.waitUntil(
            caches.open('auth-token')
                .then(cache => cache.match('/token'))
                .then(res => {
                    if (!res) throw new Error('No auth token cached');
                    return res.text();
                })
                .then(token => {
                    return fetch(`${API_URL}/interactions/requests/${interactionId}/${actionType}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(response => {
                    if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
                    return response.json();
                })
                .then(result => {
                    console.log(`Successfully completed interest action: ${actionType}`, result);
                    const msgText = actionType === 'accept' 
                        ? 'You accepted the interest request! 🎉' 
                        : 'You declined the interest request.';
                        
                    return self.registration.showNotification('Match Request Update', {
                        body: msgText,
                        icon: '/icon.png',
                        silent: false
                    });
                })
                .catch(err => {
                    console.error('Failed to perform background notification action:', err);
                    // Fallback: Open dashboard requests tab so user can review/action manually
                    return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                        const urlToOpen = '/dashboard?tab=requests';
                        for (let i = 0; i < windowClients.length; i++) {
                            const client = windowClients[i];
                            if (client.url.includes('/dashboard')) {
                                if ('navigate' in client) {
                                    client.navigate(urlToOpen);
                                }
                                if ('focus' in client) {
                                    return client.focus();
                                }
                            }
                        }
                        if (clients.openWindow) {
                            return clients.openWindow(urlToOpen);
                        }
                    });
                })
        );
        return;
    }

    // Determine target tab from payload data
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
