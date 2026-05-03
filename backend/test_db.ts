import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function test() { 
    const msgs = await prisma.messages.findMany({ orderBy: { created_at: 'desc' }, take: 5 }); 
    console.log(msgs); 
} 
test();
