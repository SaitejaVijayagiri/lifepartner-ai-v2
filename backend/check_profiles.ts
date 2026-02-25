import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({
        orderBy: {
            created_at: 'desc'
        },
        take: 10,
        select: {
            id: true,
            full_name: true,
            email: true,
            gender: true,
            age: true,
            avatar_url: true,
            location_name: true,
            profiles: {
                select: {
                    photos: true,
                    traits: true,
                    values: true,
                    dealbreakers: true
                }
            }
        }
    });

    console.log("=== USER PROFILE COMPLETION STATUS ===\n");
    users.forEach((u, i) => {
        let status = "⚠️ INCOMPLETE";
        let missingInfo = [];

        if (!u.gender) missingInfo.push("Gender");
        if (!u.age) missingInfo.push("Age");
        if (!u.avatar_url && (!u.profiles || !u.profiles.photos || (u.profiles.photos as any).length === 0)) missingInfo.push("Photos");
        if (!u.location_name) missingInfo.push("Location");
        if (!u.profiles) missingInfo.push("Profile Table Row Missing");

        if (missingInfo.length === 0) {
            status = "✅ COMPLETE & VISIBLE";
        }

        console.log(`${i + 1}. ${u.full_name || 'No Name'} (${u.email})`);
        console.log(`   Status: ${status}`);
        if (missingInfo.length > 0) {
            console.log(`   Missing: ${missingInfo.join(', ')}`);
        }
        console.log("-----------------------------------------");
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
