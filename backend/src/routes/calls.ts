
import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { sanitizePhotoUrl } from '../utils/photoUrl';

const router = express.Router();

// GET /calls/history
router.get('/history', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const logs = await prisma.call_logs.findMany({
            where: {
                OR: [{ caller_id: userId }, { receiver_id: userId }]
            },
            orderBy: { started_at: 'desc' },
            take: 50,
            include: {
                users_call_logs_caller_idTousers: { select: { full_name: true, avatar_url: true } },
                users_call_logs_receiver_idTousers: { select: { full_name: true, avatar_url: true } }
            }
        });

        // Transform keys to camelCase for frontend
        const formattedLogs = logs.map(row => {
            const isCaller = row.caller_id === userId;
            const otherUser = isCaller ? row.users_call_logs_receiver_idTousers : row.users_call_logs_caller_idTousers;

            return {
                id: row.id,
                otherName: otherUser?.full_name || 'Member',
                otherPhoto: sanitizePhotoUrl(otherUser?.avatar_url ?? null, otherUser?.full_name || 'Member'),
                type: row.type,
                status: row.status,
                duration: row.duration_seconds,
                startedAt: row.started_at,
                isCaller
            };
        });

        res.json(formattedLogs);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch call logs" });
    }
});

// POST /calls/log
// Internal use or called by client at end of call
router.post('/log', authenticateToken, async (req: any, res) => {
    try {
        const { receiverId, type, status, duration } = req.body;
        const callerId = req.user.userId;

        if (!receiverId || callerId === receiverId) {
            return res.status(400).json({ error: "Invalid receiver ID" });
        }

        // created_at defaults to NOW(). ended_at = NOW(). started_at = NOW() - duration.
        const now = new Date();
        const startedAt = new Date(now.getTime() - ((duration || 0) * 1000));

        await prisma.call_logs.create({
            data: {
                caller_id: callerId,
                receiver_id: receiverId,
                type: type || 'VIDEO',
                status: status || 'COMPLETED',
                duration_seconds: duration || 0,
                started_at: startedAt,
                ended_at: now
            }
        });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to log call" });
    }
});

// POST /calls/buzz - High-priority buzz call alert when partner is offline or didn't answer
router.post('/buzz', authenticateToken, async (req: any, res) => {
    try {
        const callerId = req.user.userId;
        const { receiverId, type } = req.body;

        if (!receiverId || callerId === receiverId) {
            return res.status(400).json({ error: "Invalid receiver ID" });
        }

        const caller = await prisma.users.findUnique({
            where: { id: callerId },
            select: { full_name: true, avatar_url: true }
        });
        const callerName = caller?.full_name || 'Your match';
        const callTypeLabel = type === 'audio' ? 'voice' : 'video';

        // 1. Create in-app notification
        const title = `📞 Missed ${type === 'audio' ? 'Voice' : 'Video'} Call`;
        const body = `${callerName} tried to ${callTypeLabel} call you on LifePartner AI. Tap to call back!`;

        await prisma.notifications.create({
            data: {
                user_id: receiverId,
                type: 'call_buzz',
                message: body,
                data: {
                    callerId,
                    callerName,
                    callerAvatar: caller?.avatar_url,
                    callType: type || 'video',
                    actionUrl: '/dashboard?tab=connections'
                }
            }
        }).catch(() => {});

        // 2. Dispatch push notification
        const { NotificationService } = require('../services/notification');
        NotificationService.getInstance().sendToUser(
            receiverId,
            title,
            body,
            {
                type: 'call_buzz',
                callerId,
                callerName,
                callType: type || 'video',
                url: '/dashboard?tab=connections'
            }
        ).catch(() => {});

        // 3. Socket broadcast if receiver has any active connection
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.to(receiverId).emit('call_buzz', {
                    callerId,
                    callerName,
                    callerAvatar: caller?.avatar_url,
                    callType: type || 'video'
                });
            }
        } catch (_) {}

        res.json({ success: true, message: "Call alert sent to partner" });
    } catch (e: any) {
        console.error("Call Buzz Error:", e);
        res.status(500).json({ error: "Failed to send call buzz" });
    }
});

export default router;
