import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

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
                max_attendees INT DEFAULT NULL,
                created_at TIMESTAMP(6) DEFAULT now()
            );
        `);

        // Backward-compatible: add max_attendees if the column doesn't exist yet
        await prisma.$executeRawUnsafe(`
            ALTER TABLE meet_events ADD COLUMN IF NOT EXISTS max_attendees INT DEFAULT NULL;
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS event_attendees (
                event_id UUID REFERENCES meet_events(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP(6) DEFAULT now(),
                PRIMARY KEY (event_id, user_id)
            );
        `);
        res.json({ success: true, message: 'Events DB patched successfully' });
    } catch (e: any) {
        console.error('DB Patch Error', e);
        res.status(500).json({ error: e.message });
    }
});

// Helper — build consistent event SELECT
const eventSelect = (userId: string, lat?: number, lng?: number) => {
    const withDistance = !isNaN(lat as number) && !isNaN(lng as number);
    const distanceExpr = withDistance
        ? `( 6371 * acos( GREATEST(-1, LEAST(1,
              cos(radians($2)) * cos(radians(e.lat)) * cos(radians(e.lng) - radians($3))
            + sin(radians($2)) * sin(radians(e.lat))
           )) ) ) AS distance`
        : 'NULL::FLOAT AS distance';
    return distanceExpr;
};

// 2. Fetch all upcoming events (sorted by distance then date)
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const myEvents = req.query.my === 'true';       // filter: events I created or attend
        const filter   = req.query.filter as string;    // 'hosting' | 'attending'

        let whereExtra = '';
        if (filter === 'hosting')  whereExtra = `AND e.creator_id = '${userId}'::uuid`;
        if (filter === 'attending') whereExtra = `AND EXISTS(SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = '${userId}'::uuid)`;

        let events;
        if (!isNaN(lat) && !isNaN(lng)) {
            events = await prisma.$queryRawUnsafe(`
                SELECT e.*,
                    u.full_name as creator_name,
                    u.avatar_url as creator_photo,
                    (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)::int as attendee_count,
                    EXISTS(SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = $1::uuid)::bool as is_attending,
                    (e.creator_id = $1::uuid)::bool as is_creator,
                    ( 6371 * acos( GREATEST(-1, LEAST(1,
                        cos(radians($2)) * cos(radians(e.lat)) * cos(radians(e.lng) - radians($3))
                      + sin(radians($2)) * sin(radians(e.lat))
                    )) ) ) AS distance
                FROM meet_events e
                JOIN users u ON e.creator_id = u.id
                WHERE e.event_date > NOW() ${whereExtra}
                ORDER BY distance ASC, e.event_date ASC
                LIMIT 60;
            `, userId, lat, lng);
        } else {
            events = await prisma.$queryRawUnsafe(`
                SELECT e.*,
                    u.full_name as creator_name,
                    u.avatar_url as creator_photo,
                    (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)::int as attendee_count,
                    EXISTS(SELECT 1 FROM event_attendees WHERE event_id = e.id AND user_id = $1::uuid)::bool as is_attending,
                    (e.creator_id = $1::uuid)::bool as is_creator,
                    NULL::FLOAT AS distance
                FROM meet_events e
                JOIN users u ON e.creator_id = u.id
                WHERE e.event_date > NOW() ${whereExtra}
                ORDER BY e.event_date ASC
                LIMIT 60;
            `, userId);
        }

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
        const { title, description, location_name, lat, lng, event_date, category, max_attendees } = req.body;

        if (!title || !location_name || !event_date) {
            return res.status(400).json({ error: 'Title, location, and date are required' });
        }

        const dateObj = new Date(event_date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        if (dateObj <= new Date()) {
            return res.status(400).json({ error: 'Event must be in the future' });
        }

        const maxAtt = max_attendees ? parseInt(max_attendees) : null;

        const newEvent: any[] = await prisma.$queryRawUnsafe(`
            INSERT INTO meet_events (creator_id, title, description, location_name, lat, lng, event_date, category, max_attendees)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `, userId, title, description || '', location_name, lat || null, lng || null, dateObj, category || 'Other', maxAtt);

        // Auto-RSVP the creator
        await prisma.$queryRawUnsafe(`
            INSERT INTO event_attendees (event_id, user_id) VALUES ($1::uuid, $2::uuid)
            ON CONFLICT DO NOTHING;
        `, newEvent[0].id, userId);

        res.json({ success: true, event: newEvent[0] });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// 4. Toggle RSVP (respects max_attendees cap)
router.post('/:id/rsvp', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const eventId = req.params.id;

        // Fetch event details
        const eventRows: any[] = await prisma.$queryRawUnsafe(`
            SELECT e.*, (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id)::int as attendee_count
            FROM meet_events e WHERE e.id = $1::uuid;
        `, eventId);

        if (!eventRows.length) return res.status(404).json({ error: 'Event not found' });
        const event = eventRows[0];

        const attending: any[] = await prisma.$queryRawUnsafe(`
            SELECT 1 FROM event_attendees WHERE event_id = $1::uuid AND user_id = $2::uuid;
        `, eventId, userId);

        if (attending.length > 0) {
            // Un-RSVP (creators cannot un-RSVP their own event)
            if (event.creator_id === userId) {
                return res.status(400).json({ error: 'You are the creator. Delete the event to remove it.' });
            }
            await prisma.$queryRawUnsafe(`
                DELETE FROM event_attendees WHERE event_id = $1::uuid AND user_id = $2::uuid;
            `, eventId, userId);
            res.json({ success: true, attending: false });
        } else {
            // Check capacity
            if (event.max_attendees && Number(event.attendee_count) >= event.max_attendees) {
                return res.status(400).json({ error: 'This event is full!' });
            }
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

// 5. Edit event (creator only)
router.patch('/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const eventId = req.params.id;
        const { title, description, location_name, lat, lng, event_date, category, max_attendees } = req.body;

        const eventRows: any[] = await prisma.$queryRawUnsafe(`
            SELECT creator_id FROM meet_events WHERE id = $1::uuid;
        `, eventId);

        if (!eventRows.length) return res.status(404).json({ error: 'Event not found' });
        if (eventRows[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Only the creator can edit this event' });
        }

        if (!title || !location_name || !event_date) {
            return res.status(400).json({ error: 'Title, location, and date are required' });
        }

        const dateObj = new Date(event_date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const maxAtt = max_attendees ? parseInt(max_attendees) : null;

        const updated: any[] = await prisma.$queryRawUnsafe(`
            UPDATE meet_events
            SET title = $2,
                description = $3,
                location_name = $4,
                lat = $5,
                lng = $6,
                event_date = $7,
                category = $8,
                max_attendees = $9
            WHERE id = $1::uuid
            RETURNING *;
        `, eventId, title, description || '', location_name, lat || null, lng || null, dateObj, category || 'Other', maxAtt);

        res.json({ success: true, event: updated[0] });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// 5. Delete event (creator only)
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const eventId = req.params.id;

        const eventRows: any[] = await prisma.$queryRawUnsafe(`
            SELECT creator_id FROM meet_events WHERE id = $1::uuid;
        `, eventId);

        if (!eventRows.length) return res.status(404).json({ error: 'Event not found' });
        if (eventRows[0].creator_id !== userId) {
            return res.status(403).json({ error: 'Only the creator can delete this event' });
        }

        await prisma.$queryRawUnsafe(`DELETE FROM meet_events WHERE id = $1::uuid;`, eventId);
        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// 6. Get attendees list for an event
router.get('/:id/attendees', authenticateToken, async (req: any, res) => {
    try {
        const eventId = req.params.id;
        const attendees: any[] = await prisma.$queryRawUnsafe(`
            SELECT u.id, u.full_name as name, u.avatar_url as photo
            FROM event_attendees ea
            JOIN users u ON ea.user_id = u.id
            WHERE ea.event_id = $1::uuid
            ORDER BY ea.created_at ASC
            LIMIT 50;
        `, eventId);
        res.json({ success: true, attendees });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch attendees' });
    }
});

export default router;
