import { pool } from '../db';

const countGmailUsers = async () => {
    try {
        const res = await pool.query("SELECT COUNT(*) FROM users WHERE email ILIKE '%@gmail.com%'");
        console.log(`\n\nGmail User Count: ${res.rows[0].count}\n\n`);
    } catch (err) {
        console.error("Error counting users:", err);
    } finally {
        await pool.end();
    }
};

countGmailUsers();
