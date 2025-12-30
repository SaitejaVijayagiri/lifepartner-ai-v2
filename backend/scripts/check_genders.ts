
import { prisma } from '../src/prisma';

async function main() {
    try {
        // 1. Count Females
        const femaleCount = await prisma.users.count({
            where: {
                gender: {
                    equals: 'Female',
                    mode: 'insensitive'
                }
            }
        });
        console.log(`Total Female Users: ${femaleCount}`);

        // 2. Check Specific Verified Users
        const males = await prisma.users.findMany({
            where: {
                email: { in: ['crternikar@gmail.com', 'asaqoliwamaqoli@gmail.com', 'saitejavijayagiri@gmail.com'] }
            },
            select: { full_name: true, gender: true, is_verified: true, email: true }
        });

        console.table(males);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
