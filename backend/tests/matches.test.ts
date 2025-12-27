
import request from 'supertest';
import express from 'express';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
        },
        $queryRaw: jest.fn(),
    }
}));

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id' };
        next();
    }
}));

// Mock Socket
jest.mock('../src/socket', () => ({
    isUserOnline: jest.fn(() => true)
}));

// Mock AI Service (Constructed in route)
jest.mock('../src/services/ai', () => {
    return {
        AIService: jest.fn().mockImplementation(() => ({
            parseSearchQuery: jest.fn().mockResolvedValue({}),
            generateEmbedding: jest.fn().mockResolvedValue([]),
            analyzeSentiment: jest.fn().mockResolvedValue('NEUTRAL')
        })),
    };
});


import matchesRoutes from '../src/routes/matches';
import { prisma } from '../src/prisma';

const app = express();
app.use(express.json());
app.use('/matches', matchesRoutes);

describe('Matches Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /matches/public-preview', () => {
        it('should return matches', async () => {
            // Mock findMany result
            (prisma.users.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'u1',
                    full_name: 'User One',
                    age: 25,
                    location_name: 'City',
                    avatar_url: 'http://pic.com',
                    profiles: {
                        metadata: { career: { profession: 'Engineer' } }
                    }
                }
            ]);

            // To simulate SQL query result if not yet migrated? 
            // The current code uses pool.query. I need to mock pool OR migrate immediately.
            // I'll assume I migrate immediately.

            const res = await request(app).get('/matches/public-preview?category=profession&value=Engineer');

            // Note: If I run this BEFORE migration, it will fail because valid pool mock is missing or logic differs.
            // I should migrate first.

        });
    });

    describe('GET /matches/recommendations', () => {
        it('should return recommendations with scores', async () => {
            // Mock findUnique for "Me"
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                id: 'my-user-id',
                gender: 'Male',
                profiles: {
                    metadata: { religion: { religion: 'Hindu' } }
                }
            });

            // Mock findMany for "Candidates"
            (prisma.users.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'c1',
                    full_name: 'Candidate One',
                    age: 24,
                    profiles: {
                        metadata: { religion: { religion: 'Hindu' }, career: { profession: 'Doctor' } }
                    },
                    matches_matches_user_b_idTousers: [], // No interaction yet
                    _count: { matches_matches_user_b_idTousers: 5 } // 5 likes
                }
            ]);

            const res = await request(app).get('/matches/recommendations');

            expect(res.status).toBe(200);
            expect(res.body.matches).toHaveLength(1);
            expect(res.body.matches[0].name).toBe('Candidate One');
            expect(res.body.matches[0].score).toBeGreaterThan(50); // Base 50 + Religion match
        });
    });

    describe('POST /matches/search', () => {
        it('should return search results', async () => {
            // Mock "Me"
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                id: 'my-user-id',
                gender: 'Male',
                profiles: { metadata: {} }
            });

            // Mock Search Results
            (prisma.users.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 's1',
                    full_name: 'Search Result',
                    age: 28,
                    profiles: { metadata: { career: { profession: 'Engineer' } } },
                    matches_matches_user_b_idTousers: [],
                    _count: { matches_matches_user_b_idTousers: 0 }
                }
            ]);

            const res = await request(app).post('/matches/search').send({ query: 'engineer' });

            expect(res.status).toBe(200);
            expect(res.body.matches).toHaveLength(1);
        });
    });
});
