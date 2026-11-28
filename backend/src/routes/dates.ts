import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken, authenticateOptional } from '../middleware/auth';
import { sanitizePhotoUrl, isPhotoPrivacyShieldEnabled, getConnectedUserIdSet, getBlockedUserIdSet, areUsersConnected } from '../utils/photoUrl';

const router = express.Router();

// 1. DB Patching Endpoint — disabled in production to prevent unauthorized DDL execution
router.get('/fix-db', (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Database patch routes are disabled in production' });
    }
    next();
}, async (req, res) => {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS meet_dates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                location_name VARCHAR(255) NOT NULL,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                date_time TIMESTAMP(6) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, completed, cancelled
                safety_check_triggered BOOLEAN DEFAULT false,
                created_at TIMESTAMP(6) DEFAULT now(),
                updated_at TIMESTAMP(6) DEFAULT now()
            );
        `);
        res.json({ success: true, message: 'Dates DB patched successfully' });
    } catch (e: any) {
        console.error('DB Patch Error', e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Propose a Date
router.post('/propose', authenticateToken, async (req: any, res) => {
    try {
        const senderId = req.user.userId;
        const { receiver_id, location_name, lat, lng, date_time } = req.body;

        if (!receiver_id || !location_name || !date_time) {
            return res.status(400).json({ error: 'Receiver, location, and time are required' });
        }

        const dateObj = new Date(date_time);
        if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
            return res.status(400).json({ error: 'Date must be in the future' });
        }

        const newDate: any[] = await prisma.$queryRawUnsafe(`
            INSERT INTO meet_dates (sender_id, receiver_id, location_name, lat, lng, date_time)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
            RETURNING *;
        `, senderId, receiver_id, location_name, lat || null, lng || null, dateObj);

        // Send a custom chat message so the UI renders the invitation
        const invitePayload = `[DATE_INVITE:${newDate[0].id}]`;
        const newMsg = await (prisma.messages as any).create({
            data: {
                sender_id: senderId,
                receiver_id: receiver_id,
                content: invitePayload,
                delivery_status: "sent"
            },
            select: { id: true, created_at: true }
        });

        // Broadcast to receiver
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            
            const senderProfile = await prisma.users.findUnique({
                where: { id: senderId },
                select: { full_name: true, avatar_url: true }
            });
            const { sanitizePhotoUrl } = require('../utils/photoUrl');
            
            io.to(receiver_id).emit("receiveMessage", {
                id: newMsg.id,
                text: invitePayload,
                senderId,
                timestamp: newMsg.created_at,
                status: "sent",
                senderName: senderProfile?.full_name || 'Someone',
                senderPhoto: sanitizePhotoUrl(senderProfile?.avatar_url ?? null, senderProfile?.full_name || 'User')
            });
        } catch (err) {}

        res.json({ success: true, date: newDate[0] });
    } catch (e: any) {
        console.error('Propose Date Error', e);
        res.status(500).json({ error: 'Failed to propose date' });
    }
});

// 3. Respond to Date Proposal
router.post('/:id/respond', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;
        const { status } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const dates: any[] = await prisma.$queryRawUnsafe(`
            SELECT * FROM meet_dates WHERE id = $1::uuid;
        `, dateId);

        if (!dates.length) return res.status(404).json({ error: 'Date not found' });
        const meetDate = dates[0];

        if (meetDate.receiver_id !== userId) {
            return res.status(403).json({ error: 'You cannot respond to this date' });
        }

        const updated: any[] = await prisma.$queryRawUnsafe(`
            UPDATE meet_dates SET status = $2, updated_at = now() WHERE id = $1::uuid RETURNING *;
        `, dateId, status);

        // Notify sender
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            
            const payload = `[DATE_RESPONSE:${dateId}:${status}]`;
            const newMsg = await (prisma.messages as any).create({
                data: {
                    sender_id: userId,
                    receiver_id: meetDate.sender_id,
                    content: payload,
                    delivery_status: "sent"
                },
                select: { id: true, created_at: true }
            });
            
            io.to(meetDate.sender_id).emit("receiveMessage", {
                id: newMsg.id,
                text: payload,
                senderId: userId,
                timestamp: newMsg.created_at,
                status: "sent"
            });
        } catch (err) {}

        res.json({ success: true, date: updated[0] });
    } catch (e: any) {
        console.error('Respond Date Error', e);
        res.status(500).json({ error: 'Failed to respond' });
    }
});

// Cancel Date Proposal/Meetup
router.post('/:id/cancel', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;

        const dates: any[] = await prisma.$queryRawUnsafe(`
            SELECT * FROM meet_dates WHERE id = $1::uuid;
        `, dateId);

        if (!dates.length) return res.status(404).json({ error: 'Date not found' });
        const meetDate = dates[0];

        if (meetDate.sender_id !== userId && meetDate.receiver_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to cancel this date' });
        }

        const updated: any[] = await prisma.$queryRawUnsafe(`
            UPDATE meet_dates SET status = 'cancelled', updated_at = now() WHERE id = $1::uuid RETURNING *;
        `, dateId);

        // Notify partner
        try {
            const partnerId = userId === meetDate.sender_id ? meetDate.receiver_id : meetDate.sender_id;
            const { getIO } = require('../socket');
            const io = getIO();
            
            const payload = `[DATE_RESPONSE:${dateId}:cancelled]`;
            const newMsg = await (prisma.messages as any).create({
                data: {
                    sender_id: userId,
                    receiver_id: partnerId,
                    content: payload,
                    delivery_status: "sent"
                },
                select: { id: true, created_at: true }
            });
            
            io.to(partnerId).emit("receiveMessage", {
                id: newMsg.id,
                text: payload,
                senderId: userId,
                timestamp: newMsg.created_at,
                status: "sent"
            });
        } catch (err) {
            console.error("Cancel date notification failed", err);
        }

        res.json({ success: true, date: updated[0] });
    } catch (e: any) {
        console.error('Cancel Date Error', e);
        res.status(500).json({ error: 'Failed to cancel meetup' });
    }
});

// 4. Get active dates for user
router.get('/active', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        
        const [activeDates, connectedIds] = await Promise.all([
            prisma.$queryRawUnsafe(`
                SELECT d.*, 
                       u.id as partner_id,
                       u.full_name as partner_name, 
                       u.avatar_url as partner_photo,
                       u.gender as partner_gender,
                       up.metadata as partner_metadata,
                       p.metadata as my_metadata
                FROM meet_dates d
                JOIN users u ON (d.sender_id = u.id OR d.receiver_id = u.id) AND u.id != $1::uuid
                LEFT JOIN profiles up ON up.user_id = u.id
                LEFT JOIN profiles p ON p.user_id = $1::uuid
                WHERE (d.sender_id = $1::uuid OR d.receiver_id = $1::uuid)
                  AND d.status = 'accepted'
                  AND d.date_time > NOW() - INTERVAL '4 hours' -- Keep active during date window
                  AND d.date_time < NOW() + INTERVAL '7 days'
                ORDER BY d.date_time ASC;
            `, userId) as Promise<any[]>,
            getConnectedUserIdSet(prisma, userId)
        ]);

        const safeDates = (activeDates || []).map(({ partner_metadata, ...d }) => {
            const pMeta = (partner_metadata as any) || {};
            const isBlurred = isPhotoPrivacyShieldEnabled(pMeta) && !connectedIds.has(d.partner_id);
            return {
                ...d,
                partner_photo: sanitizePhotoUrl(d.partner_photo, d.partner_name || d.partner_id),
                photo_privacy: pMeta.photo_privacy || pMeta.photoPrivacy || 'public',
                isBlurred
            };
        });

        res.json({ success: true, dates: safeDates });
    } catch (e: any) {
        console.error('Active Dates Error', e);
        res.status(500).json({ error: 'Failed to get active dates' });
    }
});

// 5. Get specific date details (for UI rendering in Chat)
router.get('/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;
        
        const dates: any[] = await prisma.$queryRawUnsafe(`
            SELECT d.*, 
                   u.id as partner_id,
                   u.full_name as partner_name, 
                   u.avatar_url as partner_photo,
                   up.metadata as partner_metadata
            FROM meet_dates d
            JOIN users u ON (d.sender_id = u.id OR d.receiver_id = u.id) AND u.id != $1::uuid
            LEFT JOIN profiles up ON up.user_id = u.id
            WHERE d.id = $2::uuid AND (d.sender_id = $1::uuid OR d.receiver_id = $1::uuid);
        `, userId, dateId);

        if (!dates.length) return res.status(404).json({ error: 'Date not found' });
        const { partner_metadata, ...row } = dates[0];
        const pMeta = (partner_metadata as any) || {};
        const connected = await areUsersConnected(prisma, userId, row.partner_id);
        const isBlurred = isPhotoPrivacyShieldEnabled(pMeta) && !connected;
        res.json({
            success: true,
            date: {
                ...row,
                partner_photo: sanitizePhotoUrl(row.partner_photo, row.partner_name || row.partner_id),
                photo_privacy: pMeta.photo_privacy || pMeta.photoPrivacy || 'public',
                isBlurred
            }
        });
    } catch (e: any) {
        console.error('Get Date Error', e);
        res.status(500).json({ error: 'Failed to get date' });
    }
});

// 6. Mark Date as Safe (Acknowledge Angel Check-in)
router.post('/:id/safe', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;

        const updated: any[] = await prisma.$queryRawUnsafe(`
            UPDATE meet_dates 
            SET status = 'completed', updated_at = now() 
            WHERE id = $1::uuid AND (sender_id = $2::uuid OR receiver_id = $2::uuid)
            RETURNING *;
        `, dateId, userId);

        if (!updated.length) return res.status(404).json({ error: 'Date not found or unauthorized' });
        
        res.json({ success: true, message: 'Marked as safe' });
    } catch (e: any) {
        console.error('Mark Safe Error', e);
        res.status(500).json({ error: 'Failed to mark safe' });
    }
});

// 7. Trigger Manual SOS
router.post('/:id/sos', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const dateId = req.params.id;
        const { lat, lng, reason } = req.body;

        const dates: any[] = await prisma.$queryRawUnsafe(`
            SELECT d.*, 
                   u.full_name as user_name,
                   p.metadata as profile_metadata,
                   partner.full_name as partner_name
            FROM meet_dates d
            JOIN users u ON u.id = $2::uuid
            JOIN profiles p ON p.user_id = u.id
            JOIN users partner ON partner.id = CASE WHEN d.sender_id = $2::uuid THEN d.receiver_id ELSE d.sender_id END
            WHERE d.id = $1::uuid AND (d.sender_id = $2::uuid OR d.receiver_id = $2::uuid);
        `, dateId, userId);

        if (!dates.length) return res.status(404).json({ error: 'Date not found' });
        
        const date = dates[0];
        const metadata = typeof date.profile_metadata === 'string' ? JSON.parse(date.profile_metadata) : (date.profile_metadata || {});
        const emergencyContact = metadata.emergency_contact;

        if (!emergencyContact || !emergencyContact.email) {
            return res.status(400).json({ error: 'No emergency contact email configured. Add an emergency contact in your profile first.' });
        }

        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const safetyFrom = process.env.EMAIL_FROM || 'LifePartner Safety <no-reply@lifepartnerai.in>';

        let mapsLink = '';
        if (lat && lng) mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        await resend.emails.send({
            from: safetyFrom,
            to: emergencyContact.email,
            subject: `🚨 SOS ALERT: ${date.user_name} Needs Help`,
            html: `
                <h2 style="color: red;">SOS Alert Triggered</h2>
                <p><strong>${date.user_name}</strong> just triggered an SOS alert during their date.</p>
                <h3>Details:</h3>
                <ul>
                    <li><strong>Partner Name:</strong> ${date.partner_name}</li>
                    <li><strong>Location:</strong> ${date.location_name}</li>
                    <li><strong>Reason:</strong> ${reason || 'Manual SOS Triggered'}</li>
                </ul>
                ${mapsLink ? `<p><a href="${mapsLink}" style="padding: 10px 15px; background: red; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Live GPS Location</a></p>` : ''}
                <p>Please contact them immediately. If you cannot reach them, consider contacting local authorities.</p>
            `
        });

        // Mark the date status as 'sos' so the cron timer doesn't fire again
        await prisma.$queryRawUnsafe(`
            UPDATE meet_dates SET status = 'sos', updated_at = now() WHERE id = $1::uuid;
        `, dateId);

        res.json({ success: true, message: 'SOS triggered successfully' });
    } catch (e: any) {
        console.error('SOS Trigger Error', e);
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
});

// Live Hosted Speed Dating Events Store
interface LiveSpeedDateEvent {
    id: string;
    title: string;
    description: string;
    host_id: string;
    host_name: string;
    host_avatar?: string;
    host_photo_privacy?: string;
    isBlurred?: boolean;
    target_gender: 'all' | 'female' | 'male';
    status: 'live' | 'upcoming' | 'ended';
    scheduled_at?: string; // ISO date string if scheduled for future
    participant_count: number;
    max_participants: number;
    created_at: string;
}

const liveEventsStore: LiveSpeedDateEvent[] = [];
const liveEventParticipants = new Map<string, Set<string>>();

function toSafeBroadcastEvent(evt: LiveSpeedDateEvent): LiveSpeedDateEvent {
    const isShielded = evt.host_photo_privacy === 'blurred_until_accept';
    return {
        ...evt,
        host_avatar: isShielded ? undefined : evt.host_avatar,
        isBlurred: isShielded
    };
}

// Helper: Ensure PostgreSQL table exists once per container boot (eliminates per-request DDL locks)
let liveEventsTableReady: Promise<void> | null = null;
let lastLiveEventsSyncAt = 0;

function ensureLiveEventsTable() {
    if (liveEventsTableReady) return liveEventsTableReady;
    if (typeof (prisma as any)?.$executeRawUnsafe !== 'function') return Promise.resolve();
    liveEventsTableReady = (async () => {
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS live_speed_date_events (
                    id VARCHAR(100) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    target_gender VARCHAR(20) DEFAULT 'all',
                    status VARCHAR(50) DEFAULT 'live',
                    scheduled_at TIMESTAMP(6),
                    participant_count INT DEFAULT 1,
                    max_participants INT DEFAULT 50,
                    created_at TIMESTAMP(6) DEFAULT now()
                );
            `);
        } catch (e: any) {
            liveEventsTableReady = null;
            console.warn('[LiveEvents] DB init warning:', e.message);
        }
    })();
    return liveEventsTableReady;
}
ensureLiveEventsTable().catch(console.error);

