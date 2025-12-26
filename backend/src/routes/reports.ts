import express from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// POST /reports - Create a new user report
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const reporterId = req.user.userId;
        const { reportedId, reason, details } = req.body;

        if (!reportedId || !reason) {
            return res.status(400).json({ error: "Missing required fields: reportedId, reason" });
        }

        // Optional: Validate that reportedId exists (FK constraint will catch it too, but this is cleaner)
        // Ignoring for speed, db error will handle it.

        const query = `
            INSERT INTO public.reports (reporter_id, reported_id, reason, details)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at
        `;

        const result = await pool.query(query, [reporterId, reportedId, reason, details]);

        res.status(201).json({
            message: "Report submitted successfully",
            reportId: result.rows[0].id
        });

    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /reports - Admin View
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        // TODO: specific admin check. For now, allow logged in users (MVP Admin URL security)

        const client = await pool.connect();
        const result = await client.query(`
            SELECT r.id, r.reason, r.details, r.created_at,
                   COALESCE(rep.full_name, 'Unknown User') as reporter_name,
                   COALESCE(target.full_name, 'Deleted User') as target_name, r.reported_id as target_id
            FROM public.reports r
            LEFT JOIN public.users rep ON r.reporter_id = rep.id
            LEFT JOIN public.users target ON r.reported_id = target.id
            ORDER BY r.created_at DESC
            LIMIT 50
        `);

        client.release();
        res.json(result.rows);
    } catch (e) {
        console.error("Fetch Reports Error", e);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

export default router;
