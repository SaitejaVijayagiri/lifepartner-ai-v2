import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const inspect = async () => {
    try {
        console.log("Connecting to:", process.env.DATABASE_URL?.split('@')[1]); // Log Host
        const client = await pool.connect();

        const tableName = process.argv[2] || 'users';
        console.log(`--- ${tableName} Table Columns ---`);
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);
        console.log(JSON.stringify(res.rows, null, 2));

        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Inspect Failed", e);
        process.exit(1);
    }
}
inspect();
