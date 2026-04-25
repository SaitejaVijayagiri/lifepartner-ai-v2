import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking for user...");
    const emailsToMatch = [
        'lifeparterai.in@gmail,com', 
        'lifeparterai.in@gmail.com', 
        'lifepartnerai.in@gmail.com' 
    ];

    const users = await prisma.users.findMany({
        where: {
            email: { in: emailsToMatch }
        }
    });

    if (users.length === 0) {
        console.log("No users found matching those emails.");
        return;
    }

    for (const u of users) {
        console.log(`Deleting user: ${u.email} (ID: ${u.id})`);
        
        try {
            console.log("Clearing foreign key dependents...");
            await prisma.$executeRaw`DELETE FROM interactions WHERE from_user_id = ${u.id}::uuid OR to_user_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM messages WHERE sender_id = ${u.id}::uuid OR receiver_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM matches WHERE user_a_id = ${u.id}::uuid OR user_b_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM call_logs WHERE caller_id = ${u.id}::uuid OR receiver_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM games WHERE player_a_id = ${u.id}::uuid OR player_b_id = ${u.id}::uuid OR winner_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM game_moves WHERE player_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM blocks WHERE blocker_id = ${u.id}::uuid OR blocked_id = ${u.id}::uuid`;
            await prisma.$executeRaw`DELETE FROM reports WHERE reporter_id = ${u.id}::uuid OR reported_id = ${u.id}::uuid`;
            
            await prisma.users.delete({
                where: { id: u.id }
            });
            console.log(`✅ Successfully hard-deleted ${u.email}`);
        } catch (e) {
            console.error(`❌ Failed to delete ${u.email}:`, e);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
