import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const REELS = [
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-0.jpg',
        caption: "Late night city vibes! 🌃✨ #neon #citylife",
        userName: "Priya Sharma",
        userAvatar: "https://i.pravatar.cc/150?u=priya",
        gender: "Female",
        likes: 124,
        comments: 12
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-in-sunny-day-1211-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-in-sunny-day-1211-0.jpg',
        caption: "Beautiful sunny day! 🌻🌞 #nature #positivevibes",
        userName: "Anjali Gupta",
        userAvatar: "https://i.pravatar.cc/150?u=anjali",
        gender: "Female",
        likes: 245,
        comments: 34
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-1240-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-1240-0.jpg',
        caption: "Just vibing to the beat 🕺🎶 #dance #party",
        userName: "Rahul Verma",
        userAvatar: "https://i.pravatar.cc/150?u=rahul",
        gender: "Male",
        likes: 89,
        comments: 5
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-her-laptop-project-355-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-her-laptop-project-355-0.jpg',
        caption: "Working hard or hardly working? 💻☕ #workmode #coffee",
        userName: "Sneha Reddy",
        userAvatar: "https://i.pravatar.cc/150?u=sneha",
        gender: "Female",
        likes: 456,
        comments: 56
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-happy-couple-playing-with-a-dog-4074-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-happy-couple-playing-with-a-dog-4074-0.jpg',
        caption: "Best friends forever! 🐶❤️ #doglover #cute",
        userName: "Vikram Singh",
        userAvatar: "https://i.pravatar.cc/150?u=vikram",
        gender: "Male",
        likes: 312,
        comments: 20
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-red-flowers-moving-in-the-wind-1159-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-red-flowers-moving-in-the-wind-1159-0.jpg',
        caption: "Nature's beauty 🌺🍃 #flowers #peace",
        userName: "Meera Patel",
        userAvatar: "https://i.pravatar.cc/150?u=meera",
        gender: "Female",
        likes: 567,
        comments: 78
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-1166-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-1166-0.jpg',
        caption: "Ocean therapy 🌊💙 #beach #relax",
        userName: "Arjun Kumar",
        userAvatar: "https://i.pravatar.cc/150?u=arjun",
        gender: "Male",
        likes: 231,
        comments: 23
    },
    {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-pink-and-blue-ink-1192-large.mp4',
        thumbnail: 'https://assets.mixkit.co/videos/preview/mixkit-pink-and-blue-ink-1192-0.jpg',
        caption: "Abstract art 🎨✨ #art #creative",
        userName: "Kavita Rao",
        userAvatar: "https://i.pravatar.cc/150?u=kavita",
        gender: "Female",
        likes: 189,
        comments: 15
    }
];

// Duplicate Logic to get 24 reels
const expandedReels = [
    ...REELS,
    ...REELS.map(r => ({ ...r, userName: r.userName + " (2)", likes: r.likes + 50 })),
    ...REELS.map(r => ({ ...r, userName: r.userName + " (3)", likes: r.likes + 100 }))
];

async function seedRealReels() {
    try {
        console.log(`🌱 Seeding ${expandedReels.length} Real Reels...`);

        // 1. Clear existing reels to remove broken ones
        await pool.query('DELETE FROM reels');
        console.log('🗑️ Cleared existing reels.');

        // 2. Insert new users and reels
        for (const reel of expandedReels) {
            // Create or Get User
            const userRes = await pool.query(`
                INSERT INTO users (full_name, email, password_hash, gender, avatar_url)
                VALUES ($1, $2, 'dummy_hash', $3, $4)
                ON CONFLICT (email) DO UPDATE SET full_name = $1, avatar_url = $4
                RETURNING id
            `, [reel.userName, `${reel.userName.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`, reel.gender, reel.userAvatar]);

            const userId = userRes.rows[0].id;

            // Insert Reel
            await pool.query(`
                INSERT INTO reels (user_id, video_url, caption, likes, comments_count)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, reel.url, reel.caption, reel.likes, reel.comments]);

            console.log(`✅ Added reel for ${reel.userName}`);
        }

        console.log('✨ Successfully seeded real playable reels!');
    } catch (error) {
        console.error('Error seeding reels:', error);
    } finally {
        await pool.end();
    }
}

seedRealReels();
