import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import { ImageOptimizer } from '../services/imageOptimizer';
import { deleteFromCloudinary } from '../services/cloudinaryStorage';
import { isR2Configured, uploadBase64ToR2, deleteFromR2 } from '../services/r2Storage';
import { getIO } from '../socket';
import { sanitizePhotoUrl, isPhotoPrivacyShieldEnabled, isNotificationPhotoBlurred, getConnectedUserIdSet, getBlockedUserIdSet, areUsersConnected } from '../utils/photoUrl';

const router = express.Router();

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Helper: Ensure instants table exists in DB once per container boot (avoids per-request DDL locks)
let instantsTableReady: Promise<void> | null = null;
async function ensureInstantsTable() {
    if (instantsTableReady) return instantsTableReady;
    if (typeof (prisma as any)?.$executeRawUnsafe !== 'function') return;
    instantsTableReady = (async () => {
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
                    likes JSON DEFAULT '[]',
                    is_viewed BOOLEAN DEFAULT false
                );
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE instants ADD COLUMN IF NOT EXISTS likes JSON DEFAULT '[]';
            `);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_instants_expires_at ON instants(expires_at DESC);`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_instants_sender_created ON instants(sender_id, created_at DESC);`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_instants_receiver_expires ON instants(receiver_id, expires_at DESC);`);
        } catch (err: any) {
            instantsTableReady = null;
            console.warn('[Instants] Table init check warning:', err.message);
        }
    })();
    return instantsTableReady;
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

        // Deduplication / Debounce check: Prevent rapid double-upload within 15 seconds
        const recentDuplicate: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, sender_id, receiver_id, caption, created_at, expires_at, is_viewed
            FROM instants
            WHERE sender_id = $1::uuid
              AND created_at > (now() - interval '15 seconds')
            ORDER BY created_at DESC
            LIMIT 1;
        `, userId);

        if (recentDuplicate && recentDuplicate.length > 0) {
            console.log(`[Instants] Debounced duplicate snap submission for user ${userId}`);
            return res.json({
                success: true,
                instant: recentDuplicate[0]
            });
        }

        // Upload snap image to Cloudflare R2
        if (finalMediaUrl.startsWith('data:image')) {
            if (isR2Configured()) {
                const key = `instants/${userId}/snap_${Date.now()}.jpg`;
                const r2Url = await uploadBase64ToR2(finalMediaUrl, key, true);
                if (r2Url) {
                    finalMediaUrl = r2Url;
                }
            }
        }

        // Insert into database using raw SQL
        const result: any[] = receiverId
            ? await prisma.$queryRawUnsafe(`
                INSERT INTO instants (sender_id, receiver_id, media_url, caption)
                VALUES ($1::uuid, $2::uuid, $3, $4)
                RETURNING id, sender_id, receiver_id, caption, created_at, expires_at, is_viewed;
            `, userId, receiverId, finalMediaUrl, caption || '')
            : await prisma.$queryRawUnsafe(`
                INSERT INTO instants (sender_id, receiver_id, media_url, caption)
                VALUES ($1::uuid, NULL, $2, $3)
                RETURNING id, sender_id, receiver_id, caption, created_at, expires_at, is_viewed;
            `, userId, finalMediaUrl, caption || '');

        const createdInstant = result[0];

        // Also if receiverId is set, create a chat message referencing this instant
        if (receiverId && createdInstant?.id) {
            try {
                const encodedMedia = encodeURIComponent(finalMediaUrl || '');
                await prisma.messages.create({
                    data: {
                        sender_id: userId,
                        receiver_id: receiverId,
                        content: `[INSTANT:${createdInstant.id}:${encodedMedia}] View-Once Snap ⚡`,
                        delivery_status: 'sent'
                    }
                });

                try {
                    const io = getIO();
                    if (io) {
                        io.to(receiverId).emit('instant:new', {
                            instantId: createdInstant.id,
                            senderId: userId
                        });
                    }
                } catch (sErr) {}
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
 * Get active Instant snaps for the user's feed (cross-gender: female snaps for males, male snaps for females)
 */
router.get('/feed', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;

    try {
        await ensureInstantsTable();

        // Query logged-in user's gender
        const meRes: any[] = await prisma.$queryRawUnsafe(`
            SELECT gender FROM users WHERE id = $1::uuid;
        `, userId);
        const myGender = (meRes[0]?.gender || '').toLowerCase().trim();

        // Opposite gender search terms
        let oppositeGenders: string[] = [];
        if (myGender === 'male' || myGender === 'man' || myGender === 'm') {
            oppositeGenders = ['female', 'woman', 'f'];
        } else if (myGender === 'female' || myGender === 'woman' || myGender === 'f') {
            oppositeGenders = ['male', 'man', 'm'];
        }

        const hasGenderFilter = oppositeGenders.length > 0;

        // Query active instants created in last 24h with strict opposite-gender, active-user, and block filtering
        const [rows, connectedIds] = await Promise.all([
            prisma.$queryRawUnsafe(`
                SELECT i.id, i.sender_id, i.caption, i.created_at, i.expires_at, i.viewed_by, i.likes, i.is_viewed, i.media_url,
                       u.full_name as sender_name, u.avatar_url as sender_avatar, u.gender as sender_gender,
                       p.metadata as sender_metadata
                FROM instants i
                JOIN users u ON u.id = i.sender_id
                LEFT JOIN profiles p ON p.user_id = u.id
                WHERE i.expires_at > now()
                  AND u.is_banned = false
                  AND (u.is_deactivated = false OR u.is_deactivated IS NULL OR (u.deactivated_until IS NOT NULL AND u.deactivated_until < NOW()))
                  AND NOT EXISTS (
                      SELECT 1 FROM blocks b
                      WHERE (b.blocker_id = $1::uuid AND b.blocked_id = i.sender_id)
                         OR (b.blocker_id = i.sender_id AND b.blocked_id = $1::uuid)
                  )
                  AND (
                      i.sender_id = $1::uuid
                      OR i.receiver_id = $1::uuid
                      OR (i.receiver_id IS NULL AND (LOWER(TRIM(u.gender)) = ANY($2::text[]) OR $3::boolean = false))
                  )
                ORDER BY 
                    CASE 
                        WHEN i.sender_id = $1::uuid THEN 0
                        ELSE 1
                    END,
                    i.created_at DESC
                LIMIT 50;
            `, userId, hasGenderFilter ? oppositeGenders : ['none'], hasGenderFilter) as Promise<any[]>,
            getConnectedUserIdSet(prisma, userId)
        ]);

        const formatted = rows.map((row: any) => {
            const viewedList: any[] = Array.isArray(row.viewed_by) ? row.viewed_by : [];
            const likesList: any[] = Array.isArray(row.likes) ? row.likes : [];
            const hasViewed = row.sender_id === userId || viewedList.some((v: any) => v.userId === userId || v === userId);
            const hasLiked = likesList.some((l: any) => l.userId === userId || l === userId);
            const sMeta = (row.sender_metadata as any) || {};
            const isBlurred = row.sender_id !== userId && isPhotoPrivacyShieldEnabled(sMeta) && !connectedIds.has(row.sender_id);

            return {
                id: row.id,
                senderId: row.sender_id,
                senderName: row.sender_name || 'User',
                senderAvatar: sanitizePhotoUrl(row.sender_avatar, row.sender_name || row.sender_id),
                photo_privacy: sMeta.photo_privacy || sMeta.photoPrivacy || 'public',
                isBlurred,
                senderGender: row.sender_gender,
                caption: row.caption,
                createdAt: row.created_at,
                expiresAt: row.expires_at,
                hasViewed: Boolean(hasViewed),
                viewsCount: viewedList.length,
                hasLiked: Boolean(hasLiked),
                likesCount: likesList.length,
                isOwn: row.sender_id === userId,
                // Security: Strip media_url if already viewed or protected by unaccepted Privacy Shield
                mediaUrl: ((hasViewed && row.sender_id !== userId) || isBlurred) ? null : row.media_url
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
        const block = await prisma.blocks.findFirst({
            where: {
                OR: [
                    { blocker_id: userId, blocked_id: connectionId },
                    { blocker_id: connectionId, blocked_id: userId }
                ]
            }
        });
        if (block) {
            return res.status(403).json({ error: 'Cannot access instants with a blocked user.' });
        }

        await ensureInstantsTable();

        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT i.id, i.sender_id, i.receiver_id, i.caption, i.created_at, i.expires_at, i.viewed_by, i.likes, i.is_viewed, i.media_url
            FROM instants i
            WHERE ((i.sender_id = $1::uuid AND i.receiver_id = $2::uuid)
                OR (i.sender_id = $2::uuid AND i.receiver_id = $1::uuid))
              AND i.expires_at > now()
            ORDER BY i.created_at ASC;
        `, userId, connectionId);

        const formatted = rows.map((row: any) => {
            const viewedList: any[] = Array.isArray(row.viewed_by) ? row.viewed_by : [];
            const likesList: any[] = Array.isArray(row.likes) ? row.likes : [];
            const hasViewed = row.sender_id === userId || row.is_viewed || viewedList.some((v: any) => v.userId === userId || v === userId);
            const hasLiked = likesList.some((l: any) => l.userId === userId || l === userId);

            return {
                id: row.id,
                senderId: row.sender_id,
                receiverId: row.receiver_id,
                caption: row.caption,
                createdAt: row.created_at,
                expiresAt: row.expires_at,
                hasViewed: Boolean(hasViewed),
                viewsCount: viewedList.length,
                hasLiked: Boolean(hasLiked),
                likesCount: likesList.length,
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
 * View an Instant snap. Marks user as viewer and returns mediaUrl once along with views & likes count.
 */
router.post('/:id/view', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        await ensureInstantsTable();

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const rows: any[] = isUuid
            ? await prisma.$queryRawUnsafe(`
                SELECT i.id, i.sender_id, i.receiver_id, i.media_url, i.caption, i.viewed_by, i.likes, i.is_viewed, i.expires_at,
                       u.full_name as sender_name, p.metadata as sender_metadata
                FROM instants i
                JOIN users u ON u.id = i.sender_id
                LEFT JOIN profiles p ON p.user_id = u.id
                WHERE i.id = $1::uuid AND i.expires_at > now();
            `, id)
            : await prisma.$queryRawUnsafe(`
                SELECT i.id, i.sender_id, i.receiver_id, i.media_url, i.caption, i.viewed_by, i.likes, i.is_viewed, i.expires_at,
                       u.full_name as sender_name, p.metadata as sender_metadata
                FROM instants i
                JOIN users u ON u.id = i.sender_id
                LEFT JOIN profiles p ON p.user_id = u.id
                WHERE i.id::text = $1 AND i.expires_at > now();
            `, id);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Instant snap not found or expired.' });
        }

        const instant = rows[0];

        // Authorization checks for 1-to-1 snaps, blocks, and unaccepted Privacy Shield
        if (instant.receiver_id && instant.receiver_id !== userId && instant.sender_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to view this snap.' });
        }

        const [block, connected] = await Promise.all([
            instant.sender_id !== userId
                ? prisma.blocks.findFirst({
                    where: {
                        OR: [
                            { blocker_id: userId, blocked_id: instant.sender_id },
                            { blocker_id: instant.sender_id, blocked_id: userId }
                        ]
                    }
                })
                : Promise.resolve(null),
            instant.sender_id !== userId ? areUsersConnected(prisma, userId, instant.sender_id) : Promise.resolve(true)
        ]);
        if (block) {
            return res.status(403).json({ error: 'Cannot view snap from a blocked user.' });
        }
        if (instant.sender_id !== userId && isPhotoPrivacyShieldEnabled(instant.sender_metadata) && !connected) {
            return res.status(403).json({ error: 'Privacy Shield active: connect to view snaps.' });
        }

        const viewedList: any[] = Array.isArray(instant.viewed_by) ? instant.viewed_by : [];
        const likesList: any[] = Array.isArray(instant.likes) ? instant.likes : [];
        const hasAlreadyViewed = viewedList.some((v: any) => v.userId === userId || v === userId);
        const hasLiked = likesList.some((l: any) => l.userId === userId || l === userId);

        if (hasAlreadyViewed && instant.sender_id !== userId) {
            return res.status(410).json({
                error: 'This Instant snap has already been viewed and expired.',
                hasViewed: true,
                mediaUrl: null
            });
        }

        // Record view atomically if viewed by another user to eliminate double-view race
        let currentViewsCount = viewedList.length;
        if (instant.sender_id !== userId) {
            const viewedAtIso = new Date().toISOString();
            const viewerEntry = JSON.stringify([{ userId, viewedAt: viewedAtIso }]);

            const updatedRows: any[] = await prisma.$queryRawUnsafe(`
                UPDATE instants
                SET viewed_by = (COALESCE(viewed_by::jsonb, '[]'::jsonb) || $2::jsonb)::json,
                    is_viewed = true
                WHERE id = $1::uuid
                  AND expires_at > now()
                  AND NOT EXISTS (
                      SELECT 1
                      FROM jsonb_array_elements(COALESCE(viewed_by::jsonb, '[]'::jsonb)) AS elem
                      WHERE elem->>'userId' = $3
                  )
                RETURNING viewed_by;
            `, instant.id, viewerEntry, userId);

            if (!updatedRows || updatedRows.length === 0) {
                return res.status(410).json({
                    error: 'This Instant snap has already been viewed and expired.',
                    hasViewed: true,
                    mediaUrl: null
                });
            }

            const updatedViewed = Array.isArray(updatedRows[0].viewed_by) ? updatedRows[0].viewed_by : [];
            currentViewsCount = updatedViewed.length;

            // Emit live real-time update to snap creator via socket (masking viewer avatar if Privacy Shield enabled)
            try {
                const viewerInfo = await prisma.users.findUnique({
                    where: { id: userId },
                    select: { full_name: true, avatar_url: true, profiles: { select: { metadata: true } } }
                });
                const viewerShielded = isNotificationPhotoBlurred(viewerInfo?.profiles?.metadata, connected);

                const io = getIO();
                if (io) {
                    io.to(instant.sender_id).emit('instant:viewed', {
                        instantId: instant.id,
                        viewer: {
                            id: userId,
                            name: viewerInfo?.full_name || 'User',
                            avatarUrl: viewerShielded ? null : sanitizePhotoUrl(viewerInfo?.avatar_url ?? null, viewerInfo?.full_name || 'User'),
                            isBlurred: viewerShielded,
                            viewedAt: viewedAtIso
                        },
                        totalViewers: currentViewsCount
                    });
                }
            } catch (sErr) {
                console.warn('[Instants] Socket view emit warning:', sErr);
            }
        }

        return res.json({
            success: true,
            instant: {
                id: instant.id,
                senderId: instant.sender_id,
                senderName: instant.sender_name || 'User',
                caption: instant.caption,
                mediaUrl: instant.media_url,
                hasViewed: true,
                viewsCount: currentViewsCount,
                hasLiked: Boolean(hasLiked),
                likesCount: likesList.length
            }
        });
    } catch (err: any) {
        console.error('[Instants] View Error:', err);
        return res.status(500).json({ error: 'Failed to view instant snap', details: err.message });
    }
});

