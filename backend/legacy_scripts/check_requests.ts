
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL = 'saitejavijayagiri@gmail.com';

const checkRequests = async () => {
    try {
        const client = await pool.connect();

        // 1. Get User ID
        const userRes = await client.query("SELECT id, full_name FROM users WHERE email = $1", [EMAIL]);
        const user = userRes.rows[0];

        if (!user) {
            console.error("❌ User not found");
            return;
        }

        console.log(`Checking requests for ${user.full_name} (${user.id})...`);

        // 2. Check Pending Requests
        const reqRes = await client.query(`
            SELECT i.id, i.from_user_id, u.full_name as sender_name, i.status, i.created_at
            FROM interactions i
            JOIN users u ON i.from_user_id = u.id
            WHERE i.to_user_id = $1 AND i.type = 'REQUEST'
        `, [user.id]);

        console.log(`\nFound ${reqRes.rows.length} requests:`);
        console.log(JSON.stringify(reqRes.rows, null, 2));

        if (reqRes.rows.length === 0) {
            console.log("\n⚠️ No requests found! Reseeding...");
            // Reseed logic inline
            const senderRes = await client.query(`SELECT id FROM users WHERE id != $1 LIMIT 1`, [user.id]);
            if (senderRes.rows.length > 0) {
                const senderId = senderRes.rows[0].id;
                await client.query(`
                    INSERT INTO interactions (from_user_id, to_user_id, type, status)
                    VALUES ($1, $2, 'REQUEST', 'pending')
                    ON CONFLICT (from_user_id, to_user_id, type) DO NOTHING
                `, [senderId, user.id]);
                console.log("✅ Reseeded 1 request via UPSERT.");
            }
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

checkRequests();