async function syncLiveEventsFromDB(): Promise<LiveSpeedDateEvent[]> {
    try {
        await ensureLiveEventsTable();

        const now = Date.now();
        if (now - lastLiveEventsSyncAt >= 15000) {
            lastLiveEventsSyncAt = now;
            // 1. Auto-expire stale live events older than 45 minutes from their actual start time
            await prisma.$executeRawUnsafe(`
                UPDATE live_speed_date_events
                SET status = 'ended'
                WHERE status = 'live' AND COALESCE(scheduled_at, created_at) < now() - INTERVAL '45 minutes';
            `);

            // 2. Auto-promote upcoming events in DB if start time reached (and within 45 mins)
            await prisma.$executeRawUnsafe(`
                UPDATE live_speed_date_events
                SET status = 'live'
                WHERE status = 'upcoming' AND scheduled_at IS NOT NULL AND scheduled_at <= now() AND scheduled_at >= now() - INTERVAL '45 minutes';
            `);

            // 3. Auto-expire stale upcoming events scheduled in the past
            await prisma.$executeRawUnsafe(`
                UPDATE live_speed_date_events
                SET status = 'ended'
                WHERE status = 'upcoming' AND scheduled_at IS NOT NULL AND scheduled_at < now() - INTERVAL '45 minutes';
            `);
        }

        const rows: any[] = await prisma.$queryRawUnsafe(`
            SELECT e.id, e.title, e.description, e.host_id, e.target_gender, e.status, 
                   e.scheduled_at, e.participant_count, e.max_participants, e.created_at,
                   u.full_name as host_name, u.avatar_url as host_avatar, p.metadata as host_metadata
            FROM live_speed_date_events e
            JOIN users u ON e.host_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE (e.status = 'upcoming' OR (e.status = 'live' AND COALESCE(e.scheduled_at, e.created_at) >= now() - INTERVAL '45 minutes'))
              AND COALESCE(u.is_banned, false) = false
              AND (COALESCE(u.is_deactivated, false) = false OR (u.deactivated_until IS NOT NULL AND u.deactivated_until <= now()))
            ORDER BY e.created_at DESC
            LIMIT 100;
        `);

        const dbEvents: LiveSpeedDateEvent[] = (rows || []).map(r => {
            const isHostShielded = isPhotoPrivacyShieldEnabled(r.host_metadata);
            if (!liveEventParticipants.has(r.id)) {
                liveEventParticipants.set(r.id, new Set([r.host_id]));
            }
            return {
                id: r.id,
                title: r.title,
                description: r.description || '',
                host_id: r.host_id,
                host_name: r.host_name || 'Host User',
                host_avatar: sanitizePhotoUrl(r.host_avatar, r.host_name || r.host_id || 'Host') || undefined,
                host_photo_privacy: isHostShielded ? 'blurred_until_accept' : 'public',
                target_gender: (r.target_gender || 'all') as any,
                status: r.status as any,
                scheduled_at: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : undefined,
                participant_count: Number(r.participant_count || 1),
                max_participants: Number(r.max_participants || 50),
                created_at: new Date(r.created_at).toISOString()
            };
        });

        liveEventsStore.length = 0;
        liveEventsStore.push(...dbEvents);

        return dbEvents;
    } catch (e: any) {
        console.error('Failed to sync live events from DB:', e);
        return liveEventsStore;
    }
}

