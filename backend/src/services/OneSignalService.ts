import axios from 'axios';

export class OneSignalService {
    private static instance: OneSignalService;
    private appId: string = '';
    private apiKey: string = '';
    private initialized = false;

    private constructor() {
        this.appId = process.env.ONESIGNAL_APP_ID || '';
        this.apiKey = process.env.ONESIGNAL_REST_API_KEY || '';

        if (this.appId && this.apiKey) {
            this.initialized = true;
            console.log('OneSignal Service Initialized ✓');
        } else {
            console.log('OneSignal: ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY not provided.');
        }
    }

    public static getInstance(): OneSignalService {
        if (!OneSignalService.instance) {
            OneSignalService.instance = new OneSignalService();
        }
        return OneSignalService.instance;
    }

    public isReady(): boolean {
        return this.initialized;
    }

    public getAppId(): string {
        return this.appId;
    }

    public async sendToUser(userId: string, title: string, body: string, data?: any): Promise<boolean> {
        if (!this.initialized) {
            return false;
        }

        try {
            const senderPhoto = data?.fromUserPhoto || data?.senderPhoto || data?.avatarUrl || null;
            let bannerUrl = data?.bannerUrl || null;
            if (bannerUrl && bannerUrl.startsWith('/')) {
                const frontendUrl = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
                const cleanBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
                bannerUrl = `${cleanBase}${bannerUrl}`;
            }

            const targetUrl = data?.url || 
                (data?.callerId ? `https://lifepartnerai.in/chat/${data.callerId}` : 
                (data?.senderId ? `https://lifepartnerai.in/chat/${data.senderId}` : 'https://lifepartnerai.in/dashboard'));

            const buttons: any[] = [];
            // If chat message, offer quick reply and like
            if (data?.senderId || data?.connId) {
                buttons.push(
                    { id: 'reply', text: 'Reply 💬', icon: 'ic_menu_send' },
                    { id: 'like', text: '❤️ Like' }
                );
            } else if (data?.type === 'request') {
                buttons.push(
                    { id: 'accept', text: 'Accept ✅' },
                    { id: 'decline', text: 'Decline ❌' }
                );
            } else if (data?.type === 'witty_reengagement') {
                buttons.push(
                    { id: 'matches', text: 'Swipe Matches 🔍' },
                    { id: 'guru', text: 'Ask Love Guru 🤖' }
                );
            }

            let subIds: string[] = [];
            try {
                const { prisma } = require('../prisma');
                const onesignalTokens = await prisma.device_tokens.findMany({
                    where: {
                        user_id: userId,
                        platform: 'onesignal'
                    },
                    select: { token: true }
                });
                subIds = onesignalTokens
                    .map((t: any) => t.token)
                    .filter((t: string) => t && t.length > 20 && !t.startsWith('{'));
            } catch (_) {}

            const payload: any = {
                app_id: this.appId,
                include_aliases: {
                    external_id: [userId]
                },
                target_channel: 'push',
                headings: { en: title },
                contents: { en: body },
                data: {
                    ...data,
                    url: targetUrl
                },
                url: targetUrl,
                web_url: targetUrl,
                app_url: targetUrl,
                priority: 10,
                android_visibility: 1,
                android_accent_color: 'FFFF4081'
            };

            if (subIds.length > 0) {
                payload.include_subscription_ids = subIds;
            }

            if (senderPhoto) {
                payload.large_icon = senderPhoto;
                payload.chrome_web_icon = senderPhoto;
                payload.firefox_icon = senderPhoto;
            }

            if (bannerUrl) {
                payload.big_picture = bannerUrl;
                payload.chrome_web_image = bannerUrl;
            }

            if (buttons.length > 0) {
                payload.buttons = buttons;
                payload.web_buttons = buttons;
            }

            const response = await axios.post('https://onesignal.com/api/v1/notifications', payload, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Key ${this.apiKey}`
                },
                timeout: 10000
            });

            if (response.data && response.data.id) {
                console.log(`[OneSignal] Sent notification ${response.data.id} to user ${userId}`);
                return true;
            }
            return false;
        } catch (err: any) {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            console.error('[OneSignal] Send failed:', errorMsg);
            return false;
        }
    }
}
