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
    
    // Crucial: If the payload contains a notification block, the browser natively handles displaying it.
    // Calling self.registration.showNotification here would create duplicate/double notifications!
    if (payload.notification) {
        console.log('[firebase-messaging-sw.js] Native notification block present. Bypassing manual showNotification to avoid duplicates.');
        return;
    }
    
    const origin = self.location.origin;
    const notificationTitle = payload.data?.title || 'Coming In Hot';
    const rawPhoto = payload.data?.senderPhoto || payload.data?.fromUserPhoto || null;
    const rawBanner = payload.data?.bannerUrl || null;
    
    // Resolve relative path to absolute URL if needed to guarantee display on all browsers/platforms
    let senderPhoto = rawPhoto;
    if (senderPhoto && !senderPhoto.startsWith('http') && !senderPhoto.startsWith('data:')) {
        const cleanPath = senderPhoto.startsWith('/') ? senderPhoto.slice(1) : senderPhoto;
        senderPhoto = `${origin}/${cleanPath}`;
    }

    let bannerUrl = rawBanner;
    if (bannerUrl && !bannerUrl.startsWith('http') && !bannerUrl.startsWith('data:')) {
        const cleanPath = bannerUrl.startsWith('/') ? bannerUrl.slice(1) : bannerUrl;
        bannerUrl = `${origin}/${cleanPath}`;
    }
    
    const notificationOptions = {
        body: payload.data?.body || 'New Notification',
        icon: senderPhoto || `${origin}/icon.png`, // Absolute path to sender avatar or platform logo
        badge: `${origin}/icon-192x192.png`, // Absolute path to app logo badge
        image: bannerUrl || senderPhoto || null, // Optional large image preview (useful for story updates)
        data: payload.data,
        vibrate: [200, 100, 200], // Haptic vibration pattern for Android/mobile devices
        silent: false, // Explicitly tell browser/device to play default system alert sound
    };

    // Add Accept/Decline actions only if it's an interest request containing interactionId!
    if (payload.data?.type === 'request' && payload.data?.interactionId) {
        notificationOptions.actions = [
            { action: 'accept_request', title: 'Accept ✅' },
            { action: 'decline_request', title: 'Decline ❌' }
        ];
    } else if (payload.data?.type === 'match' && payload.data?.messageId && payload.data?.senderId) {
        // Add Like and Reply actions for chat messages/replies
        notificationOptions.actions = [
            { action: 'like_message', title: 'Like ❤️' },
            { action: 'reply_to_message', title: 'Reply 💬', type: 'text', placeholder: 'Type your reply...' }
        ];
    } else if (payload.data?.type === 'witty_reengagement') {
        notificationOptions.actions = [
            { action: 'find_matches', title: 'Swipe Matches 🔍' },
            { action: 'love_guru', title: 'Ask Love Guru 🤖' }
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
    const notificationId = payloadData.notificationId;
    const action = event.action;

    // Record the push click in database log asynchronously
    if (notificationId) {
        const API_URL = self.location.origin.includes('localhost') 
            ? 'http://localhost:4000' 
            : 'https://lifepartner-ai.onrender.com';
            
        event.waitUntil(
            fetch(`${API_URL}/notifications/${notificationId}/click`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: action || 'notification_body' })
            })
            .then(res => res.json())
            .then(data => console.log('Successfully recorded push click in DB:', data))
            .catch(err => console.error('Failed to track push click:', err))
        );
    }

    // Check if an action button was clicked
    if (action === 'find_matches') {
        const urlToOpen = '/dashboard?tab=matches';
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes('/dashboard')) {
                        if ('navigate' in client) client.navigate(urlToOpen);
                        if ('focus' in client) return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
        );
        return;
    }

    if (action === 'love_guru') {
        const urlToOpen = '/dashboard?tab=matches&openGuru=true';
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes('/dashboard')) {
                        if ('navigate' in client) client.navigate(urlToOpen);
                        if ('focus' in client) return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
        );
        return;
    }

    if (action === 'accept_request' || action === 'decline_request') {
        const actionType = action === 'accept_request' ? 'accept' : 'decline';
        const API_URL = self.location.origin.includes('localhost') 
            ? 'http://localhost:4000' 
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

    // Like message action click handler
    if (action === 'like_message') {
        const messageId = payloadData.messageId;
        const API_URL = self.location.origin.includes('localhost') 
            ? 'http://localhost:4000' 
            : 'https://lifepartner-ai.onrender.com';

        event.waitUntil(
            caches.open('auth-token')
                .then(cache => cache.match('/token'))
                .then(res => {
                    if (!res) throw new Error('No auth token cached');
                    return res.text();
                })
                .then(token => {
                    return fetch(`${API_URL}/messages/${messageId}/like`, {
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
                    return self.registration.showNotification('LifePartner AI', {
                        body: 'Message liked! ❤️',
                        icon: '/icon.png',
                        silent: true
                    });
                })
                .catch(err => {
                    console.error('Failed to like message from notification:', err);
                })
        );
        return;
    }

    // Inline reply action click handler
    if (action === 'reply_to_message') {
        const replyText = event.reply;
        const senderId = payloadData.senderId; // The partner's user ID
        
        if (!replyText) return;
        
        const API_URL = self.location.origin.includes('localhost') 
            ? 'http://localhost:4000' 
            : 'https://lifepartner-ai.onrender.com';

        event.waitUntil(
            caches.open('auth-token')
                .then(cache => cache.match('/token'))
                .then(res => {
                    if (!res) throw new Error('No auth token cached');
                    return res.text();
                })
                .then(token => {
                    return fetch(`${API_URL}/messages/${senderId}/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            text: replyText
                        })
                    });
                })
                .then(response => {
                    if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
                    return response.json();
                })
                .then(result => {
                    return self.registration.showNotification('LifePartner AI', {
                        body: `Reply sent: "${replyText}"`,
                        icon: '/icon.png',
                        silent: true
                    });
                })
                .catch(err => {
                    console.error('Failed to send reply from notification:', err);
                })
        );
        return;
    }

    // Connection online action or body click handler
    const type = payloadData.type;
    if (action === 'chat_now' || type === 'connection_online') {
        const fromUserId = payloadData.fromUserId || payloadData.senderId;
        const fromUserName = payloadData.fromUserName || payloadData.senderName || 'Member';
        const fromUserPhoto = payloadData.fromUserPhoto || payloadData.senderPhoto || '';
        
        let urlToOpen = `/dashboard?tab=connections`;
        if (fromUserId) {
            urlToOpen = `/chat/${fromUserId}?name=${encodeURIComponent(fromUserName)}&photo=${encodeURIComponent(fromUserPhoto)}`;
        }
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes('/chat/') || client.url.includes('/dashboard')) {
                        if ('navigate' in client) client.navigate(urlToOpen);
                        if ('focus' in client) return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
        );
        return;
    }

    // Determine target tab from payload data
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
