import express from 'express';
import { pool } from '../db';
import { getIO } from '../socket'; // Import socket getter
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get Requests (Pending interactions of type 'REQUEST')
router.get('/requests', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const client = await pool.connect();
        const result = await client.query(`
            SELECT i.id as interaction_id, i.created_at,
                   u.id as from_id, u.full_name as from_name, u.avatar_url
            FROM interactions i
            JOIN users u ON i.from_user_id = u.id
            WHERE i.to_user_id = $1 
              AND i.type = 'REQUEST' 
              AND i.status = 'pending'
        `, [userId]);

        client.release();

        const requests = result.rows.map(r => ({
            interactionId: r.interaction_id,
            fromUser: {
                id: r.from_id,
                name: r.from_name,
                photoUrl: r.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.from_id}`,
                career: { profession: "Member" }
            },
            timestamp: r.created_at
        }));

        res.json(requests);
    } catch (e) {
        console.error("Get Requests Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Get Connections (Accepted Interactions)
router.get('/connections', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const client = await pool.connect();
        // Find interactions where status='connected' AND (from=me OR to=me)
        // type might be 'REQUEST' (origin) or we just look for status='connected'
        const result = await client.query(`
            SELECT i.id as interaction_id, i.created_at,
                   u1.id as u1_id, u1.full_name as u1_name, u1.avatar_url as u1_avatar,
                   u2.id as u2_id, u2.full_name as u2_name, u2.avatar_url as u2_avatar
            FROM interactions i
            JOIN users u1 ON i.from_user_id = u1.id
            JOIN users u2 ON i.to_user_id = u2.id
            WHERE (i.from_user_id = $1 OR i.to_user_id = $1) 
              AND i.status = 'connected'
        `, [userId]);

        client.release();

        const connections = result.rows.map(r => {
            const isFromMe = r.u1_id === userId;
            const partnerId = isFromMe ? r.u2_id : r.u1_id;
            const partnerName = isFromMe ? r.u2_name : r.u1_name;
            const partnerAvatar = isFromMe ? r.u2_avatar : r.u1_avatar;

            return {
                interactionId: r.interaction_id,
                partner: {
                    id: partnerId,
                    name: partnerName,
                    photoUrl: partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`,
                    role: "Member",
                    location: "India"
                },
                timestamp: r.created_at
            };
        });

        res.json(connections);
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
        const client = await pool.connect();
        await client.query(`
            DELETE FROM matches 
            WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)
        `, [id, userId]);

        client.release();
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

        const client = await pool.connect();

        // Fetch Names for Email
        const userRes = await client.query('SELECT full_name, email FROM users WHERE id = $1', [userId]);
        const targetRes = await client.query('SELECT full_name, email FROM users WHERE id = $1', [toUserId]);
        const myName = userRes.rows[0].full_name;
        const targetEmail = targetRes.rows[0].email;
        const targetName = targetRes.rows[0].full_name;

        // Upsert Interaction: type='REQUEST'
        await client.query(`
            INSERT INTO public.interactions (from_user_id, to_user_id, type, status)
            VALUES ($1, $2, 'REQUEST', 'pending')
            ON CONFLICT (from_user_id, to_user_id, type) 
            DO UPDATE SET status = 'pending', created_at = NOW()
        `, [userId, toUserId]);

        // Emit Real-time Notification & Persist
        try {
            const msg = "Someone sent you an Interest Request! 💖";

            // Persist
            await client.query(`
                INSERT INTO public.notifications (user_id, type, message, data)
                VALUES ($1, 'request', $2, $3)
            `, [toUserId, msg, JSON.stringify({ fromUserId: userId })]);

            // Realtime
            getIO().to(toUserId).emit('notification:new', {
                type: 'request',
                message: msg,
                timestamp: new Date()
            });

            // EMAIL ALERT
            await EmailService.sendInterestReceivedEmail(targetEmail, targetName, myName);

        } catch (err) {
            console.warn("Notification/Email failed:", err);
        }

        client.release();
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
        const client = await pool.connect();

        // Update Status in interactions table
        const resDb = await client.query(`
            UPDATE interactions 
            SET status = 'connected' 
            WHERE id = $1 
            RETURNING from_user_id, to_user_id
        `, [interactionId]);

        if (resDb.rows.length > 0) {
            const { from_user_id, to_user_id } = resDb.rows[0];

            // Notify Sender (from_user_id) that Receiver (to_user_id) accepted
            try {
                // Fetch details
                const uA = await client.query('SELECT full_name, email FROM users WHERE id = $1', [from_user_id]);
                const uB = await client.query('SELECT full_name FROM users WHERE id = $1', [to_user_id]);

                if (uA.rows.length && uB.rows.length) {
                    await EmailService.sendMatchAcceptedEmail(uA.rows[0].email, uA.rows[0].full_name, uB.rows[0].full_name);

                    // Realtime Notification
                    const msg = `Good news! ${uB.rows[0].full_name} accepted your request. You can now chat! 🎉`;
                    getIO().to(from_user_id).emit('notification:new', {
                        type: 'match',
                        message: msg,
                        timestamp: new Date()
                    });
                }
            } catch (notifyErr) { console.error("Notify error", notifyErr); }
        }

        client.release();
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
        const client = await pool.connect();

        // Update interactions table
        await client.query("UPDATE interactions SET status = 'declined' WHERE id = $1", [interactionId]);

        client.release();
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

        const client = await pool.connect();
        await client.query(`
            INSERT INTO public.reports (reporter_id, reported_id, reason, details)
            VALUES ($1, $2, $3, $4)
        `, [userId, reportedId, reason, details || '']);

        client.release();
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

        const client = await pool.connect();
        await client.query(`
            INSERT INTO public.contact_inquiries (name, email, message)
            VALUES ($1, $2, $3)
        `, [name, email, message]);

        client.release();
        res.json({ success: true, message: "Inquiry received" });
    } catch (e) {
        console.error("Contact Form Error", e);
        res.status(500).json({ error: "Failed to save inquiry" });
    }
});

