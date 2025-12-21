
import { pool } from '../db';

async function checkDB() {
    try {
        const client = await pool.connect();

        const countRes = await client.query("SELECT COUNT(*) FROM users");
        console.log(`Total Users: ${countRes.rows[0].count}`);

        const profileRes = await client.query("SELECT COUNT(*) FROM profiles");
        console.log(`Total Profiles: ${profileRes.rows[0].count}`);

        const genderRes = await client.query("SELECT gender, COUNT(*) FROM users GROUP BY gender");
        console.log("Gender Distribution:", genderRes.rows);

        const locationRes = await client.query("SELECT location_name, COUNT(*) FROM users GROUP BY location_name");
        console.log("Locations:", locationRes.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkDB();
