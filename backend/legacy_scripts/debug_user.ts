
import { pool } from '../db';

async function main() {
    try {
        console.log("--- DEBUG USER ---");
        const res = await pool.query("SELECT id, email, gender, location_name, age FROM users WHERE email = 'saitejavijayagiri@gmail.com'");
        if (res.rows.length === 0) {
            console.log("User Not Found");
        } else {
            console.log("USER FOUND:", res.rows[0]);
        }

        console.log("\n--- COUNT FEMALES ---");
        const f = await pool.query("SELECT count(*) FROM users WHERE gender = 'Female'");
        console.log("Female Count:", f.rows[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
