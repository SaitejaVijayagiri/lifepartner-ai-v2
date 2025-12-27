import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get Wallet Balance
router.get('/balance', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { coins: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        const transactions = await prisma.transactions.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        res.json({
            balance: user.coins || 0,
            history: transactions
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch balance" });
    }
});

// Send Gift
router.post('/gift', authenticateToken, async (req: any, res) => {
    const { toUserId, giftId, cost } = req.body;
    const userId = req.user.userId;

    if (!toUserId || !cost) return res.status(400).json({ error: "Missing details" });

    try {
        await prisma.$transaction(async (tx) => {
            // Atomic Deduction: Only updates if balance is sufficient
            const updateResult = await tx.users.updateMany({
                where: {
                    id: userId,
                    coins: { gte: cost }
                },
                data: {
                    coins: { decrement: cost }
                }
            });

            if (updateResult.count === 0) {
                throw new Error("Insufficient coins");
            }

            // Record Transaction
            await tx.transactions.create({
                data: {
                    user_id: userId,
                    type: 'SPEND',
                    amount: cost,
                    currency: 'COINS',
                    description: `Sent Gift: ${giftId}`,
                    metadata: { toUserId, giftId },
                    status: 'SUCCESS'
                }
            });

            // Optional: Notify Receiver (Skipped as per original)
        });

        // Fetch new balance to return
        const updatedUser = await prisma.users.findUnique({ where: { id: userId }, select: { coins: true } });
        res.json({ success: true, newBalance: updatedUser?.coins });

    } catch (e: any) {
        if (e.message === "Insufficient coins") {
            return res.status(402).json({ error: "Insufficient coins" });
        }
        console.error("Gift Failed", e);
        res.status(500).json({ error: "Transaction failed" });
    }
});

// Purchase Profile Boost
router.post('/boost', authenticateToken, async (req: any, res) => {
    const userId = req.user.userId;
    const BOOST_COST = 50;
    const DURATION_MINUTES = 30;

    try {
        await prisma.$transaction(async (tx) => {
            // Atomic Deduction
            const updateResult = await tx.users.updateMany({
                where: {
                    id: userId,
                    coins: { gte: BOOST_COST }
                },
                data: {
                    coins: { decrement: BOOST_COST }
                }
            });

            if (updateResult.count === 0) {
                throw new Error("Insufficient coins");
            }

            // Activate Boost
            // Calculate expiry (Prisma doesn't support generic SQL INTERVAL syntax in update directly easily without raw, 
            // but we can calculate date in JS)
            const expiresAt = new Date(Date.now() + DURATION_MINUTES * 60 * 1000);

            await tx.users.update({
                where: { id: userId },
                data: {
                    is_boosted: true,
                    boost_expires_at: expiresAt
                }
            });

            // Record Transaction
            await tx.transactions.create({
                data: {
                    user_id: userId,
                    type: 'SPEND',
                    amount: BOOST_COST,
                    currency: 'COINS',
                    description: `Profile Boost (${DURATION_MINUTES} mins)`,
                    status: 'SUCCESS'
                }
            });
        });

        res.json({ success: true, message: "Profile Boosted!" });

    } catch (e: any) {
        if (e.message === "Insufficient coins") {
            return res.status(402).json({ error: `Insufficient coins. Need ${BOOST_COST} coins.` });
        }
        console.error("Boost Failed", e);
        res.status(500).json({ error: "Failed to activate boost" });
    }
});

export default router;
