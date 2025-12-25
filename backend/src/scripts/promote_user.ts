
import { pool } from '../db';

async function makeAdmin(email: string) {
    try {
        console.log(`Promoting ${email} to Admin...`);
        const res = await pool.query(
            'UPDATE users SET is_admin = TRUE WHERE email = $1 RETURNING id, full_name, is_admin',
            [email]
        );

        if (res.rows.length > 0) {
            console.log("✅ Success! User updated:", res.rows[0]);
        } else {
            console.log("❌ Error: User not found with email:", email);
        }
    } catch (e) {
        console.error("Database Error:", e);
    } finally {
        process.exit();
    }
}

makeAdmin('saitejavijayagiri@gmail.com');
