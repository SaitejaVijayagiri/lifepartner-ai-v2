const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Listing all users with no profile photo...\n');

    const users = await prisma.users.findMany({
        where: {
            age: { not: null },
            gender: { not: null }
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    const noPhoto = users.filter(u => {
        const url = u.avatar_url || '';
        return !url || url.includes('dicebear') || url.trim() === '';
    });

    console.log(`📊 Found ${noPhoto.length} users with NO profile photo:`);
    for (const u of noPhoto) {
        console.log(`👤 Name: ${u.full_name} | Email: ${u.email} | ID: ${u.id}`);
        console.log(`   🔗 Avatar: ${u.avatar_url || 'null'}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
