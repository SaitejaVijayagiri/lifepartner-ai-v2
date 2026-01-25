
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                full_name: true,
                email: true,
                gender: true,
                age: true,
                location_name: true,
                is_verified: true,
                is_premium: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' }
        });

        console.table(users.map(u => ({
            Name: u.full_name,
            Email: u.email,
            Gender: u.gender,
            Age: u.age,
            Location: u.location_name,
            Verified: u.is_verified,
            Premium: u.is_premium,
            Joined: u.created_at.toISOString().split('T')[0]
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
