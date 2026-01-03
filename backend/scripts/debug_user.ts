
import { prisma } from '../src/prisma';
require('dotenv').config();

async function findUser() {
    const name = "Devika";
    console.log(`🔍 Searching for user with name containing: ${name}...\n`);

    const users = await prisma.users.findMany({
        where: {
            full_name: {
                contains: name,
                mode: 'insensitive'
            }
        },
        orderBy: { created_at: 'desc' },
        take: 5
    });

    if (users.length === 0) {
        console.log("❌ No user found with that name.");
        // Fallback: Show last 5 users just in case name is different
        const lastUsers = await prisma.users.findMany({
            take: 5,
            orderBy: { created_at: 'desc' }
        });
        console.log("--- Latest 5 Users (for reference) ---");
        console.table(lastUsers.map(u => ({ Name: u.full_name, Email: u.email, Verified: u.is_verified })));
        return;
    }

    console.log("--- Users Found ---");
    users.forEach(u => {
        console.log(`ID: ${u.id}`);
        console.log(`Name: ${u.full_name}`);
        console.log(`Email: ${u.email}`);
        console.log(`Verified: ${u.is_verified}`);
        console.log(`OTP Code: ${u.otp_code}`); // Showing OTP for debugging
        console.log(`Created At: ${u.created_at}`);
        console.log('-------------------');
    });
}

findUser()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
