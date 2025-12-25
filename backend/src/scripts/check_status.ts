
import { pool } from '../db';

async function checkAdmin(email: string) {
    try {
        const res = await pool.query('SELECT email, is_admin FROM users WHERE email = $1', [email]);
        console.log("User Status:", res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

// Check for the user who was logged in (based on previous logs/context if available, otherwise just hardcode or arg)
// I'll grab the last user
checkAdmin(process.argv[2] || '');
