
import { pool } from '../db';

async function main() {
    try {
        console.log("--- GENDER DISTRIBUTION ---");
        const res = await pool.query('SELECT gender, count(*) FROM users GROUP BY gender');
        console.table(res.rows);

        console.log("\n--- TARGET USER DETAILS ---");
        const userRes = await pool.query("SELECT id, email, gender, location_name FROM users WHERE email = 'saitejavijayagiri@gmail.com'");
        if (userRes.rows.length === 0) {
            console.log("User 'saitejavijayagiri@gmail.com' NOT FOUND.");
        } else {
            console.table(userRes.rows);
            // Check Preferences if they exist in a different table?
            // Usually preferences are in `profiles` or inferred.
            const profileRes = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userRes.rows[0].id]);
            if (profileRes.rows.length > 0) {
                console.log("Profile Metadata (Partial):", JSON.stringify(profileRes.rows[0].metadata).substring(0, 200));
            } else {
                console.log("No Profile Found for User.");
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
