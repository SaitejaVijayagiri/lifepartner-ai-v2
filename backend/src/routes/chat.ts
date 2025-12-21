import express from 'express';
import { sanitizeContent } from '../utils/contentFilter';

import { pool } from '../db';

import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET Chat History
router.get('/:connectionId/history', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params;
    const userId = req.user.userId;

    try {
        const client = await pool.connect();
        const result = await client.query(`
            SELECT id, sender_id, receiver_id, content as text, inserted_at as timestamp 
            FROM public.messages 
            WHERE (sender_id = $1 AND receiver_id = $2) 
            OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY inserted_at ASC
        `, [userId, connectionId]);

        // Format for frontend
        const history = result.rows.map(row => ({
            id: row.id,
            text: row.text,
            senderId: row.sender_id,
            timestamp: row.timestamp
        }));

        client.release();
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
        const client = await pool.connect();

        // 1. Check for Block
        const blockRes = await client.query(`
            SELECT 1 FROM public.blocks 
            WHERE (blocker_id = $1 AND blocked_id = $2) 
               OR (blocker_id = $2 AND blocked_id = $1)
        `, [senderId, connectionId]);

        if (blockRes.rows.length > 0) {
            client.release();
            return res.status(403).json({ error: "You cannot message this user." });
        }

        const result = await client.query(`
            INSERT INTO public.messages (sender_id, receiver_id, content) 
            VALUES ($1, $2, $3) 
            RETURNING id, inserted_at
        `, [senderId, connectionId, cleanText]);

        const newMessage = {
            id: result.rows[0].id,
            text: cleanText,
            senderId,
            timestamp: result.rows[0].inserted_at
        };

        client.release();
        res.json({ success: true, message: newMessage });

    } catch (e) {
        console.error("Send Message Error", e);
        res.status(500).json({ error: "Failed to send message" });
    }
});

export default router;
