const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log('Fixing Aditya...');
    const userId = '9c49a0d0-ae23-4ccc-944d-42a17a18e515'; // ADITYA ANASANE
    
    try {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        if (!user || !user.profiles) {
            console.log('Not found');
            return;
        }

        const exactBio = "I am a Graphics Designer at Nubeno.";
        const exactExpectation = "Mujhe ek samajhdar, caring aur family-oriented life partner ki talash hai jo har situation me saath de aur respect kare";

        const meta = user.profiles.metadata || {};
        meta.bio = exactBio;
        meta.aboutMe = exactBio;
        meta.expectations = exactExpectation;

        await prisma.profiles.update({
            where: { user_id: userId },
            data: {
                raw_prompt: exactBio,
                metadata: meta
            }
        });

        console.log('Fixed! Bio:', exactBio);
        console.log('Expectations:', exactExpectation);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

fix();
