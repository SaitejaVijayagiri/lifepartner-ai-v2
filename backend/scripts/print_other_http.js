const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Listing all users in the OTHER_HTTP bucket...\n');

    const users = await prisma.users.findMany({
        where: {
            age: { not: null },
            gender: { not: null }
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    const otherHttp = users.filter(u => {
        const url = u.avatar_url || '';
        return url && 
            !url.includes('dicebear') && 
            !url.startsWith('data:') && 
            !url.includes('supabase.co/storage') && 
            !url.includes('/photo?url=');
    });

    console.log(`📊 Found ${otherHttp.length} users with other HTTP avatar URLs:`);
    for (const u of otherHttp) {
        console.log(`👤 ${u.full_name} (${u.email})`);
        console.log(`   🔗 URL: ${u.avatar_url}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
