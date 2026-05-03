import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const user = await prisma.users.findUnique({
        where: { email: 'mubeenabanu6125@gmail.com' }
    });
    console.log('User found:', !!user);
    await prisma.$disconnect();
}

check();
