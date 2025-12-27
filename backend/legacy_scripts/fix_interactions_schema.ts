
import { pool } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const fixSchema = async () => {
    try {
        const client = await pool.connect();
        console.log("Adding UNIQUE constraint to interactions table...");

        // We use a DO block or just try/catch the ALTER TABLE
        // Better to try dropping it first if we want to be clean, or just ADD IF NOT EXISTS logic (Postgres doesn't support IF NOT EXISTS for constraints easily in one line without a DO block)
        // Simple approach: Try to add it, ignore if it exists.

        try {
            await client.query(`
                ALTER TABLE public.interactions 
                ADD CONSTRAINT unique_interaction_type 
                UNIQUE (from_user_id, to_user_id, type);
            `);
            console.log("Constraint added successfully.");
        } catch (e: any) {
            if (e.code === '23505') { // Unique violation if data exists? No, that's for insert. 
                // If duplicates exist, we need to clean them up first!
                console.log("Constraint addition failed, likely due to duplicates or existing constraint. Cleaning up duplicates...");

                // 1. Keep only the latest interaction for each (from, to, type) tuple
                await client.query(`
                    DELETE FROM public.interactions a USING public.interactions b
                    WHERE a.id < b.id 
                    AND a.from_user_id = b.from_user_id 
                    AND a.to_user_id = b.to_user_id 
                    AND a.type = b.type;
                `);
                console.log("Duplicates removed.");

                // 2. Try adding constraint again
                try {
                    await client.query(`
                        ALTER TABLE public.interactions 
                        ADD CONSTRAINT unique_interaction_type 
                        UNIQUE (from_user_id, to_user_id, type);
                    `);
                    console.log("Constraint added successfully after cleanup.");
                } catch (err2: any) {
                    if (err2.message.includes('already exists')) {
                        console.log("Constraint already exists. All good.");
                    } else {
                        console.error("Final failure adding constraint:", err2);
                    }
                }
            } else if (e.message.includes('already exists')) {
                console.log("Constraint already exists. All good.");
            } else {
                console.error("Unknown error:", e);
            }
        }

        client.release();
        process.exit(0);
    } catch (e) {
        console.error("Script failed", e);
        process.exit(1);
    }
};

fixSchema();
