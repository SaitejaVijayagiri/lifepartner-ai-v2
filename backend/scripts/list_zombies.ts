
import { prisma } from '../src/prisma';
import fs from 'fs';

async function listZombies() {
    const zombies = await prisma.users.findMany({
        where: {
            is_verified: true,
            OR: [
                { gender: null },
                { age: null }
            ]
        },
        select: { email: true, full_name: true, gender: true, age: true }
    });

    if (zombies.length > 0) {
        console.log(`Found ${zombies.length} zombies.`);
        fs.writeFileSync('zombies.txt', JSON.stringify(zombies, null, 2));
    } else {
        console.log("No zombies found.");
        fs.writeFileSync('zombies.txt', "[]");
    }
}

listZombies()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
