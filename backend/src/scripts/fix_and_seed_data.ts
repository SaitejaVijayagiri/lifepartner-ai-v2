
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const fixData = async () => {
    try {
        const client = await pool.connect();

        console.log("Cleaning up Reel URLs...");
        // Remove trailing quotes or whitespace
        await client.query(`
            UPDATE public.reels 
            SET video_url = TRIM(BOTH '"' FROM video_url)
            WHERE video_url LIKE '%"';
        `);
        await client.query(`
            UPDATE public.reels 
            SET video_url = TRIM(video_url);
        `);
        console.log("Reel URLs cleaned.");

        console.log("Seeding Views...");
        // Get all users
        const users = await client.query('SELECT id FROM public.users');
        const userIds = users.rows.map(u => u.id);

        if (userIds.length > 2) {
            // Make everyone view the first 3 users (likely test users)
            const targets = userIds.slice(0, 5);
            const viewers = userIds.slice(5).concat(userIds.slice(0, 2)); // Mix it up

            for (const target of targets) {
                for (const viewer of viewers) {
                    if (target === viewer) continue;

                    await client.query(`
                        INSERT INTO public.interactions (from_user_id, to_user_id, type, status)
                        VALUES ($1, $2, 'VIEW', 'seen')
                        ON CONFLICT (from_user_id, to_user_id, type) 
                        DO UPDATE SET created_at = NOW()
                    `, [viewer, target]);
                }
            }
            console.log(`Seeded views for top 5 users from ${viewers.length} viewers.`);
        }

        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Fix failed", e);
        process.exit(1);
    }
};

fixData();