/**
 * GET /api/instants/:id/viewers
 * Get list of users who viewed an Instant snap (Strictly accessible ONLY by creator)
 */
router.get('/:id/viewers', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        await ensureInstantsTable();

        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, sender_id, viewed_by
            FROM instants
            WHERE id = $1::uuid;
        `, id);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Instant snap not found.' });
        }

        const instant = rows[0];
        if (instant.sender_id !== userId) {
            return res.status(403).json({ error: 'Only the snap creator can view the viewers list.' });
        }

        const rawViewers: any[] = Array.isArray(instant.viewed_by) ? instant.viewed_by : [];
        if (rawViewers.length === 0) {
            return res.json({ success: true, viewers: [], totalViewers: 0 });
        }

        const [connectedSet, blockedSet] = await Promise.all([
            getConnectedUserIdSet(prisma, userId),
            getBlockedUserIdSet(prisma, userId)
        ]);
        const viewerIds = rawViewers.map((v: any) => v.userId || v).filter(Boolean);
        const users = await prisma.users.findMany({
            where: {
                id: { in: viewerIds },
                is_banned: false,
                OR: [{ is_deactivated: false }, { deactivated_until: { lte: new Date() } }]
            },
            select: {
                id: true,
                full_name: true,
                avatar_url: true,
                profiles: { select: { metadata: true } }
            }
        });

        const viewerMap = new Map(users.map(u => [u.id, u]));

        const viewers = rawViewers
            .filter((v: any) => {
                const uid = v.userId || v;
                return uid && !blockedSet.has(uid) && viewerMap.has(uid);
            })
            .map((v: any) => {
                const uid = v.userId || v;
                const uInfo = viewerMap.get(uid);
                const meta = (uInfo?.profiles?.metadata as any) || {};
                const isShielded = isPhotoPrivacyShieldEnabled(meta);
                const isBlurred = isShielded && uid !== userId && !connectedSet.has(uid);
                return {
                    id: uid,
                    name: uInfo?.full_name || 'User',
                    avatarUrl: isBlurred ? null : sanitizePhotoUrl(uInfo?.avatar_url, uInfo?.full_name || 'User'),
                    photo_privacy: isShielded ? 'blurred_until_accept' : 'public',
                    isBlurred,
                    viewedAt: v.viewedAt || null
                };
            });

        return res.json({ success: true, viewers, totalViewers: viewers.length });
    } catch (err: any) {
        console.error('[Instants] Viewers Error:', err);
        return res.status(500).json({ error: 'Failed to fetch viewers list', details: err.message });
    }
});

async function getAuthorizedInstantForAction(id: string, userId: string): Promise<{ instant?: any; status?: number; error?: string }> {
    const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT i.id, i.sender_id, i.receiver_id, i.media_url, i.likes,
               u.is_banned, u.is_deactivated, u.deactivated_until,
               p.metadata as sender_metadata
        FROM instants i
        JOIN users u ON i.sender_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE i.id = $1::uuid AND i.expires_at > now();
    `, id);

    if (!rows || rows.length === 0) {
        return { status: 404, error: 'Instant snap not found or expired.' };
    }

    const instant = rows[0];
    const isDeactivatedActive = Boolean(instant.is_deactivated) && (!instant.deactivated_until || new Date(instant.deactivated_until) > new Date());
    if (instant.is_banned || isDeactivatedActive) {
        return { status: 404, error: 'Instant snap not found or expired.' };
    }

    if (instant.receiver_id && instant.receiver_id !== userId && instant.sender_id !== userId) {
        return { status: 403, error: 'Access denied to private snap.' };
    }

    if (instant.sender_id !== userId) {
        const blocked = await prisma.blocks.findFirst({
            where: {
                OR: [
                    { blocker_id: userId, blocked_id: instant.sender_id },
                    { blocker_id: instant.sender_id, blocked_id: userId }
                ]
            },
            select: { blocker_id: true }
        });
        if (blocked) {
            return { status: 403, error: 'Action unavailable.' };
        }
        if (isPhotoPrivacyShieldEnabled(instant.sender_metadata)) {
            const connected = await areUsersConnected(prisma, userId, instant.sender_id);
            if (!connected) {
                return { status: 403, error: 'Privacy Shield is enabled on this snap until connected.' };
            }
        }
    }

    return { instant };
}

