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
                    path.resolve(process.cwd(), 'backend/firebase-service-account.json'), // Repo root
                    path.resolve(process.cwd(), 'firebase-service-account.json'), // CWD
                    path.resolve(__dirname, '../../firebase-service-account.json'), // Local dev relative to dist/
                    path.resolve(__dirname, '../firebase-service-account.json'), // Local dev relative to src/
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
        const senderId = data?.from || data?.senderId || data?.fromUserId || data?.connId || data?.callerId;

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

        const senderPhoto = data?.fromUserPhoto || data?.senderPhoto || data?.avatarUrl || data?.callerPhoto || null;
        let bannerUrl = data?.bannerUrl || null;
        if (bannerUrl && bannerUrl.startsWith('/')) {
            const frontendUrl = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
            const cleanBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
            bannerUrl = `${cleanBase}${bannerUrl}`;
        }

        const rawSenderName = data?.senderName || data?.callerName || data?.fromUserName || title;
        const cleanSenderName = (rawSenderName && typeof rawSenderName === 'string') 
            ? rawSenderName.replace(/^(New message from|Message from)\s+/i, '').trim() 
            : '';

        const targetUrl = data?.url || (
            data?.callerId 
                ? `/chat/${data.callerId}?action=answer_call&callType=${data?.callType || 'video'}&callerId=${encodeURIComponent(String(data.callerId))}&callerName=${encodeURIComponent(cleanSenderName)}&callerPhoto=${encodeURIComponent(senderPhoto || '')}&partnerName=${encodeURIComponent(cleanSenderName)}&partnerPhoto=${encodeURIComponent(senderPhoto || '')}` 
                : (senderId 
                    ? `/chat/${senderId}?partnerName=${encodeURIComponent(cleanSenderName)}&partnerPhoto=${encodeURIComponent(senderPhoto || '')}&name=${encodeURIComponent(cleanSenderName)}&photo=${encodeURIComponent(senderPhoto || '')}` 
                    : '/dashboard?tab=connections')
        );

        // Standardized interactive actions across all web push providers
        const isRequest = data?.type === 'request';
        const isCall = data?.type === 'incoming_call';
        const isMatch = data?.type === 'match';
        const isChatMessage = data?.type === 'message' || data?.type === 'chat' || (!isRequest && !isCall && !isMatch && !!senderId);

        let notificationActions: any[] | undefined = undefined;
        if (isRequest) {
            notificationActions = [
                { action: 'accept_request', title: 'Connect 💖' },
                { action: 'decline_request', title: 'Not Now' }
            ];
        } else if (isCall) {
            notificationActions = [
                { action: 'answer_call', title: 'Answer 📞' },
                { action: 'decline_call', title: 'Decline ❌' }
            ];
        } else if (isMatch) {
            notificationActions = [
                { action: 'open_chat', title: 'Chat Now 💬' }
            ];
        } else if (isChatMessage && senderId) {
            notificationActions = [
                ...(data?.messageId ? [{ action: 'like_message', title: 'Like ❤️' }] : []),
                { action: 'reply_to_message', title: 'Reply 💬', type: 'text', placeholder: 'Type your reply...' }
            ];
        }

        // ==========================================
        // 1. Fetch user's registered device tokens & channel audit
        // ==========================================
        const tokensRec = await prisma.device_tokens.findMany({
            where: { user_id: userId },
            select: { token: true, platform: true }
        });

        const androidTokens = Array.from(new Set(
            tokensRec
                .filter((r: any) => r.platform === 'android')
                .map((r: any) => r.token)
                .filter((t: string) => !t.startsWith('{') && t.length > 20)
        ));

        const hasWebPushTokens = tokensRec.some((r: any) => r.platform === 'webpush' || r.token.startsWith('{'));
        const onesignalRecords = tokensRec.filter((r: any) => r.platform === 'onesignal');
        const legacyWebTokens = Array.from(new Set(
            tokensRec
                .filter((r: any) => r.platform === 'web' && !r.token.startsWith('{'))
                .map((r: any) => r.token)
                .filter((t: string) => t.length > 20)
        ));
        const iosTokens = Array.from(new Set(
            tokensRec
                .filter((r: any) => r.platform === 'ios')
                .map((r: any) => r.token)
                .filter((t: string) => !t.startsWith('{') && t.length > 20)
        ));

        let webPushDispatched = false;
        let androidDispatched = false;

        // ==========================================
        // PROVIDER 1: Standard W3C WebPush (VAPID)
        // Primary, high-fidelity channel for all web browsers (Chrome, Edge, Safari, Firefox)
        // ==========================================
        const webPush = WebPushService.getInstance();
        if (webPush.isReady() && hasWebPushTokens) {
            const webPayload = {
                title,
                body,
                icon: senderPhoto || '/icon.png',
                image: bannerUrl || null,
                actions: notificationActions,
                data: {
                    ...data,
                    senderId: senderId || data?.senderId,
                    connId: senderId || data?.connId,
                    senderName: cleanSenderName || data?.senderName,
                    senderPhoto,
                    bannerUrl,
                    url: targetUrl
                }
            };
            const sent = await webPush.sendToUser(userId, webPayload).catch(err => {
                console.error('[WebPush Error]:', err);
                return 0;
            });
            if (sent > 0) {
                webPushDispatched = true;
            }
        }

        // ==========================================
        // PROVIDER 2: Android Native (FCM Multicast)
        // High-priority DATA-ONLY message for native Android APK with lockscreen inline replies
        // ==========================================
        if (this.initialized) {
            try {
                const defaultAppLogo = 'https://lifepartnerai.in/icon-512x512.png';
                const displayImage = bannerUrl || senderPhoto || defaultAppLogo;
                const mappedData = data ? Object.keys(data).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {}) : {};

                if (androidTokens.length > 0) {
                    androidDispatched = true;
                    const androidMessage: any = {
                        tokens: androidTokens,
                        data: {
                            title: String(title),
                            body: String(body),
                            type: String(data?.type || 'message'),
                            interactionId: String(data?.interactionId || ''),
                            senderId: String(senderId || ''),
                            connId: String(senderId || ''),
                            senderName: String(cleanSenderName || data?.senderName || data?.callerName || title),
                            callerId: String(data?.callerId || senderId || ''),
                            callerName: String(data?.callerName || data?.senderName || ''),
                            callerPhoto: senderPhoto ? String(senderPhoto) : defaultAppLogo,
                            callType: String(data?.callType || 'video'),
                            senderPhoto: senderPhoto ? String(senderPhoto) : defaultAppLogo,
                            bannerUrl: bannerUrl ? String(bannerUrl) : '',
                            url: targetUrl,
                            messageId: String(data?.messageId || ''),
                            ...mappedData
                        },
                        android: {
                            priority: 'high',
                            ttl: 86400 * 1000
                        }
                    };

                    const androidBatchResp = await admin.messaging().sendEachForMulticast(androidMessage);
                    console.log(`FCM Android (Data-Only Native Actions): ${androidBatchResp.successCount} sent, ${androidBatchResp.failureCount} failed`);

                    if (androidBatchResp.failureCount > 0) {
                        const staleTokens: string[] = [];
                        androidBatchResp.responses.forEach((resp: any, idx: number) => {
                            if (!resp.success && resp.error) {
                                const code = resp.error.code;
                                if (code === 'messaging/registration-token-not-registered' || 
                                    code === 'messaging/invalid-registration-token') {
                                    staleTokens.push(androidTokens[idx] as string);
                                }
                            }
                        });
                        if (staleTokens.length > 0) {
                            await prisma.device_tokens.deleteMany({
                                where: { token: { in: staleTokens } }
                            }).catch(() => {});
                        }
                    }
                }

                // B. iOS & Legacy Web FCM Fallback:
                // Only send to legacy web tokens if WebPush VAPID was NOT already dispatched
                const eligibleOtherTokens = Array.from(new Set([
                    ...iosTokens,
                    ...(!webPushDispatched ? legacyWebTokens : [])
                ]));

                if (eligibleOtherTokens.length > 0) {
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
                        notification: {
                            title: String(title),
                            body: String(body),
                            icon: senderPhoto ? String(senderPhoto) : '/icon.png',
                            image: bannerUrl ? String(bannerUrl) : undefined,
                            actions: notificationActions
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

                    const otherMessage: any = {
                        tokens: eligibleOtherTokens,
                        notification: {
                            title: String(title),
                            body: String(body),
                            imageUrl: displayImage
                        },
                        data: {
                            title: String(title),
                            body: String(body),
                            senderName: String(data?.senderName || title),
                            senderPhoto: senderPhoto ? String(senderPhoto) : defaultAppLogo,
                            bannerUrl: bannerUrl ? String(bannerUrl) : '',
                            url: targetUrl,
                            ...mappedData
                        },
                        apns: apnsPayload,
                        webpush: webpushPayload
                    };

                    const otherBatchResp = await admin.messaging().sendEachForMulticast(otherMessage);
                    console.log(`FCM iOS/Web: ${otherBatchResp.successCount} sent, ${otherBatchResp.failureCount} failed`);

                    if (otherBatchResp.successCount > 0 && legacyWebTokens.length > 0) {
                        webPushDispatched = true;
                    }

                    if (otherBatchResp.failureCount > 0) {
                        const staleTokens: string[] = [];
                        otherBatchResp.responses.forEach((resp: any, idx: number) => {
                            if (!resp.success && resp.error) {
                                const code = resp.error.code;
                                if (code === 'messaging/registration-token-not-registered' || 
                                    code === 'messaging/invalid-registration-token') {
                                    staleTokens.push(eligibleOtherTokens[idx] as string);
                                }
                            }
                        });
                        if (staleTokens.length > 0) {
                            await prisma.device_tokens.deleteMany({
                                where: { token: { in: staleTokens } }
                            }).catch(() => {});
                        }
                    }
                }
            } catch (fcmErr) {
                console.error("FCM Multicast Error:", fcmErr);
            }
        }

        // ==========================================
        // PROVIDER 3: OneSignal Fallback
        // Only deliver via OneSignal if the user hasn't already received the notification
        // via Native Android FCM or WebPush (strictly prevents duplicate notifications on the same device)
        // ==========================================
        const oneSignal = OneSignalService.getInstance();
        if (oneSignal.isReady()) {
            const hasExplicitOneSignal = onesignalRecords.length > 0;
            const alreadyDispatched = androidDispatched || webPushDispatched;
            if (!alreadyDispatched && (hasExplicitOneSignal || onesignalRecords.length > 0)) {
                oneSignal.sendToUser(userId, title, body, {
                    ...data,
                    title: String(title),
                    body: String(body),
                    senderId: senderId || data?.senderId,
                    connId: senderId || data?.connId,
                    senderName: cleanSenderName || data?.senderName,
                    senderPhoto,
                    bannerUrl,
                    url: targetUrl
                }).catch(err => console.error('[OneSignal Error]:', err));
            }
        }
    }
}
