
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const checkReports = async () => {
    // Explicitly disabling SSL verification to ensure connection works from this script environment 
    // if the system certificates aren't set up for the cloud DB.
    // In production, the app uses the config from db.ts which handles this.
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    try {
        console.log("🔍 Checking Reports Table...");
        const res = await pool.query('SELECT COUNT(*) FROM reports');
        console.log(`📊 Total Reports Found in DB: ${res.rows[0].count}`);

        if (parseInt(res.rows[0].count) > 0) {
            const sample = await pool.query('SELECT * FROM reports ORDER BY created_at DESC LIMIT 1');
            console.log("📝 Latest Report Sample:", sample.rows[0]);
        } else {
            console.log("⚠️ Table is EMPTY. Submission is failing silently or going to a different DB.");
        }
    } catch (e) {
        console.error("❌ DB Connection Error:", e);
    } finally {
        await pool.end();
    }
};

checkReports();
