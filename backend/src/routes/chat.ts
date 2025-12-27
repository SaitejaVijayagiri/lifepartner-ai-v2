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
            orderBy: { created_at: 'asc' },
            select: {
                id: true,
                sender_id: true,
                receiver_id: true,
                content: true,
                created_at: true
            }
        });

        // Format for frontend
        const history = messages.map(row => ({
            id: row.id,
            text: row.content, // Map content -> text
            senderId: row.sender_id,
            timestamp: row.created_at
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
        // 1. Check for Block
        // "SELECT 1 FROM public.blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)"
        const block = await prisma.blocks.findFirst({
            where: {
                OR: [
                    { blocker_id: senderId, blocked_id: connectionId },
                    { blocker_id: connectionId, blocked_id: senderId }
                ]
            }
        });

        if (block) {
            return res.status(403).json({ error: "You cannot message this user." });
        }

        const newMessageRecord = await prisma.messages.create({
            data: {
                sender_id: senderId,
                receiver_id: connectionId,
                content: cleanText
            }
        });

        const newMessage = {
            id: newMessageRecord.id,
            text: cleanText,
            senderId,
            timestamp: newMessageRecord.created_at
        };

        res.json({ success: true, message: newMessage });

    } catch (e) {
        console.error("Send Message Error", e);
        res.status(500).json({ error: "Failed to send message" });
    }
});

export default router;
