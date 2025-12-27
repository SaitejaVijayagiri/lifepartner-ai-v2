
import { pool } from '../db';

const REEL_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
];

async function seedFemaleReels() {
    console.log("Seeding Female Reels...");
    const client = await pool.connect();

    try {
        // 1. Get Female Users
        const females = await client.query("SELECT id, full_name FROM users WHERE gender = 'Female' LIMIT 10");
        console.log(`Found ${females.rows.length} Female users.`);

        if (females.rows.length === 0) {
            console.error("No Female users found! Cannot seed reels.");
            return;
        }

        // 2. Insert Reels
        for (let i = 0; i < 10; i++) {
            const user = females.rows[i % females.rows.length];
            const videoUrl = REEL_VIDEOS[i % REEL_VIDEOS.length];

            await client.query(`
                INSERT INTO reels (user_id, video_url, caption, likes, views, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                user.id,
                videoUrl,
                `Vibe triggered by ${user.full_name} ✨ #${i}`,
                Math.floor(Math.random() * 1000),
                Math.floor(Math.random() * 10000)
            ]);
            console.log(`Added reel for ${user.full_name}`);
        }

        console.log("✅ Successfully seeded 10 Female Reels!");

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

seedFemaleReels();
