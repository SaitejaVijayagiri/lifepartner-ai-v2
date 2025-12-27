
import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /calls/history
router.get('/history', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.id;

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
                otherName: otherUser?.full_name,
                otherPhoto: otherUser?.avatar_url,
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

export default router;
