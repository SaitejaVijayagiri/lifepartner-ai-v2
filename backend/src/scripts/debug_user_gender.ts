
import { pool } from '../db';

async function checkUser() {
    const email = 'saitejavijayagiri@gmail.com';
    console.log(`Checking user: ${email}...`);
    const client = await pool.connect();

    try {
        // 1. Check Specific User
        const userRes = await client.query("SELECT id, email, gender, location_name FROM users WHERE email = $1", [email]);
        if (userRes.rows.length === 0) {
            console.log("❌ User not found!");
        } else {
            console.log("✅ User Found:", userRes.rows[0]);
        }

        // 2. Check Available Matches (Opposite Gender)
        if (userRes.rows.length > 0) {
            const myGender = userRes.rows[0].gender;
            console.log(`My Gender: '${myGender}'`);

            // Standardize logic usually flips 'Male' -> 'Female'
            const targetGender = myGender === 'Male' ? 'Female' : 'Male';

            const matchCount = await client.query("SELECT COUNT(*) FROM users WHERE gender = $1", [targetGender]);
            console.log(`Available '${targetGender}' profiles: ${matchCount.rows[0].count}`);

            // detailed check on casing
            const distinctGenders = await client.query("SELECT DISTINCT gender, COUNT(*) FROM users GROUP BY gender");
            console.log("All Genders in DB:", distinctGenders.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

checkUser();
