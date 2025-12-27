
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const debugData = async () => {
    try {
        const client = await pool.connect();

        console.log("\n=== Checking Reels Data ===");
        const reels = await client.query(`
            SELECT r.id, r.video_url, r.user_id, u.full_name, u.avatar_url
            FROM public.reels r
            LEFT JOIN public.users u ON r.user_id = u.id
            LIMIT 5
        `);
        console.log("Sample Reels:", JSON.stringify(reels.rows, null, 2));

        if (reels.rows.length === 0) console.log("⚠️ No reels found!");
        reels.rows.forEach(r => {
            if (!r.video_url) console.error(`❌ Reel ${r.id} missing video_url`);
            if (!r.full_name) console.error(`❌ Reel ${r.id} has no associated user (orphan or null join)`);
        });

        console.log("\n=== Checking View Interactions ===");
        const views = await client.query(`
            SELECT * FROM public.interactions WHERE type = 'VIEW' LIMIT 5
        `);
        console.log("Sample Views:", JSON.stringify(views.rows, null, 2));

        if (views.rows.length === 0) console.log("⚠️ No VIEW interactions found. The feature is unused or broken.");

        // Check for ANY users to simulate a view
        const users = await client.query(`SELECT id, full_name, email FROM public.users LIMIT 2`);
        console.log("\n=== Available Users ===");
        console.log(users.rows);

        client.release();
    } catch (e) {
        console.error("Debug failed", e);
    } finally {
        process.exit();
    }
};

debugData();
