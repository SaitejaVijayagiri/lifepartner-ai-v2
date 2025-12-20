import express from 'express';
import { pool } from '../db';
import { getIO } from '../socket'; // Import socket getter
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get Requests (Pending matches where I am 'user_b')
router.get('/requests', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const client = await pool.connect();
        const result = await client.query(`
            SELECT m.id as interaction_id, m.created_at,
                   u.id as from_id, u.full_name as from_name
            FROM matches m
            JOIN users u ON m.user_a_id = u.id
            WHERE m.user_b_id = $1 AND m.status = 'pending'
        `, [userId]);

        client.release();

        const requests = result.rows.map(r => ({
            interactionId: r.interaction_id,
            fromUser: {
                id: r.from_id,
                name: r.from_name,
                photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.from_id}`,
                career: { profession: "Member" } // Join profiles for more data
            },
            timestamp: r.created_at
        }));

        res.json(requests);
    } catch (e) {
        console.error("Get Requests Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Get Connections (Accepted)
router.get('/connections', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const client = await pool.connect();
        // Find matches where status='accepted' AND (user_a=me OR user_b=me)
        const result = await client.query(`
            SELECT m.id as interaction_id, m.created_at,
                   u1.id as u1_id, u1.full_name as u1_name,
                   u2.id as u2_id, u2.full_name as u2_name
            FROM matches m
            JOIN users u1 ON m.user_a_id = u1.id
            JOIN users u2 ON m.user_b_id = u2.id
            WHERE (m.user_a_id = $1 OR m.user_b_id = $1) AND m.status = 'accepted'
        `, [userId]);

        client.release();

        const connections = result.rows.map(r => {
            const isA = r.u1_id === userId;
            const partnerId = isA ? r.u2_id : r.u1_id;
            const partnerName = isA ? r.u2_name : r.u1_name;

            return {
                interactionId: r.interaction_id,
                partner: {
                    id: partnerId,
                    name: partnerName,
                    photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`,
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

// Send Interest (Connect Request)
router.post('/interest', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.body;

        const client = await pool.connect();

        // Upsert: Only update STATUS. Do NOT touch is_liked.
        await client.query(`
            INSERT INTO public.matches (user_a_id, user_b_id, status, is_liked, score_total)
            VALUES ($1, $2, 'pending', FALSE, 0.8)
            ON CONFLICT (user_a_id, user_b_id) 
            DO UPDATE SET status = 'pending'
            WHERE matches.status IS DISTINCT FROM 'pending'
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
        } catch (err) {
            console.warn("Notification failed:", err);
        }

        client.release();
        res.json({ success: true });
    } catch (e) {
        console.error("Send Interest Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Revoke Interest (Cancel Request)
router.delete('/interest/:toUserId', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.params;

        const client = await pool.connect();
        await client.query(`
            UPDATE matches 
            SET status = NULL 
            WHERE user_a_id = $1 AND user_b_id = $2 AND status = 'pending'
        `, [userId, toUserId]);

        client.release();
        res.json({ success: true });
    } catch (e) {
        console.error("Revoke Interest Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Like Profile (Instagram Style)
router.post('/like', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.body;

        const client = await pool.connect();

        // Upsert: Only update IS_LIKED = TRUE. Do NOT touch status.
        await client.query(`
            INSERT INTO public.matches (user_a_id, user_b_id, status, is_liked, score_total)
            VALUES ($1, $2, DEFAULT, TRUE, 0.8)
            ON CONFLICT (user_a_id, user_b_id) 
            DO UPDATE SET is_liked = TRUE
        `, [userId, toUserId]);

        // Notify
        try {
            const msg = "Someone liked your profile! ⭐";
            await client.query(`
                INSERT INTO public.notifications (user_id, type, message, data)
                VALUES ($1, 'like', $2, $3)
            `, [toUserId, 'like', JSON.stringify({ fromUserId: userId })]);

            getIO().to(toUserId).emit('notification:new', {
                type: 'like',
                message: msg,
                timestamp: new Date()
            });
        } catch (e) { console.warn("Notify error", e); }

        client.release();
        res.json({ success: true });
    } catch (e) {
        console.error("Like Profile Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Unlike Profile (Instagram Style)
router.delete('/like/:toUserId', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { toUserId } = req.params;

        const client = await pool.connect();

        // Update is_liked = FALSE. Do NOT touch status.
        await client.query(`
            UPDATE matches 
            SET is_liked = FALSE
            WHERE user_a_id = $1 AND user_b_id = $2
        `, [userId, toUserId]);

        client.release();
        res.json({ success: true });
    } catch (e) {
        console.error("Unlike Profile Error", e);
        res.status(500).json({ error: "Failed" });
    }
});

// Accept
router.post('/:id/accept', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        await client.query("UPDATE matches SET status = 'accepted' WHERE id = $1", [id]);
        client.release();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed" });
    }
});

// Decline
router.post('/:id/decline', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        await client.query("UPDATE matches SET status = 'declined' WHERE id = $1", [id]);
        client.release();
        res.json({ success: true });
    } catch (e) {
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

export default router;
