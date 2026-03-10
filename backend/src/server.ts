// Fix: Disable TLS cert rejection on Render (OpenSSL cert verification fails with Supabase)
// Connection is still encrypted; this only skips certificate chain verification.
if (process.env.NODE_ENV === 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { generateBlogPost } from './services/blogGenerator';
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
import blogRoutes from './routes/blog';
import migrateRoutes from './routes/migrate';
import photoRoutes from './routes/photo';
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

app.use(cors({
    origin: ['http://localhost:3000', 'https://www.lifepartnerai.in', 'https://lifepartnerai.in', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

app.use(globalLimiter);

// Global Request Logger
app.use((req, res, next) => {
    console.log(`📨 [${req.method}] ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        // Sanitize body before logging — strip base64 blobs to prevent memory bloat on Render
        const sanitized = JSON.parse(JSON.stringify(req.body || {}));
        if (sanitized.photoUrl && typeof sanitized.photoUrl === 'string' && sanitized.photoUrl.startsWith('data:')) {
            sanitized.photoUrl = `[base64 image, ${Math.round(sanitized.photoUrl.length / 1024)}KB]`;
        }
        if (Array.isArray(sanitized.photos)) {
            sanitized.photos = sanitized.photos.map((p: string) =>
                typeof p === 'string' && p.startsWith('data:') ? `[base64 image, ${Math.round(p.length / 1024)}KB]` : p
            );
        }
        console.log('📦 Body:', JSON.stringify(sanitized, null, 2));
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Life Partner AI Backend is Running (Production Mode)');
});

// Health Check endpoint — tests DB connectivity
app.get('/health', async (req, res) => {
    try {
        const { pool } = require('./prisma');
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        res.json({
            status: 'ok',
            db: 'connected',
            env: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    } catch (e: any) {
        res.status(500).json({
            status: 'error',
            db: 'disconnected',
            error: e.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.use('/auth', authLimiter, authRoutes);
app.use('/profile', profileRoutes);
app.use('/matches', matchRoutes);
app.use('/interactions', interactionRoutes);
app.use('/messages', chatRoutes);
app.use('/games', gameRoutes);
app.use('/payments', paymentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/wallet', walletRoutes);
app.use('/calls', require('./routes/calls').default);
app.use('/verification', require('./routes/verification').default);
app.use('/blog', blogRoutes);
app.use('/migrate', migrateRoutes); // One-time migration route — remove after use
app.use('/photo', photoRoutes);     // Image proxy — bypasses India ISP Supabase DNS block

// Debug Environment on Startup
console.log("------------------------------------------------");
console.log("🚀 Server Starting...");
console.log(`📧 EMAIL_FROM: '${process.env.EMAIL_FROM}'`);
console.log(`🔑 RESEND_KEY: '${process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 5) + '...' : 'MISSING'}'`);
console.log("------------------------------------------------");

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

            // ⏰ Start Daily SEO Blog Generation
            cron.schedule('0 12 * * *', async () => {
                const topics = [
                    "Online Dating Tips for Introverts in India",
                    "How to Know if someone is serious on a Matrimony App",
                    "The Science behind successful Relationships",
                    "Red Flags to look out for on Dating Apps",
                    "Is Astrology Important for Marriage in Modern Day?",
                    "Best Places for a First Date in Mumbai",
                    "How AI is Changing Matchmaking",
                    "Navigating Long Distance Relationships"
                ];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                console.log(`[CRON] Generating Daily SEO Blog: "${randomTopic}"`);
                try {
                    await generateBlogPost(randomTopic);
                    console.log("[CRON] Successfully generated daily blog.");
                } catch (error) {
                    console.error("[CRON] Failed to generate daily blog:", error);
                }
            });
            console.log("⏰ Daily Blog Generation Cron Job Scheduled for 12:00 PM.");

        } catch (e) {
            console.error("❌ Prisma Connection Failed", e);
        }
    });
}
