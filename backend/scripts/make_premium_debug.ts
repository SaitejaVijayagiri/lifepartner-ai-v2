
import { PrismaClient } from '@prisma/client';
require('dotenv').config();

const prisma = new PrismaClient();

async function upgradeUsers() {
    console.log("Upgrading Saiteja and Swetha to Premium...");

    const names = ['saiteja', 'swetha'];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 Year from now

    const updated = await prisma.users.updateMany({
        where: {
            OR: [
                { full_name: { contains: 'saiteja', mode: 'insensitive' } },
                { full_name: { contains: 'swetha', mode: 'insensitive' } }
            ]
        },
        data: {
            is_premium: true,
            premium_expiry: expiryDate,
            coins: 1000 // Bonus coins for testing
        }
    });

    console.log(`✅ Successfully upgraded ${updated.count} users to Premium.`);

    // Verify
    const users = await prisma.users.findMany({
        where: {
            OR: [
                { full_name: { contains: 'saiteja', mode: 'insensitive' } },
                { full_name: { contains: 'swetha', mode: 'insensitive' } }
            ]
        },
        select: { full_name: true, is_premium: true, coins: true }
    });
    console.log(users);
}

upgradeUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
