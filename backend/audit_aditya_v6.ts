import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
    console.log('=== FULL AUDIT: Aditya Anasane ===\n');

    // Find ALL users with "aditya" in name
    const users = await prisma.users.findMany({
        where: { full_name: { contains: 'aditya', mode: 'insensitive' } },
        include: { profiles: true }
    });

    for (const user of users) {
        const meta = (user.profiles?.metadata as any) || {};
        console.log('-------------------------------');
        console.log('Name:', user.full_name);
        console.log('ID:', user.id);
        console.log('Has Profile:', !!user.profiles);
        if (user.profiles) {
            console.log('\nraw_prompt (raw data he entered):', user.profiles.raw_prompt);
            console.log('\nmeta.bio:', meta.bio);
            console.log('\nmeta.aboutMe:', meta.aboutMe);
            console.log('\nmeta.expectations:', meta.expectations);
            console.log('\nmeta.location:', JSON.stringify(meta.location));
        }
        console.log('-------------------------------\n');
    }

    await prisma.$disconnect();
}

audit();
