import request from 'supertest';
import express from 'express';
// We must mock prisma BEFORE importing routes
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        transactions: {
            create: jest.fn(),
        },
        profiles: {
            create: jest.fn(),
        },
        $transaction: jest.fn((cb) => cb(require('../src/prisma').prisma)),
    }
}));

import authRoutes from '../src/routes/auth';
import { prisma } from '../src/prisma'; // This will be the mock

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes (Integration)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            // Mock findFirst (users) -> null (user doesn't exist)
            (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);

            // Mock create (users) -> newUser
            (prisma.users.create as jest.Mock).mockResolvedValue({
                id: 'user-123',
                full_name: 'Test User',
                email: 'test@example.com'
            });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    full_name: 'Test User',
                    age: 25,
                    gender: 'Male',
                    location_name: 'New York'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.email).toBe('test@example.com');
            expect(prisma.users.create).toHaveBeenCalled();
        });

        it('should fail if user already exists', async () => {
            // Mock findFirst (users) -> user exists
            (prisma.users.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-123' });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('User already exists');
        });

        it('should fail if email domain is disposable', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'kodic62937@adsprite.com',
                    password: 'password123',
                    full_name: 'Test User'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Please use a valid, non-disposable email address.');
            expect(prisma.users.create).not.toHaveBeenCalled();
        });

        it('rejects password overwrite on existing unverified user with non-matching password', async () => {
            (prisma.users.findFirst as jest.Mock).mockResolvedValue({
                id: 'unverified-123',
                is_verified: false,
                is_banned: false,
                password_hash: '$2b$10$someStoredBcryptHashThatWillNotMatch1234567890123456'
            });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'victim@example.com',
                    password: 'attackerPassword'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('User already exists');
            expect(prisma.users.update).not.toHaveBeenCalled();
        });

        it('uppercases referral codes and stores default matrimony intent on signup', async () => {
            (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.users.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'ref-user-1' });
            (prisma.users.create as jest.Mock).mockResolvedValue({
                id: 'user-456',
                full_name: 'Priya Sharma',
                gender: 'Female',
                age: 26,
                is_premium: true,
                coins: 100
            });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'priya@example.com',
                    password: 'password123',
                    full_name: 'Priya Sharma',
                    age: 26,
                    gender: 'Female',
                    referralCode: ' adit1234 '
                });

            expect(res.status).toBe(200);
            expect(prisma.users.findUnique).toHaveBeenCalledWith({
                where: { referral_code: 'ADIT1234' }
            });
            expect(prisma.profiles.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    metadata: expect.objectContaining({
                        intent: 'matrimony',
                        gender: 'Female',
                        age: 26
                    })
                })
            }));
        });
    });

    describe('POST /auth/google', () => {
        const origSecret = process.env.GOOGLE_CLIENT_SECRET;
        const origClientId = process.env.GOOGLE_CLIENT_ID;
        const origFetch = global.fetch;

        afterEach(() => {
            if (origSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
            else process.env.GOOGLE_CLIENT_SECRET = origSecret;
            if (origClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
            else process.env.GOOGLE_CLIENT_ID = origClientId;
            global.fetch = origFetch;
        });

        it('returns 503 with clear message when GOOGLE_CLIENT_SECRET is missing', async () => {
            delete process.env.GOOGLE_CLIENT_SECRET;

            const res = await request(app)
                .post('/auth/google')
                .send({ code: 'auth-code-123' });

            expect(res.status).toBe(503);
            expect(res.body.error).toContain('Google Sign-In is temporarily unavailable');
        });

        it('returns 503 when Google OAuth responds with invalid_client', async () => {
            process.env.GOOGLE_CLIENT_ID = 'bad-client-id';
            process.env.GOOGLE_CLIENT_SECRET = 'bad-secret';
            global.fetch = jest.fn().mockResolvedValue({
                json: async () => ({
                    error: 'invalid_client',
                    error_description: 'The OAuth client was not found.'
                })
            }) as any;

            const res = await request(app)
                .post('/auth/google')
                .send({ code: 'auth-code-123', redirect_uri: 'https://www.lifepartnerai.in/auth/callback/google' });

            expect(res.status).toBe(503);
            expect(res.body.error).toContain('Google Sign-In is temporarily misconfigured');
        });

        it('creates a new verified Google OAuth user and trims client credentials', async () => {
            process.env.GOOGLE_CLIENT_ID = ' 326304538770-test.apps.googleusercontent.com\n';
            process.env.GOOGLE_CLIENT_SECRET = ' secret-value \n';

            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                    json: async () => ({ access_token: 'google-access-token' })
                })
                .mockResolvedValueOnce({
                    json: async () => ({
                        id: 'google-uid-999',
                        email: 'NewGoogleUser@Gmail.com',
                        name: 'Ananya Rao',
                        picture: 'https://lh3.googleusercontent.com/avatar.jpg'
                    })
                }) as any;

            (prisma.users.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.users.create as jest.Mock).mockResolvedValue({
                id: 'google-user-1',
                full_name: 'Ananya Rao',
                gender: 'Female',
                age: 25,
                avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg',
                is_premium: true,
                coins: 100
            });
            (prisma.profiles as any).findUnique = jest.fn().mockResolvedValue({
                metadata: { gender: 'Female', age: 25, onboarding_completed: false },
                photos: []
            });

            const res = await request(app)
                .post('/auth/google')
                .send({
                    code: 'valid-code',
                    gender: 'Female',
                    age: 25,
                    redirect_uri: 'https://www.lifepartnerai.in/auth/callback/google'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.isNewUser).toBe(true);
            expect(res.body.requiresOnboarding).toBe(true);
            expect(res.body.token).toBeTruthy();
        });
    });
});
