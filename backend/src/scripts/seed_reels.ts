
import { pool } from '../db';


// Video URLs from Coverr (Free Stock)
const SAMPLE_VIDEOS = [
    { url: "https://cdn.coverr.co/videos/coverr-woman-doing-yoga-outdoors-4412/1080p.mp4", caption: "Morning Yoga 🧘‍♀️ #peace #wellness" },
    { url: "https://cdn.coverr.co/videos/coverr-doctor-checking-ipad-5838/1080p.mp4", caption: "Busy day at the clinic 🩺 #doctor #medicine" },
    { url: "https://cdn.coverr.co/videos/coverr-hiker-walking-in-mountains-5431/1080p.mp4", caption: "Nature heals the soul ⛰️ #hiking #adventure" },
    { url: "https://cdn.coverr.co/videos/coverr-typing-code-on-laptop-5527/1080p.mp4", caption: "Coding late night 💻 #developer #startup" },
    { url: "https://cdn.coverr.co/videos/coverr-woman-reading-book-on-sofa-5309/1080p.mp4", caption: "Weekend reads 📚 #booklover #chill" },
    { url: "https://cdn.coverr.co/videos/coverr-people-drinking-coffee-5211/1080p.mp4", caption: "Coffee catchups ☕ #friends #coffee" },
    { url: "https://cdn.coverr.co/videos/coverr-person-playing-piano-5389/1080p.mp4", caption: "Music is life 🎹 #piano #music" }
];

async function seedReels() {
    console.log("🚀 SEEDING REELS TABLE...");
    const client = await pool.connect();

    try {
        // 1. Get 30 Random Users
        const res = await client.query("SELECT id FROM users ORDER BY RANDOM() LIMIT 30");
        const users = res.rows;

        if (users.length === 0) {
            console.log("No users found. Run mass_seed or mega_seed first.");
            process.exit(1);
        }

        console.log(`Found ${users.length} users to assign reels to.`);

        for (const user of users) {
            // Assign 1-2 reels per user
            const reelCount = Math.floor(Math.random() * 2) + 1;

            for (let i = 0; i < reelCount; i++) {
                const vid = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];

                // Insert into reels table
                await client.query(`
                    INSERT INTO reels (user_id, video_url, caption, likes, views, comments_count)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    user.id,
                    vid.url,
                    vid.caption,
                    Math.floor(Math.random() * 100), // Random Likes
                    Math.floor(Math.random() * 500), // Random Views
                    Math.floor(Math.random() * 20)   // Random Comments
                ]);
            }
        }

        console.log("✅ Reels Seeded Successfully!");

    } catch (e) {
        console.error("Seeding Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

seedReels();
