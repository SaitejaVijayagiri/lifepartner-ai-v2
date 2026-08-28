import express from 'express';
// import { pool } from '../db';
import { prisma } from '../prisma';
import { getIO, isUserOnline } from '../socket'; // Import socket getter
import { authenticateToken } from '../middleware/auth';
import { sanitizePhotoUrl } from '../utils/photoUrl';
import { matchCache } from './matches'; // Import to invalidate match cache on interest send
import { mergeStoriesHelper } from './profile';


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
                        profiles: { select: { stories: true, metadata: true } }
                    }
                },
                users_interactions_to_user_idTousers: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                        city: true,
                        location_name: true,
                        profiles: { select: { stories: true, metadata: true } }
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
                const directStories: any[] = (partner.profiles?.stories as any[]) || [];
                const metaStories: any[] = (partner.profiles as any)?.metadata?.stories || [];
                const allStories = mergeStoriesHelper(directStories, metaStories);
                const activeStories = allStories.filter((s: any) => Boolean(s.isHighlight) || new Date(s.expiresAt) > new Date());

                uniqueConnections.set(partner.id, {
                    interactionId: r.id,
                    partner: {
                        id: partner.id,
                        name: partner.full_name,
                        photoUrl: sanitizePhotoUrl(partner.avatar_url, partner.full_name || partner.id),
                        role: (partner.profiles?.metadata as any)?.career?.profession || "Member",
                        location: getLocationString(partner),
                        stories: activeStories
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
                // Fetch the latest message timestamp for all conversations in a single, ultra-fast query
                const latestMessages: any[] = await prisma.$queryRawUnsafe(`
                    SELECT 
                        CASE 
                            WHEN sender_id = $1::uuid THEN receiver_id 
                            ELSE sender_id 
                        END as partner_id,
                        MAX(created_at) as latest_message_at
                    FROM messages
                    WHERE sender_id = $1::uuid OR receiver_id = $1::uuid
                    GROUP BY partner_id
                `, userId);

                latestMessages.forEach((msg: any) => {
                    const pId = msg.partner_id;
                    if (pId && uniqueConnections.has(pId)) {
                        uniqueConnections.get(pId).latestMessageAt = msg.latest_message_at;
                    }
                });
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

        // Fetch to get user IDs for cache busting before deleting
        const interaction = await prisma.interactions.findUnique({
            where: { id: id },
            select: { from_user_id: true, to_user_id: true }
        });

        // Verify user is part of the connection
        const deleteResult = await prisma.interactions.deleteMany({
            where: {
                id: id,
                OR: [
                    { from_user_id: userId },
                    { to_user_id: userId }
                ]
            }
        });

        if (interaction && deleteResult.count > 0) {
            const { from_user_id, to_user_id } = interaction;
            if (from_user_id && to_user_id) {
                matchCache.deletePrefix(`${from_user_id}_`);
                matchCache.deletePrefix(`${to_user_id}_`);
            }
        }

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

        try {
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
                    profiles: { select: { photos: true, metadata: true } }
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

            // 1. Check if we already sent a request to this user
        const existingInteraction = await prisma.interactions.findUnique({
            where: {
                from_user_id_to_user_id_type: {
                    from_user_id: userId,
                    to_user_id: toUserId,
                    type: 'REQUEST'
                }
            }
        });

        if (existingInteraction) {
            if (existingInteraction.status === 'connected') {
                return res.json({ success: true, message: "Already connected" });
            }
            if (existingInteraction.status === 'pending') {
                return res.json({ success: true, message: "Interest request already pending" });
            }
        }

        // 2. Check if the other user already sent a request to us (opposite request)
        const oppositeInteraction = await prisma.interactions.findUnique({
            where: {
                from_user_id_to_user_id_type: {
                    from_user_id: toUserId,
                    to_user_id: userId,
                    type: 'REQUEST'
                }
            }
        });

        if (oppositeInteraction) {
            if (oppositeInteraction.status === 'connected') {
                return res.json({ success: true, message: "Already connected" });
            }
            if (oppositeInteraction.status === 'pending') {
                // Mutual Interest! Automatically connect them
                const updateRes = await prisma.interactions.updateMany({
                    where: { id: oppositeInteraction.id, status: 'pending' },
                    data: { status: 'connected' }
                });

                if (updateRes.count > 0) {
                    // Trigger notifications & match email (similar to Accept route)
                    try {
                        const uA = await prisma.users.findUnique({ 
                            where: { id: toUserId },
                            select: {
                                email: true,
                                full_name: true,
                                avatar_url: true,
                                profiles: { select: { metadata: true } }
                            }
                        });
                        const uB = await prisma.users.findUnique({ 
                            where: { id: userId },
                            select: {
                                full_name: true,
                                age: true,
                                city: true,
                                location_name: true,
                                avatar_url: true,
                                profiles: { select: { metadata: true } }
                            }
                        });

                        if (uA && uB) {
                            const { sanitizePhotoUrl } = require('../utils/photoUrl');
                            
                            // User A (target user) photo
                            const metaA = (uA.profiles?.metadata as any) || {};
                            let rawPhotoA = uA.avatar_url || metaA.photos?.[0] || null;
                            if (rawPhotoA && rawPhotoA.startsWith('data:image')) {
                                rawPhotoA = null;
                            }
                            const userPhotoUrl = rawPhotoA
                                ? sanitizePhotoUrl(rawPhotoA, uA.full_name || "User")
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(uA.full_name || "User")}&background=random&color=fff&size=256`;

                            // User B (current user) photo & details
                            const metaB = (uB.profiles?.metadata as any) || {};
                            const ageStr = uB.age ? `${uB.age} yr` : '';
                            const profStr = metaB.career?.profession || "";
                            const locStr = uB.city || uB.location_name || metaB.location?.city || "";

                            const detailsArr = [ageStr, profStr, locStr].filter(Boolean);
                            const detailsStr = detailsArr.length > 0 ? detailsArr.join(' • ') : '';

                            let rawPhotoB = uB.avatar_url || metaB.photos?.[0] || null;
                            if (rawPhotoB && rawPhotoB.startsWith('data:image')) {
                                rawPhotoB = null;
                            }
                            const partnerPhotoUrl = rawPhotoB
                                ? sanitizePhotoUrl(rawPhotoB, uB.full_name || "Partner")
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(uB.full_name || "Partner")}&background=random&color=fff&size=256`;

                            const partnerDetails = {
                                age: uB.age || metaB.age,
                                location: locStr,
                                job: profStr,
                                detailsString: detailsStr
                            };

                            await EmailService.sendMatchAcceptedEmail(
                                uA.email,
                                uA.full_name || "User",
                                userPhotoUrl,
                                uB.full_name || "User",
                                partnerPhotoUrl,
                                partnerDetails
                            );

                            const msg = `Good news! ${uB.full_name} accepted your request. You can now chat! 🎉`;
                            getIO().to(toUserId).emit('notification:new', {
                                type: 'match',
                                message: msg,
                                timestamp: new Date()
                            });
                        }
                    } catch (notifyErr) { 
                        console.error("Notify error during mutual match", notifyErr); 
                    }

                    // Bust cache for both
                    matchCache.deletePrefix(`${userId}_`);
                    matchCache.deletePrefix(`${toUserId}_`);

                    return res.json({ success: true, message: "Connected mutually!" });
                } else {
                    return res.json({ success: true, message: "Already connected" });
                }
            }
        }

        // UPSERT Interaction (only runs if no existing/opposite request is connected or pending)
        const interaction = await prisma.interactions.upsert({
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

        // Send notifications (only for new requests / declined requests returning to pending)
        if (true) {
            try {
                const meta = (user.profiles?.metadata as any) || {};
                const ageStr = user.age ? `${user.age} yr` : '';
                const profStr = meta.career?.profession || "";
                const locStr = user.city || user.location_name || meta.location?.city || "";

                const detailsArr = [ageStr, profStr, locStr].filter(Boolean);
                const detailsStr = detailsArr.length > 0 ? ` (${detailsArr.join(', ')})` : '';

                const msg = `${myName}${detailsStr} sent you an Interest Request! 💖`;

                // Persist
                const dbNotif = await prisma.notifications.create({
                    data: {
                        user_id: toUserId,
                        type: 'request',
                        message: msg,
                        data: { fromUserId: userId }
                    }
                });

                // Get photo url
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                let rawPhotoUrl = user.avatar_url || (user.profiles?.photos as any)?.[0] || null;
                if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
                    rawPhotoUrl = null;
                }
                const fromUserPhoto = rawPhotoUrl
                    ? sanitizePhotoUrl(rawPhotoUrl, myName)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=256`;

                // Realtime
                getIO().to(toUserId).emit('notification:new', {
                    id: dbNotif.id,
                    type: 'request',
                    message: msg,
                    timestamp: new Date(),
                    fromUserId: userId,
                    fromUserName: myName,
                    fromUserPhoto: fromUserPhoto,
                    interactionId: interaction.id
                });

                // Embed the sender ID so the Android app / PWA knows where to navigate
                const pushData = { 
                    type: 'request', 
                    from: userId, 
                    screen: 'requests',
                    interactionId: interaction.id
                };
                
                // Realtime Push via Service Worker / FCM
                const { NotificationService } = await import('../services/notification');
                NotificationService.getInstance().sendToUser(
                    toUserId, 
                    "New Match Interest! 💖", 
                    msg,
                    pushData
                ).catch(e => console.warn("Push failed in interactions", e));

                // Email
                // Provide a PNG fallback for emails, because email clients do not render SVGs
                const emailPhotoUrl = fromUserPhoto;

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

        // Bust the match cache for BOTH users so next fetch returns updated status
        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${toUserId}_`);

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
                const endBracketIdx = cleanText.indexOf(']');
                if (endBracketIdx !== -1) {
                    actualText = cleanText.substring(endBracketIdx + 1);
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

            // Always create persistent DB notification and emit real-time alert
            const dbNotif = await prisma.notifications.create({
                data: {
                    user_id: toUserId,
                    type: isStoryReply ? 'story_reply' : 'direct_message',
                    message: msg,
                    data: { fromUserId: userId }
                }
            });

            // Realtime Socket Notification
            getIO().to(toUserId).emit('notification:new', {
                id: dbNotif.id,
                type: isStoryReply ? 'story_reply' : 'direct_message',
                message: msg,
                fromUserId: userId,
                timestamp: new Date()
            });

            // Push Notification
            const pushData = { type: 'chat', from: userId, screen: 'connections' };
            const { NotificationService } = await import('../services/notification');
            NotificationService.getInstance().sendToUser(
                toUserId, 
                isStoryReply ? "New Story Reply! 📸" : "New Direct Message! 💌", 
                msg,
                pushData
            ).catch(e => console.warn("Push failed in direct message", e));

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
        
        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${toUserId}_`);

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
            where: { id: interactionId, to_user_id: req.user.userId, status: 'pending' },
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
                    matchCache.deletePrefix(`${from_user_id}_`);
                    matchCache.deletePrefix(`${to_user_id}_`);
                    try {
                        const uA = await prisma.users.findUnique({
                            where: { id: from_user_id },
                            select: {
                                email: true,
                                full_name: true,
                                avatar_url: true,
                                profiles: { select: { metadata: true } }
                            }
                        });
                        const uB = await prisma.users.findUnique({
                            where: { id: to_user_id },
                            select: {
                                full_name: true,
                                age: true,
                                city: true,
                                location_name: true,
                                avatar_url: true,
                                profiles: { select: { metadata: true } }
                            }
                        });

                        if (uA && uB) {
                            const { sanitizePhotoUrl } = require('../utils/photoUrl');
                            
                            // User A (recipient) photo
                            const metaA = (uA.profiles?.metadata as any) || {};
                            let rawPhotoA = uA.avatar_url || metaA.photos?.[0] || null;
                            if (rawPhotoA && rawPhotoA.startsWith('data:image')) {
                                rawPhotoA = null;
                            }
                            const userPhotoUrl = rawPhotoA
                                ? sanitizePhotoUrl(rawPhotoA, uA.full_name || "User")
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(uA.full_name || "User")}&background=random&color=fff&size=256`;

                            // User B (partner) photo & details
                            const metaB = (uB.profiles?.metadata as any) || {};
                            const ageStr = uB.age ? `${uB.age} yr` : '';
                            const profStr = metaB.career?.profession || "";
                            const locStr = uB.city || uB.location_name || metaB.location?.city || "";

                            const detailsArr = [ageStr, profStr, locStr].filter(Boolean);
                            const detailsStr = detailsArr.length > 0 ? detailsArr.join(' • ') : '';

                            let rawPhotoB = uB.avatar_url || metaB.photos?.[0] || null;
                            if (rawPhotoB && rawPhotoB.startsWith('data:image')) {
                                rawPhotoB = null;
                            }
                            const partnerPhotoUrl = rawPhotoB
                                ? sanitizePhotoUrl(rawPhotoB, uB.full_name || "Partner")
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(uB.full_name || "Partner")}&background=random&color=fff&size=256`;

                            const partnerDetails = {
                                age: uB.age || metaB.age,
                                location: locStr,
                                job: profStr,
                                detailsString: detailsStr
                            };

                            await EmailService.sendMatchAcceptedEmail(
                                uA.email,
                                uA.full_name || "User",
                                userPhotoUrl,
                                uB.full_name || "User",
                                partnerPhotoUrl,
                                partnerDetails
                            );

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

        const interaction = await prisma.interactions.findUnique({
            where: { id: interactionId },
            select: { from_user_id: true, to_user_id: true }
        });

        await prisma.interactions.updateMany({
            where: { id: interactionId, to_user_id: userId },
            data: { status: 'declined' }
        });

        if (interaction && interaction.from_user_id && interaction.to_user_id) {
            matchCache.deletePrefix(`${interaction.from_user_id}_`);
            matchCache.deletePrefix(`${interaction.to_user_id}_`);
        }

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

        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${toUserId}_`);

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
                is_liked: true,
                created_at: new Date()
            },
            create: {
                user_a_id: userId,
                user_b_id: toUserId,
                is_liked: true,
                status: 'pending'
            }
        });

        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${toUserId}_`);

        // Notification & Realtime push for Like
        try {
            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: {
                    full_name: true,
                    avatar_url: true,
                    profiles: { select: { photos: true, metadata: true } }
                }
            });

            if (user) {
                const myName = user.full_name || "Someone";
                const msg = `${myName} liked your profile! ❤️`;
                
                // Persist
                const dbNotif = await prisma.notifications.create({
                    data: {
                        user_id: toUserId,
                        type: 'like',
                        message: msg,
                        data: { fromUserId: userId }
                    }
                });

                // Get photo
                const meta = (user.profiles?.metadata as any) || {};
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                let rawPhotoUrl = user.avatar_url || (user.profiles?.photos as any)?.[0] || null;
                if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
                    rawPhotoUrl = null;
                }
                const fromUserPhoto = rawPhotoUrl
                    ? sanitizePhotoUrl(rawPhotoUrl, myName)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=256`;

                // Emit realtime
                const { getIO } = require('../socket');
                const io = getIO();
                io.to(toUserId).emit('notification:new', {
                    id: dbNotif.id,
                    type: 'like',
                    message: msg,
                    timestamp: new Date(),
                    fromUserId: userId,
                    fromUserName: myName,
                    fromUserPhoto: fromUserPhoto
                });
                io.to(toUserId).emit('like:new', {
                    fromUserId: userId,
                    fromUserName: myName,
                    fromUserPhoto: fromUserPhoto,
                    likedAt: new Date()
                });

                // Push
                const { NotificationService } = await import('../services/notification');
                NotificationService.getInstance().sendToUser(
                    toUserId,
                    "New Profile Like! ❤️",
                    msg,
                    { type: 'like', from: userId, screen: 'matches' }
                ).catch((e: any) => console.warn("Push failed in like", e));
            }
        } catch (notifErr) {
            console.error("Failed to notify profile like:", notifErr);
        }

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

        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${toUserId}_`);

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

            const isBlurred = false;

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
            isPremium: true,
            totalLikes,
            likes: formattedLikes
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

        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${blockedId}_`);

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

        matchCache.deletePrefix(`${userId}_`);
        matchCache.deletePrefix(`${blockedId}_`);

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

        // Notification & Realtime push for profile view
        try {
            const viewer = await prisma.users.findUnique({
                where: { id: userId },
                select: {
                    full_name: true,
                    avatar_url: true,
                    profiles: { select: { photos: true, metadata: true } }
                }
            });

            if (viewer) {
                const viewerName = viewer.full_name || "Someone";
                const msg = `${viewerName} viewed your profile! 👀`;

                // Persist notification for targetId
                const dbNotif = await prisma.notifications.create({
                    data: {
                        user_id: targetId,
                        type: 'view',
                        message: msg,
                        data: { fromUserId: userId }
                    }
                });

                // Get photo
                const meta = (viewer.profiles?.metadata as any) || {};
                const { sanitizePhotoUrl } = require('../utils/photoUrl');
                let rawPhotoUrl = viewer.avatar_url || (viewer.profiles?.photos as any)?.[0] || null;
                if (rawPhotoUrl && rawPhotoUrl.startsWith('data:image')) {
                    rawPhotoUrl = null;
                }
                const fromUserPhoto = rawPhotoUrl
                    ? sanitizePhotoUrl(rawPhotoUrl, viewerName)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(viewerName)}&background=random&color=fff&size=256`;

                // Emit realtime socket event if online
                const { getIO } = require('../socket');
                const io = getIO();
                io.to(targetId).emit('notification:new', {
                    id: dbNotif.id,
                    type: 'view',
                    message: msg,
                    timestamp: new Date(),
                    fromUserId: userId,
                    fromUserName: viewerName,
                    fromUserPhoto: fromUserPhoto
                });
                io.to(targetId).emit('visitor:new', {
                    fromUserId: userId,
                    fromUserName: viewerName,
                    fromUserPhoto: fromUserPhoto,
                    viewedAt: new Date()
                });

                // Send Push Notification if offline
                const { isUserOnline } = require('../socket');
                if (!isUserOnline(targetId)) {
                    const { NotificationService } = require('../services/notification');
                    NotificationService.getInstance().sendToUser(
                        targetId,
                        `${viewerName}`,
                        `viewed your profile! 👀`,
                        {
                            type: 'view',
                            from: userId,
                            screen: 'visitors',
                            fromUserId: userId,
                            fromUserName: viewerName,
                            fromUserPhoto: fromUserPhoto
                        }
                    ).catch((e: any) => console.warn("Push failed in view profile", e));
                }
            }
        } catch (viewNotifErr) {
            console.error("Failed to notify profile view:", viewNotifErr);
        }

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

            return {
                id: u.id,
                name: u.full_name || "User",
                age: u.age || meta.age,
                height: meta.height || "Not Specified",
                photoUrl: sanitizePhotoUrl(u.avatar_url || meta.photos?.[0], u.full_name || u.id),
                location: getLocationString(u),
                profession: meta.career?.profession || "Member",
                viewedAt: r.created_at,
                isBlurred: false,
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
            isPremium: true,
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
