import express from 'express';
// import { pool } from '../db';
import { prisma } from '../prisma';
import { getIO, isUserOnline } from '../socket'; // Import socket getter
import { authenticateToken } from '../middleware/auth';
import { sanitizePhotoUrl } from '../utils/photoUrl';
import { matchCache } from './matches'; // Import to invalidate match cache on interest send


const router = express.Router();

// Get Requests (Pending interactions of type 'REQUEST')
// Helper for consistent location
const getLocationString = (u: any) => {
    const meta = (u.profiles?.metadata as any) || {};
    const loc = meta.location;
    const isObj = loc && typeof loc === 'object';
    const mCity = isObj ? loc.city : (typeof loc === 'string' ? loc : "");
    const mDistrict = isObj ? loc.district : "";
    const mState = isObj ? loc.state : "";
    const mCountry = isObj ? loc.country : "";

    const rowCity = u.city || u.location_name;
    const city = mCity || rowCity;
    const parts = [city, mState, mCountry].filter((p: any) => p && p !== "Unknown" && p !== "null");

    let locStr = parts.length > 0 ? parts.join(", ") : "India";
    if (locStr === "India" && mDistrict) locStr = `${mDistrict}, India`;
    return locStr;
};

router.get('/requests', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const requests = await prisma.interactions.findMany({
            where: {
                to_user_id: userId,
                type: 'REQUEST',
                status: 'pending'
            },
            take: 100, // Memory Limit Protection
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                created_at: true,
                users_interactions_from_user_idTousers: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                        city: true,
                        location_name: true,
                        profiles: {
                            select: {
                                metadata: true // Unfortunately Prisma doesn't support selecting specific JSON keys inside a select yet. 
                                // BUT omitting 'raw_prompt', 'traits', 'embedding' drastically reduces memory footprint vs include: true.
                            }
                        }
                    }
                }
            }
        });

        const formattedRequests = requests.map(r => {
            const fromUser = r.users_interactions_from_user_idTousers;
            if (!fromUser) return null; // Safe guard for deleted accounts

            return {
                interactionId: r.id,
                fromUser: {
                    id: fromUser.id,
                    name: fromUser.full_name,
                    photoUrl: sanitizePhotoUrl(fromUser.avatar_url, fromUser.full_name || fromUser.id),
                    career: { profession: (fromUser.profiles?.metadata as any)?.career?.profession || "Member" },
                    location: getLocationString(fromUser)
                },
                timestamp: r.created_at
            };
        }).filter(Boolean);

        res.json(formattedRequests);
    } catch (e) {
        console.error("Get Requests Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Get Total Unread Count (Fast)
router.get('/unread-count', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const count = await prisma.messages.count({
            where: {
                receiver_id: userId,
                NOT: { delivery_status: "read" }
            }
        });
        res.json({ count });
    } catch (e) {
        console.error("Unread Count Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// GET /counts — single fast endpoint for all badge counts on dashboard load
// Replaces: getRequests() (just for count) + getUnreadCount() separately
router.get('/counts', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const [requestCount, unreadMessages] = await Promise.all([
            prisma.interactions.count({
                where: { to_user_id: userId, type: 'REQUEST', status: 'pending' }
            }),
            prisma.messages.count({
                where: { receiver_id: userId, NOT: { delivery_status: 'read' } }
            })
        ]);

        res.json({ requestCount, unreadMessages });
    } catch (e) {
        console.error("Counts Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Get Connections (Accepted Interactions)
router.get('/connections', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const connections = await prisma.interactions.findMany({
            where: {
                OR: [
                    { from_user_id: userId },
                    { to_user_id: userId }
                ],
                status: 'connected'
            },
            // Memory Limit Protection
            take: 100,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                created_at: true,
                from_user_id: true,
                to_user_id: true,
                users_interactions_from_user_idTousers: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                        city: true,
                        location_name: true,
                        profiles: { select: { metadata: true } }
                    }
                },
                users_interactions_to_user_idTousers: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                        city: true,
                        location_name: true,
                        profiles: { select: { metadata: true } }
                    }
                }
            }
        });

        const uniqueConnections = new Map();
        const partnerIds: string[] = [];

        connections.forEach(r => {
            const u1 = r.users_interactions_from_user_idTousers;
            const u2 = r.users_interactions_to_user_idTousers;

            // Safe guard: if either user profile was deleted, skip this interaction
            // instead of crashing the server with a TypeError on the '!' assertion.
            if (!u1 || !u2) return;

            const isFromMe = r.from_user_id === userId;
            const partner = isFromMe ? u2 : u1;

            if (!uniqueConnections.has(partner.id)) {
                partnerIds.push(partner.id);
                uniqueConnections.set(partner.id, {
                    interactionId: r.id,
                    partner: {
                        id: partner.id,
                        name: partner.full_name,
                        photoUrl: sanitizePhotoUrl(partner.avatar_url, partner.full_name || partner.id),
                        role: (partner.profiles?.metadata as any)?.career?.profession || "Member",
                        location: getLocationString(partner)
                    },
                    timestamp: r.created_at,
                    unreadCount: 0 // Default
                });
            }
        });

        // Batch fetch unread counts and latest messages
        if (partnerIds.length > 0) {
            try {
                const unreadCounts = await prisma.messages.groupBy({
                    by: ['sender_id'],
                    where: {
                        sender_id: { in: partnerIds },
                        receiver_id: userId,
                        NOT: { delivery_status: "read" }
                    },
                    _count: {
                        id: true
                    }
                });

                unreadCounts.forEach((c: any) => {
                    if (c.sender_id && uniqueConnections.has(c.sender_id)) {
                        uniqueConnections.get(c.sender_id).unreadCount = c._count.id;
                    }
                });
            } catch (err) {
                console.error("Failed to fetch unreadCounts in Connections", err);
            }

            try {
                // Fetch the latest message timestamp for each partner (extremely optimized, uses index)
                await Promise.all(partnerIds.map(async (pId) => {
                    const latestMsg = await prisma.messages.findFirst({
                        where: {
                            OR: [
                                { sender_id: userId, receiver_id: pId },
                                { sender_id: pId, receiver_id: userId }
                            ]
                        },
                        orderBy: { created_at: 'desc' },
                        select: { created_at: true }
                    });
                    
                    if (latestMsg) {
                        const conn = uniqueConnections.get(pId);
                        if (conn) {
                            conn.latestMessageAt = latestMsg.created_at;
                        }
                    }
                }));
            } catch (err) {
                console.error("Failed to fetch latestMessages in Connections", err);
            }
        }

        const formattedConnections = Array.from(uniqueConnections.values());

        // Sort by latest message, fallback to interaction timestamp
        formattedConnections.sort((a: any, b: any) => {
            const dateA = a.latestMessageAt ? new Date(a.latestMessageAt) : new Date(a.timestamp);
            const dateB = b.latestMessageAt ? new Date(b.latestMessageAt) : new Date(b.timestamp);
            return dateB.getTime() - dateA.getTime();
        });

        res.json(formattedConnections);
    } catch (e) {
        console.error("Get Connections Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Delete Connection
router.delete('/connections/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const { id } = req.params;
        // Verify user is part of the connection
        await prisma.interactions.deleteMany({
            where: {
                id: id,
                OR: [
                    { from_user_id: userId },
                    { to_user_id: userId }
                ]
            }
        });

        res.json({ success: true });
    } catch (e) {
        console.error("Delete Connection Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

import { EmailService } from '../services/email';

// ... (existing imports)

// ...

// Simple memory cache to debounce rapid double-clicks (race condition prevention)
const interestDebounceCache = new Set<string>();

// Send Interest (Connect Request)
router.post('/interest', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.body;

        // Prevent rapid double-clicks causing duplicate emails
        const debounceKey = `${userId}-${toUserId}`;
        if (interestDebounceCache.has(debounceKey)) {
            return res.json({ success: true, message: "Request processing" });
        }
        interestDebounceCache.add(debounceKey);

        // Fetch Names, Premium & Details for Notification
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                full_name: true,
                is_premium: true,
                age: true,
                city: true,
                location_name: true,
                avatar_url: true,
                profiles: { select: { metadata: true } }
            }
        });
        const target = await prisma.users.findUnique({
            where: { id: toUserId },
            select: { full_name: true, email: true }
        });

        if (!user || !target) return res.status(404).json({ error: "User not found" });

        const myName = user.full_name || "Someone";
        const targetName = target.full_name || "User";
        const targetEmail = target.email;
        const isPremium = user.is_premium;

        try {
            // Rate Limit (Free: 5/day)
        if (!isPremium) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayCount = await prisma.interactions.count({
                where: {
                    from_user_id: userId,
                    type: 'REQUEST',
                    created_at: { gte: todayStart }
                }
            });

            if (todayCount >= 5) {
                return res.status(403).json({
                    error: "Daily Limit Reached",
                    message: "You have reached your daily limit of 5 interests. Upgrade to Premium for unlimited connections!"
                });
            }
        }

        // Check if interaction already exists to avoid duplicate notifications
        const existingInteraction = await prisma.interactions.findUnique({
            where: {
                from_user_id_to_user_id_type: {
                    from_user_id: userId,
                    to_user_id: toUserId,
                    type: 'REQUEST'
                }
            }
        });

        // UPSERT Interaction
        await prisma.interactions.upsert({
            where: {
                from_user_id_to_user_id_type: {
                    from_user_id: userId,
                    to_user_id: toUserId,
                    type: 'REQUEST'
                }
            },
            update: {
                status: 'pending',
                created_at: new Date()
            },
            create: {
                from_user_id: userId,
                to_user_id: toUserId,
                type: 'REQUEST',
                status: 'pending'
            }
        });

        // Only send notifications if this is a NEW request (or it wasn't pending before)
        if (!existingInteraction || existingInteraction.status !== 'pending') {
            try {
                const meta = (user.profiles?.metadata as any) || {};
                const ageStr = user.age ? `${user.age} yr` : '';
                const profStr = meta.career?.profession || "";
                const locStr = user.city || user.location_name || meta.location?.city || "";

                const detailsArr = [ageStr, profStr, locStr].filter(Boolean);
                const detailsStr = detailsArr.length > 0 ? ` (${detailsArr.join(', ')})` : '';

                const msg = `${myName}${detailsStr} sent you an Interest Request! 💖`;

                // Persist
                await prisma.notifications.create({
                    data: {
                        user_id: toUserId,
                        type: 'request',
                        message: msg,
                        data: { fromUserId: userId }
                    }
                });

                // Realtime
                getIO().to(toUserId).emit('notification:new', {
                    type: 'request',
                    message: msg,
                    timestamp: new Date()
                });

                // Embed the sender ID so the Android app / PWA knows where to navigate
                const pushData = { type: 'request', from: userId, screen: 'requests' };
                
                // Realtime Push via Service Worker / FCM
                const { NotificationService } = await import('../services/notification');
                NotificationService.getInstance().sendToUser(
                    toUserId, 
                    "New Match Interest! 💖", 
                    msg,
                    pushData
                ).catch(e => console.warn("Push failed in interactions", e));

                // Email
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                let rawPhotoUrl = user.avatar_url || meta.photos?.[0] || null;
                // Most email clients (Gmail, Apple Mail) BLOCK base64 data URIs. 
                // We MUST fall back to a standard http/https avatar image if it's base64.
                if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
                    rawPhotoUrl = null;
                }
                // Provide a PNG fallback for emails, because email clients do not render SVGs
                const emailPhotoUrl = rawPhotoUrl 
                    ? sanitizePhotoUrl(rawPhotoUrl, myName) 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=256`;

                const senderDetails = {
                    name: myName,
                    age: user.age || meta.age,
                    location: locStr,
                    job: profStr,
                    photoUrl: emailPhotoUrl
                };
                await EmailService.sendInterestReceivedEmail(targetEmail, targetName, senderDetails);
            } catch (err) {
                console.warn("Notification/Email failed:", err);
            }
        }

        res.json({ success: true });

        // Bust the match cache for THIS user so next fetch returns updated status
        matchCache.delete(userId);

        } finally {
            // Clear debounce lock after 2 seconds
            setTimeout(() => interestDebounceCache.delete(debounceKey), 2000);
        }
    } catch (e) {
        console.error("Send Interest Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Send Direct Message (Bypass Match)
router.post('/direct', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId, text } = req.body;

        if (!toUserId || !text || !text.trim()) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Get user details & check quota
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { full_name: true, is_premium: true, free_direct_messages: true, avatar_url: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if already connected
        const existingConnection = await prisma.interactions.findFirst({
            where: {
                OR: [
                    { from_user_id: userId, to_user_id: toUserId },
                    { from_user_id: toUserId, to_user_id: userId }
                ],
                status: 'connected'
            }
        });

        const isAlreadyConnected = !!existingConnection;

        // Quota check only if NOT already connected
        if (!isAlreadyConnected) {
            if (!user.is_premium && (user.free_direct_messages || 0) <= 0) {
                return res.status(403).json({ 
                    error: "Limit Reached", 
                    message: "You have run out of free Direct Messages. Upgrade to Premium for unlimited!" 
                });
            }

            // Decrement quota if not premium
            if (!user.is_premium) {
                await prisma.users.update({
                    where: { id: userId },
                    data: { free_direct_messages: { decrement: 1 } }
                });
            }

            // Create a Connected Interaction to make them appear in Connections list instantly
            await prisma.interactions.upsert({
                where: {
                    from_user_id_to_user_id_type: {
                        from_user_id: userId,
                        to_user_id: toUserId,
                        type: 'REQUEST'
                    }
                },
                update: {
                    status: 'connected', // Auto-connect for DM
                    created_at: new Date()
                },
                create: {
                    from_user_id: userId,
                    to_user_id: toUserId,
                    type: 'REQUEST',
                    status: 'connected'
                }
            });
        }

        // 2. Insert the actual message into the chat history
        const cleanText = text.trim();
        let newMessageRecord;
        try {
            newMessageRecord = await (prisma.messages as any).create({
                data: {
                    sender_id: userId,
                    receiver_id: toUserId,
                    content: cleanText,
                    delivery_status: "sent"
                }
            });
        } catch (dbErr) {
            console.warn("Falling back to legacy message create in direct message");
            newMessageRecord = await prisma.messages.create({
                data: {
                    sender_id: userId,
                    receiver_id: toUserId,
                    content: cleanText,
                    delivery_status: "sent"
                }
            });
        }

        // 3. Notify receiver
        try {
            const isStoryReply = cleanText.startsWith('[STORY_REPLY:');
            let actualText = cleanText;
            if (isStoryReply) {
                const match = cleanText.match(/^\[STORY_REPLY:([^:]+):([^\]]+)\]([\s\S]*)$/);
                if (match) {
                    actualText = match[3];
                }
            }

            const myName = user.full_name || "Someone";
            let msg;
            if (isStoryReply) {
                msg = `${myName} replied to your story: "${actualText.substring(0, 30)}${actualText.length > 30 ? '...' : ''}"`;
            } else {
                msg = `${myName} sent you a Direct Message: "${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}"`;
            }

            const isOnline = isUserOnline(toUserId);

            if (!isAlreadyConnected) {
                // Persist
                await prisma.notifications.create({
                    data: {
                        user_id: toUserId,
                        type: isStoryReply ? 'story_reply' : 'direct_message',
                        message: msg,
                        data: { fromUserId: userId }
                    }
                });

                // Realtime Notification
                getIO().to(toUserId).emit('notification:new', {
                    type: isStoryReply ? 'story_reply' : 'direct_message',
                    message: msg,
                    timestamp: new Date()
                });

                // Realtime Push via Service Worker / FCM
                const pushData = { type: 'chat', from: userId, screen: 'connections' };
                const { NotificationService } = await import('../services/notification');
                NotificationService.getInstance().sendToUser(
                    toUserId, 
                    isStoryReply ? "New Story Reply! 📸" : "New Direct Message! 💌", 
                    msg,
                    pushData
                ).catch(e => console.warn("Push failed in direct msg", e));
            } else {
                // Already connected. Only send push notification if offline.
                if (!isOnline) {
                    const pushData = { type: 'chat', from: userId, screen: 'connections' };
                    const { NotificationService } = await import('../services/notification');
                    NotificationService.getInstance().sendToUser(
                        toUserId, 
                        isStoryReply ? "New Story Reply! 📸" : "New Direct Message! 💌", 
                        msg,
                        pushData
                    ).catch(e => console.warn("Push failed in direct msg for connected user", e));
                }
            }

            // Realtime Message Broadcast
            const senderPhoto = sanitizePhotoUrl(user.avatar_url, myName);
            const newMessage = {
                id: newMessageRecord.id,
                text: cleanText,
                senderId: userId,
                senderName: myName,
                senderPhoto: senderPhoto,
                timestamp: newMessageRecord.created_at || new Date(),
                status: "sent"
            };
            getIO().to(toUserId).emit("receiveMessage", newMessage);

        } catch (err) {
            console.warn("Notification failed for direct message:", err);
        }

        const remaining = user.is_premium ? "Unlimited" : Math.max(0, (user.free_direct_messages || 0) - 1);
        res.json({ success: true, remaining });

    } catch (e) {
        console.error("Direct Message Error", e);
        res.status(500).json({ error: "Failed to send direct message" });
    }
});

// ...

// Accept Request
router.post('/requests/:interactionId/accept', authenticateToken, async (req: any, res) => {
    try {
        const { interactionId } = req.params;

        // Update
        const interaction = await prisma.interactions.updateMany({
            where: { id: interactionId, to_user_id: req.user.userId },
            data: { status: 'connected' }
        });

        if (interaction.count > 0) {
            const updatedInteraction = await prisma.interactions.findUnique({
                where: { id: interactionId },
                select: { from_user_id: true, to_user_id: true }
            });
            if (updatedInteraction) {
                const { from_user_id, to_user_id } = updatedInteraction;
                if (from_user_id && to_user_id) {
                    try {
                        const uA = await prisma.users.findUnique({ where: { id: from_user_id } });
                        const uB = await prisma.users.findUnique({ where: { id: to_user_id } });

                        if (uA && uB) {
                            await EmailService.sendMatchAcceptedEmail(uA.email, uA.full_name || "User", uB.full_name || "User");

                            const msg = `Good news! ${uB.full_name} accepted your request. You can now chat! 🎉`;
                            getIO().to(from_user_id).emit('notification:new', {
                                type: 'match',
                                message: msg,
                                timestamp: new Date()
                            });
                        }
                    } catch (notifyErr) { console.error("Notify error", notifyErr); }
                }
            }
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Accept Error", e);
        res.status(500).json({ error: "Failed" });
    }
});
// Decline Request
router.post('/requests/:interactionId/decline', authenticateToken, async (req: any, res) => {
    try {
        const { interactionId } = req.params;
        const userId = req.user.userId;

        await prisma.interactions.updateMany({
            where: { id: interactionId, to_user_id: userId },
            data: { status: 'declined' }
        });

        res.json({ success: true });
    } catch (e) {
        console.error("Decline Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Report User
router.post('/report', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const { reportedId, reason, details } = req.body;
        if (!reportedId || !reason) return res.status(400).json({ error: "Missing fields" });

        await prisma.reports.create({
            data: {
                reporter_id: userId,
                reported_id: reportedId,
                reason,
                details: details || ''
            }
        });

        res.json({ success: true, message: "Report submitted" });

    } catch (e) {
        console.error("Report Error", e);
        res.status(500).json({ error: "Failed to submit report" });
    }
});

// POST /contact - Save Inquiry
router.post('/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: "Missing fields" });
        }

        await prisma.contact_inquiries.create({
            data: { name, email, message }
        });

        res.json({ success: true, message: "Inquiry received" });
    } catch (e) {
        console.error("Contact Form Error", e);
        res.status(500).json({ error: "Failed to save inquiry" });
    }
});

// DELETE /interest/:toUserId
router.delete('/interest/:toUserId', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.params;

        await prisma.interactions.deleteMany({
            where: {
                from_user_id: userId,
                to_user_id: toUserId,
                type: 'REQUEST'
            }
        });

        res.json({ success: true, message: "Interest revoked" });
    } catch (e) {
        console.error("Revoke Interest Error", e);
        res.status(500).json({ error: "Failed to revoke interest" });
    }
});

// POST /like
router.post('/like', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.body;

        await prisma.matches.upsert({
            where: {
                user_a_id_user_b_id: {
                    user_a_id: userId,
                    user_b_id: toUserId
                }
            },
            update: {
                is_liked: true
            },
            create: {
                user_a_id: userId,
                user_b_id: toUserId,
                is_liked: true,
                status: 'pending'
            }
        });

        res.json({ success: true, message: "Profile Liked!" });
    } catch (e) {
        console.error("Like Error", e);
        res.status(500).json({ error: "Failed to send like" });
    }
});

// DELETE /like/:toUserId
router.delete('/like/:toUserId', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.params;

        await prisma.matches.updateMany({
            where: {
                user_a_id: userId,
                user_b_id: toUserId
            },
            data: {
                is_liked: false
            }
        });

        res.json({ success: true, message: "Like revoked" });
    } catch (e) {
        console.error("Revoke Like Error", e);
        res.status(500).json({ error: "Failed to revoke like" });
    }
});

// GET /who-liked-me - Premium Feature
router.get('/who-liked-me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Check premium
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { is_premium: true }
        });
        const isPremium = user?.is_premium || false;

        // Get likes
        const likes = await prisma.matches.findMany({
            where: {
                user_b_id: userId,
                is_liked: true
            },
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                users_matches_user_a_idTousers: {
                    include: { profiles: true }
                }
            }
        });

        const totalLikes = likes.length;

        // Map Results
        const formattedLikes = likes.map(r => {
            const u = r.users_matches_user_a_idTousers;
            if (!u) return null; // Safe guard

            const meta = (u.profiles?.metadata as any) || {};

            const isBlurred = !isPremium;

            // If blurred, hide details
            if (isBlurred) {
                return {
                    id: u.id,
                    name: "???",
                    age: "??",
                    photoUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${u.id}`,
                    location: "Hidden",
                    isBlurred: true,
                    likedAt: r.created_at
                };
            }

            return {
                id: u.id,
                name: u.full_name || "User",
                age: u.age || meta.age,
                height: meta.height || "Not Specified",
                photoUrl: sanitizePhotoUrl(u.avatar_url || meta.photos?.[0], u.full_name || u.id),
                location: getLocationString(u),
                profession: meta.career?.profession || "Member",
                isBlurred: false,
                likedAt: r.created_at,
                career: meta.career || {},
                family: meta.family || {},
                religion: meta.religion || {},
                horoscope: meta.horoscope || {},
                lifestyle: meta.lifestyle || {},
                partnerPreferences: meta.partnerPreferences || {},
                aboutMe: u.profiles?.raw_prompt || meta.bio || meta.aboutMe || "",
                expectations: meta.expectations || "",
                prompt: u.profiles?.raw_prompt || "",
                dob: meta.dob || null,
                photos: (meta.photos || []).map((p: string) => sanitizePhotoUrl(p, u.full_name || u.id))
            };
        }).filter(Boolean);

        res.json({
            isPremium,
            totalLikes,
            likes: formattedLikes,
            message: !isPremium ? `${totalLikes} people liked your profile! Upgrade to Premium to see who.` : undefined
        });

    } catch (e) {
        console.error("Who Liked Me Error", e);
        res.status(500).json({ error: "Failed to fetch likes" });
    }
});

