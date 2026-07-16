import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) return res.sendStatus(401);

    // JWT_SECRET guaranteed by startup guard in server.ts (throws if missing)
    const secret = process.env.JWT_SECRET!;
    jwt.verify(token, secret, async (err: any, decoded: any) => {
        if (err) return res.sendStatus(401);
        
        try {
            const user = await prisma.users.findUnique({
                where: { id: decoded.userId },
                select: { is_banned: true, is_deactivated: true, deactivated_until: true }
            });

            if (!user) return res.sendStatus(401);
            if (user.is_banned) {
                return res.status(403).json({ error: "Your account is banned." });
            }

            if (user.is_deactivated) {
                const now = new Date();
                if (user.deactivated_until && now > new Date(user.deactivated_until)) {
                    // Auto-reactivate user if the 15-day period has passed
                    await prisma.users.update({
                        where: { id: decoded.userId },
                        data: { is_deactivated: false, deactivated_until: null }
                    });
                } else {
                    return res.status(403).json({ error: "Your account is temporarily deactivated." });
                }
            }

            req.user = decoded;
            next();
        } catch (dbErr) {
            console.error("Auth middleware db check failed", dbErr);
            return res.sendStatus(500);
        }
    });
};

export const authenticateOptional = (req: any, res: Response, next: NextFunction) => {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        req.user = undefined;
        return next();
    }

    // JWT_SECRET guaranteed by startup guard in server.ts (throws if missing)
    const secret = process.env.JWT_SECRET!;
    jwt.verify(token, secret, async (err: any, decoded: any) => {
        if (err) {
            // If token is invalid (expired), treat as guest instead of 401 blocking
            req.user = undefined;
            return next();
        }

        try {
            const user = await prisma.users.findUnique({
                where: { id: decoded.userId },
                select: { is_banned: true, is_deactivated: true, deactivated_until: true }
            });

            if (!user || user.is_banned) {
                req.user = undefined;
            } else if (user.is_deactivated) {
                const now = new Date();
                if (user.deactivated_until && now > new Date(user.deactivated_until)) {
                    await prisma.users.update({
                        where: { id: decoded.userId },
                        data: { is_deactivated: false, deactivated_until: null }
                    });
                    req.user = decoded;
                } else {
                    req.user = undefined;
                }
            } else {
                req.user = decoded;
            }
        } catch (dbErr) {
            req.user = undefined;
        }
        next();
    });
};

// NOTE: requireAdmin has been removed from this file.
// Use the adminAuth middleware from middleware/adminAuth.ts instead.
// That middleware performs a proper DB lookup for is_admin status, since
// the JWT payload only contains { userId } \u2014 not the is_admin flag.
