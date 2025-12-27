
import { pool } from '../db';
import bcrypt from 'bcrypt';

async function main() {
    console.log("--- ENSURING CASHFREE TEST USER ---");
    const client = await pool.connect();

    const TARGET_EMAIL = "cashfree_reviewer@lifepartnerai.in";
    const PLAIN_PASSWORD = "LifePartnerTest123!"; // Strong password for reviewers

    try {
        await client.query('BEGIN');

        // 1. Check if exists
        const check = await client.query("SELECT id FROM users WHERE email = $1", [TARGET_EMAIL]);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(PLAIN_PASSWORD, salt);

        if (check.rows.length > 0) {
            console.log("User exists. Updating password...");
            await client.query("UPDATE users SET password_hash = $1, is_verified = TRUE WHERE email = $2", [hash, TARGET_EMAIL]);
        } else {
            console.log("Creating new test user...");
            const userRes = await client.query(`
                INSERT INTO users (full_name, email, password_hash, is_verified, gender, age, location_name)
                VALUES ('Cashfree Reviewer', $1, $2, TRUE, 'Male', 28, 'Bangalore, India')
                RETURNING id
            `, [TARGET_EMAIL, hash]);

            const newId = userRes.rows[0].id;

            // Init Profile
            await client.query(`
                INSERT INTO profiles (user_id, raw_prompt, metadata)
                VALUES ($1, 'Test account for payment gateway verification.', '{}')
            `, [newId]);
        }

        await client.query('COMMIT');
        console.log("✅ SUCCESS: Test User Ready");
        console.log(`📧 Email: ${TARGET_EMAIL}`);
        console.log(`🔑 Password: ${PLAIN_PASSWORD}`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

main();
