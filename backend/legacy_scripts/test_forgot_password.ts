
import { pool } from '../db';
import bcrypt from 'bcrypt';

const TEST_EMAIL = 'forgot_pw_test@example.com';
const OLD_PW = 'oldpassword';
const NEW_PW = 'newsecurepassword';

async function main() {
    console.log("--- TESTING FORGOT PASSWORD FLOW ---");
    const client = await pool.connect();

    try {
        // 1. Setup User
        await client.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
        const salt = await bcrypt.genSalt(10);
        const oldHash = await bcrypt.hash(OLD_PW, salt);

        const res = await client.query(`
            INSERT INTO users (email, full_name, password_hash, is_verified)
            VALUES ($1, 'Reset Test', $2, TRUE)
            RETURNING id
        `, [TEST_EMAIL, oldHash]);
        const userId = res.rows[0].id;
        console.log(`Created User: ${userId}`);

        // 2. Simulate /forgot-password (Request OTP)
        console.log("Simulating /forgot-password request...");
        const otp = '999999';
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Logic from auth.ts
        await client.query(
            "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
            [otp, expires, userId]
        );
        console.log(`OTP Generated & Stored: ${otp}`);

        // 3. Simulate /reset-password (Verify & Change)
        console.log("Simulating /reset-password logic...");

        // Fetch User & OTP
        const userRes = await client.query("SELECT otp_code, otp_expires_at FROM users WHERE id = $1", [userId]);
        const user = userRes.rows[0];

        if (user.otp_code !== otp) throw new Error("OTP Mismatch in DB");
        if (new Date() > new Date(user.otp_expires_at)) throw new Error("OTP Expired");

        // Hash New PW
        const newHash = await bcrypt.hash(NEW_PW, await bcrypt.genSalt(10));

        // Update DB
        await client.query(
            "UPDATE users SET password_hash = $1, otp_code = NULL WHERE id = $2",
            [newHash, userId]
        );
        console.log("Password Updated in DB.");

        // 4. Verify New Password works
        const finalRes = await client.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
        const isMatch = await bcrypt.compare(NEW_PW, finalRes.rows[0].password_hash);

        if (isMatch) {
            console.log("✅ SUCCESS: New password works!");
        } else {
            console.error("❌ FAILURE: Password hash mismatch.");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        await client.query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
        client.release();
        process.exit();
    }
}

main();
