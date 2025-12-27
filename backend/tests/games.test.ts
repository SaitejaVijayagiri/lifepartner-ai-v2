
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        games: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(), // If needed
        },
        game_moves: {
            create: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn(),
            findFirst: jest.fn(),
        },
        profiles: {
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

// Mock AI Service
jest.mock('../src/services/ai', () => ({
    AIService: jest.fn().mockImplementation(() => ({
        generateRelationshipScenario: jest.fn().mockResolvedValue('A romantic dinner scenario')
    }))
}));

import { prisma } from '../src/prisma';
// Dynamic app import
let app: any;

describe('Games Routes', () => {
    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /games/start', () => {
        it('should start a game', async () => {
            (prisma.games.create as jest.Mock).mockResolvedValue({ id: 'g1' });

            const res = await request(app).post('/games/start').send({ partnerId: 'p2' });

            expect(res.status).toBe(200);
            expect(res.body.gameId).toBe('g1');
        });
    });

    describe('POST /games/scenario/start', () => {
        it('should generate scenario', async () => {
            (prisma.profiles.findUnique as jest.Mock).mockResolvedValue({ metadata: { bio: 'Bio' } });

            const res = await request(app).post('/games/scenario/start').send({ partnerId: 'p2' });

            expect(res.status).toBe(200);
            expect(res.body.scenario).toBe('A romantic dinner scenario');
        });
    });

    describe('POST /games/:id/answer', () => {
        it('should submit answer', async () => {
            (prisma.games.findUnique as jest.Mock).mockResolvedValue({ id: 'g1', player_a_id: 'my-user-id', player_b_id: 'p2' });
            (prisma.game_moves.findMany as jest.Mock).mockResolvedValue([]); // Partner hasn't played

            const res = await request(app).post('/games/g1/answer').send({ questionId: 1, optionIndex: 0 });

            expect(res.status).toBe(200);
            expect(prisma.game_moves.upsert).toHaveBeenCalled();
        });
    });
});
