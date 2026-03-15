/**
 * One-off script to delete a user by email.
 * Usage: npx ts-node --require tsconfig-paths/register scripts/delete_user.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const EMAIL_TO_DELETE = 'lifepartnerai.in@gmail.com';

async function deleteUser() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        // 1. Look up user
        const findResult = await client.query(
            'SELECT id, full_name, email FROM users WHERE email = $1',
            [EMAIL_TO_DELETE]
        );

        if (findResult.rowCount === 0) {
            console.log(`❌ User not found: ${EMAIL_TO_DELETE}`);
            client.release();
            await pool.end();
            return;
        }

        const user = findResult.rows[0];
        console.log(`\n🔍 Found user:`);
        console.log(`   ID:    ${user.id}`);
        console.log(`   Name:  ${user.full_name}`);
        console.log(`   Email: ${user.email}`);

        // 2. Delete (cascade via FK constraints will clean up profiles, matches, etc.)
        await client.query('DELETE FROM users WHERE id = $1', [user.id]);

        console.log(`\n✅ User ${EMAIL_TO_DELETE} deleted successfully.`);
        client.release();
    } catch (e) {
        console.error('❌ Error deleting user:', e);
    } finally {
        await pool.end();
    }
}

deleteUser();
