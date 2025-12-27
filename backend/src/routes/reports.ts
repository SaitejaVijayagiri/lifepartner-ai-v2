import express from 'express';
// import { pool } from '../db';
import { prisma } from '../prisma';
import { getIO } from '../socket';
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

        const report = await prisma.reports.create({
            data: {
                reporter_id: reporterId,
                reported_id: reportedId,
                reason,
                details
            }
        });

        // Notify Admins
        try {
            const io = getIO();
            io.emit('admin:newReport', {
                id: report.id,
                reason,
                reporterId,
                created_at: new Date()
            });
        } catch (e) { /* ignore if socket not ready */ }

        res.status(201).json({
            message: "Report submitted successfully",
            reportId: report.id
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

        const reports = await prisma.reports.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                users_reports_reporter_idTousers: { select: { full_name: true } },
                users_reports_reported_idTousers: { select: { full_name: true } }
            }
        });

        const formattedReports = reports.map(r => ({
            id: r.id,
            reason: r.reason,
            details: r.details,
            created_at: r.created_at,
            reporter_name: r.users_reports_reporter_idTousers?.full_name || 'Unknown User',
            target_name: r.users_reports_reported_idTousers?.full_name || 'Deleted User',
            target_id: r.reported_id
        }));

        res.json(formattedReports);
    } catch (e) {
        console.error("Fetch Reports Error", e);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

export default router;
