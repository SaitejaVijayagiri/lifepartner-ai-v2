const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS meet_dates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                location_name VARCHAR(255) NOT NULL,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                date_time TIMESTAMP(6) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                safety_check_triggered BOOLEAN DEFAULT false,
                created_at TIMESTAMP(6) DEFAULT now(),
                updated_at TIMESTAMP(6) DEFAULT now()
            )
        `);
        console.log('meet_dates created');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
