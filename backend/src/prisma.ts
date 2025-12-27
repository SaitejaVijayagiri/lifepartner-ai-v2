
import { PrismaClient } from './generated/prisma/client';

// Shared instance to avoid connection limit issues and allow easier mocking
// @ts-ignore
export const prisma = new PrismaClient();