// Block User
router.post('/block', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { blockedId } = req.body;

        if (!blockedId) return res.status(400).json({ error: "Missing blockedId" });

        // 1. Create Block (ignore if exists)
        // Using upsert or catch unique constraint
        await prisma.blocks.upsert({
            where: {
                blocker_id_blocked_id: {
                    blocker_id: userId,
                    blocked_id: blockedId
                }
            },
            create: { blocker_id: userId, blocked_id: blockedId },
            update: {}
        });

        // 2. Remove Matches
        await prisma.matches.deleteMany({
            where: {
                OR: [
                    { user_a_id: userId, user_b_id: blockedId },
                    { user_a_id: blockedId, user_b_id: userId }
                ]
            }
        });

        // 3. Remove Interactions
        await prisma.interactions.deleteMany({
            where: {
                OR: [
                    { from_user_id: userId, to_user_id: blockedId },
                    { from_user_id: blockedId, to_user_id: userId }
                ]
            }
        });

        res.json({ success: true, message: "User blocked" });
    } catch (e) {
        console.error("Block Error", e);
        res.status(500).json({ error: "Failed to block user" });
    }
});

// Unblock User
router.delete('/block/:blockedId', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { blockedId } = req.params;

        await prisma.blocks.deleteMany({
            where: {
                blocker_id: userId,
                blocked_id: blockedId
            }
        });

        res.json({ success: true, message: "User unblocked" });
    } catch (e) {
        console.error("Unblock Error", e);
        res.status(500).json({ error: "Failed to unblock user" });
    }
});

