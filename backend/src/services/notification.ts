
import * as admin from 'firebase-admin';
import path from 'path';

export class NotificationService {
    private static instance: NotificationService;
    private initialized = false;


    private constructor() {
        try {
            // Priority 1: Environment variable (works everywhere)
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                console.log("Firebase: Found FIREBASE_SERVICE_ACCOUNT env var, initializing...");
                try {
                    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                    this.initialized = true;
                    console.log("Firebase Admin Initialized (Env Var) ✓");
                } catch (parseErr) {
                    console.error("Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", parseErr);
                }
            } else {
                // Priority 2: Check multiple file locations
                const fs = require('fs');

                // PERFORMANCE: readdirSync is synchronous and runs at module load time.
                // Wrapped in try/catch so a filesystem error (permissions, etc.) never crashes Firebase init.
                let adminSdkFiles: string[] = [];
                try {
                    adminSdkFiles = fs.readdirSync(process.cwd())
                        .filter((f: string) => f.endsWith('.json') && f.includes('firebase-adminsdk'))
                        .map((f: string) => path.resolve(process.cwd(), f));
                } catch (_) { /* ignore if CWD is not readable */ }

                const possiblePaths = [
                    '/etc/secrets/firebase-service-account.json', // Render Secret Files
                    path.resolve(__dirname, '../../firebase-service-account.json'), // Local dev relative to dist/
                    path.resolve(process.cwd(), 'firebase-service-account.json'), // CWD (fallback)
                    ...adminSdkFiles,
                ];

                console.log("Firebase: No env var found, checking file paths...");
                let found = false;
                for (const p of possiblePaths) {
                    console.log(`Firebase: Checking ${p} ...`);
                    if (fs.existsSync(p)) {
                        console.log(`Firebase: Found file at ${p}`);
                        admin.initializeApp({
                            credential: admin.credential.cert(JSON.parse(fs.readFileSync(p, 'utf8')))
                        });
                        this.initialized = true;
                        console.log(`Firebase Admin Initialized (File: ${p}) ✓`);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.warn("Push Notifications DISABLED: No firebase-service-account.json found in any path, and no FIREBASE_SERVICE_ACCOUNT env var set.");
                }
            }
        } catch (e) {
            console.error("Firebase Init Failed:", e);
        }
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    public isReady(): boolean {
        return this.initialized;
    }

    public async sendvalidate(token: string): Promise<boolean> {
        if (!this.initialized) return false;
        try {
            await admin.messaging().send({
                token,
                notification: { title: 'Test', body: 'Validating token' },
            }, true); // dryRun
            return true;
        } catch (e) {
            return false;
        }
    }

    public async sendToToken(token: string, title: string, body: string, data?: any) {
        if (!this.initialized) {
            console.log(`[Mock Push] To ${token}: ${title} - ${body}`);
            return;
        }

        try {
            await admin.messaging().send({
                token,
                notification: { title, body },
                data: data ? Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {}) : {}
            });
            console.log(`Push sent to ${token}`);
        } catch (e) {
            console.error(`Push failed to ${token}`, e);
        }
    }

