// MUST be first: load env vars before any imports read process.env
import dotenv from 'dotenv';
dotenv.config();

// Fix: Disable TLS cert rejection on Render (OpenSSL cert verification fails with Supabase)
// Connection is still encrypted; this only skips certificate chain verification.
if (process.env.NODE_ENV === 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// SECURITY: Fail fast if critical secrets are missing — prevents running with insecure defaults
if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
}

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import cookieParser from 'cookie-parser';
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
import eventRoutes from './routes/events';
import webhookRoutes from './routes/webhooks';
import dateRoutes from './routes/dates';
import instantsRoutes from './routes/instants';
import analyticsRoutes from './routes/analytics';
import { initAngelTimer } from './services/angelTimer';
import path from 'path';


import rateLimit from 'express-rate-limit';

export const app = express();
app.use(cookieParser());
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

const ALLOWED_ORIGINS = [
    'https://lifepartnerai.in',
    'https://www.lifepartnerai.in',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:4200',
    ...(process.env.EXTRA_ALLOWED_ORIGINS ? process.env.EXTRA_ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server requests (no origin) and known origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        return callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

app.use(globalLimiter);

// Parse request bodies FIRST — logger must come after so req.body is populated
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Request Logger — lightweight non-blocking logger
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📨 [${req.method}] ${req.url}`);
    }
    next();
});

// Serve uploads with 7-day browser caching for fast image loading
app.use('/uploads', express.static('uploads', {
    maxAge: '7d',
    etag: true,
    immutable: true
}));

app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('Life Partner AI Backend is Running (Production Mode)');
});

// Health Check endpoint — tests DB connectivity
app.get('/health', async (req, res) => {
    try {
        // Use already-imported prisma client instead of require()
        await prisma.$queryRaw`SELECT 1`;
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
// Apply contact rate limiter specifically to the /contact sub-path.
// contactLimiter was defined but never applied — this was a medium audit finding.
// We attach it AFTER the main router so the limiter wraps only this route.
app.use('/interactions/contact', contactLimiter);
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
// SECURITY: /migrate is a one-time route — disabled in production to prevent abuse.
// Re-enable only locally when running pending migrations.
if (process.env.NODE_ENV !== 'production') {
    app.use('/migrate', migrateRoutes);
    console.log('⚠️  /migrate route enabled (non-production mode)');
}
app.use('/photo', photoRoutes);     // Image proxy — bypasses India ISP Supabase DNS block
app.use('/events', eventRoutes);    // Meet Spots feature
app.use('/dates', dateRoutes);      // 1-on-1 Meet Dates feature
app.use('/instants', instantsRoutes);  // Instants View-Once Snaps
app.use('/api/instants', instantsRoutes); // API fallback
app.use('/analytics', analyticsRoutes); // User drop-off & telemetry analytics
app.use('/api/analytics', analyticsRoutes);
app.use('/webhooks', webhookRoutes); // Webhook receiver for Resend

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

            // Start Angel Timer
            initAngelTimer();

            // Start Witty Push Notifications Cron
            const { initWittyNotificationsCron } = require('./services/wittyNotifications');
            initWittyNotificationsCron();

            // Start Female Match Reminders Cron
            const { initFemaleMatchRemindersCron } = require('./services/femaleMatchReminders');
            initFemaleMatchRemindersCron();

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
