
import { pool } from '../db';

const checkReports = async () => {
    try {
        console.log("🔍 Checking Reports Table...");
        const client = await pool.connect();

        const result = await client.query(`
            SELECT * FROM public.reports ORDER BY created_at DESC;
        `);

        console.log(`📄 Found ${result.rows.length} reports in DB:`);
        console.table(result.rows);

        client.release();
        process.exit(0);
    } catch (e) {
        console.error("❌ Check Failed:", e);
        process.exit(1);
    }
};

checkReports();
