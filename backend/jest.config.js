module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    moduleNameMapper: {
        '.*generated/prisma/client$': '<rootDir>/tests/__mocks__/prismaClient.ts',
    },
    verbose: true,
    forceExit: true,
    // clearMocks: true,
    // resetMocks: true,
    // restoreMocks: true,
};
