import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import { ImageOptimizer } from '../services/imageOptimizer';

const router = express.Router();

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Helper: Ensure instants table exists in DB
async function ensureInstantsTable() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS instants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
                media_url TEXT NOT NULL,
                caption TEXT,
                created_at TIMESTAMP(6) DEFAULT now(),
                expires_at TIMESTAMP(6) DEFAULT (now() + INTERVAL '24 hours'),
                viewed_by JSON DEFAULT '[]',
                is_viewed BOOLEAN DEFAULT false
            );
        `);
    } catch (err: any) {
        console.warn('[Instants] Table init check warning:', err.message);
    }
}

// Run table creation check on init
ensureInstantsTable().catch(e => console.error('[Instants] Table setup failed:', e));

/**
 * POST /api/instants
 * Create a new Instant Snap (upload image or base64 URI)
 */
router.post('/', authenticateToken, memoryUpload.single('file'), async (req: any, res) => {
    const userId = req.user.userId;
    const { caption, receiverId, mediaUrl: inputMediaUrl } = req.body;

    try {
        let finalMediaUrl = inputMediaUrl || '';

        // If a file was uploaded via multipart, optimize and base64-encode it
        if (req.file) {
            let base64Data = '';
            let finalMimeType = req.file.mimetype;

            if (req.file.mimetype.startsWith('image/')) {
                const optimizedBuffer = await ImageOptimizer.optimize(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`);
                base64Data = optimizedBuffer.toString('base64');
                finalMimeType = 'image/webp';
            } else {
                base64Data = req.file.buffer.toString('base64');
            }

            finalMediaUrl = `data:${finalMimeType};base64,${base64Data}`;
        }

        if (!finalMediaUrl) {
            return res.status(400).json({ error: 'Snap media content is required.' });
        }

        // Insert into database using raw SQL
        const result: any[] = await prisma.$queryRawUnsafe(`
            INSERT INTO instants (sender_id, receiver_id, media_url, caption)
            VALUES ($1::uuid, ${receiverId ? '$2::uuid' : 'NULL'}, $3, $4)
            RETURNING id, sender_id, receiver_id, caption, created_at, expires_at, is_viewed;
        `, userId, ...(receiverId ? [receiverId, finalMediaUrl, caption || ''] : [finalMediaUrl, caption || '']));

        const createdInstant = result[0];

        // Also if receiverId is set, create a chat message referencing this instant
        if (receiverId && createdInstant?.id) {
            try {
                await prisma.messages.create({
                    data: {
                        sender_id: userId,
                        receiver_id: receiverId,
                        content: `[INSTANT:${createdInstant.id}] View-Once Snap ⚡`,
                        delivery_status: 'sent'
                    }
                });
            } catch (msgErr: any) {
                console.warn('[Instants] Failed to inject chat message for instant:', msgErr.message);
            }
        }

        return res.json({
            success: true,
            instant: createdInstant
        });
    } catch (err: any) {
        console.error('[Instants] Create Error:', err);
        return res.status(500).json({ error: 'Failed to post Instant snap', details: err.message });
    }
});

/**
 * GET /api/instants/feed
 * Get active Instant snaps for the user's feed (posted by matches / opposite gender users)
 */