// Get Blocked Users
router.get('/blocked', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const blocks = await prisma.blocks.findMany({
            where: { blocker_id: userId },
            include: {
                users_blocks_blocked_idTousers: {
                    select: { full_name: true, avatar_url: true }
                }
            }
        });

        const formatted = blocks.map(b => ({
            blocked_id: b.blocked_id,
            full_name: b.users_blocks_blocked_idTousers.full_name,
            avatar_url: sanitizePhotoUrl(b.users_blocks_blocked_idTousers.avatar_url, b.users_blocks_blocked_idTousers.full_name || 'User'),
            created_at: b.created_at
        }));

        res.json(formatted);
    } catch (e) {
        console.error("Get Blocked Error", e);
        res.status(500).json({ error: "Failed to fetch blocked users" });
    }
});

// Record Profile View
router.post('/view', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { targetId } = req.body;

        if (!targetId || userId === targetId) return res.sendStatus(200);

        await prisma.interactions.upsert({
            where: {
                from_user_id_to_user_id_type: {
                    from_user_id: userId,
                    to_user_id: targetId,
                    type: 'VIEW'
                }
            },
            update: { created_at: new Date() },
            create: {
                from_user_id: userId,
                to_user_id: targetId,
                type: 'VIEW',
                status: 'seen'
            }
        });

        res.json({ success: true });
    } catch (e) {
        console.error("View Profile Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Get Profile Visitors (Who viewed me)
router.get('/visitors', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Check premium
        const user = await prisma.users.findUnique({
            where: { id: userId }, select: { is_premium: true }
        });
        const isPremium = user?.is_premium || false;

        const visitors = await prisma.interactions.findMany({
            where: {
                to_user_id: userId,
                type: 'VIEW'
            },
            orderBy: { created_at: 'desc' },
            take: 20,
            include: {
                users_interactions_from_user_idTousers: {
                    include: { profiles: true }
                }
            }
        });

        const formattedVisitors = visitors.map(r => {
            const u = r.users_interactions_from_user_idTousers;
            if (!u) return null; // Safe guard

            const meta = (u.profiles?.metadata as any) || {};
            const isBlurred = !isPremium;

            return {
                id: u.id,
                name: isBlurred ? "Verify to Unlock" : (u.full_name || "User"),
                age: isBlurred ? "??" : (u.age || meta.age),
                height: meta.height || "Not Specified",
                photoUrl: isBlurred
                    ? `https://api.dicebear.com/7.x/shapes/svg?seed=${u.id}`
                    : sanitizePhotoUrl(u.avatar_url || meta.photos?.[0], u.full_name || u.id),
                location: isBlurred ? "Hidden" : getLocationString(u),
                profession: isBlurred ? "Hidden" : (meta.career?.profession || "Member"),
                viewedAt: r.created_at,
                isBlurred,
                career: meta.career || {},
                family: meta.family || {},
                religion: meta.religion || {},
                horoscope: meta.horoscope || {},
                lifestyle: meta.lifestyle || {},
                partnerPreferences: meta.partnerPreferences || {},
                aboutMe: u.profiles?.raw_prompt || meta.bio || meta.aboutMe || "",
                expectations: meta.expectations || "",
                prompt: u.profiles?.raw_prompt || "",
                dob: meta.dob || null,
                photos: (meta.photos || []).map((p: string) => sanitizePhotoUrl(p, u.full_name || u.id))
            };
        }).filter(Boolean);

        res.json({
            isPremium,
            visitors: formattedVisitors
        });

    } catch (e) {
        console.error("Get Visitors Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// POST /speed-date/like
router.post('/speed-date/like', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { targetId, liked } = req.body;

        if (!targetId || liked === undefined) return res.status(400).json({ error: "Missing fields" });

        if (liked) {
            // Log interaction
            await prisma.interactions.upsert({
                where: {
                    from_user_id_to_user_id_type: {
                        from_user_id: userId,
                        to_user_id: targetId,
                        type: 'SPEED_DATE_LIKE'
                    }
                },
                update: { status: 'pending', created_at: new Date() },
                create: {
                    from_user_id: userId,
                    to_user_id: targetId,
                    type: 'SPEED_DATE_LIKE',
                    status: 'pending'
                }
            });

            // Check if reciprocal exists
            const reciprocal = await prisma.interactions.findUnique({
                where: {
                    from_user_id_to_user_id_type: {
                        from_user_id: targetId,
                        to_user_id: userId,
                        type: 'SPEED_DATE_LIKE'
                    }
                }
            });

            if (reciprocal) {
                // It's a match!
                // Update both to 'connected'
                await prisma.interactions.updateMany({
                    where: {
                        OR: [
                            { from_user_id: userId, to_user_id: targetId, type: 'SPEED_DATE_LIKE' },
                            { from_user_id: targetId, to_user_id: userId, type: 'SPEED_DATE_LIKE' }
                        ]
                    },
                    data: { status: 'connected' }
                });

                // Also formally create a Request/Connection so they appear in 'Chat' tab
                await prisma.interactions.upsert({
                    where: {
                        from_user_id_to_user_id_type: {
                            from_user_id: targetId,
                            to_user_id: userId,
                            type: 'REQUEST'
                        }
                    },
                    create: { from_user_id: targetId, to_user_id: userId, type: 'REQUEST', status: 'connected', created_at: new Date() },
                    update: { status: 'connected' }
                });

                await prisma.interactions.upsert({
                    where: {
                        from_user_id_to_user_id_type: {
                            from_user_id: userId,
                            to_user_id: targetId,
                            type: 'REQUEST'
                        }
                    },
                    create: { from_user_id: userId, to_user_id: targetId, type: 'REQUEST', status: 'connected', created_at: new Date() },
                    update: { status: 'connected' }
                });

                // Notify both
                getIO().to(userId).emit('notification:new', { type: 'match', message: "You have a new Speed Match!", data: { targetId } });
                getIO().to(targetId).emit('notification:new', { type: 'match', message: "You have a new Speed Match!", data: { targetId: userId } });

                return res.json({ success: true, isMatch: true });
            }

            return res.json({ success: true, isMatch: false });
        } else {
            // Create a pass interaction just to avoid re-matching them in random pool
            await prisma.interactions.upsert({
                where: {
                    from_user_id_to_user_id_type: {
                        from_user_id: userId,
                        to_user_id: targetId,
                        type: 'SPEED_DATE_PASS'
                    }
                },
                update: { status: 'declined', created_at: new Date() },
                create: {
                    from_user_id: userId,
                    to_user_id: targetId,
                    type: 'SPEED_DATE_PASS',
                    status: 'declined'
                }
            });
            return res.json({ success: true, isMatch: false });
        }
    } catch (e) {
        console.error("Speed Date Like Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

export default router;
