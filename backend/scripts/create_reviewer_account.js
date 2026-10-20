const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const email = 'reviewer@lifepartnerai.in';
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const photoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

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
                avatar_url: photoUrl,
                is_verified: true,
                is_admin: false,
                is_banned: false,
                is_deactivated: false,
                is_premium: true,
                free_direct_messages: 999999,
                coins: 500
            }
        });
        console.log("Created Reviewer User:", user.email);
    } else {
        user = await prisma.users.update({
            where: { id: user.id },
            data: { 
                password_hash: hashedPassword,
                full_name: 'Indus Reviewer',
                gender: 'Female',
                age: 26,
                avatar_url: photoUrl,
                is_verified: true,
                is_banned: false,
                is_deactivated: false,
                is_premium: true,
                free_direct_messages: 999999,
                coins: 500
            }
        });
        console.log("Updated Reviewer User Record:", user.email);
    }

    // Upsert full profile so onboarding is already 100% completed
    await prisma.profiles.upsert({
        where: { user_id: user.id },
        update: {
            photos: [photoUrl],
            location_name: 'Mumbai, Maharashtra, India',
            metadata: {
                onboarding_completed: true,
                gender: 'Female',
                age: 26,
                profession: 'Product Specialist',
                bio: 'Google Play Store App Reviewer Account. Passionate about reading, technology and travel.',
                aboutMe: 'Google Play Store App Reviewer Account. Passionate about reading, technology and travel.',
                education: 'Master of Science',
                religion: 'Universal',
                diet: 'Vegetarian',
                height: "5'6\""
            }
        },
        create: {
            user_id: user.id,
            photos: [photoUrl],
            location_name: 'Mumbai, Maharashtra, India',
            metadata: {
                onboarding_completed: true,
                gender: 'Female',
                age: 26,
                profession: 'Product Specialist',
                bio: 'Google Play Store App Reviewer Account. Passionate about reading, technology and travel.',
                aboutMe: 'Google Play Store App Reviewer Account. Passionate about reading, technology and travel.',
                education: 'Master of Science',
                religion: 'Universal',
                diet: 'Vegetarian',
                height: "5'6\""
            }
        }
    });
    console.log("Upserted Reviewer Profile with onboarding_completed = true");

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password Verification Test:", isMatch ? "✅ 100% SUCCESS" : "❌ FAILED");
}

main().catch(console.error).finally(() => prisma.$disconnect());
