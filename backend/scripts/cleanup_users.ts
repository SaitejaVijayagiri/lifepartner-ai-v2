
import { PrismaClient } from '@prisma/client';
require('dotenv').config();

const prisma = new PrismaClient();

async function cleanup() {
    console.log("Checking for non-gmail users...");

    const count = await prisma.users.count({
        where: {
            NOT: {
                email: { contains: '@gmail.com', mode: 'insensitive' }
            }
        }
    });

    const usersToDelete = await prisma.users.findMany({
        where: { NOT: { email: { contains: '@gmail.com', mode: 'insensitive' } } },
        select: { id: true }
    });

    const ids = usersToDelete.map(u => u.id);
    console.log(`Targeting ${ids.length} users for deletion...`);

    if (ids.length > 0) {
        // MANUAL CASCADE
        console.log("Deleting dependent records...");

        await prisma.messages.deleteMany({
            where: { OR: [{ sender_id: { in: ids } }, { receiver_id: { in: ids } }] }
        });
        console.log("- Messages deleted");

        await prisma.matches.deleteMany({
            where: { OR: [{ user_a_id: { in: ids } }, { user_b_id: { in: ids } }] }
        });
        console.log("- Matches deleted");

        await prisma.interactions.deleteMany({
            where: { OR: [{ from_user_id: { in: ids } }, { to_user_id: { in: ids } }] }
        });
        console.log("- Interactions deleted");

        await prisma.blocks.deleteMany({
            where: { OR: [{ blocker_id: { in: ids } }, { blocked_id: { in: ids } }] }
        });
        console.log("- Blocks deleted");

        await prisma.call_logs.deleteMany({
            where: { OR: [{ caller_id: { in: ids } }, { receiver_id: { in: ids } }] }
        });
        console.log("- Call Logs deleted");

        await prisma.games.deleteMany({
            where: { OR: [{ player_a_id: { in: ids } }, { player_b_id: { in: ids } }] }
        });
        console.log("- Games deleted");

        await prisma.transactions.deleteMany({
            where: { user_id: { in: ids } }
        });
        console.log("- Transactions deleted");

        await prisma.reports.deleteMany({
            where: { reporter_id: { in: ids } }
        });
        console.log("- Reports (reporter) deleted");

        // Now delete users (Casacade will handle profiles, reels, etc)
        const deleted = await prisma.users.deleteMany({
            where: { id: { in: ids } }
        });
        console.log(`✅ Successfully deleted ${deleted.count} fake users.`);
    } else {
        console.log("No users to delete.");
    }
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
