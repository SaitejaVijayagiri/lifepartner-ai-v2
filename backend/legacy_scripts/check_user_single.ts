import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const userId = 'f035d0e3-9548-407e-afee-a6386c1f7be5';
    const restoredEmail = 'saitejavijayagiri123@gmail.com';

    await prisma.users.update({
        where: { id: userId },
        data: { email: restoredEmail }
    });

    console.log(`\n✅ Email restored successfully!`);
    console.log(`  User ID : ${userId}`);
    console.log(`  Name    : Swetha`);
    console.log(`  Email   : ${restoredEmail}`);
    console.log(`\nYou can now log in with this email.\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
