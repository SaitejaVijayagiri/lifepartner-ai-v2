import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import { pool, checkDbConnection } from './db'; -> Removed

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import matchRoutes from './routes/matches';
import interactionRoutes from './routes/interactions';
import chatRoutes from './routes/chat';
import gameRoutes from './routes/games';
import paymentRoutes from './routes/payments';
import walletRoutes from './routes/wallet';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import path from 'path';

dotenv.config();

import rateLimit from 'express-rate-limit';

export const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 4000;

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later."
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many contact requests, please try again later."
});

app.use(globalLimiter);
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Life Partner AI Backend is Running (Production Mode)');
});

app.use('/auth', authLimiter, authRoutes);
app.use('/profile', profileRoutes);
app.use('/matches', matchRoutes);
app.use('/interactions', interactionRoutes);
app.use('/messages', chatRoutes);
app.use('/games', gameRoutes);
app.use('/payments', paymentRoutes);
app.use('/reels', require('./routes/reels').default);
app.use('/notifications', notificationRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/wallet', walletRoutes);
app.use('/calls', require('./routes/calls').default);
app.use('/verification', require('./routes/verification').default);

import { prisma } from './prisma';

const { createServer } = require('http');
const { initSocket } = require('./socket');

export const httpServer = createServer(app);
initSocket(httpServer);

if (require.main === module) {
    httpServer.listen(PORT, '0.0.0.0', async () => {
        console.log(`Server running on port ${PORT} at 0.0.0.0`);
        try {
            await prisma.$connect();
            console.log("✅ Prisma Connected (Schema Verified)");
        } catch (e) {
            console.error("❌ Prisma Connection Failed", e);
        }
    });
}
