import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const msg = await prisma.messages.findFirst();
        console.log("Success! Messages exist.");
    } catch (e) {
        console.error(e);
    }
}
main();
