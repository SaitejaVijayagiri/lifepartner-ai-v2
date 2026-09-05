const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com';

let storyFeedCache: { data: any; timestamp: number } | null = null;

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: any = {
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (res.status === 413) {
        throw new Error("The file is too large! Please upload a smaller file (under 15MB).");
    }

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
    } else {
        const text = await res.text();
        throw new Error(`API Error ${res.status}: ${text.substring(0, 100)}`);
    }

    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            console.warn("Session expired. Redirecting to login.");
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '/login';
        }
        throw new Error('Session Expired. Please login again.');
    }

    if (!res.ok) throw new Error(data.error || `API Request Failed: ${res.status}`);
    return data;
}

export const api = {
    auth: {
        register: (data: any) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        login: (data: any) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
        logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
        sendOtp: (mobile: string) => fetchAPI('/auth/send-otp', { method: 'POST', body: JSON.stringify({ mobile }) }),
        verifyOtp: (payload: { email: string, otp: string }) => fetchAPI('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
        getToken: () => fetchAPI('/auth/token'),
    },
    profile: {
        getPublicFeatured: () => fetchAPI('/profile/public/featured'),
        updatePrompt: (payload: any) => fetchAPI('/profile/prompt', { method: 'POST', body: JSON.stringify(payload) }),
        getMe: () => fetchAPI('/profile/me'),
        updateProfile: (data: any) => fetchAPI('/profile/me', { method: 'PUT', body: JSON.stringify(data) }),
        uploadStory: (formData: FormData) => {
            storyFeedCache = null;
            return fetchAPI('/profile/stories', {
                method: 'POST',
                body: formData instanceof FormData ? formData : JSON.stringify(formData)
            });
        },
        toggleMute: (targetId: string) => fetchAPI(`/profile/mute/${targetId}`, { method: 'POST' }),
        getById: (id: string) => fetchAPI(`/profile/${id}`),
        getStoryFeed: async (forceRefresh = false) => {
            const now = Date.now();
            if (!forceRefresh && storyFeedCache && (now - storyFeedCache.timestamp < 30000)) {
                return storyFeedCache.data;
            }
            const data = await fetchAPI('/profile/stories/feed');
            storyFeedCache = { data, timestamp: now };
            return data;
        },
        likeStory: (targetUserId: string, storyId: string, liked: boolean) => fetchAPI(`/profile/stories/${targetUserId}/${storyId}/like`, { method: 'POST', body: JSON.stringify({ liked }) }),
        reactToStory: (targetUserId: string, storyId: string, emoji: string) => fetchAPI(`/profile/stories/${targetUserId}/${storyId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
        toggleStoryHighlight: (storyId: string) => fetchAPI(`/profile/stories/${storyId}/highlight`, { method: 'POST' }),
        deleteStory: (storyId: string) => {
            storyFeedCache = null;
            return fetchAPI(`/profile/stories/${storyId}`, { method: 'DELETE' });
        },
        trackStoryView: (targetUserId: string, storyId: string) => fetchAPI(`/profile/stories/${targetUserId}/${storyId}/view`, { method: 'POST' }),
        uploadVoiceBio: (formData: FormData) => fetchAPI('/profile/voice-bio', {
            method: 'POST',
            body: formData,
            headers: {}
        }),
        deactivateAccount: (days: number) => fetchAPI('/profile/deactivate', { method: 'POST', body: JSON.stringify({ days }) }),
        deleteAccount: () => fetchAPI('/profile/me', { method: 'DELETE' }),
    },
    matches: {
        getAll: (page: number = 1) => fetchAPI(`/matches/recommendations?page=${page}`),
        getMapUsers: () => fetchAPI('/matches/map-users'),
        search: (query: string) => fetchAPI('/matches/search', {
            method: 'POST',
            body: JSON.stringify({ query })
        }),
        runSimulation: (matchId: string) => fetchAPI(`/matches/${matchId}/simulation`, { method: 'POST' }),
        getPublicPreviews: (category: string, value: string) => fetchAPI(`/matches/public-preview?category=${category}&value=${value}`),
    },
    interactions: {
        getRequests: () => fetchAPI('/interactions/requests'),
        getUnreadCount: () => fetchAPI('/interactions/unread-count'),
        getCounts: () => fetchAPI('/interactions/counts'), // Fast: requestCount + unreadMessages in one shot
        getConnections: () => fetchAPI('/interactions/connections'),
        acceptRequest: (id: string) => fetchAPI(`/interactions/requests/${id}/accept`, { method: 'POST' }),
        declineRequest: (id: string) => fetchAPI(`/interactions/requests/${id}/decline`, { method: 'POST' }),
        sendInterest: (toUserId: string) => fetchAPI('/interactions/interest', {
            method: 'POST',
            body: JSON.stringify({ toUserId })
        }),
        revokeInterest: (toUserId: string) => fetchAPI(`/interactions/interest/${toUserId}`, { method: 'DELETE' }),
        sendLike: (toUserId: string) => fetchAPI('/interactions/like', {
            method: 'POST',
            body: JSON.stringify({ toUserId })
        }),
        revokeLike: (toUserId: string) => fetchAPI(`/interactions/like/${toUserId}`, { method: 'DELETE' }),
        deleteConnection: (id: string) => fetchAPI(`/interactions/connections/${id}`, { method: 'DELETE' }),
        contact: (data: any) => fetchAPI('/interactions/contact', { method: 'POST', body: JSON.stringify(data) }),
        whoLikedMe: () => fetchAPI('/interactions/who-liked-me'),
        getVisitors: () => fetchAPI('/interactions/visitors'),
        recordView: (targetId: string) => fetchAPI('/interactions/view', { method: 'POST', body: JSON.stringify({ targetId }) }),
        reportUser: (reportedId: string, reason: string, details: string) => fetchAPI('/reports', {
            method: 'POST',
            body: JSON.stringify({ reportedId, reason, details })
        }),
        sendDirectMessage: (toUserId: string, text: string) => fetchAPI('/interactions/direct', {
            method: 'POST',
            body: JSON.stringify({ toUserId, text })
        }),
    },
    chat: {
        getHistory: (connectionId: string) => fetchAPI(`/messages/${connectionId}/history`),
        clearHistory: (connectionId: string, mode: 'me' | 'everyone' = 'me') => fetchAPI(`/messages/${connectionId}/history?mode=${mode}`, { 
            method: 'DELETE',
            body: JSON.stringify({ mode })
        }),
        sendMessage: (connectionId: string, text: string, replyToId?: string, isIncognito?: boolean) => fetchAPI(`/messages/${connectionId}/send`, {
            method: 'POST',
            body: JSON.stringify({ text, replyToId, isIncognito })
        }),
        reactToMessage: (messageId: string, emoji: string) => fetchAPI(`/messages/${messageId}/react`, {
            method: 'POST',
            body: JSON.stringify({ emoji })
        }),
        likeMessage: (messageId: string) => fetchAPI(`/messages/${messageId}/like`, { method: 'POST' }),
        markRead: (connectionId: string) => fetchAPI(`/messages/${connectionId}/read`, { method: 'POST' }),
        uploadMedia: (file: File, onProgress?: (percent: number) => void): Promise<any> => {
            return new Promise((resolve, reject) => {
                const formData = new FormData();
                formData.append('file', file);
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_URL}/messages/upload-media`);

                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        onProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    let data = {};
                    try {
                        data = JSON.parse(xhr.responseText);
                    } catch (e) {
                        data = {};
                    }

                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        const errData = data as any;
                        const errorMsg = errData.details ? `${errData.error}: ${errData.details}` : (errData.error || 'Upload failed');
                        reject(new Error(errorMsg));
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network error during upload'));
                };

                xhr.send(formData);
            });
        },
        deleteMessage: (messageId: string, mode: 'me' | 'everyone') => fetchAPI(`/messages/${messageId}?mode=${mode}`, {
            method: 'DELETE',
            body: JSON.stringify({ mode })
        })
    },
    games: {
        start: (partnerId: string) => fetchAPI('/games/start', { method: 'POST', body: JSON.stringify({ partnerId }) }),
        startScenario: (partnerId: string) => fetchAPI('/games/scenario/start', { method: 'POST', body: JSON.stringify({ partnerId }) }),
        submitAnswer: (gameId: string, questionId: number, optionIndex: number, userId: string) => fetchAPI(`/games/${gameId}/answer`, {
            method: 'POST',
            body: JSON.stringify({ questionId, optionIndex, userId })
        })
    },
    payments: {
        createOrder: (amount: number, type: 'COINS' | 'PREMIUM' = 'COINS', coins: number = 0) =>
            fetchAPI('/payments/create-order', { method: 'POST', body: JSON.stringify({ amount, type, coins }) }),
        verifyPayment: (payload: any) => fetchAPI('/payments/verify', { method: 'POST', body: JSON.stringify(payload) })
    },
    notifications: {
        register: (token: string, platform: string) => fetchAPI('/notifications/register', {
            method: 'POST',
            body: JSON.stringify({ token, platform })
        }),
        registerSubscription: (subscription: any, platform: string = 'webpush') => fetchAPI('/notifications/register', {
            method: 'POST',
            body: JSON.stringify({ subscription, platform })
        }),
        getConfig: () => fetchAPI('/notifications/config').catch(() => null),
        unregister: (token: string) => fetchAPI('/notifications/unregister', {
            method: 'DELETE',
            body: JSON.stringify({ token })
        }),
        getAll: () => fetchAPI('/notifications'),
        markRead: (id: string) => fetchAPI(`/notifications/${id}/read`, { method: 'PUT' }),
        markAllRead: () => fetchAPI('/notifications/read-all', { method: 'PUT' }),
        remove: (id: string) => fetchAPI(`/notifications/${id}`, { method: 'DELETE' })
    },

    wallet: {
        getBalance: () => fetchAPI('/wallet/balance'),
        sendGift: (toUserId: string, giftId: string, cost: number) => fetchAPI('/wallet/gift', {
            method: 'POST',
            body: JSON.stringify({ toUserId, giftId, cost })
        }),
        boostProfile: () => fetchAPI('/wallet/boost', { method: 'POST' })
    },
    ai: {
        getIcebreaker: (targetUserId: string) => fetchAPI('/ai/icebreaker', {
            method: 'POST',
            body: JSON.stringify({ userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null, targetUserId })
        }),
        chat: (message: string, history: any[]) => fetchAPI('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, history })
        }),
        profileRoast: () => fetchAPI('/ai/profile-roast', { method: 'POST' })
    },
    calls: {
        getHistory: () => fetchAPI('/calls/history'),
        log: (data: any) => fetchAPI('/calls/log', { method: 'POST', body: JSON.stringify(data) })
    },
    admin: {
        getStats: () => fetchAPI('/admin/stats'),
        getUsers: (params: any = {}) => {
            const qs = new URLSearchParams(params).toString();
            return fetchAPI(`/admin/users?${qs}`);
        },
        getTransactions: (params: any = {}) => {
            const qs = new URLSearchParams(params).toString();
            return fetchAPI(`/admin/transactions?${qs}`);
        },
        getReports: () => fetchAPI('/admin/reports'),
        banUser: (userId: string, ban: boolean) => fetchAPI('/admin/ban', {
            method: 'POST',
            body: JSON.stringify({ userId, ban })
        }),
        resolveReport: (reportId: string, status: string) => fetchAPI('/admin/resolve-report', {
            method: 'POST',
            body: JSON.stringify({ reportId, status })
        }),
        sendCampaign: (body: { type: string; inviteEmails?: string[] }) => fetchAPI('/admin/send-campaign', {
            method: 'POST',
            body: JSON.stringify(body)
        }),
        getPhotosPending: () => fetchAPI('/admin/photos-pending'),
        moderatePhoto: (userId: string, action: 'approve' | 'reject') => fetchAPI('/admin/moderate-photo', {
            method: 'POST',
            body: JSON.stringify({ userId, action })
        }),
        getCampaignStats: () => fetchAPI('/notifications/campaign-stats')
    },
    events: {
        getAll: (lat?: number, lng?: number, filter?: string) => {
            const params = new URLSearchParams();
            if (lat !== undefined) params.append('lat', lat.toString());
            if (lng !== undefined) params.append('lng', lng.toString());
            if (filter) params.append('filter', filter);
            return fetchAPI(`/events?${params.toString()}`);
        },
        create: (data: any) => fetchAPI('/events', { method: 'POST', body: JSON.stringify(data) }),
        rsvp: (id: string) => fetchAPI(`/events/${id}/rsvp`, { method: 'POST' }),
        deleteEvent: (id: string) => fetchAPI(`/events/${id}`, { method: 'DELETE' }),
        editEvent: (id: string, data: any) => fetchAPI(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        getAttendees: (id: string) => fetchAPI(`/events/${id}/attendees`),
        fixDb: () => fetchAPI('/events/fix-db')
    },
    verification: {
        request: (documentUrl?: string) => fetchAPI('/verification/request', {
            method: 'POST',
            body: JSON.stringify({ documentUrl })
        }),
        getStatus: () => fetchAPI('/verification/status')
    },
    instants: {
        create: (payload: any) => fetchAPI('/instants', { method: 'POST', body: JSON.stringify(payload) }),
        getFeed: () => fetchAPI('/instants/feed'),
        getChat: (connectionId: string) => fetchAPI(`/instants/chat/${connectionId}`),
        view: (id: string) => fetchAPI(`/instants/${id}/view`, { method: 'POST' }),
        getViewers: (id: string) => fetchAPI(`/instants/${id}/viewers`),
        like: (id: string) => fetchAPI(`/instants/${id}/like`, { method: 'POST' }),
        reply: (id: string, text: string) => fetchAPI(`/instants/${id}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
        delete: (id: string) => fetchAPI(`/instants/${id}`, { method: 'DELETE' })
    },
    get: (endpoint: string) => fetchAPI(endpoint),
    post: (endpoint: string, data?: any) => fetchAPI(endpoint, {
        method: 'POST',
        body: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined
    }),
    delete: (endpoint: string) => fetchAPI(endpoint, { method: 'DELETE' })
};