/**
 * POST /api/instants/:id/like
 * Like or unlike an Instant snap
 */
router.post('/:id/like', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        await ensureInstantsTable();

        const authResult = await getAuthorizedInstantForAction(id, userId);
        if (!authResult.instant) {
            return res.status(authResult.status || 404).json({ error: authResult.error });
        }

        const instant = authResult.instant;
        let likesList: any[] = Array.isArray(instant.likes) ? instant.likes : [];
        const existingIdx = likesList.findIndex((l: any) => l.userId === userId || l === userId);

        let hasLiked = false;
        if (existingIdx >= 0) {
            // Unlike
            likesList.splice(existingIdx, 1);
            hasLiked = false;
        } else {
            // Like
            likesList.push({ userId, likedAt: new Date().toISOString() });
            hasLiked = true;
        }

        await prisma.$executeRawUnsafe(`
            UPDATE instants SET likes = $1::json WHERE id = $2::uuid;
        `, JSON.stringify(likesList), id);

        // Notify snap sender via socket if liked by another user
        if (hasLiked && instant.sender_id !== userId) {
            try {
                const io = getIO();
                if (io) {
                    io.to(instant.sender_id).emit('instant:liked', {
                        instantId: id,
                        likerId: userId
                    });
                }
            } catch (sErr) {}
        }

        return res.json({
            success: true,
            hasLiked,
            likesCount: likesList.length
        });
    } catch (err: any) {
        console.error('[Instants] Like Error:', err);
        return res.status(500).json({ error: 'Failed to update snap like status', details: err.message });
    }
});