// GET /who-liked-me - Premium Feature: See who liked your profile
router.get('/who-liked-me', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const client = await pool.connect();

        // Check premium status
        const userRes = await client.query('SELECT is_premium FROM public.users WHERE id = $1', [userId]);
        const isPremium = userRes.rows[0]?.is_premium;

        // Get users who liked me (where user_b_id = me and is_liked = true)
        const likesRes = await client.query(`
            SELECT m.user_a_id, m.created_at, m.is_liked,
                   u.full_name, u.avatar_url, u.age, u.location_name,
                   p.metadata
            FROM public.matches m
            JOIN public.users u ON m.user_a_id = u.id
            LEFT JOIN public.profiles p ON u.id = p.user_id
            WHERE m.user_b_id = $1 AND m.is_liked = TRUE
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [userId]);

        client.release();

        const totalLikes = likesRes.rows.length;

        // If not premium, return count but blur the details
        if (!isPremium) {
            const blurredLikes = likesRes.rows.slice(0, 3).map((r, i) => ({
                id: r.user_a_id,
                name: "???",
                age: "??",
                photoUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${i}`, // Generic shape
                location: "Hidden",
                isBlurred: true,
                likedAt: r.created_at
            }));

            return res.json({
                isPremium: false,
                totalLikes,
                message: `${totalLikes} people liked your profile! Upgrade to Premium to see who.`,
                likes: blurredLikes
            });
        }

        // Premium users get full details
        const likes = likesRes.rows.map(r => {
            const meta = r.metadata || {};
            return {
                id: r.user_a_id,
                name: r.full_name || "User",
                age: r.age || meta.age,
                photoUrl: r.avatar_url || meta.photos?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user_a_id}`,
                location: r.location_name || meta.location?.city || "India",
                profession: meta.career?.profession || "Professional",
                isBlurred: false,
                likedAt: r.created_at
            };
        });

        res.json({
            isPremium: true,
            totalLikes,
            likes
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

        const client = await pool.connect();

        // 1. Insert Block
        await client.query(`
            INSERT INTO public.blocks (blocker_id, blocked_id)
            VALUES ($1, $2)
            ON CONFLICT (blocker_id, blocked_id) DO NOTHING
        `, [userId, blockedId]);

        // 2. Remove any existing Connection/Match
        await client.query(`
            DELETE FROM public.matches 
            WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)
        `, [userId, blockedId]);

        // 3. Remove Interactions? (Optional, but safer)
        await client.query(`
            DELETE FROM public.interactions
            WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
        `, [userId, blockedId]);

        client.release();
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

        const client = await pool.connect();
        await client.query(`
            DELETE FROM public.blocks 
            WHERE blocker_id = $1 AND blocked_id = $2
        `, [userId, blockedId]);

        client.release();
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
        const client = await pool.connect();

        const result = await client.query(`
            SELECT b.blocked_id, u.full_name, u.avatar_url, b.created_at
            FROM public.blocks b
            JOIN public.users u ON b.blocked_id = u.id
            WHERE b.blocker_id = $1
        `, [userId]);

        client.release();
        res.json(result.rows);
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

        const client = await pool.connect();

        // Upsert Interaction (type='VIEW')
        // We update 'created_at' to keep track of the LATEST view
        await client.query(`
            INSERT INTO public.interactions (from_user_id, to_user_id, type, status)
            VALUES ($1, $2, 'VIEW', 'seen')
            ON CONFLICT (from_user_id, to_user_id, type) 
            DO UPDATE SET created_at = NOW()
        `, [userId, targetId]);

        client.release();
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
        const client = await pool.connect();

        // Check premium
        const userRes = await client.query('SELECT is_premium FROM public.users WHERE id = $1', [userId]);
        const isPremium = userRes.rows[0]?.is_premium;

        const result = await client.query(`
            SELECT i.from_user_id, i.created_at,
                   u.full_name, u.avatar_url, u.age, u.location_name,
                   p.metadata
            FROM public.interactions i
            JOIN public.users u ON i.from_user_id = u.id
            LEFT JOIN public.profiles p ON u.id = p.user_id
            WHERE i.to_user_id = $1 AND i.type = 'VIEW'
            ORDER BY i.created_at DESC
            LIMIT 20
        `, [userId]);

        client.release();

        const visitors = result.rows.map(r => {
            // If NOT premium, blur details (except for the first one maybe? No, blur all for teasing)
            const meta = r.metadata || {};
            const isBlurred = !isPremium;

            return {
                id: r.from_user_id,
                name: isBlurred ? "Verify to Unlock" : (r.full_name || "User"),
                age: isBlurred ? "??" : (r.age || meta.age),
                photoUrl: isBlurred
                    ? `https://api.dicebear.com/7.x/shapes/svg?seed=${r.from_user_id}`
                    : (r.avatar_url || meta.photos?.[0]),
                location: isBlurred ? "Hidden" : (r.location_name || meta.location?.city || "India"),
                profession: isBlurred ? "Hidden" : (meta.career?.profession || "Professional"),
                viewedAt: r.created_at,
                isBlurred
            };
        });

        res.json({
            isPremium,
            visitors
        });

    } catch (e) {
        console.error("Get Visitors Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

export default router;
