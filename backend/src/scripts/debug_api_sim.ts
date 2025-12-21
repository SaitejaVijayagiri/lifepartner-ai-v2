
import { pool } from '../db';

async function debugAPI() {
    const userId = 'c63f93cf-d77e-4e56-8e15-aa6438d1f599'; // The user
    console.log(`Simulating /recommendations for ${userId}`);

    const client = await pool.connect();
    try {
        // 1. Get Me
        const meRes = await client.query("SELECT * FROM public.users u LEFT JOIN public.profiles p ON u.id = p.user_id WHERE u.id = $1", [userId]);
        const me = meRes.rows[0];
        console.log("ME:", { id: me.id, gender: me.gender });

        const myGender = (me.gender || "").trim().toLowerCase();
        let genderFilter = "";
        if (myGender === 'male') genderFilter = "AND LOWER(u.gender) = 'female'";
        else if (myGender === 'female') genderFilter = "AND LOWER(u.gender) = 'male'";

        console.log(`Filter: "${genderFilter}"`);

        const candRes = await client.query(`
            SELECT u.*, p.* 
            FROM public.users u 
            LEFT JOIN public.profiles p ON u.id = p.user_id 
            WHERE u.id != $1 ${genderFilter}
            LIMIT 5
        `, [userId]);

        console.log(`Candidates Found: ${candRes.rows.length}`);
        if (candRes.rows.length > 0) {
            console.log("First Candidate:", candRes.rows[0].full_name, candRes.rows[0].gender);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit();
    }
}

debugAPI();
