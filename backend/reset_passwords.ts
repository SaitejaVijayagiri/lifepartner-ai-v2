import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Test@123', salt);

    const emailsToReset = [
        'sandesh.udupi@gmail.com',
        'sangaiahchowdary@gmail.com',
        'khanshahrukh02468@gmail.com',
        'sachinkeshari25@gmail.com',
        'bhamasararao555@gmail.com',
        'naveenknaveen952@gmail.com',
        'nikhilkumarjogi12@gmail.com',
        'vvirupaksha784@gmail.com',
        'patekarritesh710@gmail.com',
        'rcd265663@gmail.com'
    ];

    const result = await prisma.users.updateMany({
        where: { email: { in: emailsToReset } },
        data: { password_hash: passwordHash }
    });

    console.log(`✅ Reset password to 'Test@123' for ${result.count} test accounts.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
