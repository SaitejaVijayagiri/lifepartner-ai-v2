const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCloudinaryAvatars() {
    const users = await prisma.users.findMany({
        where: { avatar_url: { contains: 'cloudinary' } },
        select: { id: true, email: true, avatar_url: true }
    });
    console.log(`Found ${users.length} users with Cloudinary avatars.`);
    if (users.length > 0) console.log(users.slice(0, 3));
}

checkCloudinaryAvatars().finally(() => prisma.$disconnect());
