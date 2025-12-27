import { prisma } from '../src/prisma';

async function checkUser() {
    const email = 'saitejavijayagiri@gmail.com';

    try {
        const user = await prisma.users.findUnique({
            where: { email },
            select: { id: true, email: true, is_verified: true, google_id: true, password_hash: true }
        });

        if (!user) {
            console.log("User not found!");
        } else {
            console.log("Email:", user.email);
            console.log("Verified:", user.is_verified);
            console.log("Google ID:", user.google_id);
            console.log("Password Hash:", user.password_hash);

            if (user.password_hash === 'google_auth_placeholder') {
                console.log("⚠️ User registered via Google and has no password. Password login will fail.");
            } else {
                console.log("✅ User has a password set.");
            }
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
