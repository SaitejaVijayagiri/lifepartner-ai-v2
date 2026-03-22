import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const res = await prisma.$queryRawUnsafe(`
            SELECT id FROM users
            WHERE is_verified = true
            TABLESAMPLE SYSTEM(30)
            LIMIT 50
        `);
        console.log("Success:", res);
    } catch(e) {
        console.error("Error:", e);
    }
}
main();
