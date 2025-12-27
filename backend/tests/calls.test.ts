
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        call_logs: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
    }
}));

// Mock Auth
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id', id: 'my-user-id' };
        next();
    },
    requireAdmin: (req: any, res: any, next: any) => next()
}));

import { prisma } from '../src/prisma';
// Dynamic app import
let app: any;

describe('Calls Routes', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /calls/history', () => {
        it('should return call logs', async () => {
            (prisma.call_logs.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'c1',
                    started_at: new Date(),
                    duration_seconds: 60,
                    type: 'VIDEO',
                    status: 'COMPLETED',
                    caller_id: 'my-user-id',
                    receiver_id: 'other-id',
                    users_call_logs_receiver_idTousers: { full_name: 'Other', photo_url: 'pic.jpg' },
                    users_call_logs_caller_idTousers: { full_name: 'Me', photo_url: 'me.jpg' }
                }
            ]);

            const res = await request(app).get('/calls/history');

            if (res.status === 200) {
                expect(res.body).toHaveLength(1);
                expect(res.body[0].id).toBe('c1');
                expect(res.body[0].otherName).toBe('Other');
            }
        });
    });

    describe('POST /calls/log', () => {
        it('should create call log', async () => {
            (prisma.call_logs.create as jest.Mock).mockResolvedValue({ id: 'c2' });

            const res = await request(app).post('/calls/log').send({
                receiverId: 'other-id', type: 'AUDIO', duration: 120
            });

            expect(res.status).toBe(200);
            expect(prisma.call_logs.create).toHaveBeenCalled();
        });
    });
});
