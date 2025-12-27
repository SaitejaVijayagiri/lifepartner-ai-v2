import { pool } from '../db';

async function migrate() {
    try {
        console.log("Starting Admin Migration...");

        // Users Table
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;`);

        // Reports Table
        await pool.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`);

        console.log("✅ Schema Updated Successfully");

        // Optional: List users to help identify who to make admin
        const res = await pool.query('SELECT id, email, name FROM users LIMIT 5');
        console.log("Sample Users:", res.rows);

    } catch (e) {
        console.error("Migration Failed", e);
    } finally {
        pool.end();
    }
}

migrate();
