
import request from 'supertest';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        interactions: {
            count: jest.fn(),
            upsert: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
        },
        notifications: {
            create: jest.fn(),
        },
        matches: {
            deleteMany: jest.fn(),
            findMany: jest.fn(),
        },
        blocks: {
            create: jest.fn(),
            upsert: jest.fn(),
            deleteMany: jest.fn(),
            findMany: jest.fn(),
        },
        contact_inquiries: {
            create: jest.fn(),
        },
        reports: {
            create: jest.fn(),
        }
    }
}));

// Mock Auth
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id' };
        next();
    },
    requireAdmin: (req: any, res: any, next: any) => next()
}));

// Mock Services
jest.mock('../src/services/email', () => ({
    EmailService: {
        sendInterestReceivedEmail: jest.fn(),
        sendMatchAcceptedEmail: jest.fn(),
    }
}));

import { prisma } from '../src/prisma';

let app: any;

describe('Interactions Routes (Prisma)', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /interest', () => {
        it('should send interest (upsert interaction)', async () => {
            // Mock users
            (prisma.users.findUnique as jest.Mock)
                .mockResolvedValueOnce({ full_name: 'Me', is_premium: false }) // Me
                .mockResolvedValueOnce({ full_name: 'Target', email: 't@example.com' }); // Target

            // Mock count (< 5)
            (prisma.interactions.count as jest.Mock).mockResolvedValue(2);

            // Mock upsert
            (prisma.interactions.upsert as jest.Mock).mockResolvedValue({ id: 'int1' });

            const res = await request(app)
                .post('/interactions/interest')
                .send({ toUserId: 'target-id' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.interactions.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    from_user_id_to_user_id_type: expect.anything()
                })
            }));
        });
    });

    describe('GET /who-liked-me', () => {
        it('should return blurred likes for free user', async () => {
            // Mock user as NON-premium
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({ is_premium: false });

            // Mock matches
            (prisma.matches.findMany as jest.Mock).mockResolvedValue([
                {
                    user_a_id: 'u2',
                    created_at: new Date(),
                    is_liked: true,
                    users_matches_user_a_idTousers: {
                        id: 'u2',
                        full_name: 'Admirer',
                        profiles: { metadata: { location: { city: 'Paris' } } }
                    }
                }
            ]);

            const res = await request(app).get('/interactions/who-liked-me');
            expect(res.status).toBe(200);
            expect(res.body.isPremium).toBe(false);
            expect(res.body.likes[0].isBlurred).toBe(true);
            expect(res.body.likes[0].name).toBe("???");
        });
    });
});
