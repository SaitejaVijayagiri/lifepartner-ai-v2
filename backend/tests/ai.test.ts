
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findUnique: jest.fn(),
        }
    }
}));

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id' };
        next();
    }
}));

import aiRoutes from '../src/routes/ai';
import { prisma } from '../src/prisma';

const app = express();
app.use(express.json());
app.use('/ai', aiRoutes);

describe('AI Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /ai/icebreaker', () => {
        it('should generate icebreakers for a valid user', async () => {
            // Mock target user finding
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                id: 'target-id',
                full_name: 'Target User',
                profiles: {
                    metadata: {
                        interests: ['Travel', 'Food']
                    }
                }
            });

            const res = await request(app)
                .post('/ai/icebreaker')
                .send({ targetUserId: 'target-id' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('suggestions');
            expect(Array.isArray(res.body.suggestions)).toBe(true);
            expect(res.body.suggestions.length).toBeGreaterThan(0);
        });

        it('should return 404 if user not found', async () => {
            (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/ai/icebreaker')
                .send({ targetUserId: 'ghost-id' });

            expect(res.status).toBe(404);
        });

        it('should return 400 if targetUserId is missing', async () => {
            const res = await request(app)
                .post('/ai/icebreaker')
                .send({});

            expect(res.status).toBe(400);
        });
    });
});
