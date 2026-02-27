
import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
    const rawUrl = process.env.DATABASE_URL || '';

    // Try to extract Supabase project ref from the URL to build a session pooler URL
    // Transaction Pooler (port 6543 via aws-*.pooler.supabase.com) has OpenSSL issues on Render
    // Session Pooler (port 5432 via aws-*.pooler.supabase.com) does NOT have this issue
    // Direct (port 5432 via db.*.supabase.co) also works
    try {
        const parsed = new URL(rawUrl);

        // If using Transaction Pooler port 6543 → switch to Session Pooler port 5432
        // Session Pooler uses the same host but different port and no pgbouncer param
        if (parsed.port === '6543') {
            parsed.port = '5432';
            // Remove pgbouncer=true (session mode doesn't need it)
            parsed.searchParams.delete('pgbouncer');
            // Remove any conflicting sslmode
            parsed.searchParams.delete('sslmode');
            // Add sslmode=require (Session Pooler supports proper SSL)
            parsed.searchParams.set('sslmode', 'require');
            const sessionUrl = parsed.toString();
            console.log('🔄 Switched from Transaction Pooler → Session Pooler for Render compatibility');
            return sessionUrl;
        }
    } catch (e) {
        console.error('URL parse error:', e);
    }

    return rawUrl;
};

// @ts-ignore
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: getDatabaseUrl(),
        },
    },
});
