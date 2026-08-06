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

// Daily Streak Rewards Configuration
const STREAK_REWARDS: Record<number, number> = {
    1: 15,
    2: 25,
    3: 40,
    4: 60,
    5: 80,
    6: 100,
    7: 150
};

/**
 * GET /api/wallet/streak
 * Returns user's login streak status & eligibility for today
 */
router.get('/streak', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const profile = await prisma.profiles.findUnique({
            where: { user_id: userId },
            select: { metadata: true }
        });

        const meta: any = profile?.metadata || {};
        const streakData = meta.daily_streak || { streak_count: 0, last_claimed_date: null };

        const todayStr = new Date().toISOString().split('T')[0];
        const lastClaimed = streakData.last_claimed_date;

        let canClaimToday = true;
        let currentStreak = streakData.streak_count || 0;

        if (lastClaimed) {
            const lastDate = new Date(lastClaimed);
            const currentDate = new Date(todayStr);
            const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

            if (diffDays === 0) {
                canClaimToday = false; // Already claimed today
            } else if (diffDays > 1) {
                // Streak broken — reset to Day 0
                currentStreak = 0;
            }
        }

        const nextDay = canClaimToday ? (currentStreak % 7) + 1 : ((currentStreak - 1) % 7) + 1;
        const rewardCoins = STREAK_REWARDS[nextDay] || 15;

        return res.json({
            streakCount: currentStreak,
            canClaimToday,
            nextDay,
            rewardCoins,
            rewardsSchedule: STREAK_REWARDS,
            lastClaimedDate: lastClaimed
        });
    } catch (e: any) {
        console.error('Failed to get streak status', e);
        return res.status(500).json({ error: 'Failed to fetch daily streak' });
    }
});

/**
 * POST /api/wallet/streak/claim
 * Claims today's daily streak reward & awards bonus coins
 */
router.post('/streak/claim', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const todayStr = new Date().toISOString().split('T')[0];

        const profile = await prisma.profiles.findUnique({
            where: { user_id: userId },
            select: { metadata: true }
        });

        const meta: any = profile?.metadata || {};
        const streakData = meta.daily_streak || { streak_count: 0, last_claimed_date: null };
        const lastClaimed = streakData.last_claimed_date;

        if (lastClaimed) {
            const lastDate = new Date(lastClaimed);
            const currentDate = new Date(todayStr);
            const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

            if (diffDays === 0) {
                return res.status(400).json({ error: 'You have already claimed today\'s streak reward!' });
            }
        }

        let newStreak = (streakData.streak_count || 0) + 1;
        if (lastClaimed) {
            const lastDate = new Date(lastClaimed);
            const currentDate = new Date(todayStr);
            const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
            if (diffDays > 1) {
                newStreak = 1; // Missed a day
            }
        }

        const dayCycle = ((newStreak - 1) % 7) + 1;
        const rewardCoins = STREAK_REWARDS[dayCycle] || 15;

        // Perform transaction
        await prisma.$transaction(async (tx) => {
            // Update user balance
            await tx.users.update({
                where: { id: userId },
                data: { coins: { increment: rewardCoins } }
            });

            // Update streak metadata
            const updatedMeta = {
                ...meta,
                daily_streak: {
                    streak_count: newStreak,
                    last_claimed_date: todayStr
                }
            };

            await tx.profiles.upsert({
                where: { user_id: userId },
                create: { user_id: userId, metadata: updatedMeta },
                update: { metadata: updatedMeta }
            });

            // Create transaction record
            await tx.transactions.create({
                data: {
                    user_id: userId,
                    type: 'REWARD',
                    amount: rewardCoins,
                    currency: 'COINS',
                    description: `Daily Login Streak Reward (Day ${newStreak})`,
                    status: 'SUCCESS'
                }
            });
        });

        const updatedUser = await prisma.users.findUnique({
            where: { id: userId },
            select: { coins: true }
        });

        return res.json({
            success: true,
            streakCount: newStreak,
            rewardCoins,
            newBalance: updatedUser?.coins || 0,
            message: `🎉 Claimed ${rewardCoins} coins for Day ${newStreak} streak!`
        });

    } catch (e: any) {
        console.error('Failed to claim streak reward', e);
        return res.status(500).json({ error: 'Failed to claim daily streak reward' });
    }
});

export default router;
