import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        const msg = await prisma.messages.findFirst({});
        if (!msg) {
            console.log("No messages found in DB.");
            return;
        }

        const userId = msg.sender_id;
        const connectionId = msg.receiver_id;

        console.log(`Testing history between ${userId} and ${connectionId}...`);
        const messages = await prisma.messages.findMany({
            where: {
                OR: [
                    { sender_id: userId, receiver_id: connectionId },
                    { sender_id: connectionId, receiver_id: userId }
                ]
            },
            orderBy: { created_at: 'desc' },
            take: 10,
            select: {
                id: true,
                sender_id: true,
                receiver_id: true,
                content: true,
                created_at: true,
                delivery_status: true
            }
        });

        console.log("Messages found:", messages.length);
        console.dir(messages, { depth: null });

    } catch (e) {
        console.error("FAIL:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
