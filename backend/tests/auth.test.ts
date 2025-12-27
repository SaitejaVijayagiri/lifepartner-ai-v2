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
            expect(res.body).toHaveProperty('error', 'User already exists');
        });
    });
});
