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

// GET /reports - Admin only (TODO: Add Admin Middleware)
// For now, leaving it out or protected by simple check if needed later.

export default router;
