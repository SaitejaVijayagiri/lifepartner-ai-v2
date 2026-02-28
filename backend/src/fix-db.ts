import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixDb() {
    try {
        console.log("Adding delivery_status column to messages table...");
        await prisma.$executeRawUnsafe(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'sent';`);
        console.log("Column added successfully!");
    } catch (e) {
        console.error("FAIL:", e);
    } finally {
        await prisma.$disconnect();
    }
}

fixDb();
