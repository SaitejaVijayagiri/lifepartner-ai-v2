
import { pool } from '../db';

async function forceConnectAndReply() {
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

        console.log(`Connecting Me(${myId}) <-> Priya(${priya.id})...`);

        // 1. Force Connect (Upsert Interaction)
        await client.query(`
            INSERT INTO interactions (from_user_id, to_user_id, type, status)
            VALUES ($1, $2, 'REQUEST', 'connected')
            ON CONFLICT (from_user_id, to_user_id, type)
            DO UPDATE SET status = 'connected'
        `, [myId, priya.id]);

        console.log(`✅ Connection Established!`);

        // 2. Seed User Message (Simulation)
        await client.query(`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES ($1, $2, 'Hi Priya, I really liked your profile!')
        `, [myId, priya.id]);
        console.log("✅ User message seeded.");

        // 3. Seed Priya Reply
        await client.query(`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES ($1, $2, 'Hey! Thanks for reaching out. How are you? 😊')
        `, [priya.id, myId]);
        console.log("✅ Priya reply seeded.");

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

forceConnectAndReply();
