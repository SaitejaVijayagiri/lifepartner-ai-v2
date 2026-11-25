
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
    authenticateOptional: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id', id: 'my-user-id' };
        next();
    },
    requireAdmin: (req: any, res: any, next: any) => next()
}));

jest.mock('../src/middleware/adminAuth', () => ({
    adminAuth: (req: any, res: any, next: any) => next()
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

            const res = await request(app).post('/verification/request').send({ documentUrl: 'https://cdn.example.org/selfie.jpg' });

            expect(res.status).toBe(200);
            expect(prisma.verification_requests.create).toHaveBeenCalled();
        });

        it('should reject missing or mock documentUrl', async () => {
            const missingRes = await request(app).post('/verification/request').send({});
            expect(missingRes.status).toBe(400);

            const mockRes = await request(app).post('/verification/request').send({ documentUrl: 'https://example.com/mock-id.jpg' });
            expect(mockRes.status).toBe(400);
            expect(prisma.verification_requests.create).not.toHaveBeenCalled();
        });

        it('should reject duplicate submission if user is already APPROVED', async () => {
            (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue({ status: 'APPROVED' });

            const res = await request(app).post('/verification/request').send({ documentUrl: 'https://cdn.example.org/selfie.jpg' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already verified');
            expect(prisma.verification_requests.create).not.toHaveBeenCalled();
        });
    });

    describe('GET /verification/status', () => {
        it('should return status', async () => {
            (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue({ status: 'PENDING' });
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({ is_verified: false });

            const res = await request(app).get('/verification/status');

            expect(res.status).toBe(200);
            expect(res.body.request.status).toBe('PENDING');
            expect(res.body.isVerified).toBe(false);
        });

        it('should NOT treat email-verified (users.is_verified=true) as ID-verified without an approved verification request', async () => {
            (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                is_verified: true,
                profiles: { metadata: {} }
            });

            const res = await request(app).get('/verification/status');

            expect(res.status).toBe(200);
            expect(res.body.isEmailVerified).toBe(true);
            expect(res.body.isVerified).toBe(false);
        });

        it('should return isVerified=true when an APPROVED verification request exists', async () => {
            (prisma.verification_requests.findFirst as jest.Mock).mockResolvedValue({ status: 'APPROVED' });
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                is_verified: true,
                profiles: { metadata: {} }
            });

            const res = await request(app).get('/verification/status');

            expect(res.status).toBe(200);
            expect(res.body.isVerified).toBe(true);
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
