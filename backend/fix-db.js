const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
    try {
        await prisma.$executeRawUnsafe('ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID;');
        await prisma.$executeRawUnsafe('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT false;');
        await prisma.$executeRawUnsafe('ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSON DEFAULT \'{}\';');
        await prisma.$executeRawUnsafe('ALTER TABLE messages ADD COLUMN IF NOT EXISTS cleared_by JSON DEFAULT \'[]\';');
        console.log('Fixed DB');
    } catch(e) {
        console.error(e);
    }
}
fix();
