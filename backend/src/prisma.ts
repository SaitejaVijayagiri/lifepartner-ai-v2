import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// Supabase requires SSL. The pg Pool needs explicit SSL config — 
// NODE_TLS_REJECT_UNAUTHORIZED=0 alone does NOT apply to the pg Pool adapter.
const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
});

export { pool }; // Export pool for health checks

const adapter = new PrismaPg(pool);

// @ts-ignore
export const prisma = new PrismaClient({ adapter });
