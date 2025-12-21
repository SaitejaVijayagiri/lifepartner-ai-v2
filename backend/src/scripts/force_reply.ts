
import { pool } from '../db';

async function forceReply() {
    const client = await pool.connect();
    try {
        const meRes = await client.query("SELECT id FROM users WHERE email = 'saitejavijayagiri@gmail.com'");
        const myId = meRes.rows[0]?.id;
        const priyaRes = await client.query("SELECT id, full_name FROM users WHERE full_name ILIKE '%Priya Sharma%'");
        const priya = priyaRes.rows[0];

        if (!myId || !priya) {
            console.log("Could not find users.");
            return;
        }

        // 1. Ensure Interaction Exists (Upsert)
        await client.query(`
            INSERT INTO interactions (from_user_id, to_user_id, type, status)
            VALUES ($1, $2, 'REQUEST', 'connected')
            ON CONFLICT (from_user_id, to_user_id, type)
            DO UPDATE SET status = 'connected'
        `, [myId, priya.id]);

        // 2. Inject Reply
        // Note: Using 'content' column as per schema check
        await client.query(`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES ($1, $2, 'Hey! I got your message. My mobile styling is looking great now! 😉')
        `, [priya.id, myId]);

        console.log(`✅ Reply injected from ${priya.full_name} to you.`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

forceReply();
