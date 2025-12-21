
import { pool } from '../db';

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM messages LIMIT 1");
        if (res.rows.length === 0) {
            console.log("Table 'messages' is empty. Cannot deduce keys.");
        } else {
            console.log("Keys in 'messages' table:", Object.keys(res.rows[0]));
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkSchema();
