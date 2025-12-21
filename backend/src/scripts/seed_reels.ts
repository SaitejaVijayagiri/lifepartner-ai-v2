
import { pool } from '../db';

const REEL_VIDEOS = [
    "https://videos.pexels.com/video-files/5634005/5634005-hd_1080_1920_25fps.mp4", // Woman smiling
    "https://videos.pexels.com/video-files/3205779/3205779-hd_1080_1920_25fps.mp4", // Man thinking
    "https://videos.pexels.com/video-files/6981419/6981419-hd_1080_1920_25fps.mp4", // Couple laughing
    "https://videos.pexels.com/video-files/4936676/4936676-hd_1080_1920_30fps.mp4", // Travel vibe
    "https://videos.pexels.com/video-files/4057319/4057319-hd_1080_1920_25fps.mp4", // Coffee shop
    "https://videos.pexels.com/video-files/5634006/5634006-hd_1080_1920_25fps.mp4", // Happy girl
    "https://videos.pexels.com/video-files/3191393/3191393-hd_1080_1920_25fps.mp4", // Guy gym
    "https://videos.pexels.com/video-files/7565445/7565445-hd_1080_1920_30fps.mp4", // Dancing
    "https://videos.pexels.com/video-files/6893699/6893699-hd_1080_1920_25fps.mp4", // Fashion
    "https://videos.pexels.com/video-files/4761426/4761426-hd_1080_1920_30fps.mp4"  // Nature walk
];

async function seedReels() {
    console.log("🚀 SEEDING 10 REELS...");
    const client = await pool.connect();

    try {
        // Get first 10 users
        const users = await client.query("SELECT id FROM users LIMIT 10");
        if (users.rows.length === 0) {
            console.log("❌ No users found. Run mass_seed.ts first.");
            return;
        }

        let added = 0;
        for (let i = 0; i < 10; i++) {
            const video = REEL_VIDEOS[i];
            const userId = users.rows[i % users.rows.length].id; // Cycle through users if fewer than 10

            await client.query(`
                INSERT INTO public.reels (user_id, video_url, caption, likes, views, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                userId,
                video,
                `Vibe check #${i + 1} ✨ #lifepartner #dating`,
                Math.floor(Math.random() * 500),
                Math.floor(Math.random() * 5000)
            ]);
            added++;
        }

        console.log(`✅ Successfully added ${added} Reels.`);

    } catch (e) {
        console.error("Seed Reels Failed", e);
    } finally {
        client.release();
        process.exit();
    }
}

seedReels();
