
import { pool } from '../db';

const debugSchema = async () => {
    try {
        console.log("🔍 Inspecting Reports Table Schema...");
        const client = await pool.connect();

        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'reports' AND table_schema = 'public';
        `);

        console.log("📄 Columns found:", result.rows);
        client.release();
        process.exit(0);
    } catch (e) {
        console.error("❌ Schema Inspection Failed:", e);
        process.exit(1);
    }
};

debugSchema();
