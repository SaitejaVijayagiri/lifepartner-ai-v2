
import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { sanitizePhotoUrl, isPhotoPrivacyShieldEnabled, isNotificationPhotoBlurred, getConnectedUserIdSet, areUsersConnected } from '../utils/photoUrl';

const router = express.Router();

// GET /calls/pending - Returns active incoming call offer if any exists for the authenticated user
router.get('/pending', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { getPendingCallForUser } = require('../socket');
        const pending = getPendingCallForUser ? getPendingCallForUser(userId) : null;
        if (pending) {
            return res.json({ hasPendingCall: true, call: pending });
        }
        res.json({ hasPendingCall: false });
    } catch (e) {
        console.error("Failed to fetch pending calls:", e);
        res.status(500).json({ error: "Failed to fetch pending calls" });
    }
});

// GET /calls/history
router.get('/history', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const [logs, connectedIds] = await Promise.all([
            prisma.call_logs.findMany({
                where: {
                    OR: [{ caller_id: userId }, { receiver_id: userId }]
                },
                orderBy: { started_at: 'desc' },
                take: 50,
                include: {
                    users_call_logs_caller_idTousers: { select: { id: true, full_name: true, avatar_url: true, profiles: { select: { metadata: true } } } },
                    users_call_logs_receiver_idTousers: { select: { id: true, full_name: true, avatar_url: true, profiles: { select: { metadata: true } } } }
                }
            }),
            getConnectedUserIdSet(prisma, userId)
        ]);

        // Transform keys to camelCase for frontend
        const formattedLogs = logs.map(row => {
            const isCaller = row.caller_id === userId;
            const otherUser = isCaller ? row.users_call_logs_receiver_idTousers : row.users_call_logs_caller_idTousers;
            const otherId = isCaller ? row.receiver_id : row.caller_id;
            const otherMeta = (otherUser?.profiles?.metadata as any) || {};
            const isBlurred = Boolean(otherId) && isPhotoPrivacyShieldEnabled(otherMeta) && !connectedIds.has(otherId!);

            return {
                id: row.id,
                otherId,
                otherName: otherUser?.full_name || 'Member',
                otherPhoto: isBlurred ? null : sanitizePhotoUrl(otherUser?.avatar_url ?? null, otherUser?.full_name || 'Member'),
                photo_privacy: otherMeta.photo_privacy || otherMeta.photoPrivacy || 'public',
                isBlurred,
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

        const [block, receiverUser, connected] = await Promise.all([
            prisma.blocks.findFirst({
                where: {
                    OR: [
                        { blocker_id: callerId, blocked_id: receiverId },
                        { blocker_id: receiverId, blocked_id: callerId }
                    ]
                }
            }),
            prisma.users.findUnique({
                where: { id: receiverId },
                select: { id: true, is_banned: true, is_deactivated: true, deactivated_until: true }
            }),
            areUsersConnected(prisma, callerId, receiverId)
        ]);
        if (block) return res.status(403).json({ error: "Cannot call a blocked user" });
        const receiverDeactivated = receiverUser?.is_deactivated && (!receiverUser.deactivated_until || new Date(receiverUser.deactivated_until) > new Date());
        if (!receiverUser || receiverUser.is_banned || receiverDeactivated) {
            return res.status(404).json({ error: "Recipient unavailable" });
        }
        if (!connected) {
            return res.status(403).json({ error: "Only connected matches can buzz each other" });
        }

        const caller = await prisma.users.findUnique({
            where: { id: callerId },
            select: { 
                full_name: true, 
                avatar_url: true,
                profiles: {
                    select: {
                        photos: true,
                        metadata: true
                    }
                }
            }
        });
        const meta = (caller?.profiles?.metadata as any) || {};
        const callerName = caller?.full_name?.trim() || meta.name?.trim() || 'Your match';
        const callTypeLabel = type === 'audio' ? 'voice' : 'video';
        const isShielded = isNotificationPhotoBlurred(meta, connected);
        let rawPhoto: string | null | undefined = caller?.avatar_url;
        if (!rawPhoto && Array.isArray(caller?.profiles?.photos) && (caller.profiles.photos as any).length > 0) {
            rawPhoto = String((caller.profiles.photos as any)[0] || '');
        }
        if (rawPhoto && rawPhoto.startsWith('data:image')) rawPhoto = null;
        const callerPhoto = isShielded
            ? null
            : (rawPhoto ? sanitizePhotoUrl(rawPhoto, callerName) : `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=e11d48&color=fff&size=256`);

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
                    callerAvatar: callerPhoto,
                    isBlurred: isShielded,
                    callType: type || 'video',
                    actionUrl: `/chat/${callerId}`
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
                senderId: callerId,
                callerName,
                senderName: callerName,
                callerPhoto,
                senderPhoto: callerPhoto,
                isBlurred: isShielded,
                callType: type || 'video',
                url: `/chat/${callerId}`
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
                    callerAvatar: callerPhoto,
                    isBlurred: isShielded,
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
