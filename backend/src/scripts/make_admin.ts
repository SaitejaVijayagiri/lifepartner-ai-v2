import { pool } from '../db';

async function makeAdmin() {
    const adminEmail = 'saitejavijayagiri@gmail.com';

    try {
        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id, email, is_admin FROM users WHERE email = $1',
            [adminEmail]
        );

        if (userCheck.rows.length === 0) {
            console.log(`❌ User with email ${adminEmail} not found.`);
            console.log('Please register an account first, then run this script.');
            process.exit(1);
        }

        const user = userCheck.rows[0];
        console.log(`\n✅ Found user: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Current admin status: ${user.is_admin || false}`);

        if (user.is_admin) {
            console.log('\n✅ User is already an admin!');
            process.exit(0);
        }

        // Make user admin
        await pool.query(
            'UPDATE users SET is_admin = true WHERE email = $1',
            [adminEmail]
        );

        console.log(`\n🎉 SUCCESS! User ${adminEmail} is now an admin!`);
        console.log('You can now login to the admin panel.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

makeAdmin();
