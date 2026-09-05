import webpush from 'web-push';
import { prisma } from '../prisma';

export class WebPushService {
    private static instance: WebPushService;
    private initialized = false;
    private publicKey: string = '';

    private constructor() {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;
        const subject = process.env.VAPID_SUBJECT || 'mailto:support@lifepartnerai.in';

        if (publicKey && privateKey) {
            try {
                webpush.setVapidDetails(subject, publicKey, privateKey);
                this.publicKey = publicKey;
                this.initialized = true;
                console.log('WebPush (VAPID) Initialized successfully ✓');
            } catch (err) {
                console.error('WebPush VAPID Init Failed:', err);
            }
        } else {
            console.warn('WebPush: VAPID keys not found in environment.');
        }
    }

    public static getInstance(): WebPushService {
        if (!WebPushService.instance) {
            WebPushService.instance = new WebPushService();
        }
        return WebPushService.instance;
    }

    public isReady(): boolean {
        return this.initialized;
    }

    public getPublicKey(): string {
        return this.publicKey;
    }

    public async sendToSubscription(subscription: any, payload: any): Promise<boolean> {
        if (!this.initialized) return false;
        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify(payload),
                {
                    TTL: 86400,
                    urgency: 'high'
                }
            );
            return true;
        } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
                // Subscription is expired or gone
                return false;
            }
            console.error('WebPush sendNotification error:', err.message || err);
            return false;
        }
    }

    public async sendToUser(userId: string, payload: any): Promise<number> {
        if (!this.initialized) return 0;

        try {
            // Find subscriptions registered for this user
            const tokens = await prisma.device_tokens.findMany({
                where: {
                    user_id: userId,
                    platform: { in: ['web', 'webpush'] }
                }
            });

            if (!tokens || tokens.length === 0) return 0;

            let sentCount = 0;
            const expiredTokens: string[] = [];

            for (const record of tokens) {
                try {
                    // Try parsing token as JSON subscription
                    let subObj: any = null;
                    if (record.token.startsWith('{')) {
                        subObj = JSON.parse(record.token);
                    }

                    if (subObj && subObj.endpoint) {
                        const ok = await this.sendToSubscription(subObj, payload);
                        if (ok) {
                            sentCount++;
                        } else {
                            expiredTokens.push(record.token);
                        }
                    }
                } catch (_) {
                    // Not a valid JSON subscription string (e.g. legacy token)
                }
            }

            // Cleanup expired subscriptions
            if (expiredTokens.length > 0) {
                await prisma.device_tokens.deleteMany({
                    where: { token: { in: expiredTokens } }
                });
                console.log(`Cleaned up ${expiredTokens.length} expired WebPush subscription(s).`);
            }

            return sentCount;
        } catch (err) {
            console.error('WebPush sendToUser error:', err);
            return 0;
        }
    }
}
