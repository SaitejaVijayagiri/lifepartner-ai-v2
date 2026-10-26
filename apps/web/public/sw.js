// LifePartner AI Service Worker (W3C Web Push & Notification Actions)

self.addEventListener('push', function (event) {
    if (!event.data) return;

    try {
        const payload = event.data.json();
        if (payload.ping || payload.silent) {
            return;
        }
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

        // Actions for Request, Call, Chat, and Campaign
        if (data.type === 'request') {
            options.actions = [
                { action: 'accept_request', title: 'Connect 💖' },
                { action: 'decline_request', title: 'Not Now' }
            ];
        } else if (data.type === 'incoming_call') {
            options.actions = [
                { action: 'answer_call', title: 'Answer 📞' },
                { action: 'decline_call', title: 'Decline ❌' }
            ];
        } else if (data.type === 'match') {
            options.actions = [
                { action: 'open_chat', title: 'Chat Now 💬' }
            ];
        } else if (data.type === 'message' || data.type === 'chat' || data.senderId || data.connId || data.from || data.fromUserId) {
            const actions = [];
            if (data.messageId) {
                actions.push({ action: 'like_message', title: 'Like ❤️' });
            }
            actions.push({ action: 'reply_to_message', title: 'Reply 💬', type: 'text', placeholder: 'Type your reply...' });
            options.actions = actions;
        } else if (data.type === 'witty_reengagement') {
            options.actions = [
                { action: 'find_matches', title: 'Swipe Matches 🔍' },
                { action: 'love_guru', title: 'Ask Love Guru 🤖' }
            ];
        }

        const pushPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const incomingSender = data.senderId || data.connId || data.from || data.fromUserId;
            
            // Only suppress system push notification if the user is actively viewing this sender's chat in a focused window
            if (incomingSender) {
                const isActivelyChatting = clientList.some(client => 
                    client.focused && (
                        client.url.includes(`/chat/${incomingSender}`) || 
                        client.url.includes(`chatId=${incomingSender}`)
                    )
                );
                if (isActivelyChatting) {
                    console.log('[SW] User is actively chatting with this sender in focused window. Suppressing push notification.');
                    return;
                }
            }

            // WhatsApp-style notification stacking for chat messages
            const tag = incomingSender ? `chat_${incomingSender}` : (data.notificationId || 'lifepartner_alert');
            options.tag = tag;

            return self.registration.getNotifications({ tag }).then(existingNotifications => {
                let finalTitle = title;
                let finalBody = options.body;
                if (existingNotifications && existingNotifications.length > 0 && incomingSender) {
                    const existing = existingNotifications[0];
                    const existingList = (existing.data && existing.data.stacked) || [existing.body];
                    const updatedList = [...existingList, options.body].slice(-4);
                    finalTitle = `${title} (${updatedList.length} messages)`;
                    finalBody = updatedList.join('\n');
                    options.data = { ...options.data, stacked: updatedList };
                }
                return self.registration.showNotification(finalTitle, { ...options, body: finalBody });
            });
        });

        event.waitUntil(pushPromise);
    } catch (err) {
        console.error('Error handling push event:', err);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const payloadData = event.notification.data || {};
    const action = event.action;
    const senderId = payloadData.senderId || payloadData.connId || payloadData.from || payloadData.fromUserId;
    const messageId = payloadData.messageId;
    const interactionId = payloadData.interactionId;
    const origin = self.location.origin;
    const API_URL = (origin.includes('localhost') || origin.includes('127.0.0.1'))
        ? 'http://localhost:4000'
        : (origin.includes('10.0.2.2') ? 'http://10.0.2.2:4000' : 'https://lifepartner-ai.onrender.com');

    // 1. Inline quick reply action
    if (action === 'reply_to_message') {
        const replyText = event.reply;
        if (!replyText) {
            // Browser does not support inline reply input or user tapped reply without typing:
            // Fall back to opening the chat window directly
            const targetUrl = senderId ? `/dashboard?tab=connections&chatId=${senderId}` : '/dashboard';
            event.waitUntil(
                clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                    for (let i = 0; i < windowClients.length; i++) {
                        const client = windowClients[i];
                        if (client.url.includes('/dashboard') || client.url.includes('/chat')) {
                            if ('navigate' in client) client.navigate(targetUrl);
                            if ('focus' in client) return client.focus();
                        }
                    }
                    if (clients.openWindow) return clients.openWindow(targetUrl);
                })
            );
            return;
        }

        if (!senderId) return;

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
                .then(response => {
                    if (!response || !response.ok) {
                        throw new Error(`Failed to send reply HTTP status: ${response ? response.status : 'offline'}`);
                    }
                    return self.registration.showNotification('LifePartner AI', {
                        body: `Reply sent: "${replyText}"`,
                        icon: '/icon.png',
                        silent: true
                    });
                })
                .catch(err => {
                    console.error('Failed to send reply from SW (offline), queueing:', err);
                    return caches.open('offline-actions').then(cache => {
                        const item = { type: 'reply', connId: senderId, text: replyText, timestamp: Date.now() };
                        return cache.put('/reply_' + Date.now(), new Response(JSON.stringify(item)));
                    }).then(() => {
                        return self.registration.showNotification('LifePartner AI', {
                            body: `Reply queued: "${replyText}" (will send when online)`,
                            icon: '/icon.png',
                            silent: true
                        });
                    });
                })
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
                .then(response => {
                    if (!response || !response.ok) {
                        throw new Error(`Failed to like message HTTP status: ${response ? response.status : 'offline'}`);
                    }
                    return self.registration.showNotification('LifePartner AI', {
                        body: 'Message liked! ❤️',
                        icon: '/icon.png',
                        silent: true
                    });
                })
                .catch(err => {
                    console.error('Failed to like message from SW (offline), queueing:', err);
                    return caches.open('offline-actions').then(cache => {
                        const item = { type: 'like', messageId, timestamp: Date.now() };
                        return cache.put('/like_' + Date.now(), new Response(JSON.stringify(item)));
                    }).then(() => {
                        return self.registration.showNotification('LifePartner AI', {
                            body: 'Message liked! ❤️ (will sync when online)',
                            icon: '/icon.png',
                            silent: true
                        });
                    });
                })
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
                .catch(err => {
                    console.error('Failed to process request action (offline), queueing:', err);
                    return caches.open('offline-actions').then(cache => {
                        const item = { type: 'request', interactionId, action: actionType, timestamp: Date.now() };
                        return cache.put('/req_' + Date.now(), new Response(JSON.stringify(item)));
                    }).then(() => {
                        return self.registration.showNotification('Match Request Update', {
                            body: actionType === 'accept' ? 'Request accepted (will sync when online) ✅' : 'Request declined (will sync when online) ❌',
                            icon: '/icon.png'
                        });
                    });
                })
        );
        return;
    }

    // 3.5. Decline call action
    if (action === 'decline_call') {
        return;
    }

    // 3.6. Answer call action or incoming call tap
    if (action === 'answer_call' || (payloadData.type === 'incoming_call' && !action)) {
        const callerId = payloadData.callerId || payloadData.senderId || payloadData.from;
        const callerName = payloadData.callerName || payloadData.senderName || 'Partner';
        const callerPhoto = payloadData.callerPhoto || payloadData.senderPhoto || '';
        const callType = payloadData.callType || 'video';
        
        const targetUrl = callerId
            ? `/chat/${callerId}?action=answer_call&callType=${callType}&callerName=${encodeURIComponent(callerName)}&callerPhoto=${encodeURIComponent(callerPhoto)}`
            : '/dashboard?tab=connections';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes('/chat') || client.url.includes('/dashboard')) {
                        if ('navigate' in client) client.navigate(targetUrl);
                        if ('focus' in client) return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(targetUrl);
            })
        );
        return;
    }

    // 3.7. Match connection tap or Chat Now button
    if (action === 'open_chat' || (payloadData.type === 'match' && !action)) {
        const targetPartnerId = payloadData.senderId || payloadData.connId || payloadData.fromUserId || payloadData.from;
        const targetUrl = payloadData.url || (targetPartnerId ? `/chat/${targetPartnerId}` : '/dashboard?tab=connections');

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes('/chat') || client.url.includes('/dashboard')) {
                        if ('navigate' in client) client.navigate(targetUrl);
                        if ('focus' in client) return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(targetUrl);
            })
        );
        return;
    }

    // 4. Default click: Open / focus target app window
    let targetUrl = payloadData.url || '/dashboard';
    if (!payloadData.url && senderId) {
        targetUrl = `/chat/${senderId}`;
    } else if (!payloadData.url && (payloadData.type === 'like' || payloadData.type === 'view') && (payloadData.fromUserId || payloadData.from)) {
        const id = payloadData.fromUserId || payloadData.from;
        targetUrl = `/dashboard?tab=matches&viewProfile=${id}`;
    } else if (!payloadData.url && payloadData.type === 'request' && (payloadData.fromUserId || payloadData.from)) {
        const id = payloadData.fromUserId || payloadData.from;
        targetUrl = `/dashboard?tab=requests&viewProfile=${id}`;
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

// 5. Offline Queue Synchronization (Background Sync & Active Wakeup)
async function flushOfflineActions() {
    try {
        if (!('caches' in self)) return;
        const cache = await caches.open('offline-actions');
        const keys = await cache.keys();
        if (!keys || keys.length === 0) return;

        const tokenRes = await caches.open('auth-token').then(c => c.match('/token')).catch(() => null);
        const token = tokenRes ? await tokenRes.text() : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const origin = self.location.origin;
        const API_URL = origin.includes('localhost') ? 'http://localhost:4000' : 'https://lifepartner-ai.onrender.com';

        for (const req of keys) {
            try {
                const res = await cache.match(req);
                if (!res) continue;
                const item = await res.json();

                if (item.type === 'reply' && item.connId && item.text) {
                    const sendRes = await fetch(`${API_URL}/messages/${item.connId}/send`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ text: item.text })
                    });
                    if (sendRes.ok) {
                        await cache.delete(req);
                        console.log('[SW Sync] Queued reply delivered to:', item.connId);
                    }
                } else if (item.type === 'like' && item.messageId) {
                    const likeRes = await fetch(`${API_URL}/messages/${item.messageId}/like`, {
                        method: 'POST',
                        headers
                    });
                    if (likeRes.ok) {
                        await cache.delete(req);
                        console.log('[SW Sync] Queued like synced for message:', item.messageId);
                    }
                } else if (item.type === 'request' && item.interactionId && item.action) {
                    const reqRes = await fetch(`${API_URL}/interactions/requests/${item.interactionId}/${item.action}`, {
                        method: 'POST',
                        headers
                    });
                    if (reqRes.ok) {
                        await cache.delete(req);
                        console.log('[SW Sync] Queued request synced for interaction:', item.interactionId);
                    }
                }
            } catch (err) {
                console.warn('[SW Sync] Action sync failed (will retry):', err);
            }
        }
    } catch (e) {
        console.warn('[SW Sync] Error flushing offline actions:', e);
    }
}

self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-offline-actions' || event.tag === 'offline-sync') {
        event.waitUntil(flushOfflineActions());
    }
});

self.addEventListener('activate', function(event) {
    event.waitUntil(flushOfflineActions());
});

