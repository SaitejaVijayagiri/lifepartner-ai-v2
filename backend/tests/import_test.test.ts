import { app } from '../src/server';

describe('Server Import', () => {
    it('should export app', () => {
        expect(app).toBeDefined();
    });
});
