
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const countTables = async () => {
    try {
        const client = await pool.connect();
        const tables = ['users', 'profiles', 'reels', 'interactions', 'matches', 'messages', 'notifications'];

        console.log("\n=== Table Row Counts ===");
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT COUNT(*) FROM public.${table}`);
                console.log(`${table}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${table}: [Error/Missing]`);
            }
        }
        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

countTables();
