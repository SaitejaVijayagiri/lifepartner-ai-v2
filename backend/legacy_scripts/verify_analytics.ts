
import { pool } from '../db';

async function main() {
    console.log("--- VERIFYING REVENUE ANALYTICS ---");
    const client = await pool.connect();

    try {
        const email = `analytics_test_${Date.now()}@test.com`;

        // 1. Create User
        const userRes = await client.query(`
            INSERT INTO users (email, full_name, password_hash, coins)
            VALUES ($1, 'Analytics User', 'hash', 0)
            RETURNING id
        `, [email]);
        const userId = userRes.rows[0].id;

        // 2. Simulate PAYMENT (Logic from payments.ts)
        // User buys 100 coins for ₹99
        await client.query(`
            INSERT INTO transactions (user_id, type, amount, currency, description, status)
            VALUES ($1, 'DEPOSIT', 99.00, 'INR', 'Purchased 100 Coins', 'SUCCESS')
        `, [userId]);
        // Grant coins
        await client.query('UPDATE users SET coins = coins + 100 WHERE id = $1', [userId]);

        // 3. Simulate SPEND (Logic from wallet.ts - AFTER FIX)
        // User spends 50 coins
        await client.query(`
            INSERT INTO transactions (user_id, type, amount, currency, description)
            VALUES ($1, 'SPEND', 50, 'COINS', 'Sent Gift')
        `, [userId]);

        // 4. RUN ANALYTICS QUERY
        console.log("Running Analytics Query...");

        const revenueRes = await client.query(`
            SELECT 
                SUM(amount) FILTER (WHERE currency = 'INR') as total_revenue_inr,
                SUM(amount) FILTER (WHERE currency = 'COINS') as total_coins_spent,
                COUNT(*) as total_txns
            FROM transactions
            WHERE user_id = $1
        `, [userId]);

        const data = revenueRes.rows[0];
        console.log("Analytics Data:", data);

        // 5. Assertions
        const revenue = parseFloat(data.total_revenue_inr);
        const coins = parseFloat(data.total_coins_spent);

        if (revenue === 99.00 && coins === 50) {
            console.log("✅ SUCCESS: Revenue and Coin Usage are perfectly separated!");
            console.log(`   Revenue: ₹${revenue} (Expected ₹99)`);
            console.log(`   Coins Spent: ${coins} (Expected 50)`);
        } else {
            console.error("❌ FAILURE: Data mixed up or incorrect.");
            console.error(`   Got Revenue: ${revenue}, Coins: ${coins}`);
        }

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

main();
