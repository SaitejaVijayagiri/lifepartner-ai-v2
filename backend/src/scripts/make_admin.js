const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function makeAdmin() {
    const adminEmail = 'saitejavijayagiri@gmail.com';

    try {
        console.log('🔍 Connecting to database...');

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id, email, is_admin FROM users WHERE email = $1',
            [adminEmail]
        );

        if (userCheck.rows.length === 0) {
            console.log(`\n❌ User with email ${adminEmail} not found.`);
            console.log('Please register an account first at your web app, then run this script.');
            process.exit(1);
        }

        const user = userCheck.rows[0];
        console.log(`\n✅ Found user: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Current admin status: ${user.is_admin || false}`);

        if (user.is_admin) {
            console.log('\n✅ User is already an admin!');
            await pool.end();
            process.exit(0);
        }

        // Make user admin
        await pool.query(
            'UPDATE users SET is_admin = true WHERE email = $1',
            [adminEmail]
        );

        console.log(`\n🎉 SUCCESS! User ${adminEmail} is now an admin!`);
        console.log('You can now login to the admin panel at: https://admin-nine-ashen.vercel.app');
        console.log('Or wait for DNS to propagate: https://admin.lifepartnerai.in');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

makeAdmin();
