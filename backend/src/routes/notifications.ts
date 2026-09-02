
import express from 'express';
import { prisma } from '../prisma';
import { NotificationService } from '../services/notification';
import { authenticateToken } from '../middleware/auth';


const router = express.Router();
const notificationService = NotificationService.getInstance();

// 1. Register Token
router.post('/register', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const { token, platform } = req.body;
        if (!token) return res.status(400).json({ error: "Token required" });

        // Upsert (DO NOTHING on conflict)
        // Schema: @@id([user_id, token])
        await prisma.device_tokens.upsert({
            where: {
                user_id_token: { user_id: userId, token }
            },
            create: {
                user_id: userId,
                token,
                platform: platform || 'android'
            },
            update: {} // Do nothing if exists
        });

        // Ensure push_notifications_enabled is set to true in profile metadata
        try {
            const profile = await prisma.profiles.findUnique({ where: { user_id: userId } });
            if (profile) {
                const meta = (profile.metadata as any) || {};
                if (meta.push_notifications_enabled === false) {
                    await prisma.profiles.update({
                        where: { user_id: userId },
                        data: { metadata: { ...meta, push_notifications_enabled: true } }
                    });
                }
            }
        } catch (_) {}

        res.json({ success: true });
    } catch (e) {
        console.error("Token Register Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 2. Status Check (Admin: Firebase initialization + device token debug)
router.get('/status', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { email: true } });
        const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',');
        if (!user?.email || (!ADMIN_EMAILS.includes(user.email) && user.email !== 'admin@lifepartner.ai')) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const tokenCount = await prisma.device_tokens.count();
        const myTokens = await prisma.device_tokens.findMany({ where: { user_id: userId } });

        res.json({
            firebaseInitialized: notificationService.isReady(),
            hasFirebaseEnvVar: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            totalDeviceTokens: tokenCount,
            myTokens: myTokens.map((t: any) => ({ platform: t.platform, tokenPrefix: t.token.substring(0, 20) + '...' }))
        });
    } catch (e) {
        res.status(500).json({ error: "Failed" });
    }
});

