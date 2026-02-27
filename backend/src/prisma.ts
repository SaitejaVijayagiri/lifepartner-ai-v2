
import { PrismaClient } from '@prisma/client';

// Shared instance to avoid connection limit issues and allow easier mocking
const getDatabaseUrl = () => {
    let url = process.env.DATABASE_URL;
    if (!url) return url;

    // Auto-fix: Supabase transaction pooler (port 6543) needs pgbouncer=true
    if (url.includes('6543') && !url.includes('pgbouncer=true')) {
        console.log("⚠️ Detected Supabase Transaction Pooler without pgbouncer param. Auto-fixing...");
        url = url + (url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true');
    }

    // Auto-fix: Supabase requires SSL - append sslmode=require if not set
    if (!url.includes('sslmode=')) {
        console.log("⚠️ SSL mode not set. Auto-appending sslmode=require for Supabase...");
        url = url + (url.includes('?') ? '&sslmode=require' : '?sslmode=require');
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
