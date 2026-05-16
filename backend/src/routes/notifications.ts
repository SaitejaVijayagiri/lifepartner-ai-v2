
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

        const { title, body } = req.body;

        // Removed pool arg
        await notificationService.sendToUser(userId, title || "Test Notification", body || "This is a test from LifePartner AI");

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

        // Single query — fetch notifications and derive unread count in one shot
        const notifications = await prisma.notifications.findMany({
            where: { user_id: userId },
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
        const { token } = req.body;

        if (!token) return res.status(400).json({ error: "Token required" });

        await prisma.device_tokens.deleteMany({
            where: { user_id: userId, token }
        });

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

export default router;
