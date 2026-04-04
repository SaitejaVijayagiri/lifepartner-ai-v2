import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const names = ["Bhagwati Mistry", "Tushar Virani"];
    
    for (const name of names) {
        const users = await prisma.users.findMany({
            where: { full_name: { contains: name } },
            include: { profiles: true }
        });
        
        console.log(`\nResults for "${name}":`);
        for (const user of users) {
             console.log(`- User ID: ${user.id} | Email: ${user.email} (Banned: ${user.is_banned})`);
             console.log(`  Gender: ${user.gender}, Age: ${user.age}, Intent: ${user.intent}`);
             if (user.profiles) {
                 const p = user.profiles;
                 const meta = p.metadata as any;
                 console.log(`  Profile User_ID: ${p.user_id}`);
                 console.log(`  Visible (is_public flag in meta?): ${meta?.is_public}`);
                 console.log(`  Raw Prompt Exists: ${!!p.raw_prompt}`);
                 console.log(`  Photos length: ${(p.photos as any[])?.length || 0}`);
             } else {
                 console.log(`  NO PROFILE DATA in profiles table`);
             }
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
