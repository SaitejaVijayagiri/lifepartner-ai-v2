import { pool } from '../db';
import bcrypt from 'bcrypt';

/**
 * Admin Account Verification Script
 * 
 * This script checks if an admin account exists and displays its details.
 * Usage: ts-node src/scripts/verify_admin.ts <email>
 */

async function verifyAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Usage: ts-node src/scripts/verify_admin.ts <email>');
        process.exit(1);
    }

    try {
        console.log(`\n🔍 Checking admin account for: ${email}\n`);

        const result = await pool.query(
            `SELECT 
                id, 
                full_name, 
                email, 
                phone,
                is_admin, 
                is_verified, 
                is_premium,
                created_at,
                password_hash
            FROM public.users 
            WHERE email = $1 OR phone = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            console.error('❌ User not found with email/phone:', email);
            console.log('\n💡 To create an admin account, run:');
            console.log('   ts-node src/scripts/make_admin.ts <email>\n');
            process.exit(1);
        }

        const user = result.rows[0];

        console.log('✅ User Found!');
        console.log('─'.repeat(60));
        console.log(`👤 Name:          ${user.full_name}`);
        console.log(`📧 Email:         ${user.email}`);
        console.log(`📱 Phone:         ${user.phone || 'N/A'}`);
        console.log(`🛡️  Admin:         ${user.is_admin ? '✅ YES' : '❌ NO'}`);
        console.log(`✉️  Verified:      ${user.is_verified ? '✅ YES' : '❌ NO'}`);
        console.log(`💎 Premium:       ${user.is_premium ? '✅ YES' : '❌ NO'}`);
        console.log(`📅 Created:       ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`🔑 Password Hash: ${user.password_hash.substring(0, 20)}...`);
        console.log('─'.repeat(60));

        if (!user.is_admin) {
            console.log('\n⚠️  This user is NOT an admin!');
            console.log('💡 To grant admin privileges, run:');
            console.log(`   ts-node src/scripts/make_admin.ts ${email}\n`);
        } else {
            console.log('\n✅ This user has admin privileges.');
            console.log('💡 You can now log in to the admin panel with this email.\n');
        }

        // Test password (optional - commented out for security)
        // const testPassword = process.argv[3];
        // if (testPassword) {
        //     const isValid = await bcrypt.compare(testPassword, user.password_hash);
        //     console.log(`🔐 Password Test: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
        // }

    } catch (error) {
        console.error('❌ Error verifying admin:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

verifyAdmin();