/**
 * POST /api/instants/:id/reply
 * Send a text reply to an Instant snap (creates a chat message to the creator)
 */
router.post('/:id/reply', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Reply text cannot be empty.' });
    }

    try {
        await ensureInstantsTable();

        const authResult = await getAuthorizedInstantForAction(id, userId);
        if (!authResult.instant) {
            return res.status(authResult.status || 404).json({ error: authResult.error });
        }

        const instant = authResult.instant;
        const targetUserId = instant.sender_id;

        if (targetUserId === userId) {
            return res.status(400).json({ error: 'You cannot reply to your own snap.' });
        }

        // Create message in DB
        const createdMessage = await prisma.messages.create({
            data: {
                sender_id: userId,
                receiver_id: targetUserId,
                content: `[REPLY_TO_SNAP:${instant.id}] ⚡ ${text.trim()}`,
                delivery_status: 'sent'
            }
        });

        // Emit socket notification to target user
        try {
            const io = getIO();
            if (io) {
                io.to(targetUserId).emit('chat:message', createdMessage);
                io.to(targetUserId).emit('instant:reply', {
                    instantId: id,
                    senderId: userId,
                    message: createdMessage
                });
            }
        } catch (sErr) {}

        return res.json({
            success: true,
            message: createdMessage
        });
    } catch (err: any) {
        console.error('[Instants] Reply Error:', err);
        return res.status(500).json({ error: 'Failed to send reply to snap', details: err.message });
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
        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT media_url FROM instants WHERE id = $1::uuid AND sender_id = $2::uuid;
        `, id, userId);

        if (rows && rows.length > 0 && rows[0].media_url) {
            const mediaUrl = rows[0].media_url;
            if (mediaUrl.includes('r2.dev') || mediaUrl.includes('r2.cloudflarestorage.com') || mediaUrl.includes('/photo/r2/')) {
                const match = mediaUrl.match(/instants\/[^\?#\s]+/);
                if (match) {
                    deleteFromR2(match[0]).catch(e => console.warn('[R2] Instant cleanup warning:', e));
                }
            } else if (mediaUrl.includes('res.cloudinary.com')) {
                const parts = mediaUrl.split('/upload/');
                if (parts[1]) {
                    const publicId = parts[1].replace(/^v\d+\//, '').split('.')[0];
                    deleteFromCloudinary(publicId).catch(e => console.warn('[Cloudinary] Instant cleanup warning:', e));
                }
            }
        }

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
