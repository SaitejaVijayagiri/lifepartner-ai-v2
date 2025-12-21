
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL = 'saitejavijayagiri@gmail.com';

const seedRequest = async () => {
    try {
        const client = await pool.connect();

        // 1. Get Target User
        const targetRes = await client.query("SELECT * FROM public.users WHERE email = $1", [EMAIL]);
        const targetUser = targetRes.rows[0];

        if (!targetUser) {
            console.error("Target user not found");
            process.exit(1);
        }

        // 2. Get Random Sender
        const senderRes = await client.query(`
            SELECT * FROM public.users 
            WHERE id != $1 
            ORDER BY RANDOM() 
            LIMIT 1
        `, [targetUser.id]);

        const sender = senderRes.rows[0];
        if (!sender) {
            console.error("No other users found to send request");
            process.exit(1);
        }

        console.log(`Sending request from ${sender.full_name} to ${targetUser.full_name}...`);

        // 3. Insert Request
        // Ensure no existing interaction blocks it
        await client.query(`
            DELETE FROM public.interactions 
            WHERE (from_user_id = $1 AND to_user_id = $2) 
               OR (from_user_id = $2 AND to_user_id = $1)
        `, [sender.id, targetUser.id]);

        await client.query(`
            INSERT INTO public.interactions (from_user_id, to_user_id, type, status)
            VALUES ($1, $2, 'REQUEST', 'pending')
        `, [sender.id, targetUser.id]);

        console.log(`✅ Request sent! Go to your 'Requests' tab to accept it.`);

        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Seed failed", e);
        process.exit(1);
    }
};

seedRequest();
