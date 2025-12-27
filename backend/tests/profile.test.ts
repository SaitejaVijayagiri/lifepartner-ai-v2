

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        profiles: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(require('../src/prisma').prisma)),
    }
}));

import request from 'supertest';
import express from 'express';

// Mocks are handled in setup.ts but we need to define specific return values here.
// Re-import mocks to types
import { prisma } from '../src/prisma';


// Mock Auth
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id' };
        next();
    },
    requireAdmin: (req: any, res: any, next: any) => next() // Allow admin check to pass
}));

// Mock Image Optimizer to avoid real processing
jest.mock('../src/services/imageOptimizer', () => ({
    ImageOptimizer: {
        isBase64: jest.fn(() => false), // Default no processing
        optimize: jest.fn()
    }
}));

// Mock AI Service
jest.mock('../src/services/ai', () => ({
    AIService: jest.fn().mockImplementation(() => ({
        parseUserPrompt: jest.fn().mockResolvedValue({ traits: {}, values: [] })
    }))
}));

// Dynamic import for app to avoid top-level side effects (though mocked in setup, safe to be cautious)
let app: any;

describe('Profile Routes', () => {
    beforeAll(() => {
        // We need to require server to register routes
        // Ensure manual mock of pool in setup.ts is active
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /profile/me', () => {
        it('should return my profile', async () => {
            // Mock findUnique
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                id: 'my-user-id',
                full_name: 'Test User',
                email: 'test@example.com',
                age: 30,
                gender: 'Male',
                location_name: 'Test City',
                avatar_url: 'http://img.com/a.jpg',
                is_premium: true,
                profiles: {
                    metadata: {
                        career: { profession: 'Engineer' },
                        religion: { religion: 'Hindu' }
                    },
                    raw_prompt: 'I am a test user'
                }
            });

            const res = await request(app).get('/profile/me');
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Test User');
            expect(res.body.career.profession).toBe('Engineer');
        });

        it('should return 404 if user not found', async () => {
            (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);
            const res = await request(app).get('/profile/me');
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /profile/me', () => {
        it('should update profile', async () => {
            // Mock transaction and updates
            // In Prisma mock setup, $transaction calls callback immediately
            (prisma.users.update as jest.Mock).mockResolvedValue({ id: 'my-user-id' });
            (prisma.profiles.upsert as jest.Mock).mockResolvedValue({ id: 'p-id' });
            // Note: Current migration plan suggests using upsert or update.
            // Old code had "INSERT ... ON CONFLICT". Prisma `upsert` is perfect.

            const res = await request(app).put('/profile/me').send({
                name: 'New Name',
                aboutMe: 'Updated Bio'
            });

            expect(res.status).toBe(200);
            expect(prisma.users.update).toHaveBeenCalled();
        });
    });
});
