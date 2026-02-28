import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Testing interactions.findMany...");
        const conns = await prisma.interactions.findMany({ take: 1, select: { id: true, status: true, from_user_id: true } });
        console.log("Interactions count:", conns.length);

        console.log("Testing messages.groupBy...");
        const grp = await prisma.messages.groupBy({
            by: ['sender_id'],
            _count: { id: true }
        });
        console.log("GroupBy result:", grp);

    } catch (e) {
        console.error("FAIL:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
