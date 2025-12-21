
import { pool } from '../db';

async function checkColumns() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages'
        `);
        console.log("Columns:", res.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkColumns();
