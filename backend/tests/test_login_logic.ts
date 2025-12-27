import { prisma } from '../src/prisma';
import bcrypt from 'bcrypt';

async function testLoginLogic() {
    const email = 'test_login_debug@example.com';
    const password = 'password123';

    console.log("1. Cleaning up...");
    await prisma.users.deleteMany({ where: { email } });

    console.log("2. Creating User...");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await prisma.users.create({
        data: {
            email,
            password_hash: hash,
            full_name: 'Test Logic',
            is_verified: true,
            referral_code: 'TEST1',
            otp_code: '123456',
            otp_expires_at: new Date()
        }
    });

    console.log("3. Testing Login Logic (Simulating Route)...");
    const user = await prisma.users.findFirst({ where: { email } });

    if (!user) throw new Error("User not found (Create failed)");

    console.log("   User Verified?", user.is_verified);

    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log("   Password Valid ('password123')?", validPassword);

    if (!validPassword) console.error("   ❌ Password valid check failed!");
    if (!user.is_verified) console.error("   ❌ Verification check failed!");

    if (validPassword && user.is_verified) {
        console.log("   ✅ Login Logic SHOULD PASS.");
    } else {
        console.log("   ❌ Login Logic WOULD FAIL.");
    }

    // Cleanup
    await prisma.users.deleteMany({ where: { email } });
}

testLoginLogic().catch(console.error).finally(() => prisma.$disconnect());
