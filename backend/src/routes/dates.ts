import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. DB Patching Endpoint
router.get('/fix-db', async (req, res) => {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS meet_dates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                location_name VARCHAR(255) NOT NULL,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                date_time TIMESTAMP(6) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, completed, cancelled
                safety_check_triggered BOOLEAN DEFAULT false,
                created_at TIMESTAMP(6) DEFAULT now(),
                updated_at TIMESTAMP(6) DEFAULT now()
            );
        `);
        res.json({ success: true, message: 'Dates DB patched successfully' });
    } catch (e: any) {
        console.error('DB Patch Error', e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Propose a Date
router.post('/propose', authenticateToken, async (req: any, res) => {
    try {
        const senderId = req.user.userId;
        const { receiver_id, location_name, lat, lng, date_time } = req.body;

        if (!receiver_id || !location_name || !date_time) {
            return res.status(400).json({ error: 'Receiver, location, and time are required' });
        }

        const dateObj = new Date(date_time);
        if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
            return res.status(400).json({ error: 'Date must be in the future' });
        }

        const newDate: any[] = await prisma.$queryRawUnsafe(`
            INSERT INTO meet_dates (sender_id, receiver_id, location_name, lat, lng, date_time)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
            RETURNING *;
        `, senderId, receiver_id, location_name, lat || null, lng || null, dateObj);

        // Send a custom chat message so the UI renders the invitation
        const invitePayload = `[DATE_INVITE:${newDate[0].id}]`;
        const newMsg = await (prisma.messages as any).create({
            data: {
                sender_id: senderId,
                receiver_id: receiver_id,
                content: invitePayload,
                delivery_status: "sent"
            },
            select: { id: true, created_at: true }
        });

        // Broadcast to receiver
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            
            const senderProfile = await prisma.users.findUnique({
                where: { id: senderId },
                select: { full_name: true, avatar_url: true }
            });
            const { sanitizePhotoUrl } = require('../utils/photoUrl');
            
            io.to(receiver_id).emit("receiveMessage", {
                id: newMsg.id,
                text: invitePayload,
                senderId,
                timestamp: newMsg.created_at,
                status: "sent",
                senderName: senderProfile?.full_name || 'Someone',
                senderPhoto: sanitizePhotoUrl(senderProfile?.avatar_url ?? null, senderProfile?.full_name || 'User')
            });
        } catch (err) {}

        res.json({ success: true, date: newDate[0] });
    } catch (e: any) {
        console.error('Propose Date Error', e);
        res.status(500).json({ error: 'Failed to propose date' });
    }
});

// 3. Respond to Date Proposal
router.post('/:id/respond', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;
        const { status } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const dates: any[] = await prisma.$queryRawUnsafe(`
            SELECT * FROM meet_dates WHERE id = $1::uuid;
        `, dateId);

        if (!dates.length) return res.status(404).json({ error: 'Date not found' });
        const meetDate = dates[0];

        if (meetDate.receiver_id !== userId) {
            return res.status(403).json({ error: 'You cannot respond to this date' });
        }

        const updated: any[] = await prisma.$queryRawUnsafe(`
            UPDATE meet_dates SET status = $2, updated_at = now() WHERE id = $1::uuid RETURNING *;
        `, dateId, status);

        // Notify sender
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            
            const payload = `[DATE_RESPONSE:${dateId}:${status}]`;
            const newMsg = await (prisma.messages as any).create({
                data: {
                    sender_id: userId,
                    receiver_id: meetDate.sender_id,
                    content: payload,
                    delivery_status: "sent"
                },
                select: { id: true, created_at: true }
            });
            
            io.to(meetDate.sender_id).emit("receiveMessage", {
                id: newMsg.id,
                text: payload,
                senderId: userId,
                timestamp: newMsg.created_at,
                status: "sent"
            });
        } catch (err) {}

        res.json({ success: true, date: updated[0] });
    } catch (e: any) {
        console.error('Respond Date Error', e);
        res.status(500).json({ error: 'Failed to respond' });
    }
});

// 4. Get active dates for user
router.get('/active', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        
        const activeDates: any[] = await prisma.$queryRawUnsafe(`
            SELECT d.*, 
                   u.full_name as partner_name, 
                   u.avatar_url as partner_photo,
                   u.gender as partner_gender
            FROM meet_dates d
            JOIN users u ON (d.sender_id = u.id OR d.receiver_id = u.id) AND u.id != $1::uuid
            WHERE (d.sender_id = $1::uuid OR d.receiver_id = $1::uuid)
              AND d.status = 'accepted'
              AND d.date_time > NOW() - INTERVAL '4 hours' -- Keep active during date window
              AND d.date_time < NOW() + INTERVAL '7 days'
            ORDER BY d.date_time ASC;
        `, userId);

        res.json({ success: true, dates: activeDates });
    } catch (e: any) {
        console.error('Active Dates Error', e);
        res.status(500).json({ error: 'Failed to get active dates' });
    }
});

// 5. Get specific date details (for UI rendering in Chat)
router.get('/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;
        
        const dates: any[] = await prisma.$queryRawUnsafe(`
            SELECT d.*, 
                   u.full_name as partner_name, 
                   u.avatar_url as partner_photo
            FROM meet_dates d
            JOIN users u ON (d.sender_id = u.id OR d.receiver_id = u.id) AND u.id != $1::uuid
            WHERE d.id = $2::uuid AND (d.sender_id = $1::uuid OR d.receiver_id = $1::uuid);
        `, userId, dateId);

        if (!dates.length) return res.status(404).json({ error: 'Date not found' });
        res.json({ success: true, date: dates[0] });
    } catch (e: any) {
        console.error('Get Date Error', e);
        res.status(500).json({ error: 'Failed to get date' });
    }
});

export default router;
