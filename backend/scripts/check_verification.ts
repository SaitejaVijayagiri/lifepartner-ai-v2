
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.users.findMany({
            where: {
                OR: [
                    { full_name: { contains: 'saiteja', mode: 'insensitive' } },
                    { full_name: { contains: 'giridhar', mode: 'insensitive' } },
                    { email: { contains: 'saiteja', mode: 'insensitive' } },
                    { email: { contains: 'giridhar', mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                is_verified: true,
                is_premium: true
            }
        });

        console.log("Found Users:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
