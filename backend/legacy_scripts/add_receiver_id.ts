
import { pool } from '../db';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Adding receiver_id column to messages table...");
        await client.query(`
            ALTER TABLE messages 
            ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id);
        `);
        console.log("✅ Column receiver_id added successfully.");
    } catch (e: any) {
        console.error("Migration Failed:", e.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
