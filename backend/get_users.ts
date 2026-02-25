import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({
        orderBy: {
            created_at: 'desc'
        },
        take: 10,
        select: {
            id: true,
            full_name: true,
            email: true,
            gender: true,
            created_at: true,
            is_verified: true,
            age: true
        }
    });

    fs.writeFileSync('users_output.json', JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
