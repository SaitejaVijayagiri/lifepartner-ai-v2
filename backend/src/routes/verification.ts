import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// 1. Submit Verification Request
router.post('/request', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { documentUrl } = req.body;

        // Check if pending exists
        const check = await prisma.verification_requests.findFirst({
            where: {
                user_id: userId,
                status: 'PENDING'
            }
        });

        if (check) {
            return res.status(400).json({ error: 'Verification request already pending.' });
        }

        // Create Request
        await prisma.verification_requests.create({
            data: {
                user_id: userId,
                document_url: documentUrl || 'https://example.com/mock-id.jpg',
                status: 'PENDING'
            }
        });

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

        const request = await prisma.verification_requests.findFirst({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            select: { status: true, created_at: true }
        });

        // Also check if user is already verified (e.g. manually set)
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { is_verified: true }
        });

        res.json({
            isVerified: user?.is_verified || false,
            request: request || null
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
        const result = await prisma.verification_requests.findMany({
            where: { status: 'PENDING' },
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: {
                        full_name: true,
                        email: true,
                        avatar_url: true // mapped to photo_url in previous SQL? SQL used photo_url. Schema likely avatar_url.
                    }
                }
            }
        });

        // Map if needed to preserve exact previous API shape, e.g. .name .photo_url
        const mapped = result.map(r => ({
            ...r,
            name: r.users?.full_name,
            email: r.users?.email,
            photo_url: r.users?.avatar_url
        }));

        res.json(mapped);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Approve/Reject
router.post('/admin/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Update Request
            // Note: Update throws if not found
            const updatedRequest = await tx.verification_requests.update({
                where: { id },
                data: {
                    status,
                    admin_notes: notes
                }
            });

            // If Approved, update User table
            if (status === 'APPROVED' && updatedRequest.user_id) {
                await tx.users.update({
                    where: { id: updatedRequest.user_id as string },
                    data: { is_verified: true }
                });
            }
        });

        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2025') { // Record not found
            return res.status(404).json({ error: 'Request not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
