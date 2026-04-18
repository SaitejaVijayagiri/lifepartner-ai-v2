import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) return res.sendStatus(401);

    // JWT_SECRET guaranteed by startup guard in server.ts (throws if missing)
    const secret = process.env.JWT_SECRET!;
    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) return res.sendStatus(401);
        req.user = user;
        next();
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
    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) {
            // If token is invalid (expired), treat as guest instead of 401 blocking
            req.user = undefined;
        } else {
            req.user = user;
        }
        next();
    });
};

// NOTE: requireAdmin has been removed from this file.
// Use the adminAuth middleware from middleware/adminAuth.ts instead.
// That middleware performs a proper DB lookup for is_admin status, since
// the JWT payload only contains { userId } \u2014 not the is_admin flag.
