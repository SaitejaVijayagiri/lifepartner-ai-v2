import express from 'express';
import { sanitizeContent } from '../utils/contentFilter';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET Chat History
router.get('/:connectionId/history', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params;
    const userId = req.user.userId;

    try {
        const messages = await prisma.messages.findMany({
            where: {
                OR: [
                    { sender_id: userId, receiver_id: connectionId },
                    { sender_id: connectionId, receiver_id: userId }
                ]
            },
            // Optimize: Use indexed desc sort and take 100, then reverse in memory
            // This avoids the slow negative take / subquery approach in PostgreSQL
            orderBy: { created_at: 'desc' },
            take: 100,
            select: {
                id: true,
                sender_id: true,
                receiver_id: true,
                content: true,
                created_at: true,
                delivery_status: true,
                is_liked: true
            }
        });

        // Format for frontend and restore chronological order
        const history = messages.reverse().map(row => ({
            id: row.id,
            text: row.content, // Map content -> text
            senderId: row.sender_id,
            timestamp: row.created_at,
            status: row.delivery_status,
            is_liked: row.is_liked
        }));

        res.json(history);
    } catch (e) {
        console.error("Fetch History Error", e);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

// SEND Message
router.post('/:connectionId/send', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params; // receiverId
    const { text } = req.body;
    const senderId = req.user.userId;

    if (!text) {
        return res.status(400).json({ error: "Missing text" });
    }

    const cleanText = sanitizeContent(text);

    try {
        // Run Block Check and Message creation in parallel for speed
        const [block, newMessageRecord] = await Promise.all([
            prisma.blocks.findFirst({
                where: {
                    OR: [
                        { blocker_id: senderId, blocked_id: connectionId },
                        { blocker_id: connectionId, blocked_id: senderId }
                    ]
                }
            }),
            prisma.messages.create({
                data: {
                    sender_id: senderId,
                    receiver_id: connectionId,
                    content: cleanText,
                    delivery_status: "sent"
                }
            })
        ]);

        if (block) {
            // Rollback message creation if blocked
            await prisma.messages.delete({ where: { id: newMessageRecord.id } });
            return res.status(403).json({ error: "You cannot message this user." });
        }

        const newMessage = {
            id: newMessageRecord.id,
            text: cleanText,
            senderId,
            timestamp: newMessageRecord.created_at,
            status: "sent"
        };

        // Broadcast via Socket.IO
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            io.to(connectionId).emit("receiveMessage", newMessage);
        } catch (socketError) {
            console.error("Socket broadcast failed", socketError);
            // Don't fail the request if socket fails, just log it.
        }

        // Send Push Notification
        try {
            const senderProfile = await prisma.users.findUnique({
                where: { id: senderId },
                select: { full_name: true, avatar_url: true }
            });
            const senderName = senderProfile?.full_name?.split(' ')[0] || "Someone";

            const { NotificationService } = require('../services/notification');
            await NotificationService.getInstance().sendToUser(
                connectionId,
                `${senderName}`,
                cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText,
                { 
                    url: `/dashboard?tab=connections&chatId=${senderId}`,
                    messageId: newMessageRecord.id,
                    senderId: senderId,
                    senderName: senderName,
                    senderPhoto: senderProfile?.avatar_url || "https://lifepartnerai.in/icon-512x512.png" 
                }
            );
        } catch (pushErr) {
            console.error("Chat Push Notification Error", pushErr);
        }

        res.json({ success: true, message: newMessage });

    } catch (e) {
        console.error("Send Message Error", e);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// LIKE A MESSAGE
router.post('/:messageId/like', authenticateToken, async (req: any, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    try {
        const msg = await prisma.messages.findUnique({ where: { id: messageId } });
        if (!msg) return res.status(404).json({ error: "Message not found" });

        // Toggle like status (or always set to true, depending on requirement)
        const newStatus = !msg.is_liked;

        const updatedMsg = await prisma.messages.update({
            where: { id: messageId },
            data: { is_liked: newStatus }
        });

        // Notify the OTHER user (or both) via Socket
        const { getIO } = require('../socket');
        const io = getIO();
        
        const notifyTarget = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        io.to(notifyTarget).emit("messageLiked", { messageId, isLiked: newStatus, likedBy: userId });

        res.json({ success: true, is_liked: newStatus });
    } catch (e) {
        console.error("Like Message Error", e);
        res.status(500).json({ error: "Failed to like message" });
    }
});

// MARK AS READ
router.post('/:connectionId/read', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params;
    const userId = req.user.userId;

    try {
        await prisma.messages.updateMany({
            where: {
                sender_id: connectionId,
                receiver_id: userId,
                NOT: { delivery_status: "read" }
            },
            data: { delivery_status: "read" }
        });

        // Notify the original sender that their messages were read
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            io.to(connectionId).emit("updateMessageStatus", {
                readerMode: userId,
                status: "read"
            });
        } catch (socketError) {
            console.error("Socket broadcast failed", socketError);
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Mark Read Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

export default router;
