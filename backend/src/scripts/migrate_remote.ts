
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

            CREATE TABLE IF NOT EXISTS public.reels (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                user_id UUID REFERENCES public.users(id),
                video_url TEXT NOT NULL,
                caption TEXT,
                likes INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
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
