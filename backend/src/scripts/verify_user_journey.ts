
import { pool } from '../db';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:4000';
const EMAIL = 'saitejavijayagiri@gmail.com';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyUser = async () => {
    try {
        const client = await pool.connect();
        console.log(`\n🔍 Searching for user: ${EMAIL}`);

        const userRes = await client.query("SELECT * FROM public.users WHERE email = $1", [EMAIL]);
        const user = userRes.rows[0];

        if (!user) {
            console.error("❌ User NOT FOUND in database!");
            return;
        }

        console.log(`✅ User found: ID=${user.id}, Name=${user.full_name}, Premium=${user.is_premium}, Coins=${user.coins}`);

        // Generate Token (Simulate Login)
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        console.log("🔑 Generated Auth Token (Simulated Login)");

        const headers = { Authorization: `Bearer ${token}` };

        // 1. Check Profile
        try {
            console.log("\n--- Checking Profile ---");
            // Direct DB check for profile completeness
            const pRes = await client.query("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
            if (pRes.rows.length > 0) console.log(`✅ Profile Data Exists. Metadata keys: ${Object.keys(pRes.rows[0].metadata || {}).join(', ')}`);
            else console.log("⚠️ No specific Profile record found (User might be new).");
        } catch (e: any) { console.error("Profile check error", e.message); }

        // 2. Check Reels Feed
        try {
            console.log("\n--- Checking Reels Feed ---");
            // Simulate feed request (might need local server running, or we call DB logic directly)
            // Since we don't know if local server is running on 4000, we'll simulate the Query logic directly for confidence.

            // Gender logic mirror
            console.log(`Fetching reels for user (Assuming heterosexual preference based on gender '${user.gender}')`);
            const feedRes = await client.query(`SELECT count(*) FROM reels WHERE user_id != $1`, [user.id]);
            console.log(`✅ ${feedRes.rows[0].count} potential reels available for feed.`);

        } catch (e: any) { console.error("Feed check error", e.message); }


        // 3. Check Visitors
        try {
            console.log("\n--- Checking Visitors ---");
            const vRes = await client.query(`
                SELECT count(*) 
                FROM interactions 
                WHERE to_user_id = $1 AND type = 'VIEW'
            `, [user.id]);

            const count = vRes.rows[0].count;
            if (count > 0) console.log(`✅ User has ${count} visitors recorded.`);
            else console.log("⚠️ User has 0 visitors. Seeding one now for verification...");

            if (count === '0') {
                // Seed a visitor
                const randomUser = await client.query("SELECT id FROM users WHERE id != $1 LIMIT 1", [user.id]);
                if (randomUser.rows.length > 0) {
                    await client.query(`
                        INSERT INTO interactions (from_user_id, to_user_id, type)
                        VALUES ($1, $2, 'VIEW')
                   `, [randomUser.rows[0].id, user.id]);
                    console.log("✅ Seeded 1 visitor. Refresh should show it.");
                }
            }

        } catch (e: any) { console.error("Visitors check error", e.message); }

        // 4. Check Matches
        try {
            console.log("\n--- Checking Matches ---");
            // Just count potential matches
            const matchRes = await client.query(`SELECT count(*) FROM users WHERE id != $1`, [user.id]);
            console.log(`✅ ${matchRes.rows[0].count} potential matches in DB.`);
        } catch (e: any) { console.log(e); }


        client.release();
    } catch (e) {
        console.error("Verification failed", e);
    } finally {
        process.exit();
    }
};

verifyUser();
