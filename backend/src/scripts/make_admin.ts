import { pool } from '../db';

async function makeAdmin(email: string) {
    try {
        console.log(`Promoting ${email} to Admin...`);
        const res = await pool.query(
            "UPDATE users SET is_admin = TRUE WHERE email = $1 RETURNING id, full_name, email, is_admin",
            [email]
        );

        if (res.rows.length === 0) {
            console.log(`❌ User not found: ${email}`);
        } else {
            console.log("✅ Success:", res.rows[0]);
        }
    } catch (e) {
        console.error("Error promoting user:", e);
    } finally {
        pool.end();
    }
}

makeAdmin('saitejavijayagiri@gmail.com');