export async function endUserLiveEvents(userId: string) {
    if (!userId) return;
    const eventIndex = liveEventsStore.findIndex(e => e.host_id === userId && e.status === 'live');
    let endedEvent: LiveSpeedDateEvent | null = null;
    if (eventIndex !== -1) {
        endedEvent = liveEventsStore.splice(eventIndex, 1)[0];
        endedEvent.status = 'ended';
        liveEventParticipants.delete(endedEvent.id);
    }

    try {
        await ensureLiveEventsTable();
        await prisma.$executeRawUnsafe(`
            UPDATE live_speed_date_events SET status = 'ended' WHERE host_id = $1::uuid AND status = 'live';
        `, userId);
    } catch (dbErr) {
        console.error('Failed to end user live events in DB on disconnect:', dbErr);
    }

    try {
        const { getIO } = require('../socket');
        const io = getIO();
        if (io && endedEvent) {
            io.emit('live_event_ended', toSafeBroadcastEvent(endedEvent));
        }
    } catch (e) {}
}


/**
 * POST /api/dates/events/create
 * Host a new Live Speed Dating Event (Instant or Scheduled)
 */
router.post('/events/create', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { title, description, target_gender, max_participants, scheduled_at } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Event title is required' });
        }

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                full_name: true,
                avatar_url: true,
                is_banned: true,
                is_deactivated: true,
                deactivated_until: true,
                profiles: { select: { metadata: true } }
            }
        });
        const isDeactivatedActive = Boolean(user?.is_deactivated) && (!user?.deactivated_until || new Date(user.deactivated_until) > new Date());
        if (!user || user.is_banned || isDeactivatedActive) {
            return res.status(403).json({ error: 'Account is not active' });
        }

        let status: 'live' | 'upcoming' = 'live';
        let scheduledIso: string | undefined = undefined;

        if (scheduled_at) {
            const schedDate = new Date(scheduled_at);
            if (!isNaN(schedDate.getTime()) && schedDate > new Date()) {
                status = 'upcoming';
                scheduledIso = schedDate.toISOString();
            }
        }

        const isHostShielded = isPhotoPrivacyShieldEnabled(user?.profiles?.metadata);
        const newEvent: LiveSpeedDateEvent = {
            id: `evt_live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: title.trim(),
            description: description ? description.trim() : 'Live 3-Minute Speed Dating Roulette',
            host_id: userId,
            host_name: user?.full_name || 'Host User',
            host_avatar: sanitizePhotoUrl(user?.avatar_url, user?.full_name || userId || 'Host') || undefined,
            host_photo_privacy: isHostShielded ? 'blurred_until_accept' : 'public',
            target_gender: target_gender || 'all',
            status,
            scheduled_at: scheduledIso,
            participant_count: 1,
            max_participants: max_participants || 50,
            created_at: new Date().toISOString()
        };
        liveEventParticipants.set(newEvent.id, new Set([userId]));

        // Persist to PostgreSQL DB
        try {
            await ensureLiveEventsTable();
            await prisma.$executeRawUnsafe(`
                INSERT INTO live_speed_date_events (id, title, description, host_id, target_gender, status, scheduled_at, participant_count, max_participants)
                VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9);
            `, newEvent.id, newEvent.title, newEvent.description, userId, newEvent.target_gender, status, scheduledIso ? new Date(scheduledIso) : null, 1, newEvent.max_participants);
        } catch (dbErr) {
            console.error('Failed to persist live event to DB:', dbErr);
        }

        liveEventsStore.unshift(newEvent);

        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.emit('live_event_created', toSafeBroadcastEvent(newEvent));
            }
        } catch (err) {
            console.error('Failed to emit live_event_created socket event:', err);
        }

        console.log(`[Live Event] ${status === 'upcoming' ? '📅 Scheduled' : '🔴 Live'} Speed Dating Hosted by ${newEvent.host_name}: "${newEvent.title}"`);

        return res.status(201).json({
            success: true,
            event: { ...newEvent, isBlurred: false },
            message: status === 'upcoming'
                ? '📅 Your Live Speed Dating event has been scheduled successfully!'
                : '🎉 Your Live Speed Dating event is now LIVE!'
        });
    } catch (e: any) {
        console.error('Failed to create live event', e);
        return res.status(500).json({ error: 'Failed to create live event' });
    }
});

/**
 * GET /api/dates/events/active
 * Returns active & scheduled live speed dating events
 */
router.get('/events/active', authenticateOptional, async (req: any, res) => {
    try {
        const viewerId = req.user?.userId || null;
        const [activeEvents, connectedSet, blockedSet] = await Promise.all([
            syncLiveEventsFromDB(),
            viewerId ? getConnectedUserIdSet(prisma, viewerId) : Promise.resolve(new Set<string>()),
            viewerId ? getBlockedUserIdSet(prisma, viewerId) : Promise.resolve(new Set<string>())
        ]);

        const visibleEvents = activeEvents
            .filter(e => !blockedSet.has(e.host_id))
            .map(e => {
                const isShielded = e.host_photo_privacy === 'blurred_until_accept';
                const isBlurred = isShielded && (!viewerId || (e.host_id !== viewerId && !connectedSet.has(e.host_id)));
                return {
                    ...e,
                    host_avatar: isBlurred ? undefined : e.host_avatar,
                    isBlurred
                };
            });

        return res.json({
            success: true,
            activeCount: visibleEvents.length,
            events: visibleEvents
        });
    } catch (e: any) {
        return res.status(500).json({ error: 'Failed to fetch active events' });
    }
});

/**
 * POST /api/dates/events/join
 * Join a live speed dating event queue
 */
router.post('/events/join', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { event_id } = req.body;

        let targetEvent = liveEventsStore.find(e => e.id === event_id);
        if (!targetEvent && event_id) {
            await syncLiveEventsFromDB();
            targetEvent = liveEventsStore.find(e => e.id === event_id);
        }
        if (!targetEvent) {
            return res.status(404).json({ success: false, error: 'Live event room not found or has ended' });
        }

        const joiningUser = await prisma.users.findUnique({
            where: { id: userId },
            select: { gender: true, is_banned: true, is_deactivated: true, deactivated_until: true }
        });
        const isDeactivatedActive = Boolean(joiningUser?.is_deactivated) && (!joiningUser?.deactivated_until || new Date(joiningUser.deactivated_until) > new Date());
        if (!joiningUser || joiningUser.is_banned || isDeactivatedActive) {
            return res.status(403).json({ success: false, error: 'Account is not active' });
        }

        const blocked = await prisma.blocks.findFirst({
            where: {
                OR: [
                    { blocker_id: userId, blocked_id: targetEvent.host_id },
                    { blocker_id: targetEvent.host_id, blocked_id: userId }
                ]
            },
            select: { blocker_id: true }
        });
        if (blocked) {
            return res.status(403).json({ success: false, error: 'Unable to join this live room' });
        }

        // 1. Target gender check
        if (targetEvent.target_gender && targetEvent.target_gender !== 'all') {
            const userGender = (joiningUser?.gender || '').toLowerCase();

            if (targetEvent.target_gender === 'female' && !(userGender === 'female' || userGender === 'woman')) {
                return res.status(403).json({
                    success: false,
                    error: 'This live room is restricted to Female participants only'
                });
            }

            if (targetEvent.target_gender === 'male' && !(userGender === 'male' || userGender === 'man')) {
                return res.status(403).json({
                    success: false,
                    error: 'This live room is restricted to Male participants only'
                });
            }
        }

        let participants = liveEventParticipants.get(targetEvent.id);
        if (!participants) {
            participants = new Set([targetEvent.host_id]);
            liveEventParticipants.set(targetEvent.id, participants);
        }

        // 2. Capacity & deduplication check
        if (!participants.has(userId)) {
            if (targetEvent.max_participants && targetEvent.participant_count >= targetEvent.max_participants) {
                return res.status(400).json({
                    success: false,
                    error: `This live room has reached maximum capacity (${targetEvent.max_participants} participants)`
                });
            }
            participants.add(userId);
            targetEvent.participant_count += 1;
            prisma.$executeRawUnsafe(
                `UPDATE live_speed_date_events SET participant_count = $1 WHERE id = $2;`,
                targetEvent.participant_count,
                targetEvent.id
            ).catch(() => {});
        }

        // Broadcast update via socket
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.emit('live_event_updated', toSafeBroadcastEvent(targetEvent));
            }
        } catch (e) {}

        const isConnected = targetEvent.host_id === userId || await areUsersConnected(prisma, userId, targetEvent.host_id);
        const isBlurred = targetEvent.host_photo_privacy === 'blurred_until_accept' && !isConnected;

        return res.json({
            success: true,
            event: {
                ...targetEvent,
                host_avatar: isBlurred ? undefined : targetEvent.host_avatar,
                isBlurred
            },
            message: 'Joined live event queue successfully'
        });
    } catch (e: any) {
        console.error('Error joining live event:', e);
        return res.status(500).json({ error: 'Failed to join live event' });
    }
});

/**
 * POST /api/dates/events/end
 * End an active Live Speed Dating Event hosted by current user
 */
router.post('/events/end', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { event_id } = req.body;

        const eventIndex = liveEventsStore.findIndex(e => (e.id === event_id || e.host_id === userId) && e.status === 'live');
        let endedEvent: LiveSpeedDateEvent | null = null;
        if (eventIndex !== -1) {
            endedEvent = liveEventsStore.splice(eventIndex, 1)[0];
            endedEvent.status = 'ended';
            liveEventParticipants.delete(endedEvent.id);
        }
        if (event_id) liveEventParticipants.delete(event_id);

        try {
            await ensureLiveEventsTable();
            if (event_id) {
                await prisma.$executeRawUnsafe(`
                    UPDATE live_speed_date_events SET status = 'ended' WHERE id = $1 AND host_id = $2::uuid;
                `, event_id, userId);
            } else {
                await prisma.$executeRawUnsafe(`
                    UPDATE live_speed_date_events SET status = 'ended' WHERE host_id = $1::uuid AND status = 'live';
                `, userId);
            }
        } catch (dbErr) {
            console.error('Failed to update ended event in DB:', dbErr);
        }

        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io && endedEvent) {
                io.emit('live_event_ended', endedEvent);
            }
        } catch (e) {}

        return res.json({ success: true, message: 'Live event ended successfully' });
    } catch (e: any) {
        console.error('Error ending live event:', e);
        return res.status(500).json({ error: 'Failed to end live event' });
    }
});

/**
 * PUT /api/dates/events/:id
 * Edit an existing Live or Scheduled Speed Dating Event
 */
router.put('/events/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { title, description, target_gender, max_participants, scheduled_at } = req.body;

        let event = liveEventsStore.find(e => e.id === id && e.host_id === userId);
        if (!event) {
            await syncLiveEventsFromDB();
            event = liveEventsStore.find(e => e.id === id && e.host_id === userId);
        }
        if (!event) {
            return res.status(404).json({ error: 'Live event not found or unauthorized' });
        }

        if (title && title.trim()) event.title = title.trim();
        if (description !== undefined) event.description = description.trim();
        if (target_gender) event.target_gender = target_gender;
        if (max_participants) event.max_participants = Number(max_participants);

        let scheduledIso: Date | null = event.scheduled_at ? new Date(event.scheduled_at) : null;
        if (scheduled_at) {
            const schedDate = new Date(scheduled_at);
            if (!isNaN(schedDate.getTime()) && schedDate > new Date()) {
                event.status = 'upcoming';
                event.scheduled_at = schedDate.toISOString();
                scheduledIso = schedDate;
            } else {
                event.status = 'live';
                event.scheduled_at = undefined;
                scheduledIso = null;
            }
        } else if (scheduled_at === null) {
            event.status = 'live';
            event.scheduled_at = undefined;
            scheduledIso = null;
        }

        try {
            await ensureLiveEventsTable();
            await prisma.$executeRawUnsafe(`
                UPDATE live_speed_date_events
                SET title = $1, description = $2, target_gender = $3, max_participants = $4, status = $5, scheduled_at = $6
                WHERE id = $7 AND host_id = $8::uuid;
            `, event.title, event.description, event.target_gender, event.max_participants, event.status, scheduledIso, id, userId);
        } catch (dbErr) {
            console.error('Failed to update live event in DB:', dbErr);
        }

        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.emit('live_event_updated', event);
            }
        } catch (e) {}

        return res.json({
            success: true,
            event,
            message: 'Live event updated successfully'
        });
    } catch (e: any) {
        console.error('Error updating live event:', e);
        return res.status(500).json({ error: 'Failed to update live event' });
    }
});

/**
 * DELETE /api/dates/events/:id
 * Delete or Cancel a Live or Scheduled Speed Dating Event
 */
router.delete('/events/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const index = liveEventsStore.findIndex(e => e.id === id && e.host_id === userId);
        let deletedEvent: LiveSpeedDateEvent | null = null;
        if (index !== -1) {
            deletedEvent = liveEventsStore.splice(index, 1)[0];
            deletedEvent.status = 'ended';
        }
        liveEventParticipants.delete(id);

        try {
            await ensureLiveEventsTable();
            await prisma.$executeRawUnsafe(`
                DELETE FROM live_speed_date_events WHERE id = $1 AND host_id = $2::uuid;
            `, id, userId);
        } catch (dbErr) {
            console.error('Failed to delete live event from DB:', dbErr);
        }

        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.emit('live_event_ended', deletedEvent || { id });
            }
        } catch (e) {}

        return res.json({
            success: true,
            message: 'Live event deleted successfully'
        });
    } catch (e: any) {
        console.error('Error deleting live event:', e);
        return res.status(500).json({ error: 'Failed to delete live event' });
    }
});

export default router;
