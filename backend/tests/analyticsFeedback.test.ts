import request from 'supertest';
import express from 'express';

jest.mock('../src/prisma', () => ({
    prisma: {
        app_feedback: {
            create: jest.fn(),
            count: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
        },
        users: {
            count: jest.fn().mockResolvedValue(10),
        },
        $executeRawUnsafe: jest.fn().mockResolvedValue(0),
        $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    }
}));

jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, _res: any, next: any) => {
        req.user = { userId: 'admin-user-id', isAdmin: true };
        next();
    },
    authenticateOptional: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/middleware/adminAuth', () => ({
    adminAuth: (_req: any, _res: any, next: any) => next(),
}));

import analyticsRoutes from '../src/routes/analytics';
import { prisma } from '../src/prisma';

const app = express();
app.use(express.json());
app.use('/analytics', analyticsRoutes);

describe('Analytics App Feedback Persistence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects out-of-range ratings on POST /analytics/feedback', async () => {
        const res = await request(app)
            .post('/analytics/feedback')
            .send({ rating: 7, feedback_text: 'Too high' });

        expect(res.status).toBe(400);
        expect((prisma as any).app_feedback.create).not.toHaveBeenCalled();
    });

    it('persists feedback in PostgreSQL and sanitizes non-UUID user_id', async () => {
        ((prisma as any).app_feedback.create as jest.Mock).mockResolvedValue({
            id: '11111111-1111-4111-8111-111111111111',
            created_at: new Date('2026-11-12T15:00:00Z'),
        });

        const res = await request(app)
            .post('/analytics/feedback')
            .send({
                rating: 5,
                category: 'match_quality',
                feedback_text: 'Nearby international search is super fast!',
                user_id: 'not-a-valid-uuid',
                user_name: 'Elena',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe('11111111-1111-4111-8111-111111111111');
        expect((prisma as any).app_feedback.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                rating: 5,
                category: 'match_quality',
                feedback_text: 'Nearby international search is super fast!',
                user_id: null,
                user_name: 'Elena',
            })
        });
    });

    it('returns persistent feedback counts, average rating, and rows on GET /analytics/insights', async () => {
        ((prisma as any).app_feedback.count as jest.Mock).mockResolvedValue(2);
        ((prisma as any).app_feedback.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4.5 } });
        ((prisma as any).app_feedback.groupBy as jest.Mock).mockResolvedValue([
            { rating: 5, _count: { _all: 1 } },
            { rating: 4, _count: { _all: 1 } },
        ]);
        ((prisma as any).app_feedback.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'fb-1',
                rating: 5,
                category: 'overall_experience',
                feedback_text: 'Great!',
                user_name: 'Elena',
                created_at: new Date('2026-11-12T15:00:00Z'),
            },
            {
                id: 'fb-2',
                rating: 4,
                category: 'chat_experience',
                feedback_text: 'Smooth',
                user_name: 'Arjun',
                created_at: new Date('2026-11-12T14:00:00Z'),
            }
        ]);

        const res = await request(app).get('/analytics/insights');

        expect(res.status).toBe(200);
        expect(res.body.summary.totalFeedbackSubmitted).toBe(2);
        expect(res.body.summary.averageRating).toBe(4.5);
        expect(res.body.summary.ratingCounts).toEqual({ 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 });
        expect(res.body.recentFeedback).toHaveLength(2);
    });
});