router.get('/feed', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;

    try {
        await ensureInstantsTable();

        // Query active instants created in last 24h
        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT i.id, i.sender_id, i.caption, i.created_at, i.expires_at, i.viewed_by, i.is_viewed, i.media_url,
                   u.full_name as sender_name, u.avatar_url as sender_avatar, u.gender as sender_gender
            FROM instants i
            JOIN users u ON u.id = i.sender_id
            WHERE (i.receiver_id IS NULL OR i.receiver_id = $1::uuid OR i.sender_id = $1::uuid)
              AND i.expires_at > now()
            ORDER BY i.created_at DESC
            LIMIT 50;
        `, userId);

        const formatted = rows.map((row: any) => {
            const viewedList: any[] = Array.isArray(row.viewed_by) ? row.viewed_by : [];
            const hasViewed = row.sender_id === userId || viewedList.some((v: any) => v.userId === userId || v === userId);

            return {
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_name || 'User',
                senderAvatar: row.sender_avatar,
                senderGender: row.sender_gender,
                caption: row.caption,
                createdAt: row.created_at,
                expiresAt: row.expires_at,
                hasViewed: Boolean(hasViewed),
                isOwn: row.sender_id === userId,
                // Security: Strip media_url if already viewed by recipient so it can't be fetched again
                mediaUrl: hasViewed && row.sender_id !== userId ? null : row.media_url
            };
        });

        return res.json({ success: true, instants: formatted });
    } catch (err: any) {
        console.error('[Instants] Feed Error:', err);
        return res.status(500).json({ error: 'Failed to fetch instants feed', details: err.message });
    }
});

/**
 * GET /api/instants/chat/:connectionId
 * Get direct 1-to-1 Instant snaps between current user and target user
 */
router.get('/chat/:connectionId', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { connectionId } = req.params;

    try {
        await ensureInstantsTable();

        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT i.id, i.sender_id, i.receiver_id, i.caption, i.created_at, i.expires_at, i.viewed_by, i.is_viewed, i.media_url
            FROM instants i
            WHERE ((i.sender_id = $1::uuid AND i.receiver_id = $2::uuid)
                OR (i.sender_id = $2::uuid AND i.receiver_id = $1::uuid))
              AND i.expires_at > now()
            ORDER BY i.created_at ASC;
        `, userId, connectionId);

        const formatted = rows.map((row: any) => {
            const viewedList: any[] = Array.isArray(row.viewed_by) ? row.viewed_by : [];
            const hasViewed = row.sender_id === userId || row.is_viewed || viewedList.some((v: any) => v.userId === userId || v === userId);

            return {
                id: row.id,
                senderId: row.sender_id,
                receiverId: row.receiver_id,
                caption: row.caption,
                createdAt: row.created_at,
                expiresAt: row.expires_at,
                hasViewed: Boolean(hasViewed),
                isOwn: row.sender_id === userId,
                mediaUrl: hasViewed && row.sender_id !== userId ? null : row.media_url
            };
        });

        return res.json({ success: true, instants: formatted });
    } catch (err: any) {
        console.error('[Instants] Chat Fetch Error:', err);
        return res.status(500).json({ error: 'Failed to fetch chat instants', details: err.message });
    }
});

/**
 * POST /api/instants/:id/view
 * View an Instant snap. Marks user as viewer and returns mediaUrl once.
 */
router.post('/:id/view', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        await ensureInstantsTable();

        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, sender_id, receiver_id, media_url, caption, viewed_by, is_viewed, expires_at
            FROM instants
            WHERE id = $1::uuid AND expires_at > now();
        `, id);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Instant snap not found or expired.' });
        }

        const instant = rows[0];
        const viewedList: any[] = Array.isArray(instant.viewed_by) ? instant.viewed_by : [];
        const hasAlreadyViewed = viewedList.some((v: any) => v.userId === userId || v === userId);

        if (hasAlreadyViewed && instant.sender_id !== userId) {
            return res.status(410).json({
                error: 'This Instant snap has already been viewed and expired.',
                hasViewed: true,
                mediaUrl: null
            });
        }

        // If not already viewed, record view
        if (instant.sender_id !== userId) {
            const updatedViewedList = [...viewedList, { userId, viewedAt: new Date().toISOString() }];

            await prisma.$executeRawUnsafe(`
                UPDATE instants
                SET viewed_by = $1::json,
                    is_viewed = true
                WHERE id = $2::uuid;
            `, JSON.stringify(updatedViewedList), id);
        }

        return res.json({
            success: true,
            instant: {
                id: instant.id,
                senderId: instant.sender_id,
                caption: instant.caption,
                mediaUrl: instant.media_url,
                hasViewed: true
            }
        });
    } catch (err: any) {
        console.error('[Instants] View Error:', err);
        return res.status(500).json({ error: 'Failed to view instant snap', details: err.message });
    }
});

/**
 * DELETE /api/instants/:id
 * Delete an Instant snap created by current user
 */
router.delete('/:id', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        await prisma.$executeRawUnsafe(`
            DELETE FROM instants
            WHERE id = $1::uuid AND sender_id = $2::uuid;
        `, id, userId);

        return res.json({ success: true, message: 'Instant snap deleted' });
    } catch (err: any) {
        console.error('[Instants] Delete Error:', err);
        return res.status(500).json({ error: 'Failed to delete instant snap', details: err.message });
    }
});

export default router;
