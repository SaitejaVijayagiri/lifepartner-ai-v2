
import { pool } from '../db';

async function checkAndReply() {
    const client = await pool.connect();
    try {
        // 1. Find Current User
        const meRes = await client.query("SELECT id FROM users WHERE email = 'saitejavijayagiri@gmail.com'");
        const myId = meRes.rows[0]?.id;

        // 2. Find Priya
        const priyaRes = await client.query("SELECT id, full_name FROM users WHERE full_name ILIKE '%Priya Sharma%'");
        const priya = priyaRes.rows[0];

        if (!myId || !priya) {
            console.log(" Could not find users.", { myId, priya });
            return;
        }

        console.log(` Me: ${myId}`);
        console.log(` Priya: ${priya.id} (${priya.full_name})`);

        // 3. Find Interaction
        const intRes = await client.query(`
            SELECT * FROM interactions 
            WHERE (from_user_id = $1 AND to_user_id = $2) 
               OR (from_user_id = $2 AND to_user_id = $1)
        `, [myId, priya.id]);

        const interaction = intRes.rows[0];
        if (!interaction) {
            console.log(" No connection found between you and Priya.");
            return;
        }
        console.log(` Interaction ID: ${interaction.id} (Status: ${interaction.status})`);

        // 4. Check Messages
        const msgRes = await client.query(`
            SELECT * FROM messages 
            WHERE connection_id = $1 
            ORDER BY created_at ASC
        `, [interaction.id]);

        console.log(`\n Messages found: ${msgRes.rows.length}`);
        msgRes.rows.forEach(m => {
            console.log(` [${m.sender_id === myId ? 'Me' : 'Priya'}]: ${m.text}`);
        });

        if (msgRes.rows.length > 0) {
            console.log("\n Message received by system! Sending reply...");

            // 5. Simulate Reply
            const replyText = "Hey! Yes, I got your message. How are you doing? 😊";
            await client.query(`
                INSERT INTO messages (connection_id, sender_id, text, type)
                VALUES ($1, $2, $3, 'text')
            `, [interaction.id, priya.id, replyText]);

            console.log(" Reply sent from Priya!");
        } else {
            console.log("\n No messages found from you yet.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkAndReply();
