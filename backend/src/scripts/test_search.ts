
import { pool } from '../db';

async function main() {
    try {
        const query = "Software Engineer in Hyderabad"; // Test Query
        console.log(`--- TESTING SEARCH: "${query}" ---`);

        // 1. Mock AI Parse (Assume correct parsing for now)
        const filters = {
            profession: "Software Engineer",
            location: "Hyderabad",
            minAge: 22,
            maxAge: 35
        };
        console.log("Filters:", filters);

        // 2. Run Query (Mimic matches.ts logic)
        const strictSql = `
            SELECT u.full_name, u.location_name, u.gender, u.age, 
            p.metadata
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.gender = 'Female' 
            AND (
                p.metadata->'career'->>'profession' ILIKE '%Software Engineer%' 
                OR p.metadata->'career'->>'profession' ILIKE '%Developer%'
            )
            AND (
                u.location_name ILIKE '%Hyderabad%' 
                OR p.metadata->'location'->>'city' ILIKE '%Hyderabad%'
            )
            LIMIT 10
        `;

        console.log("Running Strict SQL...");
        const res = await pool.query(strictSql);
        console.log(`Strict Results: ${res.rows.length}`);
        if (res.rows.length > 0) {
            console.table(res.rows.map(r => ({
                name: r.full_name,
                loc: r.location_name,
                prof: r.metadata.career?.profession
            })));
        } else {
            console.log("No Strict Matches Found. Checking raw distribution...");
            const dist = await pool.query(`
                SELECT count(*) as count, location_name 
                FROM users 
                WHERE location_name ILIKE '%Hyderabad%' 
                GROUP BY location_name
            `);
            console.table(dist.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
main();
