
import { pool } from '../db';

async function checkReels() {
    const client = await pool.connect();
    try {
        console.log("Checking Reels Distribution...");

        const res = await client.query(`
            SELECT 
                u.gender, 
                COUNT(*) as reel_count 
            FROM reels r
            JOIN users u ON r.user_id = u.id
            GROUP BY u.gender
        `);

        console.table(res.rows);

        const allReels = await client.query(`
            SELECT r.id, u.full_name, u.gender 
            FROM reels r 
            JOIN users u ON r.user_id = u.id 
            LIMIT 20
        `);
        console.log("\nSample Reels:");
        console.table(allReels.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkReels();
