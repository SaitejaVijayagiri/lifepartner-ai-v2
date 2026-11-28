import os from 'os';
import { prisma } from '../prisma';

let cronLocksTableReady: Promise<void> | null = null;
const instanceTag = `${os.hostname()}-${process.pid}`;

function ensureCronLocksTable(): Promise<void> {
    if (cronLocksTableReady) return cronLocksTableReady;
    if (typeof (prisma as any)?.$executeRawUnsafe !== 'function') {
        return Promise.resolve();
    }
    cronLocksTableReady = (async () => {
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS cron_locks (
                    job_name TEXT PRIMARY KEY,
                    locked_until TIMESTAMPTZ NOT NULL,
                    locked_by TEXT
                );
            `);
        } catch (err) {
            cronLocksTableReady = null;
            throw err;
        }
    })();
    return cronLocksTableReady;
}

/**
 * Acquires a PostgreSQL lease lock (compatible with PgBouncer transaction mode)
 * so recurring cron jobs execute on only ONE Cloud Run replica per interval.
 */
export async function withCronLock<T>(
    jobName: string,
    leaseSeconds: number,
    task: () => Promise<T>
): Promise<T | null> {
    if (typeof (prisma as any)?.$queryRawUnsafe !== 'function') {
        return task();
    }

    try {
        await ensureCronLocksTable();
        const rows: any[] = await prisma.$queryRawUnsafe(
            `
            INSERT INTO cron_locks (job_name, locked_until, locked_by)
            VALUES ($1, NOW() + make_interval(secs => $2), $3)
            ON CONFLICT (job_name) DO UPDATE
                SET locked_until = EXCLUDED.locked_until,
                    locked_by = EXCLUDED.locked_by
                WHERE cron_locks.locked_until < NOW()
            RETURNING job_name;
            `,
            jobName,
            Math.max(5, Math.floor(leaseSeconds)),
            instanceTag
        );

        if (!rows || rows.length === 0) {
            return null;
        }
    } catch (lockErr: any) {
        console.warn(`[CronLock] Skipped ${jobName} due to lock error:`, lockErr?.message || lockErr);
        return null;
    }

    return task();
}