// 3. Test Push (Admin Only)
router.post('/test', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Admin Check
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { email: true } });
        const email = user?.email;

        const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',');
        if (!email || (!ADMIN_EMAILS.includes(email) && email !== 'admin@lifepartner.ai')) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { title, body, type } = req.body;

        if (type === 'witty_reengagement') {
            const bannerUrl = "/images/campaigns/lunch.png";
            await notificationService.sendToUser(userId, title || "Eating Masala Dosa alone? 🍛", body || "Your future partner is doing the same. Swipe matches now!", {
                type: 'witty_reengagement',
                screen: 'matches',
                bannerUrl
            });
            try {
                const { getIO } = require('../socket');
                const io = getIO();
                io.to(userId).emit('notification:new', {
                    id: `sample-${Date.now()}`,
                    type: 'witty_reengagement',
                    message: title || "Eating Masala Dosa alone? 🍛",
                    body: body || "Your future partner is doing the same. Swipe matches now!",
                    bannerUrl,
                    timestamp: new Date()
                });
            } catch (_) {}
        } else {
            await notificationService.sendToUser(userId, title || "Test Notification", body || "This is a test from LifePartner AI");
        }

        res.json({ success: true, message: "Notification queued" });
    } catch (e) {
        console.error("Test Push Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 3. Get All Notifications
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Single query — fetch notifications and derive unread count in one shot, ignoring re-engagement push logs
        const notifications = await prisma.notifications.findMany({
            where: { user_id: userId, type: { not: 'witty_reengagement' } },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        const unreadCount = notifications.filter((n: any) => !n.is_read).length;

        res.json({ notifications, unreadCount });
    } catch (e) {
        console.error("Get Notifications Error", e);
        res.status(500).json({ error: "Failed" });
    }
});


// 4. Mark Read
router.put('/:id/read', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // updateMany to ensure ownership check via where clause
        await prisma.notifications.updateMany({
            where: {
                id,
                user_id: userId
            },
            data: { is_read: true }
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed" });
    }
});

// 5. Unregister Token (disable push notifications)
router.delete('/unregister', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { token } = req.body || {};

        if (token) {
            await prisma.device_tokens.deleteMany({
                where: { user_id: userId, token }
            });
        } else {
            await prisma.device_tokens.deleteMany({
                where: { user_id: userId }
            });
        }

        // Persist push_notifications_enabled: false in profile metadata
        try {
            const profile = await prisma.profiles.findUnique({ where: { user_id: userId } });
            if (profile) {
                const meta = (profile.metadata as any) || {};
                await prisma.profiles.update({
                    where: { user_id: userId },
                    data: { metadata: { ...meta, push_notifications_enabled: false } }
                });
            }
        } catch (_) {}

        res.json({ success: true });
    } catch (e) {
        console.error("Token Unregister Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 6. Mark All Read
router.put('/read-all', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        await prisma.notifications.updateMany({
            where: { user_id: userId },
            data: { is_read: true }
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed" });
    }
});

// 7. Delete a single notification
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        await prisma.notifications.deleteMany({
            where: { id, user_id: userId }
        });

        res.json({ success: true });
    } catch (e) {
        console.error("Delete Notification Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// 8. Track Push Notification Click (Public endpoint for Service Worker background reporting)
router.post('/:id/click', async (req: any, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        const notification = await prisma.notifications.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const currentData = (notification.data as any) || {};

        await prisma.notifications.update({
            where: { id },
            data: {
                is_read: true,
                data: {
                    ...currentData,
                    clicked: true,
                    clickedAt: new Date().toISOString(),
                    clickAction: action || 'click'
                }
            }
        });

        console.log(`[Notification Tracker] Recorded click for notification ${id} (Action: ${action || 'default'})`);
        res.json({ success: true });
    } catch (e) {
        console.error("Track Click Error", e);
        res.status(500).json({ error: "Failed to record click" });
    }
});

// 9. Campaign Stats (Admin Only)
router.get('/campaign-stats', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { email: true } });
        const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',');
        if (!user?.email || (!ADMIN_EMAILS.includes(user.email) && user.email !== 'admin@lifepartner.ai')) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const notifications = await prisma.notifications.findMany({
            where: { type: 'witty_reengagement' },
            orderBy: { created_at: 'desc' }
        });

        const totalSent = notifications.length;
        const clickedNotifications = notifications.filter((n: any) => {
            const d = (n.data as any) || {};
            return d.clicked === true;
        });
        const totalClicked = clickedNotifications.length;
        const ctr = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) + '%' : '0%';

        // Breakdown by action
        const actionBreakdown: Record<string, number> = {};
        clickedNotifications.forEach((n: any) => {
            const d = (n.data as any) || {};
            const action = d.clickAction || 'body_click';
            actionBreakdown[action] = (actionBreakdown[action] || 0) + 1;
        });

        res.json({
            totalSent,
            totalClicked,
            ctr,
            actionBreakdown,
            recentCampaigns: notifications.slice(0, 50).map((n: any) => {
                const d = (n.data as any) || {};
                return {
                    id: n.id,
                    userId: n.user_id,
                    title: n.message,
                    sentAt: n.created_at,
                    clicked: !!d.clicked,
                    clickedAt: d.clickedAt || null,
                    action: d.clickAction || null
                };
            })
        });
    } catch (e) {
        console.error("Get Campaign Stats Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

/**
 * GET /api/notifications/smart-reengagement
 * Dynamic re-engagement notification generator for active user sessions
 */
router.get('/smart-reengagement', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const [user, profile, activeMatch] = await Promise.all([
            prisma.users.findUnique({ where: { id: userId }, select: { full_name: true, coins: true } }),
            prisma.profiles.findUnique({ where: { user_id: userId }, select: { metadata: true } }),
            prisma.users.findFirst({
                where: { id: { not: userId }, avatar_url: { not: null } },
                select: { full_name: true, city: true }
            })
        ]);

        const meta: any = profile?.metadata || {};
        const streakData = meta.daily_streak || { last_claimed_date: null };
        const todayStr = new Date().toISOString().split('T')[0];
        const canClaimStreak = streakData.last_claimed_date !== todayStr;

        const prompts = [];

        if (canClaimStreak) {
            prompts.push({
                id: 'prompt_streak',
                type: 'streak',
                title: '🎁 Unclaimed Daily Coins Waiting!',
                message: 'Claim your daily login reward to unlock free Super Likes & Profile Boosts.',
                actionText: 'Claim Reward',
                actionUrl: '/dashboard'
            });
        }

        if (activeMatch) {
            prompts.push({
                id: 'prompt_match',
                type: 'match_alert',
                title: `✨ High Compatibility Match Active!`,
                message: `${activeMatch.full_name || 'A verified single'} in ${activeMatch.city || 'your area'} is currently active!`,
                actionText: 'View Match',
                actionUrl: '/dashboard'
            });
        }

        prompts.push({
            id: 'prompt_speed_date',
            type: 'speed_date',
            title: '🔴 Live Speed Dating Roulette',
            message: 'Singles are waiting in the 3-minute quick date queue. Jump in now!',
            actionText: 'Join Live',
            actionUrl: '/dashboard'
        });

        return res.json({
            success: true,
            count: prompts.length,
            notifications: prompts
        });
    } catch (e: any) {
        return res.status(500).json({ error: 'Failed to generate re-engagement notifications' });
    }
});

export default router;
