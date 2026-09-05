import * as admin from 'firebase-admin';
import path from 'path';
import { OneSignalService } from './OneSignalService';
import { WebPushService } from './WebPushService';

export class NotificationService {
    private static instance: NotificationService;
    private initialized = false;

    private constructor() {
        // Initialize OneSignal & WebPush singleton instances
        OneSignalService.getInstance();
        WebPushService.getInstance();

        try {
            if (admin.apps.length > 0) {
                this.initialized = true;
                console.log("Firebase Admin already initialized ✓");
                return;
            }

            // Priority 1: Environment variable (works everywhere)
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                console.log("Firebase: Found FIREBASE_SERVICE_ACCOUNT env var, initializing...");
                try {
                    let rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
                    const serviceAccount = JSON.parse(rawEnv);
                    if (serviceAccount.private_key) {
                        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                    }
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

                for (const p of possiblePaths) {
                    if (fs.existsSync(p)) {
                        admin.initializeApp({
                            credential: admin.credential.cert(JSON.parse(fs.readFileSync(p, 'utf8')))
                        });
                        this.initialized = true;
                        console.log(`Firebase Admin Initialized (File: ${p}) ✓`);
                        break;
                    }
                }
                if (!this.initialized) {
                    console.log("Firebase Push: Not configured or disabled. OneSignal / WebPush active.");
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
        return this.initialized || OneSignalService.getInstance().isReady() || WebPushService.getInstance().isReady();
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
            console.log(`[Push] To ${token}: ${title} - ${body}`);
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
        const { prisma } = require('../prisma');

        // Extract senderId to see if they are muted by the receiver
        const senderId = data?.from || data?.senderId;

        // Check global notification enabled setting & muted users from profile metadata
        const profile = await prisma.profiles.findUnique({
            where: { user_id: userId },
            select: { metadata: true }
        });
        const meta = (profile?.metadata as any) || {};

        // 1. Global in-app push notification toggle check
        if (meta.push_notifications_enabled === false || meta.notifications_enabled === false) {
            console.log(`[Notification Disabled] User ${userId} has disabled push notifications in app settings.`);
            return;
        }

        // 2. Specific chat / partner mute check
        if (senderId) {
            const mutedUsers = meta.muted_users || [];
            if (mutedUsers.includes(senderId)) {
                console.log(`[Notification Muted] User ${userId} has muted ${senderId}. Skipping push.`);
                return;
            }
        }

        const senderPhoto = data?.fromUserPhoto || data?.senderPhoto || data?.avatarUrl || null;
        let bannerUrl = data?.bannerUrl || null;
        if (bannerUrl && bannerUrl.startsWith('/')) {
            const frontendUrl = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
            const cleanBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
            bannerUrl = `${cleanBase}${bannerUrl}`;
        }

        const targetUrl = data?.url || (data?.callerId ? `/chat/${data.callerId}` : (data?.senderId ? `/chat/${data.senderId}` : '/dashboard?tab=connections'));

        // ==========================================
        // PROVIDER 1: OneSignal (Web & Mobile APK)
        // ==========================================
        const oneSignal = OneSignalService.getInstance();
        if (oneSignal.isReady()) {
            oneSignal.sendToUser(userId, title, body, {
                ...data,
                senderPhoto,
                bannerUrl,
                url: targetUrl
            }).catch(err => console.error('[OneSignal Error]:', err));
        }

        // ==========================================
        // PROVIDER 2: Standard W3C WebPush (VAPID)
        // ==========================================
        const webPush = WebPushService.getInstance();
        if (webPush.isReady()) {
            const webPayload = {
                title,
                body,
                icon: senderPhoto || '/icon.png',
                image: bannerUrl || null,
                data: {
                    ...data,
                    senderPhoto,
                    bannerUrl,
                    url: targetUrl
                }
            };
            webPush.sendToUser(userId, webPayload).catch(err => console.error('[WebPush Error]:', err));
        }

        // ==========================================
        // PROVIDER 3: FCM Multicast (Legacy Fallback)
        // ==========================================
        if (this.initialized) {
            try {
                const tokensRec = await prisma.device_tokens.findMany({
                    where: { 
                        user_id: userId,
                        platform: { in: ['android', 'ios', 'web'] }
                    },
                    select: { token: true, platform: true }
                });

                // Filter out non-FCM tokens (such as JSON WebPush subscriptions)
                const fcmTokens = Array.from(new Set(
                    tokensRec
                        .map((r: any) => r.token)
                        .filter((t: string) => !t.startsWith('{') && t.length > 20)
                ));

                if (fcmTokens.length > 0) {
                    const mappedData = data ? Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {}) : {};
                    const apnsPayload: any = {
                        payload: {
                            aps: {
                                alert: { title, body },
                                sound: 'default'
                            }
                        }
                    };
                    const webpushPayload: any = {
                        headers: {
                            Urgency: 'high',
                            TTL: '86400'
                        },
                        fcmOptions: {
                            link: targetUrl
                        }
                    };

                    if (bannerUrl) {
                        apnsPayload.payload.aps['mutable-content'] = 1;
                        apnsPayload.fcmOptions = { imageUrl: String(bannerUrl) };
                    } else if (senderPhoto) {
                        apnsPayload.payload.aps['mutable-content'] = 1;
                        apnsPayload.fcmOptions = { imageUrl: String(senderPhoto) };
                    }

                    const message: any = {
                        tokens: fcmTokens,
                        data: {
                            title: String(title),
                            body: String(body),
                            senderName: String(data?.senderName || title),
                            senderPhoto: senderPhoto ? String(senderPhoto) : '',
                            bannerUrl: bannerUrl ? String(bannerUrl) : '',
                            url: targetUrl,
                            ...mappedData
                        },
                        android: {
                            priority: 'high',
                            ttl: 86400 * 1000
                        },
                        apns: apnsPayload,
                        webpush: webpushPayload
                    };

                    const batchResponse = await admin.messaging().sendEachForMulticast(message);
                    console.log(`FCM Multicast: ${batchResponse.successCount} sent, ${batchResponse.failureCount} failed`);

                    if (batchResponse.failureCount > 0) {
                        const staleTokens: string[] = [];
                        batchResponse.responses.forEach((resp: any, idx: number) => {
                            if (!resp.success && resp.error) {
                                const code = resp.error.code;
                                if (code === 'messaging/registration-token-not-registered' || 
                                    code === 'messaging/invalid-registration-token') {
                                    staleTokens.push(fcmTokens[idx] as string);
                                }
                            }
                        });
                        if (staleTokens.length > 0) {
                            await prisma.device_tokens.deleteMany({
                                where: { token: { in: staleTokens } }
                            });
                        }
                    }
                }
            } catch (fcmErr) {
                console.error("FCM Multicast Error:", fcmErr);
            }
        }
    }
}
