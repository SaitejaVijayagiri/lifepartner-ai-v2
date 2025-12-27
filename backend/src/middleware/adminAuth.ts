import { Request, Response, NextFunction } from 'express';
// import { pool } from '../db';
import { prisma } from '../prisma';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // User should already be authenticated via 'authenticateToken' middleware
        // which attaches user to req.user (id, email, etc.)
        const user = (req as any).user;

        // Check is_admin status from DB
        // NOTE: JWT payload uses 'userId', not 'id'
        const userId = user.userId || user.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No user ID found in token" });
        }

        const userRecord = await prisma.users.findUnique({
            where: { id: userId },
            select: { is_admin: true }
        });

        if (!userRecord || !userRecord.is_admin) {
            return res.status(403).json({ message: "Forbidden: Admin access only" });
        }

        next();
    } catch (err) {
        console.error("Admin Auth Error", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
