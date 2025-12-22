
import { pool } from '../db';

async function main() {
    console.log("--- MIGRATING TRANSACTIONS TABLE ---");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Add 'currency'
        const currencyCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='transactions' AND column_name='currency'
        `);
        if (currencyCheck.rows.length === 0) {
            console.log("Adding 'currency' column...");
            await client.query(`ALTER TABLE transactions ADD COLUMN currency VARCHAR(10) DEFAULT 'INR'`);
        } else {
            console.log("'currency' column exists.");
        }

        // 2. Add 'status'
        const statusCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='transactions' AND column_name='status'
        `);
        if (statusCheck.rows.length === 0) {
            console.log("Adding 'status' column...");
            await client.query(`ALTER TABLE transactions ADD COLUMN status VARCHAR(50) DEFAULT 'SUCCESS'`);
        } else {
            console.log("'status' column exists.");
        }

        // 3. Add 'metadata' (if missing)
        const metaCheck = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='transactions' AND column_name='metadata'
        `);
        if (metaCheck.rows.length === 0) {
            console.log("Adding 'metadata' column...");
            await client.query(`ALTER TABLE transactions ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb`);
        } else {
            console.log("'metadata' column exists.");
        }

        await client.query('COMMIT');
        console.log("✅ Migration Complete.");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

main();
