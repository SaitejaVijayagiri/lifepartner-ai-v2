import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({ select: { id: true, email: true, password_hash: true } });
    console.log(`Found ${users.length} users in DB`);

    for (const user of users) {
        const testPasswords = ['password123', 'Password123', 'password', '123456', 'Test@123', 'test', 'admin123'];
        let found = false;
        for (const p of testPasswords) {
            try {
                const matches = await bcrypt.compare(p, user.password_hash);
                if (matches) {
                    console.log(`User: ${user.email.padEnd(30)} | Password: ${p}`);
                    found = true;
                    break;
                }
            } catch (e) { }
        }
        if (!found) {
            // Drop [UNKNOWN OR GOOGLE OAUTH] to keep terminal output clean
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
