
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        verification_requests: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        users: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(require('../src/prisma').prisma)),
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

describe('Verification Routes', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /verification/request', () => {
        it('should create request', async () => {
            (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.verification_requests.create as jest.Mock).mockResolvedValue({ id: 'v1' });

            const res = await request(app).post('/verification/request').send({ documentUrl: 'url' });

            expect(res.status).toBe(200);
            expect(prisma.verification_requests.create).toHaveBeenCalled();
        });
    });

    describe('GET /verification/status', () => {
        it('should return status', async () => {
            (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue({ status: 'PENDING' });
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({ is_verified: false });

            const res = await request(app).get('/verification/status');

            expect(res.status).toBe(200);
            expect(res.body.request.status).toBe('PENDING');
        });
    });

    describe('POST /verification/admin/:id/resolve', () => {
        it('should approve request', async () => {
            (prisma.verification_requests.update as jest.Mock).mockResolvedValue({ user_id: 'my-user-id' });

            const res = await request(app).post('/verification/admin/v1/resolve').send({ status: 'APPROVED', notes: 'Ok' });

            expect(res.status).toBe(200);
            expect(prisma.users.update).toHaveBeenCalled();
        });
    });
});
