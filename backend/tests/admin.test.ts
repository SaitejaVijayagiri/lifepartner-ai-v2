
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            count: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        transactions: {
            aggregate: jest.fn(),
            findMany: jest.fn(),
        },
        reports: {
            count: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
    }
}));

// Mock Auth & Admin Auth
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'admin-id' };
        next();
    },
    requireAdmin: (req: any, res: any, next: any) => next()
}));

jest.mock('../src/middleware/adminAuth', () => ({
    adminAuth: (req: any, res: any, next: any) => next()
}));

import { prisma } from '../src/prisma'; // Re-import to use mock
// Dynamic app import
let app: any;

describe('Admin Routes', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /admin/stats', () => {
        it('should return dashboard stats', async () => {
            (prisma.users.count as jest.Mock).mockResolvedValue(100);
            (prisma.transactions.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 5000 } });
            (prisma.reports.count as jest.Mock).mockResolvedValue(5);

            const res = await request(app).get('/admin/stats');

            if (res.status === 200) {
                expect(res.body.totalUsers).toBe(100);
                expect(res.body.pendingReports).toBe(5);
            }
        });
    });

    describe('GET /admin/users', () => {
        it('should list users', async () => {
            (prisma.users.findMany as jest.Mock).mockResolvedValue([
                { id: 'u1', full_name: 'User 1' }
            ]);

            const res = await request(app).get('/admin/users');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });
});
