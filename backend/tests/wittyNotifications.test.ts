import { sendWittyNotifications } from '../src/services/wittyNotifications';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findMany: jest.fn(),
        },
        notifications: {
            findMany: jest.fn().mockResolvedValue([]),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            create: jest.fn().mockResolvedValue({ id: 'mock-notification-id' }),
        },
        interactions: {
            groupBy: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
        }
    }
}));

// Mock NotificationService via global registry to bypass Jest hoisting constraints
jest.mock('../src/services/notification', () => {
    const mockSend = jest.fn().mockResolvedValue(true);
    (global as any).__mockSendToUser = mockSend;
    return {
        NotificationService: {
            getInstance: () => ({
                sendToUser: mockSend
            })
        }
    };
});

import { prisma } from '../src/prisma';

const mockSendToUser = (global as any).__mockSendToUser;

describe('Witty Notifications Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Run deterministically at 9:05 AM IST (optimal campaign hour for India users)
        jest.useFakeTimers({ doNotFake: ['setTimeout', 'nextTick', 'setImmediate'] });
        jest.setSystemTime(new Date('2026-11-12T09:05:00+05:30'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should query all non-banned users and filter offline users inactive between 1 and 180 days', async () => {
        const now = new Date();
        // Set last_seen_at to 2 days ago (within 1-180 days window)
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const overMaxDaysAgo = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000).toISOString();
        
        // Mock users in database:
        // User 1: inactive for 2 days (SHOULD get notified)
        // User 2: active 5 minutes ago (SHOULD NOT get notified)
        // User 3: inactive for 200 days (> 180 days max cutoff, SHOULD NOT get notified)
        (prisma.users.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'user-1',
                full_name: 'John Doe',
                gender: 'Male',
                city: 'Mumbai',
                created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                profiles: {
                    metadata: {
                        location: { city: 'Mumbai', country: 'India' },
                        last_seen_at: twoDaysAgo
                    }
                }
            },
            {
                id: 'user-2',
                full_name: 'Jane Smith',
                gender: 'Female',
                city: 'Mumbai',
                created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                profiles: {
                    metadata: {
                        location: { city: 'Mumbai', country: 'India' },
                        last_seen_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
                    }
                }
            },
            {
                id: 'user-3',
                full_name: 'Bob Johnson',
                gender: 'Male',
                city: 'Mumbai',
                created_at: new Date(now.getTime() - 210 * 24 * 60 * 60 * 1000),
                profiles: {
                    metadata: {
                        location: { city: 'Mumbai', country: 'India' },
                        last_seen_at: overMaxDaysAgo
                    }
                }
            }
        ]);

        await sendWittyNotifications();

        // Expect User 1 to receive a notification, and not User 2 or User 3
        expect(mockSendToUser).toHaveBeenCalledTimes(1);
        expect(mockSendToUser).toHaveBeenCalledWith(
            'user-1',
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                type: 'witty_reengagement',
                screen: 'matches',
                bannerUrl: expect.any(String),
                notificationId: expect.any(String)
            })
        );

        // Verify the title contains the user's first name
        const callArgs = mockSendToUser.mock.calls[0];
        expect(callArgs[0]).toBe('user-1');
        expect(callArgs[1]).toContain('John');
    });
});
