
import { PrismaClient } from '@prisma/client';
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
    const saiteja = await prisma.users.findMany({
        where: { full_name: { contains: 'saiteja', mode: 'insensitive' } },
        select: { id: true, full_name: true, gender: true, is_verified: true, age: true, location_name: true, profiles: { select: { metadata: true, raw_prompt: true } } }
    });

    const swetha = await prisma.users.findMany({
        where: { full_name: { contains: 'swetha', mode: 'insensitive' } },
        select: { id: true, full_name: true, gender: true, is_verified: true, age: true, location_name: true }
    });

    console.log("--- Saiteja ---");
    console.log(JSON.stringify(saiteja, null, 2));

    const connection = await prisma.matches.findFirst({
        where: {
            user_a_id: saiteja[1]?.id || saiteja[0]?.id, // Using the verified one if possible
            user_b_id: swetha[0]?.id
        }
    });

    console.log("\n--- Connection Status (Saiteja -> Swetha) ---");
    console.log(JSON.stringify(connection, null, 2));

    const femaleCount = await prisma.users.count({
        where: { gender: { equals: 'Female', mode: 'insensitive' }, is_verified: true }
    });
    console.log("\nTotal Verified Females:", femaleCount);
}

checkUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
