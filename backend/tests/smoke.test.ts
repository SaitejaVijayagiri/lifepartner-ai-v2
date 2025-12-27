
import request from 'supertest';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    }
}));

// Mock Auth
jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, res: any, next: any) => next(),
}));

import express from 'express';

describe('Smoke Test', () => {
    let app: any;
    let server: any;

    beforeAll(() => {
        // We import the app dynamically to ensure mocks apply
        const mod = require('../src/server');
        app = mod.app;
        server = mod.httpServer;
    });

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    it('GET / should return 200', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
    });
});