    public async sendToUser(userId: string, title: string, body: string, data?: any) {
        // 1. Get tokens and check mute status
        const { prisma } = require('../prisma');

        // Extract senderId to see if they are muted by the receiver
        const senderId = data?.from || data?.senderId;

        if (senderId) {
            const profile = await prisma.profiles.findUnique({
                where: { user_id: userId },
                select: { metadata: true }
            });
            const mutedUsers = (profile?.metadata as any)?.muted_users || [];
            if (mutedUsers.includes(senderId)) {
                console.log(`[Notification Muted] User ${userId} has muted ${senderId}. Skipping push.`);
                return;
            }
        }

        const tokensRec = await prisma.device_tokens.findMany({
            where: { user_id: userId },
            select: { token: true, platform: true }
        });

        if (tokensRec.length === 0) return;

        // Prioritize android token over web token to avoid duplicate push notifications on same device
        const hasAndroid = tokensRec.some((r: any) => r.platform === 'android');
        const filteredTokens = hasAndroid 
            ? tokensRec.filter((r: any) => r.platform === 'android')
            : tokensRec;

        const tokens = Array.from(new Set(filteredTokens.map((r: any) => r.token)));

        // 2. Send (Parallel)
        // If real firebase is off, we just mock log
        if (!this.initialized) {
            console.log(`[Mock Push] To User ${userId} (${tokens.length} devices): ${title}`);
            return;
        }

        // Multicast
        try {
            const mappedData = data ? Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {}) : {};
            const senderPhoto = data?.fromUserPhoto || data?.senderPhoto || data?.avatarUrl || null;
            let bannerUrl = data?.bannerUrl || null;
            if (bannerUrl && bannerUrl.startsWith('/')) {
                const frontendUrl = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
                const cleanBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
                bannerUrl = `${cleanBase}${bannerUrl}`;
            }
            const notificationPayload: any = {
                title: String(title),
                body: String(body)
            };
            
            const apnsPayload: any = {
                payload: {
                    aps: {
                        alert: { title, body },
                        sound: 'default'
                    }
                }
            };

            const webpushPayload: any = {
                notification: {
                    title: String(title),
                    body: String(body),
                    icon: senderPhoto ? String(senderPhoto) : 'https://lifepartnerai.in/icon.png',
                    badge: 'https://lifepartnerai.in/icon-192x192.png',
                    requireInteraction: true,
                    silent: false
                },
                headers: {
                    Urgency: 'high'
                }
            };

            if (bannerUrl) {
                webpushPayload.notification.image = String(bannerUrl);
            }

            // Add Accept/Decline action buttons for Web Push client natively
            if (data?.type === 'request' && data?.interactionId) {
                webpushPayload.notification.actions = [
                    { action: 'accept_request', title: 'Accept ✅' },
                    { action: 'decline_request', title: 'Decline ❌' }
                ];
            } else if (data?.type === 'match' && data?.messageId && data?.senderId) {
                webpushPayload.notification.actions = [
                    { action: 'like_message', title: 'Like ❤️' },
                    { action: 'reply_to_message', title: 'Reply 💬', type: 'text', placeholder: 'Type your reply...' }
                ];
            } else if (data?.type === 'witty_reengagement') {
                webpushPayload.notification.actions = [
                    { action: 'find_matches', title: 'Swipe Matches 🔍' },
                    { action: 'love_guru', title: 'Ask Love Guru 🤖' }
                ];
            } else if (data?.type === 'connection_online') {
                webpushPayload.notification.actions = [
                    { action: 'chat_now', title: 'Chat Now 💬' }
                ];
            }

            if (bannerUrl) {
                notificationPayload.imageUrl = String(bannerUrl);
                apnsPayload.payload.aps['mutable-content'] = 1;
                apnsPayload.fcmOptions = {
                    imageUrl: String(bannerUrl)
                };
            } else if (senderPhoto) {
                // Node.js SDK expects imageUrl (internally converted to image in REST API)
                notificationPayload.imageUrl = String(senderPhoto);

                // Enable rich media push on iOS
                apnsPayload.payload.aps['mutable-content'] = 1;
                apnsPayload.fcmOptions = {
                    imageUrl: String(senderPhoto)
                };
            }

            const androidPayload: any = {
                priority: 'high',
                notification: {
                    channelId: 'lifepartner_chat',
                    priority: 'max',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    visibility: 'public'
                }
            };

            if (bannerUrl || senderPhoto) {
                androidPayload.notification.imageUrl = String(bannerUrl || senderPhoto);
            }

            const message: any = {
                tokens,
                data: {
                    title: String(title),
                    body: String(body),
                    ...mappedData
                },
                android: androidPayload,
                apns: apnsPayload,
                webpush: webpushPayload
            };

            if (data?.type !== 'witty_reengagement') {
                message.notification = notificationPayload;
            }
            const batchResponse = await admin.messaging().sendEachForMulticast(message);
            console.log(`Sent ${batchResponse.successCount} messages, failed ${batchResponse.failureCount}`);

            // Automatically clean up stale/uninstalled tokens
            if (batchResponse.failureCount > 0) {
                const staleTokens: string[] = [];
                batchResponse.responses.forEach((resp: any, idx: number) => {
                    if (!resp.success && resp.error) {
                        const code = resp.error.code;
                        if (code === 'messaging/registration-token-not-registered' || 
                            code === 'messaging/invalid-registration-token') {
                            staleTokens.push(tokens[idx] as string);
                        }
                    }
                });
                if (staleTokens.length > 0) {
                    await prisma.device_tokens.deleteMany({
                        where: { token: { in: staleTokens } }
                    });
                    console.log(`Cleaned up ${staleTokens.length} stale FCM token(s) from database.`);
                }
            }
        } catch (e) {
            console.error("Multicast Push Failed", e);
        }
    }
}
