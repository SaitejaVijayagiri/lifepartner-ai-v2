import request from 'supertest';
import express from 'express';

jest.mock('../src/prisma', () => ({
    prisma: {
        $executeRawUnsafe: jest.fn().mockResolvedValue(0),
        $queryRawUnsafe: jest.fn().mockResolvedValue([]),
        blocks: {
            findFirst: jest.fn().mockResolvedValue(null),
        },
        interactions: {
            findFirst: jest.fn().mockResolvedValue(null),
        },
        users: {
            findUnique: jest.fn().mockResolvedValue({
                full_name: 'Viewer User',
                avatar_url: null,
                profiles: { metadata: {} },
            }),
        },
        notifications: {
            create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        },
    },
}));

jest.mock('../src/middleware/auth', () => ({
    authenticateToken: (req: any, _res: any, next: any) => {
        req.user = { userId: '11111111-1111-4111-8111-111111111111' };
        next();
    },
}));

jest.mock('../src/services/r2Storage', () => ({
    isR2Configured: jest.fn().mockReturnValue(true),
    uploadBase64ToR2: jest.fn().mockResolvedValue('https://cdn.example.com/instants/u1/snap_1.jpg'),
    deleteFromR2: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/services/cloudinaryStorage', () => ({
    deleteFromCloudinary: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/socket', () => ({
    getIO: jest.fn().mockReturnValue(null),
}));

import instantsRoutes from '../src/routes/instants';
import { prisma } from '../src/prisma';
import { deleteFromR2 } from '../src/services/r2Storage';

const app = express();
app.use(express.json());
app.use('/instants', instantsRoutes);

describe('Instants View-Once Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects re-opening an already-viewed snap with 410 and empty mediaUrl', async () => {
        (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValueOnce([
            {
                id: '22222222-2222-4222-8222-222222222222',
                sender_id: '33333333-3333-4333-8333-333333333333',
                receiver_id: null,
                media_url: 'https://cdn.example.com/instants/sender/snap_1.jpg',
                caption: 'Hey!',
                viewed_by: [{ userId: '11111111-1111-4111-8111-111111111111' }],
                likes: [],
                is_viewed: true,
                expires_at: new Date(Date.now() + 3600_000),
                sender_name: 'Sender',
                sender_metadata: {},
            },
        ]);

        const res = await request(app).post('/instants/22222222-2222-4222-8222-222222222222/view');

        expect(res.status).toBe(410);
        expect(res.body.mediaUrl).toBeNull();
    });

    it('deletes the full R2 object key including filename on DELETE /instants/:id', async () => {
        (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValueOnce([
            {
                media_url: 'https://pub-abc.r2.dev/instants/11111111-1111-4111-8111-111111111111/snap_1700000.jpg',
            },
        ]);

        const res = await request(app).delete('/instants/22222222-2222-4222-8222-222222222222');

        expect(res.status).toBe(200);
        expect(deleteFromR2).toHaveBeenCalledWith(
            'instants/11111111-1111-4111-8111-111111111111/snap_1700000.jpg'
        );
    });
});
