import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Middleware to check auth (Assuming global auth middleware or applying individually)
// We'll import authenticateToken if available, or just check req.headers manually if pattern suggests so.
// Based on server.ts, 'authRoutes' is used, likely utilizing a middleware not shown in server.ts imports directly but common in this project.
// Let's assume we need to import middleware.
import { authenticateToken, requireAdmin } from '../middleware/auth';

// 1. Submit Verification Request
router.post('/request', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { documentUrl } = req.body; // Optional for now

        // Check if pending exists
        const check = await pool.query('SELECT * FROM verification_requests WHERE user_id = $1 AND status = \'PENDING\'', [userId]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Verification request already pending.' });
        }

        // Create Request
        await pool.query(
            'INSERT INTO verification_requests (user_id, document_url) VALUES ($1, $2)',
            [userId, documentUrl || 'https://example.com/mock-id.jpg']
        );

        res.json({ success: true, message: 'Verification requested successfully.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Check My Status
router.get('/status', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT status, created_at FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        // Also check if user is already verified (e.g. manually set)
        const userRes = await pool.query('SELECT is_verified FROM users WHERE id = $1', [userId]);
        const isVerified = userRes.rows[0]?.is_verified;

        res.json({
            isVerified,
            request: result.rows[0] || null
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN ROUTES (Protected) ---

// 3. List All Pending Requests
router.get('/admin/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT vr.*, u.name, u.email, u.photo_url 
            FROM verification_requests vr
            JOIN users u ON vr.user_id = u.id
            WHERE vr.status = 'PENDING'
            ORDER BY vr.created_at DESC
        `);
        res.json(result.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Approve/Reject
router.post('/admin/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body; // status: 'APPROVED' | 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update Request
        const resUpd = await client.query(
            'UPDATE verification_requests SET status = $1, admin_notes = $2 WHERE id = $3 RETURNING user_id',
            [status, notes, id]
        );

        if (resUpd.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }

        const userId = resUpd.rows[0].user_id;

        // If Approved, update User table
        if (status === 'APPROVED') {
            await client.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [userId]);
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

export default router;
