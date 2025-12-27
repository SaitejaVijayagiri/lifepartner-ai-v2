
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

// 2. Test Push (Admin Only)
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

        const notifications = await prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        // Count unread
        const unreadCount = await prisma.notifications.count({
            where: {
                user_id: userId,
                is_read: false // Schema Default false
            }
        });

        res.json({
            notifications,
            unreadCount
        });
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

// 5. Mark All Read
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

export default router;
