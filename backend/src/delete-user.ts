import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'lifepartnerai.in@gmail.com';
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
        console.log(`User not found with email: ${email}`);
        return;
    }

    console.log(`Found user: ${user.id} (${email}). Deleting all related data...`);

    // Delete non-cascading relations first
    await prisma.interactions.deleteMany({
        where: { OR: [{ from_user_id: user.id }, { to_user_id: user.id }] }
    });

    await prisma.matches.deleteMany({
        where: { OR: [{ user_a_id: user.id }, { user_b_id: user.id }] }
    });

    await prisma.messages.deleteMany({
        where: { OR: [{ sender_id: user.id }, { receiver_id: user.id }] }
    });

    await prisma.transactions.deleteMany({ where: { user_id: user.id } });
    await prisma.reports.deleteMany({
        where: { OR: [{ reporter_id: user.id }, { reported_id: user.id }] }
    });

    await prisma.notifications.deleteMany({ where: { user_id: user.id } });
    await prisma.reel_comments.deleteMany({ where: { user_id: user.id } });
    await prisma.reel_likes.deleteMany({ where: { user_id: user.id } });
    await prisma.reels.deleteMany({ where: { user_id: user.id } });

    // Delete the profiles (though it has Cascade, let's be safe)
    await prisma.profiles.deleteMany({ where: { user_id: user.id } });

    // Finally, delete the user
    await prisma.users.delete({ where: { id: user.id } });

    console.log(`✅ User ${email} and all their associated data have been permanently deleted.`);
}

main().catch(e => {
    console.error("Failed to delete user:", e);
}).finally(async () => {
    await prisma.$disconnect();
});
