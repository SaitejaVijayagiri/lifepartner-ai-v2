import express from 'express';
import { prisma } from '../prisma';
import { getIO } from '../socket';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { trackGrowthEvent } from '../services/growthAnalytics';

const router = express.Router();

// POST /reports - Create a new user report
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const reporterId = req.user.userId;
        const { reportedId, reason, details } = req.body;

        if (!reportedId || !reason) {
            return res.status(400).json({ error: "Missing required fields: reportedId, reason" });
        }

        const report = await prisma.reports.create({
            data: {
                reporter_id: reporterId,
                reported_id: reportedId,
                reason,
                details
            }
        });

        // Automatically block the reported user to immediately protect the reporter
        try {
            await prisma.blocks.upsert({
                where: {
                    blocker_id_blocked_id: {
                        blocker_id: reporterId,
                        blocked_id: reportedId
                    }
                },
                create: {
                    blocker_id: reporterId,
                    blocked_id: reportedId
                },
                update: {}
            });
        } catch (_) {}

        // Auto-quarantine repeat offenders reported by >= 3 distinct users in 30 days
        let autoQuarantined = false;
        try {
            const reportsModel = (prisma as any)?.reports;
            const usersModel = (prisma as any)?.users;
            if (reportsModel && typeof reportsModel.findMany === 'function') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const recentReports = await reportsModel.findMany({
                    where: {
                        reported_id: reportedId,
                        created_at: { gte: thirtyDaysAgo }
                    },
                    select: { reporter_id: true }
                });
                const distinctReporters = new Set(
                    (recentReports || []).map((r: any) => r?.reporter_id).filter(Boolean)
                );
                if (distinctReporters.size >= 3 && usersModel && typeof usersModel.update === 'function') {
                    await usersModel.update({
                        where: { id: reportedId },
                        data: { is_deactivated: true }
                    });
                    autoQuarantined = true;
                }
            }
        } catch (qErr) {
            console.warn('Auto-quarantine check warning:', qErr);
        }

        // Notify Admins
        try {
            const io = getIO();
            io.emit('admin:newReport', {
                id: report.id,
                reason,
                reporterId,
                autoQuarantined,
                created_at: new Date()
            });
            if (autoQuarantined) {
                io.emit('admin:urgentAbuseAlert', {
                    reportedId,
                    reason,
                    action: 'AUTO_QUARANTINED',
                    created_at: new Date()
                });
            }
        } catch (e) { /* ignore if socket not ready */ }

        trackGrowthEvent('user_reported', { userId: reporterId, metadata: { reason } }).catch(() => {});
        trackGrowthEvent('user_blocked', { userId: reporterId }).catch(() => {});

        res.status(201).json({
            message: "Report submitted successfully",
            reportId: report.id,
            autoQuarantined
        });

    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /reports - Admin View (requires admin access)
router.get('/', authenticateToken, adminAuth, async (req: any, res) => {
    try {
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
