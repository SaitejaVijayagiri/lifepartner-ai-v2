import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { EmailService } from '../services/email';

const router = express.Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(adminAuth);

// GET /stats - Dashboard Overview
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await prisma.users.count();
        const premiumUsers = await prisma.users.count({ where: { is_premium: true } });

        // Revenue Breakdown
        // Prisma aggregate returns { _sum: { amount: number } }
        // Status check: DB default for transactions is 'SUCCESS', but code used ILIKE 'success'.
        // Assuming status is stored consistently as 'SUCCESS'.
        const totalRevenue = await prisma.transactions.aggregate({
            _sum: { amount: true },
            where: {
                status: 'SUCCESS',
                type: { in: ['SUBSCRIPTION', 'DEPOSIT', 'BOOST'] }
            }
        });

        const premiumRevenue = await prisma.transactions.aggregate({
            _sum: { amount: true },
            where: { status: 'SUCCESS', type: 'SUBSCRIPTION' } // Code used 'PREMIUM' but payment.ts writes 'SUBSCRIPTION'
        });

        const coinRevenue = await prisma.transactions.aggregate({
            _sum: { amount: true },
            where: {
                status: 'SUCCESS',
                OR: [{ type: 'COINS' }, { type: 'DEPOSIT' }] // payment.ts writes 'DEPOSIT' for coins
            }
        });

        const pendingReports = await prisma.reports.count({
            where: { status: { equals: 'pending', mode: 'insensitive' } }
        });

        res.json({
            totalUsers,
            premiumUsers,
            totalRevenue: totalRevenue._sum.amount || 0,
            premiumRevenue: premiumRevenue._sum.amount || 0,
            coinRevenue: coinRevenue._sum.amount || 0,
            pendingReports
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
        // Secure against DoS by capping limit to 100
        const safeLimit = Math.min(Number(limit), 100);
        const skip = (Number(page) - 1) * safeLimit;

        const where: any = {};

        if (search) {
            const s = String(search);
            where.OR = [
                { full_name: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { phone: { contains: s, mode: 'insensitive' } }
            ];
        }

        if (req.query.isPremium === 'true') {
            where.is_premium = true;
        }

        const users = await prisma.users.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: safeLimit,
            skip: skip,
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                gender: true,
                created_at: true,
                is_premium: true,
                is_banned: true,
                is_admin: true,
                coins: true,
                referral_code: true,
                referred_by: true,
                premium_expiry: true
            }
        });

        // Map full_name to name to match previous API if strict
        const result = users.map(u => ({ ...u, name: u.full_name }));
        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /users/:id - Get User Details
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.users.findUnique({
            where: { id },
            include: {
                profiles: true,
                reports_reports_reported_idTousers: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Likes received count
        const likesReceived = await prisma.interactions.count({
            where: { to_user_id: id, type: 'LIKE' }
        });

        res.json({
            ...user,
            reports: user.reports_reports_reported_idTousers, // Relation name from introspection
            likes_received: likesReceived,
            profile: user.profiles || {}
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// POST /ban - Ban or Unban User
router.post('/ban', async (req, res) => {
    try {
        const { userId, ban } = req.body;

        await prisma.users.update({
            where: { id: userId },
            data: { is_banned: ban }
        });

        res.json({ success: true, message: `User ${ban ? 'banned' : 'unbanned'} successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update ban status' });
    }
});

// GET /reports - List Reports
router.get('/reports', async (req, res) => {
    try {
        const reports = await prisma.reports.findMany({
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                users_reports_reported_idTousers: { select: { full_name: true } },
                users_reports_reporter_idTousers: { select: { full_name: true } }
            }
        });

        const result = reports.map(r => ({
            id: r.id,
            reason: r.reason,
            details: r.details,
            created_at: r.created_at,
            status: r.status,
            reported_name: r.users_reports_reported_idTousers?.full_name || 'Unknown User',
            reporter_name: r.users_reports_reporter_idTousers?.full_name || 'Unknown User',
            target_id: r.reported_id
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// POST /resolve-report
router.post('/resolve-report', async (req, res) => {
    try {
        const { reportId, status } = req.body;
        await prisma.reports.update({
            where: { id: reportId },
            data: { status }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// GET /transactions - Revenue Report
router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 50, type } = req.query;
        // Secure against DoS by capping limit to 100
        const safeLimit = Math.min(Number(limit), 100);
        const skip = (Number(page) - 1) * safeLimit;

        const where: any = {};
        if (type) where.type = type;

        const transactions = await prisma.transactions.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: safeLimit,
            skip,
            include: {
                users: { select: { full_name: true, email: true } }
            }
        });

        const result = transactions.map(t => ({
            ...t,
            full_name: t.users?.full_name,
            email: t.users?.email
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// POST /send-campaign - Flexible email campaign launcher
// Body: { type: 'onboarding' | 'reengagement' | 'invite' | 'all', inviteEmails?: string[] }
router.post('/send-campaign', async (req: any, res) => {
    const { type = 'all', inviteEmails = [] } = req.body;
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const result: any = { success: true, type };

    try {
        /* ── Onboarding Reminder ── */
        if (type === 'onboarding' || type === 'all') {
            const users = await prisma.users.findMany({
                where: { is_banned: false },
                select: { id: true, email: true, full_name: true, profiles: { select: { user_id: true } } }
            });
            const notOnboarded = users.filter((u: any) => !u.profiles);
            for (const user of notOnboarded) {
                await EmailService.sendOnboardingReminderEmail(user.email, user.full_name || 'there');
                await sleep(120); // Rate-limit: ~8 emails/sec
            }
            result.onboarding_sent = notOnboarded.length;
        }

        /* ── Re-engagement (inactive 7+ days) ── */
        if (type === 'reengagement' || type === 'all') {
            const INACTIVE_DAYS = 7;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);

            const users = await prisma.users.findMany({
                where: { is_banned: false, profiles: { isNot: null } },
                select: { id: true, email: true, full_name: true, created_at: true, profiles: { select: { metadata: true } } }
            });

            const inactive = users.filter((u: any) => {
                const meta = (u.profiles?.metadata as any) || {};
                const lastSeen = meta.last_seen_at ? new Date(meta.last_seen_at) : (u.created_at ? new Date(u.created_at) : null);
                return lastSeen && lastSeen < cutoff;
            });

            for (const user of inactive) {
                const meta = (user.profiles?.metadata as any) || {};
                const lastSeen = meta.last_seen_at ? new Date(meta.last_seen_at) : new Date(user.created_at!);
                const days = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
                await EmailService.sendReEngagementEmail(user.email, user.full_name || 'there', days);
                await sleep(120);
            }
            result.reengagement_sent = inactive.length;
        }

        /* ── Invite external / non-registered emails ── */
        if (type === 'invite' || (Array.isArray(inviteEmails) && inviteEmails.length > 0)) {
            const emails: string[] = Array.isArray(inviteEmails) ? inviteEmails : [];
            for (const email of emails) {
                await EmailService.sendInviteEmail(email.trim(), req.user?.name);
                await sleep(120);
            }
            result.invites_sent = emails.length;
        }

        res.json(result);
    } catch (err) {
        console.error('Campaign Error:', err);
        res.status(500).json({ error: 'Campaign failed', details: String(err) });
    }
});

export default router;

