import express from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(adminAuth);

// GET /stats - Dashboard Overview
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
        const premiumUsers = await pool.query('SELECT COUNT(*) FROM users WHERE is_premium = TRUE');

        // Use ILIKE or UPPER for case-insensitive check. Default is 'SUCCESS' in DB.
        const totalRevenue = await pool.query("SELECT COALESCE(SUM(amount), 0) as sum FROM transactions WHERE status ILIKE 'success'");

        // Reports might be 'pending' or 'PENDING'
        const pendingReports = await pool.query("SELECT COUNT(*) FROM reports WHERE status ILIKE 'pending'");

        res.json({
            totalUsers: parseInt(totalUsers.rows[0].count),
            premiumUsers: parseInt(premiumUsers.rows[0].count),
            totalRevenue: parseFloat(totalRevenue.rows[0].sum), // Use parseFloat for currency
            pendingReports: parseInt(pendingReports.rows[0].count)
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /users - List Users with Pagination & Search
router.get('/users', async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT id, full_name as name, email, phone, gender, created_at, is_premium, is_banned, is_admin 
            FROM users 
        `;
        const params: any[] = [];

        if (search) {
            query += ` WHERE full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// GET /users/:id - Get User Details
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT u.*, 
            (SELECT json_agg(r.*) FROM reports r WHERE r.reported_id = u.id) as reports,
            (SELECT COUNT(*) FROM interactions WHERE to_user_id = u.id AND type = 'LIKE') as likes_received
            FROM users u WHERE u.id = $1
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        // Fetch Profile Data (Photos, Bio)
        const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [id]);
        const profile = profileRes.rows[0] || {};

        res.json({ ...result.rows[0], profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// POST /ban - Ban or Unban User
router.post('/ban', async (req, res) => {
    try {
        const { userId, ban } = req.body; // ban: boolean

        await pool.query('UPDATE users SET is_banned = $1 WHERE id = $2', [ban, userId]);

        res.json({ success: true, message: `User ${ban ? 'banned' : 'unbanned'} successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update ban status' });
    }
});

// GET /reports - List Reports
router.get('/reports', async (req, res) => {
    try {
        // ideally join with users to get names
        const query = `
            SELECT r.id, r.reason, r.details, r.created_at, r.status,
            COALESCE(u.full_name, 'Unknown User') as reported_name,
            COALESCE(u2.full_name, 'Unknown User') as reporter_name,
            r.reported_id as target_id
            FROM reports r
            LEFT JOIN users u ON r.reported_id = u.id
            LEFT JOIN users u2 ON r.reporter_id = u2.id
            ORDER BY r.created_at DESC
            LIMIT 50
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// POST /resolve-report
router.post('/resolve-report', async (req, res) => {
    try {
        const { reportId, status } = req.body; // 'resolved', 'dismissed'
        await pool.query('UPDATE reports SET status = $1 WHERE id = $2', [status, reportId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

export default router;
