import express from 'express';
import { sanitizeContent } from '../utils/contentFilter';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

const memoryUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const router = express.Router();

// SECURITY: /fix-db is a dev-only database patch route — disabled in production to prevent unauthorized DDL execution
router.get('/fix-db', (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Database patch routes are disabled in production' });
    }
    next();
}, async (req, res) => {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT false;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSON DEFAULT '{}';`);
        await prisma.$executeRawUnsafe(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS cleared_by JSON DEFAULT '[]';`);
        await prisma.$executeRawUnsafe(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_incognito BOOLEAN DEFAULT false;`);
        
        // New columns for Direct Messages
        await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS free_direct_messages INT DEFAULT 3;`);
        
        // New table for Lounge Messages
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS lounge_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                created_at TIMESTAMP(6) DEFAULT now()
            );
        `);
        
        res.json({ success: true, message: "Database schema patched successfully" });
    } catch (e: any) {
        console.error("DB Patch Error", e);
        res.status(500).json({ error: e.message });
    }
});

// GET Chat History
router.get('/:connectionId/history', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params;
    const userId = req.user.userId;

    try {
        let messages: any[] = [];
        try {
            // Try with is_liked (works after DB migration)
            messages = await prisma.messages.findMany({
                where: {
                    OR: [
                        { sender_id: userId, receiver_id: connectionId },
                        { sender_id: connectionId, receiver_id: userId }
                    ]
                },
                orderBy: { created_at: 'desc' },
                take: 100,
                select: {
                    id: true,
                    sender_id: true,
                    receiver_id: true,
                    content: true,
                    created_at: true,
                    delivery_status: true,
                    is_liked: true,
                    reactions: true,
                    cleared_by: true,
                    reply_to_id: true
                }
            } as any);
        } catch (dbErr: any) {
            // Fallback: column may not exist yet in DB — query without is_liked
            console.warn("is_liked column not found, falling back:", dbErr?.message);
            messages = await (prisma.messages as any).findMany({
                where: {
                    OR: [
                        { sender_id: userId, receiver_id: connectionId },
                        { sender_id: connectionId, receiver_id: userId }
                    ]
                },
                orderBy: { created_at: 'desc' },
                take: 100,
                select: {
                    id: true,
                    sender_id: true,
                    receiver_id: true,
                    content: true,
                    created_at: true,
                    delivery_status: true,
                    cleared_by: true,
                    reactions: true,
                    reply_to_id: true
                }
            });
        }

        // Format for frontend and restore chronological order, filtering out cleared & incognito messages
        const history = messages
            .filter((row: any) => {
                if (row.is_incognito || (row.content && row.content.startsWith('[INCOGNITO]'))) {
                    return false; // Exclude incognito from user-facing history, kept in DB for safety audit
                }
                const clearedBy = Array.isArray(row.cleared_by) ? row.cleared_by : [];
                return !clearedBy.includes(userId);
            })
            .reverse()
            .map((row: any) => {
                let text = row.content || "";
                let replyToId = row.reply_to_id || null;

                // Check for embedded reply ID in legacy schema mode
                if (!replyToId && text) {
                    const replyMatch = text.match(/^\[REPLY:([a-zA-Z0-9-]+)\](.*)$/is);
                    if (replyMatch) {
                        replyToId = replyMatch[1];
                        text = replyMatch[2];
                    }
                }

                return {
                    id: row.id,
                    text: text,
                    senderId: row.sender_id,
                    timestamp: row.created_at,
                    status: row.delivery_status,
                    is_liked: row.is_liked ?? false,
                    reactions: row.reactions ?? {},
                    replyToId: replyToId
                };
            });

        res.json(history);
    } catch (e: any) {
        console.error("History Error", e);
        try {
            require('fs').appendFileSync('chat_error_log.txt', new Date().toISOString() + ' ' + e.stack + '\n\n');
        } catch (err) {}
        res.status(500).json({ error: "Failed to load chat history", details: e.message });
    }
});

// SEND Message
router.post('/:connectionId/send', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params; // receiverId
    const { text, replyToId, isIncognito } = req.body;
    const senderId = req.user.userId;

    if (!text) {
        return res.status(400).json({ error: "Missing text" });
    }

    const cleanText = sanitizeContent(text);
    const dbContent = isIncognito ? `[INCOGNITO]${cleanText}` : cleanText;

    try {
        // SECURITY FIX: Check block status FIRST before creating any message.
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

        let finalContent = dbContent;
        let newMessageRecord;
        try {
            newMessageRecord = await (prisma.messages as any).create({
                data: {
                    sender_id: senderId,
                    receiver_id: connectionId,
                    content: dbContent,
                    delivery_status: "sent",
                    reply_to_id: replyToId || null,
                    is_incognito: !!isIncognito
                }
            });
        } catch (dbErr) {
            console.warn("is_incognito/reply_to_id might not exist, falling back to legacy create");
            if (replyToId) {
                finalContent = `[REPLY:${replyToId}]${dbContent}`;
            }
            newMessageRecord = await prisma.messages.create({
                data: {
                    sender_id: senderId,
                    receiver_id: connectionId,
                    content: finalContent,
                    delivery_status: "sent"
                },
                select: {
                    id: true,
                    sender_id: true,
                    receiver_id: true,
                    content: true,
                    created_at: true,
                    delivery_status: true
                }
            });
        }

        const newMessage = {
            id: newMessageRecord.id,
            text: cleanText,
            senderId,
            timestamp: newMessageRecord.created_at,
            status: "sent",
            replyToId: replyToId || null,
            isIncognito: !!isIncognito
        };

        // Auto-connect interaction so user appears in Connections list
        try {
            await prisma.interactions.upsert({
                where: {
                    from_user_id_to_user_id_type: {
                        from_user_id: senderId,
                        to_user_id: connectionId,
                        type: 'REQUEST'
                    }
                },
                update: {
                    status: 'connected',
                    created_at: new Date()
                },
                create: {
                    from_user_id: senderId,
                    to_user_id: connectionId,
                    type: 'REQUEST',
                    status: 'connected'
                }
            });
        } catch (connErr) {
            // Ignore if already connected
        }

        // Broadcast via Socket.IO (include sender details for in-app toast)
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            const senderProfile = await prisma.users.findUnique({
                where: { id: senderId },
                select: { full_name: true, avatar_url: true }
            });
            const { sanitizePhotoUrl } = require('../utils/photoUrl');

            // If replying, fetch the original message so the receiver can show the preview
            let replyToPreview: any = null;
            if (replyToId) {
                try {
                    const originalMsg = await (prisma.messages as any).findUnique({
                        where: { id: replyToId },
                        select: { content: true, sender_id: true }
                    });
                    if (originalMsg) {
                        let previewText = originalMsg.content || "";
                        const replyMatch = previewText.match(/^\[REPLY:([a-zA-Z0-9-]+)\](.*)$/is);
                        if (replyMatch) {
                            previewText = replyMatch[2];
                        }
                        
                        replyToPreview = {
                            id: replyToId,
                            text: previewText,
                            senderId: originalMsg.sender_id
                        };
                    }
                } catch (err) { /* reply preview is non-critical */ }
            }

            io.to(connectionId).emit("receiveMessage", {
                ...newMessage,
                senderName: senderProfile?.full_name || 'Someone',
                senderPhoto: sanitizePhotoUrl(senderProfile?.avatar_url ?? null, senderProfile?.full_name || 'User'),
                replyToPreview
            });
        } catch (socketError) {
            console.error("Socket broadcast failed", socketError);
        }

        // Send Push Notification for chat message
        try {
            const senderProfile = await prisma.users.findUnique({
                where: { id: senderId },
                select: { full_name: true, avatar_url: true }
            });
            const senderName = senderProfile?.full_name?.split(' ')[0] || "Someone";

            const { NotificationService } = require('../services/notification');
            const { sanitizePhotoUrl } = require('../utils/photoUrl');
            await NotificationService.getInstance().sendToUser(
                connectionId,
                `${senderName}`,
                cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText,
                { 
                    url: `/dashboard?tab=connections&chatId=${senderId}`,
                    messageId: newMessageRecord.id,
                    senderId: senderId,
                    senderName: senderName,
                    senderPhoto: sanitizePhotoUrl(senderProfile?.avatar_url ?? null, senderProfile?.full_name || 'User'),
                    type: 'match'
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

// REACT TO A MESSAGE (emoji reactions)
router.post('/:messageId/react', authenticateToken, async (req: any, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body; // e.g. '❤️', '😂', '😮', '👍'
    const userId = req.user.userId;

    if (!emoji) return res.status(400).json({ error: 'Emoji required' });

    try {
        const msg: any = await (prisma.messages as any).findUnique({
            where: { id: messageId },
            select: { id: true, sender_id: true, receiver_id: true, reactions: true }
        });
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        const reactions: Record<string, string> = (msg.reactions as any) || {};

        // Toggle: if user already reacted with same emoji, remove it; otherwise set new emoji
        if (reactions[userId] === emoji) {
            delete reactions[userId];
        } else {
            reactions[userId] = emoji;
        }

        try {
            await (prisma.messages as any).update({
                where: { id: messageId },
                data: { reactions, is_liked: Object.keys(reactions).length > 0 },
                select: { id: true, reactions: true, is_liked: true }
            });
        } catch (dbErr) {
            console.warn("is_liked column might not exist, falling back to legacy react update");
            await (prisma.messages as any).update({
                where: { id: messageId },
                data: { reactions },
                select: { id: true, reactions: true }
            });
        }

        // Fetch reactor's name for the socket event
        const reactor = await prisma.users.findUnique({
            where: { id: userId },
            select: { full_name: true, avatar_url: true }
        });

        // Emit real-time update to both sender and receiver
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            const payload = { messageId, reactions, reactorId: userId, reactorName: reactor?.full_name };
            const other = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            io.to(other!).emit('messageReaction', payload);
            io.to(userId).emit('messageReaction', payload);
        } catch (socketErr) {
            // Non-fatal
        }

        // Send Push Notification if recipient is offline
        try {
            const recipientId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            const { isUserOnline } = require('../socket');
            const hasReacted = reactions[userId] === emoji;
            
            if (recipientId && recipientId !== userId && hasReacted && !isUserOnline(recipientId)) {
                const reactorName = reactor?.full_name?.split(' ')[0] || "Someone";
                const { NotificationService } = require('../services/notification');
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                
                await NotificationService.getInstance().sendToUser(
                    recipientId,
                    `${reactorName}`,
                    `Reacted to your message: ${emoji}`,
                    {
                        url: `/dashboard?tab=connections&chatId=${userId}`,
                        messageId: messageId,
                        senderId: userId,
                        senderName: reactor?.full_name || 'Someone',
                        senderPhoto: sanitizePhotoUrl(reactor?.avatar_url ?? null, reactor?.full_name || 'User'),
                        type: 'match' // Open connection chat
                    }
                );
            }
        } catch (pushErr) {
            console.error("Reaction Push Notification Error", pushErr);
        }

        res.json({ success: true, reactions });
    } catch (e) {
        console.error('React Error', e);
        res.status(500).json({ error: 'Failed to react' });
    }
});

// LIKE A MESSAGE (kept for backward compat with Android native)
router.post('/:messageId/like', authenticateToken, async (req: any, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    try {
        const msg: any = await (prisma.messages as any).findUnique({
            where: { id: messageId },
            select: { id: true, sender_id: true, receiver_id: true, reactions: true }
        });
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        const reactions: Record<string, string> = (msg.reactions as any) || {};
        const isLiked = reactions[userId] === '❤️';

        if (isLiked) {
            delete reactions[userId];
        } else {
            reactions[userId] = '❤️';
        }

        try {
            await (prisma.messages as any).update({
                where: { id: messageId },
                data: { reactions, is_liked: Object.keys(reactions).length > 0 },
                select: { id: true, reactions: true, is_liked: true }
            });
        } catch (dbErr) {
            console.warn("is_liked column might not exist, falling back to legacy like update");
            await (prisma.messages as any).update({
                where: { id: messageId },
                data: { reactions },
                select: { id: true, reactions: true }
            });
        }

        try {
            const { getIO } = require('../socket');
            const io = getIO();
            const other = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            io.to(other!).emit('messageReaction', { messageId, reactions, reactorId: userId });
        } catch (_) {}

        // Send Push Notification if recipient is offline
        try {
            const recipientId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            const { isUserOnline } = require('../socket');
            
            if (recipientId && recipientId !== userId && !isLiked && !isUserOnline(recipientId)) {
                const reactor = await prisma.users.findUnique({
                    where: { id: userId },
                    select: { full_name: true, avatar_url: true }
                });
                const reactorName = reactor?.full_name?.split(' ')[0] || "Someone";
                const { NotificationService } = require('../services/notification');
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                
                await NotificationService.getInstance().sendToUser(
                    recipientId,
                    `${reactorName}`,
                    `Liked your message ❤️`,
                    {
                        url: `/dashboard?tab=connections&chatId=${userId}`,
                        messageId: messageId,
                        senderId: userId,
                        senderName: reactor?.full_name || 'Someone',
                        senderPhoto: sanitizePhotoUrl(reactor?.avatar_url ?? null, reactor?.full_name || 'User'),
                        type: 'match' // Open connection chat
                    }
                );
            }
        } catch (pushErr) {
            console.error("Like Push Notification Error", pushErr);
        }

        res.json({ success: true, is_liked: !isLiked, reactions });
    } catch (e) {
        console.error('Like Error', e);
        res.status(500).json({ error: 'Failed to like' });
    }
});

// DELETE MESSAGE (For Me / For Everyone)
router.delete('/:messageId', authenticateToken, async (req: any, res) => {
    const { messageId } = req.params;
    const mode = req.query.mode || req.body?.mode || 'me'; // Accept via query param to bypass proxy body-stripping
    const userId = req.user.userId;

    try {
        const msg: any = await prisma.messages.findUnique({
            where: { id: messageId },
            select: { id: true, sender_id: true, receiver_id: true, cleared_by: true }
        });
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        let clearedBy = (msg.cleared_by as any[]) || [];

        if (mode === 'everyone') {
            // Only the sender can delete for everyone
            if (msg.sender_id !== userId) {
                return res.status(403).json({ error: 'Only the sender can delete for everyone' });
            }
            // Add both users to cleared_by
            if (!clearedBy.includes(msg.sender_id)) clearedBy.push(msg.sender_id);
            if (!clearedBy.includes(msg.receiver_id)) clearedBy.push(msg.receiver_id);
        } else {
            // Delete for me
            if (!clearedBy.includes(userId)) clearedBy.push(userId);
        }

        await (prisma.messages as any).update({
            where: { id: messageId },
            data: { cleared_by: clearedBy },
            select: { id: true, cleared_by: true }
        });

        // Broadcast deletion event
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            const other = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            io.to(other!).emit('messageDeleted', { messageId, mode, deletedBy: userId });
        } catch (_) {}

        res.json({ success: true, message: 'Message deleted' });
    } catch (e) {
        console.error('Delete Message Error', e);
        res.status(500).json({ error: 'Failed to delete message' });
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

// DELETE Chat History (Soft Delete)
router.delete('/:connectionId/history', authenticateToken, async (req: any, res) => {
    const { connectionId } = req.params;
    const mode = req.query.mode || req.body?.mode || 'me';
    const userId = req.user.userId;

    try {
        const msgs = await prisma.messages.findMany({
            where: {
                OR: [
                    { sender_id: userId, receiver_id: connectionId },
                    { sender_id: connectionId, receiver_id: userId }
                ]
            },
            select: {
                id: true,
                cleared_by: true
            }
        });

        const updatePromises = msgs.map(async (msg) => {
            const clearedBy: string[] = Array.isArray((msg as any).cleared_by) ? [...(msg as any).cleared_by] : [];
            let updated = false;

            if (mode === 'everyone') {
                if (!clearedBy.includes(userId)) {
                    clearedBy.push(userId);
                    updated = true;
                }
                if (!clearedBy.includes(connectionId)) {
                    clearedBy.push(connectionId);
                    updated = true;
                }
            } else {
                if (!clearedBy.includes(userId)) {
                    clearedBy.push(userId);
                    updated = true;
                }
            }

            if (updated) {
                return (prisma.messages as any).update({
                    where: { id: msg.id },
                    data: { cleared_by: clearedBy },
                    select: { id: true, cleared_by: true }
                });
            }
        });

        await Promise.all(updatePromises);

        if (mode === 'everyone') {
            try {
                const { getIO } = require('../socket');
                const io = getIO();
                io.to(connectionId).emit('chatCleared', { clearedBy: userId, mode: 'everyone' });
            } catch (_) {}
        }

        res.json({ success: true, message: "Chat cleared successfully" });
    } catch (e) {
        console.error("Clear Chat Error", e);
        res.status(500).json({ error: "Failed to clear chat" });
    }
});

import { ImageOptimizer } from '../services/imageOptimizer';

// ... (in the route handler)
router.post('/upload-media', authenticateToken, memoryUpload.single('file'), async (req: any, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        let base64Data = '';
        let finalMimeType = file.mimetype;

        if (file.mimetype.startsWith('image/')) {
            // Compress image to prevent database bloat (<200KB)
            const optimizedBuffer = await ImageOptimizer.optimize(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
            base64Data = optimizedBuffer.toString('base64');
            finalMimeType = 'image/webp';
        } else {
            // Audio is already heavily compressed by the browser's MediaRecorder (webm)
            base64Data = file.buffer.toString('base64');
        }

        const dataUri = `data:${finalMimeType};base64,${base64Data}`;
        
        // Return the data URI directly as the URL
        res.json({ success: true, url: dataUri });
    } catch (e: any) {
        console.error("Media Upload Error", e);
        res.status(500).json({ error: "Failed to process media", details: e.message || String(e) });
    }
});

export default router;
