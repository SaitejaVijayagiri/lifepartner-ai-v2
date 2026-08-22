import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    const emails = ['chinnureddy1414@gmail.com', 'priyareddy14141@gmail.com'];
    
    for (const email of emails) {
        const user = await prisma.users.findUnique({
            where: { email },
            include: {
                profiles: true
            }
        });
        
        console.log(`\n--- User: ${email} ---`);
        if (user) {
            console.log(`ID: ${user.id}`);
            console.log(`Name: ${user.full_name}`);
            console.log(`Created At: ${user.created_at}`);
            console.log(`Is Verified: ${user.is_verified}`);
            console.log(`Phone: ${user.phone}`);
            console.log(`Profile Exists: ${!!user.profiles}`);
            if (user.profiles) {
                console.log(`Profile Updated At: ${user.profiles.updated_at}`);
            }
        } else {
            console.log('User not found in database.');
        }
    }
    
    await prisma.$disconnect();
}

checkUsers();
