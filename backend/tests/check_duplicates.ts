import { prisma } from '../src/prisma';

async function checkDuplicates() {
    const email = 'saitejavijayagiri@gmail.com';
    console.log(`Checking duplicates for: ${email}`);

    // Check by email
    const usersByEmail = await prisma.users.findMany({
        where: { email }
    });

    console.log(`Found ${usersByEmail.length} users by email.`);
    usersByEmail.forEach(u => console.log(` - ID: ${u.id}, Email: ${u.email}, Verified: ${u.is_verified}`));

    // Check by phone (just in case)
    const usersByPhone = await prisma.users.findMany({
        where: { phone: email } // Trying to see if email was saved in phone field
    });
    console.log(`Found ${usersByPhone.length} users by phone matching email.`);
}

checkDuplicates().catch(console.error).finally(() => prisma.$disconnect());
