
import { pool } from '../db';

async function debugSQL() {
    const client = await pool.connect();
    try {
        const userId = 'c63f93cf-d77e-4e56-8e15-aa6438d1f599'; // The user's ID
        const myGender = 'male';

        let genderFilter = "";
        if (myGender === 'male') genderFilter = "AND LOWER(u.gender) = 'female'";

        console.log(`Running SQL with genderFilter: "${genderFilter}"`);

        const sql = `
            SELECT u.id, u.full_name, u.gender 
            FROM public.users u 
            LEFT JOIN public.profiles p ON u.id = p.user_id 
            WHERE u.id != $1 ${genderFilter}
            LIMIT 10
        `;

        const res = await client.query(sql, [userId]);
        console.log(`Initial Query Rows: ${res.rows.length}`);
        if (res.rows.length > 0) console.log("Sample:", res.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

debugSQL();
