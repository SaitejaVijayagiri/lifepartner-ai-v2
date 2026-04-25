import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. DB Patching Endpoint
router.get('/fix-db', async (req, res) => {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS meet_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                location_name VARCHAR(255),
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                event_date TIMESTAMP(6),
                category VARCHAR(100),
                created_at TIMESTAMP(6) DEFAULT now()
            );
        `);
        
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS event_attendees (
                event_id UUID REFERENCES meet_events(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP(6) DEFAULT now(),
                PRIMARY KEY (event_id, user_id)
            );
        `);
        res.json({ success: true, message: "Events DB patched successfully" });
    } catch (e: any) {
        console.error("DB Patch Error", e);
        res.status(500).json({ error: e.message });
    }
});

// 2. Fetch all upcoming events (sorted by date)
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);

        // Raw SQL to fetch events and compute attendee count and user's RSVP status
        // Using ST_DistanceSphere if we had PostGIS, but we'll use a simple bounding box or haversine in JS if needed.
        // For simplicity and compatibility, we'll fetch all upcoming events and sort by date for now,
        // or sort by distance using basic math in SQL.

        let events;
        if (!isNaN(lat) && !isNaN(lng)) {
             events = await prisma.$queryRawUnsafe(`
                SELECT e.*, 
                    u.full_name as creator_name,
                    u.avatar_url as creator_photo,
                    (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count,
                    EXISTS(SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = $1::uuid) as is_attending,
                    ( 6371 * acos( cos( radians($2) ) * cos( radians( e.lat ) ) * cos( radians( e.lng ) - radians($3) ) + sin( radians($2) ) * sin( radians( e.lat ) ) ) ) AS distance
                FROM meet_events e
                JOIN users u ON e.creator_id = u.id
                WHERE e.event_date > NOW()
                ORDER BY distance ASC, e.event_date ASC
                LIMIT 50;
            `, userId, lat, lng);
        } else {
             events = await prisma.$queryRawUnsafe(`
                SELECT e.*, 
                    u.full_name as creator_name,
                    u.avatar_url as creator_photo,
                    (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count,
                    EXISTS(SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = $1::uuid) as is_attending
                FROM meet_events e
                JOIN users u ON e.creator_id = u.id
                WHERE e.event_date > NOW()
                ORDER BY e.event_date ASC
                LIMIT 50;
            `, userId);
        }

        // Convert BigInt counts to numbers because JSON.stringify fails on BigInt
        const serialized = (events as any[]).map(e => ({
            ...e,
            attendee_count: Number(e.attendee_count)
        }));

        res.json({ success: true, events: serialized });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// 3. Create a new event
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { title, description, location_name, lat, lng, event_date, category } = req.body;

        if (!title || !location_name || !event_date) {
            return res.status(400).json({ error: "Title, location, and date are required" });
        }

        const dateObj = new Date(event_date);

        const newEvent: any[] = await prisma.$queryRawUnsafe(`
            INSERT INTO meet_events (creator_id, title, description, location_name, lat, lng, event_date, category)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `, userId, title, description || '', location_name, lat || null, lng || null, dateObj, category || 'Other');

        // Automatically add the creator as an attendee
        await prisma.$queryRawUnsafe(`
            INSERT INTO event_attendees (event_id, user_id)
            VALUES ($1::uuid, $2::uuid);
        `, newEvent[0].id, userId);

        res.json({ success: true, event: newEvent[0] });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// 4. Toggle RSVP
router.post('/:id/rsvp', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const eventId = req.params.id;

        // Check if attending
        const attending: any[] = await prisma.$queryRawUnsafe(`
            SELECT 1 FROM event_attendees WHERE event_id = $1::uuid AND user_id = $2::uuid;
        `, eventId, userId);

        if (attending.length > 0) {
            // Un-RSVP
            await prisma.$queryRawUnsafe(`
                DELETE FROM event_attendees WHERE event_id = $1::uuid AND user_id = $2::uuid;
            `, eventId, userId);
            res.json({ success: true, attending: false });
        } else {
            // RSVP
            await prisma.$queryRawUnsafe(`
                INSERT INTO event_attendees (event_id, user_id) VALUES ($1::uuid, $2::uuid);
            `, eventId, userId);
            res.json({ success: true, attending: true });
        }
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to toggle RSVP' });
    }
});

export default router;
