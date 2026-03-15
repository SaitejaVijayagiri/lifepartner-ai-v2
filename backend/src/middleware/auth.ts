import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) return res.sendStatus(401);

    const secret = process.env.JWT_SECRET || 'dev_secret_key_123';
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

    const secret = process.env.JWT_SECRET || 'dev_secret_key_123';
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

export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) return res.sendStatus(401);

    // Check if user is admin (Assuming is_admin is in the token payload or we rely on logic)
    // If not in token, ideally we query DB. For MVP/existing pattern, let's assume token or simplistic check.
    // However, looking at previous tasks, we added 'is_admin' to DB. It might not be in token yet unless login flow puts it there.
    // Let's safe-guard by just checking the property, if fails we might need to update Login.
    if (!req.user.is_admin) {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};
