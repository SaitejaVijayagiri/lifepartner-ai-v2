/**
 * One-off fix script:
 *  1. Clear Nikhil's garbage height value ("Someshwara Temple Rd")
 *  2. Sync Manikanth's users.age column to match his DOB (1992-05-27 → age 33)
 */
import * as dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function calcAge(dobStr: string): number {
    const b = new Date(dobStr);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
}

async function main() {
    // ── 1. Clear Nikhil's bad height ──────────────────────────────────────────
    const nikhilEmail = 'nikhilkumarjogi12@gmail.com';
    const { rows: nikhilRows } = await pool.query(
        `SELECT u.id FROM users u WHERE LOWER(u.email) = LOWER($1)`, [nikhilEmail]
    );

    if (nikhilRows.length === 0) {
        console.log(`❌ Nikhil not found`);
    } else {
        const nikhilId = nikhilRows[0].id;
        // Clear height from metadata JSONB
        await pool.query(
            `UPDATE profiles
             SET metadata = metadata - 'height'
             WHERE user_id = $1`,
            [nikhilId]
        );
        console.log(`✅ Nikhil's bad height cleared (was "Someshwara Temple Rd"). He can now pick correct height from the dropdown.`);
    }

    // ── 2. Sync Manikanth's users.age from DOB ────────────────────────────────
    const maniEmail = 'devops.manikanth@gmail.com';
    const { rows: maniRows } = await pool.query(
        `SELECT u.id, u.age as users_age, p.metadata->>'dob' as dob
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE LOWER(u.email) = LOWER($1)`, [maniEmail]
    );

    if (maniRows.length === 0) {
        console.log(`❌ Manikanth not found`);
    } else {
        const mani = maniRows[0];
        const correctAge = mani.dob ? calcAge(mani.dob) : mani.users_age;
        console.log(`\nManikanth DOB: ${mani.dob}`);
        console.log(`Current users.age: ${mani.users_age}`);
        console.log(`Correct age (birthday-aware): ${correctAge}`);

        if (Number(mani.users_age) !== correctAge) {
            await pool.query(`UPDATE users SET age = $1 WHERE id = $2`, [correctAge, mani.id]);
            console.log(`✅ Manikanth's users.age updated from ${mani.users_age} → ${correctAge}`);
        } else {
            console.log(`ℹ️  users.age is already correct (${correctAge}) — no update needed.`);
        }
    }

    await pool.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
