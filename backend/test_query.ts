import { prisma } from './src/prisma';

async function main() {
    // Look at users WITH gender set - to understand the data pattern
    const maleUsers = await prisma.users.count({ where: { gender: 'Male', is_verified: true } });
    const femaleUsers = await prisma.users.count({ where: { gender: 'Female', is_verified: true } });
    const maleLower = await prisma.users.count({ where: { gender: 'male', is_verified: true } });
    const femaleLower = await prisma.users.count({ where: { gender: 'female', is_verified: true } });
    const maleUpper = await prisma.users.count({ where: { gender: 'MALE', is_verified: true } });
    const femaleUpper = await prisma.users.count({ where: { gender: 'FEMALE', is_verified: true } });

    console.log('Gender capitalization breakdown:');
    console.log('Male:', maleUsers, '| male:', maleLower, '| MALE:', maleUpper);
    console.log('Female:', femaleUsers, '| female:', femaleLower, '| FEMALE:', femaleUpper);

    // Now check users where gender is set to something unexpected
    const allGenders = await prisma.$queryRaw<any[]>`
        SELECT gender, COUNT(*) as count FROM users GROUP BY gender ORDER BY count DESC
    `;
    console.log('\nAll gender values in DB:');
    console.table(allGenders);

    // Check if any users have gender stored differently (e.g. "M" or "F")
    const unusual = await prisma.users.findMany({
        where: {
            gender: { not: null },
            NOT: [
                { gender: 'Male' },
                { gender: 'Female' },
                { gender: 'male' },
                { gender: 'female' },
                { gender: 'MALE' },
                { gender: 'FEMALE' },
            ]
        },
        select: { id: true, gender: true, full_name: true },
        take: 10
    });
    console.log('\nUnusual gender values:', unusual);

    // Check how many total users are visible in recommendations for a female user
    // Simulate: how many males would a female user see across all pages?
    const totalMalesForFemale = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM users WHERE is_verified = true AND LOWER(gender) = 'male'
    `;
    const totalFemalesForMale = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM users WHERE is_verified = true AND LOWER(gender) = 'female'
    `;
    console.log('\nTotal males visible in recommendations (for female user):', totalMalesForFemale[0].count);
    console.log('Total females visible in recommendations (for male user):', totalFemalesForMale[0].count);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
