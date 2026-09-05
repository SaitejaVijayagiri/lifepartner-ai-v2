// LifePartner AI Service Worker (W3C Web Push & Notification Actions)

self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const payload = event.data.json();
        const origin = self.location.origin;
        const title = payload.title || payload.data?.title || 'LifePartner AI';
        const rawPhoto = payload.icon || payload.data?.senderPhoto || payload.data?.fromUserPhoto || null;
        const rawBanner = payload.image || payload.data?.bannerUrl || null;

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

        const data = payload.data || payload;

        const options = {
            body: payload.body || data.body || 'You have a new update',
            icon: senderPhoto || `${origin}/icon.png`,
            badge: `${origin}/icon-192x192.png`,
            image: bannerUrl || null,
            data: data,
            vibrate: [200, 100, 200],
            tag: data.connId || data.senderId || data.notificationId || 'lifepartner_alert',
            renotify: true
        };

        // Actions for Quick Reply and Message Actions
        if (data.senderId || data.connId) {
            options.actions = [
                { action: 'like_message', title: 'Like ❤️' },
                { action: 'reply_to_message', title: 'Reply 💬', type: 'text', placeholder: 'Type your reply...' }
            ];
        } else if (data.type === 'request' && data.interactionId) {
            options.actions = [
                { action: 'accept_request', title: 'Accept ✅' },
                { action: 'decline_request', title: 'Decline ❌' }
            ];
        } else if (data.type === 'witty_reengagement') {
            options.actions = [
                { action: 'find_matches', title: 'Swipe Matches 🔍' },
                { action: 'love_guru', title: 'Ask Love Guru 🤖' }
            ];
        }

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.error('Error handling push event:', err);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const payloadData = event.notification.data || {};
    const action = event.action;
    const senderId = payloadData.senderId || payloadData.connId;
    const messageId = payloadData.messageId;
    const interactionId = payloadData.interactionId;
    const origin = self.location.origin;
    const API_URL = origin.includes('localhost') ? 'http://localhost:4000' : 'https://lifepartner-ai.onrender.com';

    // 1. Inline quick reply action
    if (action === 'reply_to_message') {
        const replyText = event.reply;
        if (!replyText || !senderId) return;

        event.waitUntil(
            caches.open('auth-token')
                .then(cache => cache.match('/token'))
                .then(res => res ? res.text() : null)
                .then(token => {
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    return fetch(`${API_URL}/messages/${senderId}/send`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ text: replyText })
                    });
                })
                .then(() => {
                    return self.registration.showNotification('LifePartner AI', {
                        body: `Reply sent: "${replyText}"`,
                        icon: '/icon.png',
                        silent: true
                    });
                })
                .catch(err => console.error('Failed to send reply from SW:', err))
        );
        return;
    }

    // 2. Like message action
    if (action === 'like_message') {
        if (!messageId) return;

        event.waitUntil(
            caches.open('auth-token')
                .then(cache => cache.match('/token'))
                .then(res => res ? res.text() : null)
                .then(token => {
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    return fetch(`${API_URL}/messages/${messageId}/like`, {
                        method: 'POST',
                        headers
                    });
                })
                .then(() => {
                    return self.registration.showNotification('LifePartner AI', {
                        body: 'Message liked! ❤️',
                        icon: '/icon.png',
                        silent: true
                    });
                })
                .catch(err => console.error('Failed to like message from SW:', err))
        );
        return;
    }

    // 3. Accept / Decline request action
    if (action === 'accept_request' || action === 'decline_request') {
        const actionType = action === 'accept_request' ? 'accept' : 'decline';
        if (!interactionId) return;

        event.waitUntil(
            caches.open('auth-token')
                .then(cache => cache.match('/token'))
                .then(res => res ? res.text() : null)
                .then(token => {
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    return fetch(`${API_URL}/interactions/requests/${interactionId}/${actionType}`, {
                        method: 'POST',
                        headers
                    });
                })
                .then(() => {
                    return self.registration.showNotification('Match Request Update', {
                        body: actionType === 'accept' ? 'You accepted the interest request! 🎉' : 'You declined the request.',
                        icon: '/icon.png'
                    });
                })
                .catch(err => console.error('Failed to process request action:', err))
        );
        return;
    }

    // 4. Default click: Open / focus target app window
    let targetUrl = payloadData.url || '/dashboard';
    if (!payloadData.url && senderId) {
        targetUrl = `/chat/${senderId}`;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes('/dashboard') || client.url.includes('/chat')) {
                    if ('navigate' in client) client.navigate(targetUrl);
                    if ('focus' in client) return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
