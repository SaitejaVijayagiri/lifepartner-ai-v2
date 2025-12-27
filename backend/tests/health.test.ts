// Mock Prisma to prevent connection attempts during smoke test
jest.mock('../src/prisma', () => ({
    prisma: {
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    }
}));

import request from 'supertest';
// import { app, httpServer } from '../src/server'; // Moved to dynamic import



describe('Health Check', () => {
    let app: any;
    let httpServer: any;

    beforeAll(() => {
        const mod = require('../src/server');
        app = mod.app;
        httpServer = mod.httpServer;
    });

    afterAll((done) => {
        if (httpServer) {
            httpServer.close(done);
        } else {
            done();
        }
    });

    it('should return 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Life Partner AI Backend');
    });
});

