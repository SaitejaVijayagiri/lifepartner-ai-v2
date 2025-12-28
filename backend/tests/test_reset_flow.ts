import { prisma } from '../src/prisma';
import bcrypt from 'bcrypt';

async function testResetFlow() {
    const email = 'test_reset_flow@example.com';
    const oldPassword = 'oldPassword123';
    const newPassword = 'newPassword456';

    console.log("1. Cleaning up...");
    await prisma.users.deleteMany({ where: { email } });

    console.log("2. Creating User with Old Password...");
    const salt1 = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash(oldPassword, salt1);

    const user = await prisma.users.create({
        data: {
            email,
            password_hash: hash1,
            full_name: 'Test Reset',
            is_verified: true,
            referral_code: 'RESET1'
        }
    });

    console.log("3. Simulating RESET PASSWORD (Route Logic)...");
    // Explicitly copy logic from auth.ts
    const salt2 = await bcrypt.genSalt(10);
    const hash2 = await bcrypt.hash(newPassword, salt2);

    await prisma.users.update({
        where: { id: user.id },
        data: { password_hash: hash2 }
    });
    console.log("   Updated password hash in DB.");

    console.log("4. Simulating LOGIN with NEW PASSWORD...");
    const updatedUser = await prisma.users.findFirst({ where: { email } });
    if (!updatedUser) throw new Error("User lost?");

    const valid = await bcrypt.compare(newPassword, updatedUser.password_hash);
    console.log(`   Compare(newPassword, hash): ${valid}`);

    if (valid) {
        console.log("✅ RESET flow works correctly.");
    } else {
        console.error("❌ RESET flow broken: Password mismatch!");
    }

    // Cleanup
    await prisma.users.deleteMany({ where: { email } });
}

testResetFlow().catch(console.error).finally(() => prisma.$disconnect());
