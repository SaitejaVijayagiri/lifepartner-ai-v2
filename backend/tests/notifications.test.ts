
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        device_tokens: {
            create: jest.fn(),
            upsert: jest.fn(),
            findUnique: jest.fn(), // If needed
            findMany: jest.fn(), // For service
        },
        notifications: {
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        users: {
            findUnique: jest.fn(),
        }
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

// Mock NotificationService
jest.mock('../src/services/notification', () => {
    return {
        NotificationService: {
            getInstance: jest.fn().mockReturnValue({
                sendToUser: jest.fn().mockResolvedValue(true)
            })
        }
    };
});

jest.mock('../src/routes/verification', () => require('express').Router());

import { prisma } from '../src/prisma';
// Dynamic app import
let app: any;

describe('Notification Routes', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /notifications/register', () => {
        it('should register token', async () => {
            (prisma.device_tokens.create as jest.Mock).mockResolvedValue({});

            const res = await request(app).post('/notifications/register').send({ token: 't1' });

            expect(res.status).toBe(200);
            expect(prisma.device_tokens.upsert).toHaveBeenCalled();
        });
    });

    describe('GET /notifications/', () => {
        it('should return notifications', async () => {
            (prisma.notifications.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.notifications.count as jest.Mock).mockResolvedValue(5);

            const res = await request(app).get('/notifications/');

            expect(res.status).toBe(200);
            expect(res.body.unreadCount).toBe(5);
        });
    });
});
