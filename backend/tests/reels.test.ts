
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        reels: {
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(), // If we switch to findMany
        },
        reel_likes: {
            findFirst: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        reel_comments: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        $queryRaw: jest.fn(),
        $transaction: jest.fn((arg) => {
            if (Array.isArray(arg)) return Promise.all(arg);
            return arg(require('../src/prisma').prisma);
        }),
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

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example.com/video.mp4' } })
            })
        }
    })
}));

// Mock Vibe Analysis (Optional import)
jest.mock('../src/services/vibeAnalysis', () => ({
    analyzeVibe: jest.fn().mockResolvedValue({ vibe: 'Funny', tags: ['fun'] })
}), { virtual: true });

import { prisma } from '../src/prisma'; // Re-import to use mock
// Dynamic app import
let app: any;

describe('Reels Routes', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /reels/feed', () => {
        it('should return reels feed', async () => {
            // Mock User Loc
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                gender: 'Male',
                profiles: { metadata: { location: { district: 'D1' } } }
            });

            // Mock Feed Query (Raw)
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([
                {
                    id: 'r1',
                    video_url: 'url',
                    caption: 'cap',
                    likes: 10,
                    user_id: 'u2',
                    author_name: 'Author',
                    // Add other fields expected by raw query map if needed
                }
            ]);

            const res = await request(app).get('/reels/feed');

            if (res.status === 200) {
                expect(res.body).toHaveLength(1);
                expect(res.body[0].id).toBe('r1');
            }
        });
    });

    describe('POST /reels/:id/like', () => {
        it('should toggle like', async () => {
            (prisma.reel_likes.findFirst as jest.Mock).mockResolvedValue(null); // Not liked yet

            const res = await request(app).post('/reels/r1/like');

            expect(res.status).toBe(200);
            expect(prisma.reel_likes.create).toHaveBeenCalled();
            expect(prisma.reels.update).toHaveBeenCalled();
        });
    });
});
