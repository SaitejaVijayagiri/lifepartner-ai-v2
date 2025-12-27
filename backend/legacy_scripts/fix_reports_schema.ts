
import { pool } from '../db';

const fixSchema = async () => {
    try {
        console.log("Starting Reports Schema Fix...");
        const client = await pool.connect();

        await client.query(`
            ALTER TABLE public.reports 
            ADD COLUMN IF NOT EXISTS details TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
        `);

        console.log("✅ Reports schema updated: Added 'details' and 'status' columns.");
        client.release();
        process.exit(0);
    } catch (e) {
        console.error("❌ Schema Fix Failed:", e);
        process.exit(1);
    }
};

fixSchema();
