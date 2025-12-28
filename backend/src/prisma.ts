
import { PrismaClient } from '@prisma/client';

// Shared instance to avoid connection limit issues and allow easier mocking
const getDatabaseUrl = () => {
    const url = process.env.DATABASE_URL;
    if (url && url.includes('6543') && !url.includes('pgbouncer=true')) {
        console.log("⚠️ Detected Supabase Transaction Pooler without pgbouncer param. Auto-fixing...");
        return url + (url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true');
    }
    return url;
};

// @ts-ignore
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
});
