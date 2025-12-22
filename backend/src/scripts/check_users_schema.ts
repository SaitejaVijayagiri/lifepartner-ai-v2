
import { pool } from '../db';
async function main() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.table(res.rows);
    } catch (e) { console.error(e); }
    process.exit();
}
main();
