import { sendWittyNotifications } from '../src/services/wittyNotifications';

// Mock Prisma
jest.mock('../src/prisma', () => ({
    prisma: {
        users: {
            findMany: jest.fn(),
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
    });

    it('should query all non-banned users and filter offline users inactive between 1 and 7 days', async () => {
        const now = new Date();
        // Set last_seen_at to 2 days ago (which is within the 1-7 days range)
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
        
        // Mock users in database:
        // User 1: inactive for 2 days (SHOULD get notified)
        // User 2: active 5 minutes ago (SHOULD NOT get notified)
        // User 3: inactive for 9 days (SHOULD NOT get notified)
        (prisma.users.findMany as jest.Mock).mockResolvedValue([
            {
                id: 'user-1',
                full_name: 'John Doe',
                created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                profiles: {
                    metadata: {
                        last_seen_at: twoDaysAgo
                    }
                }
            },
            {
                id: 'user-2',
                full_name: 'Jane Smith',
                created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                profiles: {
                    metadata: {
                        last_seen_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
                    }
                }
            },
            {
                id: 'user-3',
                full_name: 'Bob Johnson',
                created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
                profiles: {
                    metadata: {
                        last_seen_at: eightDaysAgo
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
            { type: 'witty_reengagement', screen: 'matches' }
        );

        // Verify the title contains the user's first name
        const callArgs = mockSendToUser.mock.calls[0];
        expect(callArgs[0]).toBe('user-1');
        expect(callArgs[1]).toContain('John');
    });
});
