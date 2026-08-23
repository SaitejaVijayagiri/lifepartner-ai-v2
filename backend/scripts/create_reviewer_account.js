const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const email = 'reviewer@lifepartnerai.in';
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await prisma.users.findFirst({
        where: { email: email }
    });

    if (!user) {
        user = await prisma.users.create({
            data: {
                email: email,
                password_hash: hashedPassword,
                full_name: 'Indus Reviewer',
                gender: 'Female',
                age: 26,
                city: 'Mumbai',
                state: 'Maharashtra',
                location_name: 'Mumbai, India',
                is_verified: true,
                is_admin: false,
                is_banned: false,
                is_deactivated: false
            }
        });
        console.log("Created Reviewer User:", user.email);
    } else {
        user = await prisma.users.update({
            where: { id: user.id },
            data: { 
                password_hash: hashedPassword,
                gender: 'Female',
                age: 26,
                is_verified: true,
                is_banned: false,
                is_deactivated: false
            }
        });
        console.log("Updated Reviewer User Record:", user.email);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password Verification Test:", isMatch ? "✅ 100% SUCCESS" : "❌ FAILED");
}

main().catch(console.error).finally(() => prisma.$disconnect());
