
import { pool } from '../db';

async function migrate() {
    console.log("🚀 MIGRATING REELS SCHEMA...");
    const client = await pool.connect();
    try {
        await client.query(`
            DO $$
            BEGIN
              IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'reels' AND column_name = 'url') THEN
                  ALTER TABLE public.reels RENAME COLUMN url TO video_url;
              END IF;
            END $$;
        `);
        console.log("✅ Reels Schema Standardized (url -> video_url)");
    } catch (e) {
        console.error("Migration Failed", e);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
