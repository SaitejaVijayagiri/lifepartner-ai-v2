import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching a sample of user avatar_urls...");
    const users = await prisma.users.findMany({
        select: { email: true, full_name: true, avatar_url: true, created_at: true },
        take: 20,
        orderBy: { created_at: 'desc' }
    });

    users.forEach(u => {
        console.log(`${u.full_name} (${u.email}): ${u.avatar_url?.substring(0, 60)}...`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
