
import { pool } from '../db';
import bcrypt from 'bcrypt';

const EMAIL = 'saitejavijayagiri@gmail.com';
const NEW_PASSWORD = 'Saitejauday@0102';

async function fixLogin() {
    try {
        const client = await pool.connect();
        console.log(`Checking user: ${EMAIL}`);

        const res = await client.query('SELECT * FROM users WHERE email = $1', [EMAIL]);

        if (res.rows.length === 0) {
            console.log('❌ User NOT found. Creating user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

            await client.query(`
                INSERT INTO users (email, password_hash, full_name, gender, age, is_premium)
                VALUES ($1, $2, 'Saiteja Vijayagiri', 'Male', 25, true)
            `, [EMAIL, hashedPassword]);
            console.log('✅ User Created with provided password.');
        } else {
            console.log('✅ User found. Updating password...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

            await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, EMAIL]);
            console.log('✅ Password Updated successfully.');
        }

        client.release();
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

fixLogin();
