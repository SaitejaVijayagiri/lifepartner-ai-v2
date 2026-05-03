import * as dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
    const { rows } = await pool.query(`
        SELECT u.id, u.full_name, u.age as users_age, u.email,
               p.metadata->>'dob'              as dob,
               p.metadata->>'age'              as meta_age,
               p.metadata->>'height'           as height,
               p.metadata->'basics'->>'height' as basics_height
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE LOWER(u.email) IN ('devops.manikanth@gmail.com', 'nikhilkumarjogi12@gmail.com')
    `);
    rows.forEach(x => {
        console.log('\n--- User ---');
        console.log(JSON.stringify(x, null, 2));
    });
    await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
