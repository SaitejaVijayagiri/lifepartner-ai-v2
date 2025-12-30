
import { prisma } from '../src/prisma';

async function clean() {
    await prisma.users.deleteMany({
        where: {
            email: {
                in: [
                    'flow_test_a_1766142430729@example.com',
                    'flow_test_b_1766142430988@example.com',
                    'premium_tester@example.com'
                ]
            }
        }
    });
    console.log("Cleaned test accounts.");
}

clean().finally(async () => await prisma.$disconnect());
