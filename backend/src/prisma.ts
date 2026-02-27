
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

    // Auto-fix: On Render, OpenSSL cannot verify Supabase's cert chain.
    // Use no-verify to bypass cert verification (connection is still encrypted).
    // Remove any existing sslmode first, then set no-verify.
    url = url.replace(/[&?]sslmode=[^&]*/g, '');
    url = url + (url.includes('?') ? '&sslmode=no-verify' : '?sslmode=no-verify');
    console.log("🔐 SSL mode set to no-verify for Render+Supabase compatibility.");

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
