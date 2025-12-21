
import { pool } from '../db';

async function checkTables() {
    const client = await pool.connect();
    const tables = ['calls', 'notifications', 'call_logs'];
    try {
        for (const table of tables) {
            console.log(`\n--- Table: ${table} ---`);
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            if (res.rows.length === 0) {
                console.log("❌ Table does not exist.");
            } else {
                console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkTables();
