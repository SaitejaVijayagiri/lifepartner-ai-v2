
import { pool } from '../db';

async function migrate() {
    console.log("🚀 MIGRATING REMOTE DB...");
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE public.profiles 
            ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
            
            ALTER TABLE public.profiles 
            ADD COLUMN IF NOT EXISTS location_name TEXT;

            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS location_name TEXT;
             
            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS avatar_url TEXT;

            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS full_name TEXT;

            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS age INTEGER;
            
            ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS gender TEXT;
        `);
        console.log("✅ Schema Updated Successfully");
    } catch (e) {
        console.error("Migration Failed", e);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
