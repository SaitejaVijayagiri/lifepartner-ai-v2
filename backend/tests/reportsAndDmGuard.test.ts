import request from 'supertest';

const mockEmit = jest.fn();
const mockToEmit = jest.fn();

jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({ id: 'updated' }),
        },
        profiles: {
            findUnique: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({}),
        },
        verification_requests: {
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
        },
        interactions: {
            count: jest.fn().mockResolvedValue(0),
            upsert: jest.fn().mockResolvedValue({ id: 'int-1' }),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        messages: {
            create: jest.fn().mockResolvedValue({ id: 'msg-1', created_at: new Date() }),
        },
        notifications: {
            create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        },
        matches: {
            deleteMany: jest.fn(),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
        },
        blocks: {
            create: jest.fn(),
            upsert: jest.fn().mockResolvedValue({}),
            deleteMany: jest.fn(),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue(null),
        },
        reports: {
            create: jest.fn().mockResolvedValue({ id: 'rep-1' }),
            findMany: jest.fn().mockResolvedValue([]),
        },
    },
}));

jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, _res: any, next: any) => {
        req.user = { userId: req.headers['x-test-user-id'] || 'user-1' };
        next();
    },
    authenticateOptional: (req: any, _res: any, next: any) => {
        req.user = { userId: req.headers['x-test-user-id'] || 'user-1' };
        next();
    },
    requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/socket', () => ({
    initSocket: jest.fn(),
    isUserOnline: jest.fn().mockReturnValue(false),
    getIO: () => ({
        emit: mockEmit,
        to: () => ({ emit: mockToEmit }),
    }),
}));

jest.mock('../src/services/email', () => ({
    EmailService: {
        sendInterestReceivedEmail: jest.fn(),
        sendMatchAcceptedEmail: jest.fn(),
    },
}));

jest.mock('../src/services/notification', () => ({
    NotificationService: {
        getInstance: () => ({
            sendToUser: jest.fn().mockResolvedValue(undefined),
        }),
    },
}));

jest.mock('../src/services/growthAnalytics', () => ({
    trackGrowthEvent: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../src/prisma';

let app: any;

describe('Repeat-Report Auto-Quarantine & Women Cold-DM Guard', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.blocks.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.blocks.upsert as jest.Mock).mockResolvedValue({});
        (prisma.interactions.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.reports.create as jest.Mock).mockResolvedValue({ id: 'rep-1' });
        (prisma.messages.create as jest.Mock).mockResolvedValue({ id: 'msg-1', created_at: new Date() });
        (prisma.notifications.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });
        (prisma.interactions.upsert as jest.Mock).mockResolvedValue({ id: 'int-1' });
    });

    describe('POST /reports auto-quarantine', () => {
        it('quarantines user when >= 3 distinct reporters report them within 30 days', async () => {
            (prisma.reports.findMany as jest.Mock).mockResolvedValueOnce([
                { reporter_id: 'r1' },
                { reporter_id: 'r2' },
                { reporter_id: 'r3' },
            ]);

            const res = await request(app)
                .post('/reports')
                .set('x-test-user-id', 'r3')
                .send({ reportedId: 'bad-user-1', reason: 'Scam or Fake Profile' });

            expect(res.status).toBe(201);
            expect(res.body.autoQuarantined).toBe(true);
            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { id: 'bad-user-1' },
                data: { is_deactivated: true },
            });
            expect(mockEmit).toHaveBeenCalledWith(
                'admin:urgentAbuseAlert',
                expect.objectContaining({
                    reportedId: 'bad-user-1',
                    action: 'AUTO_QUARANTINED',
                })
            );
        });

        it('does not quarantine when 3 reports come from only 2 distinct reporters', async () => {
            (prisma.reports.findMany as jest.Mock).mockResolvedValueOnce([
                { reporter_id: 'r1' },
                { reporter_id: 'r1' },
                { reporter_id: 'r2' },
            ]);

            const res = await request(app)
                .post('/reports')
                .set('x-test-user-id', 'r2')
                .send({ reportedId: 'target-user-2', reason: 'Spam' });

            expect(res.status).toBe(201);
            expect(res.body.autoQuarantined).toBe(false);
            expect(prisma.users.update).not.toHaveBeenCalled();
        });
    });

    describe('POST /interactions/direct Women cold-DM verification guard', () => {
        it('blocks photo-less unverified accounts selecting Female after 3 cold DMs in 24h', async () => {
            (prisma.users.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: 'target-1', is_banned: false, is_deactivated: false, deactivated_until: null })
                .mockResolvedValueOnce({
                    full_name: 'Suspicious Account',
                    is_premium: false,
                    free_direct_messages: 0,
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fake',
                    gender: 'Female',
                    profiles: { metadata: {} },
                });
            (prisma.interactions.count as jest.Mock).mockResolvedValueOnce(3);

            const res = await request(app)
                .post('/interactions/direct')
                .set('x-test-user-id', 'photoless-female')
                .send({ toUserId: 'target-1', text: 'Send money to this UPI' });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Verification Required');
            expect(prisma.messages.create).not.toHaveBeenCalled();
        });

        it('allows unlimited free DMs for Female user with an uploaded real photo', async () => {
            (prisma.users.findUnique as jest.Mock)
                .mockResolvedValueOnce({ id: 'target-2', is_banned: false, is_deactivated: false, deactivated_until: null })
                .mockResolvedValueOnce({
                    full_name: 'Ananya',
                    is_premium: false,
                    free_direct_messages: 0,
                    avatar_url: 'https://cdn.example.com/photos/ananya.jpg',
                    gender: 'Female',
                    profiles: { metadata: {} },
                });

            const res = await request(app)
                .post('/interactions/direct')
                .set('x-test-user-id', 'verified-photo-female')
                .send({ toUserId: 'target-2', text: 'Hi, liked your family values!' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true, remaining: 'Unlimited' });
            expect(prisma.messages.create).toHaveBeenCalled();
        });
    });
});
