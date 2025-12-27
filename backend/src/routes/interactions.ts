import express from 'express';
// import { pool } from '../db';
import { prisma } from '../prisma';
import { getIO } from '../socket'; // Import socket getter
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get Requests (Pending interactions of type 'REQUEST')
router.get('/requests', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const requests = await prisma.interactions.findMany({
            where: {
                to_user_id: userId,
                type: 'REQUEST',
                status: 'pending'
            },
            include: {
                users_interactions_from_user_idTousers: true
            }
        });

        const formattedRequests = requests.map(r => {
            const fromUser = r.users_interactions_from_user_idTousers!;
            return {
                interactionId: r.id,
                fromUser: {
                    id: fromUser.id,
                    name: fromUser.full_name,
                    photoUrl: fromUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.id}`,
                    career: { profession: "Member" }
                },
                timestamp: r.created_at
            };
        });

        res.json(formattedRequests);
    } catch (e) {
        console.error("Get Requests Error", e);
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
            include: {
                users_interactions_from_user_idTousers: true,
                users_interactions_to_user_idTousers: true
            }
        });

        const formattedConnections = connections.map(r => {
            const u1 = r.users_interactions_from_user_idTousers!;
            const u2 = r.users_interactions_to_user_idTousers!;

            const isFromMe = r.from_user_id === userId;
            const partner = isFromMe ? u2 : u1;

            return {
                interactionId: r.id,
                partner: {
                    id: partner.id,
                    name: partner.full_name,
                    photoUrl: partner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.id}`,
                    role: "Member",
                    location: "India"
                },
                timestamp: r.created_at
            };
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

// Send Interest (Connect Request)
router.post('/interest', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.body;

        // Fetch Names & Premium
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { full_name: true, is_premium: true }
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

        // UPSERT Interaction
        // UPSERT Interaction
        await prisma.interactions.upsert({
            where: {
                // Prisma uses the field names concatenated by default unless named with @@unique(name:...)
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

        // Notifications
        try {
            const msg = "Someone sent you an Interest Request! 💖";

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

            // Email
            await EmailService.sendInterestReceivedEmail(targetEmail, targetName, myName);
        } catch (err) {
            console.warn("Notification/Email failed:", err);
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Send Interest Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// ...

// Accept Request
router.post('/requests/:interactionId/accept', authenticateToken, async (req: any, res) => {
    try {
        const { interactionId } = req.params;

        // Update
        const interaction = await prisma.interactions.update({
            where: { id: interactionId },
            data: { status: 'connected' },
            select: { from_user_id: true, to_user_id: true }
        });

        if (interaction) {
            const { from_user_id, to_user_id } = interaction;
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

        await prisma.interactions.update({
            where: { id: interactionId },
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
            const u = r.users_matches_user_a_idTousers!;
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
                photoUrl: u.avatar_url || meta.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
                location: u.location_name || meta.location?.city || "India",
                profession: meta.career?.profession || "Professional",
                isBlurred: false,
                likedAt: r.created_at
            };
        });

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
            avatar_url: b.users_blocks_blocked_idTousers.avatar_url,
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
            const u = r.users_interactions_from_user_idTousers!;
            const meta = (u.profiles?.metadata as any) || {};
            const isBlurred = !isPremium;

            return {
                id: u.id,
                name: isBlurred ? "Verify to Unlock" : (u.full_name || "User"),
                age: isBlurred ? "??" : (u.age || meta.age),
                photoUrl: isBlurred
                    ? `https://api.dicebear.com/7.x/shapes/svg?seed=${u.id}`
                    : (u.avatar_url || meta.photos?.[0]),
                location: isBlurred ? "Hidden" : (u.location_name || meta.location?.city || "India"),
                profession: isBlurred ? "Hidden" : (meta.career?.profession || "Professional"),
                viewedAt: r.created_at,
                isBlurred
            };
        });

        res.json({
            isPremium,
            visitors: formattedVisitors
        });

    } catch (e) {
        console.error("Get Visitors Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

export default router;
