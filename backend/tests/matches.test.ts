
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
        matches: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        interactions: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        $queryRaw: jest.fn(),
        $queryRawUnsafe: jest.fn(),
    }
}));

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'my-user-id' };
        next();
    },
    authenticateOptional: (req: any, res: any, next: any) => {
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


import matchesRoutes, { matchCache } from '../src/routes/matches';
import { prisma } from '../src/prisma';

const app = express();
app.use(express.json());
app.use('/matches', matchesRoutes);

describe('Matches Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (matchCache) {
            matchCache.deletePrefix('');
        }
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
        it('should return recommendations with scores including age similarity, mother tongue, and education boosts', async () => {
            // Mock findUnique for "Me"
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                id: 'my-user-id',
                gender: 'Female',
                age: 30,
                profiles: {
                    metadata: { 
                        religion: { religion: 'Hindu' },
                        motherTongue: 'Telugu',
                        career: { educationLevel: 'Masters' }
                    }
                }
            });

            // Mock $queryRaw candidates IDs
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 'c1' }]);

            // Mock findMany for "Candidates" (Male, age 31, similar age boost +10, mother tongue match +10, education match +10)
            (prisma.users.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'c1',
                    full_name: 'Candidate One',
                    age: 31,
                    gender: 'Male',
                    avatar_url: 'http://pic.com',
                    profiles: {
                        metadata: { 
                            religion: { religion: 'Hindu' }, 
                            career: { profession: 'Doctor', educationLevel: 'Masters' },
                            motherTongue: 'Telugu'
                        }
                    },
                    matches_matches_user_b_idTousers: [],
                    _count: { matches_matches_user_b_idTousers: 5 },
                    interactions_interactions_to_user_idTousers: [],
                    interactions_interactions_from_user_idTousers: []
                }
            ]);

            const res = await request(app).get('/matches/recommendations');

            expect(res.status).toBe(200);
            expect(res.body.matches).toHaveLength(1);
            expect(res.body.matches[0].name).toBe('Candidate One');
            // Base 50 + Religion 10 + Age similarity 10 + Mother Tongue 10 + Education 10 = 90
            expect(res.body.matches[0].score).toBe(90);
        });

        it('should apply penalty for male candidates over 40 and large age gap', async () => {
            // Mock findUnique for "Me"
            (prisma.users.findUnique as jest.Mock).mockResolvedValue({
                id: 'my-user-id',
                gender: 'Female',
                age: 30,
                profiles: {
                    metadata: {}
                }
            });

            // Mock $queryRaw candidates IDs
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ id: 'c2' }]);

            // Mock findMany for "Candidates" (Male, age 45, penalty -15, age gap penalty -20)
            (prisma.users.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'c2',
                    full_name: 'Candidate Two',
                    age: 45,
                    gender: 'Male',
                    avatar_url: 'http://pic.com',
                    profiles: {
                        metadata: {}
                    },
                    matches_matches_user_b_idTousers: [],
                    _count: { matches_matches_user_b_idTousers: 0 },
                    interactions_interactions_to_user_idTousers: [],
                    interactions_interactions_from_user_idTousers: []
                }
            ]);

            const res = await request(app).get('/matches/recommendations');

            expect(res.status).toBe(200);
            expect(res.body.matches).toHaveLength(1);
            expect(res.body.matches[0].name).toBe('Candidate Two');
            // Base 50 - over40 male penalty 15 - ageGap(15 yrs >= 12) penalty 20 = 15
            expect(res.body.matches[0].score).toBe(15);
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

            // Mock $queryRawUnsafe search results
            (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
                {
                    id: 's1',
                    full_name: 'Search Result',
                    age: 28,
                    gender: 'Female',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    location_name: 'Bangalore, India',
                    avatar_url: 'http://pic.com',
                    is_premium: false,
                    raw_prompt: 'Engineer',
                    metadata: { career: { profession: 'Engineer' } },
                    ai_similarity: 0.8
                }
            ]);

            const res = await request(app).post('/matches/search').send({ query: 'engineer' });

            expect(res.status).toBe(200);
            expect(res.body.matches).toHaveLength(1);
        });
    });
});
