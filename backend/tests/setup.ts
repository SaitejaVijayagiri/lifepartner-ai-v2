const { PrismaClient } = require('../src/generated/prisma/client');

jest.mock('../src/generated/prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                $connect: jest.fn(),
            };
        }),
    };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
                remove: jest.fn().mockResolvedValue({ data: {}, error: null })
            }))
        }
    }))
}));

jest.mock('../src/socket', () => {
    return {
        initSocket: jest.fn(),
    };
});

// DB Mock Removed
