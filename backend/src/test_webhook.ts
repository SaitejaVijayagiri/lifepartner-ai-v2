import request from 'supertest';
import { app } from './server';
import { prisma } from './prisma';

async function testWebhook() {
    try {
        console.log("Creating dummy user...");
        const dummyEmail = 'simulator@resend.dev';
        
        // Ensure clean state
        await prisma.users.deleteMany({
            where: { email: dummyEmail }
        });

        // Create dummy unverified user
        await prisma.users.create({
            data: {
                email: dummyEmail,
                password_hash: 'dummy',
                full_name: 'Test Simulator',
                is_verified: false
            }
        });

        console.log("Sending simulated webhook...");
        const payload = {
            type: "email.bounced",
            created_at: new Date().toISOString(),
            data: {
                to: [dummyEmail]
            }
        };

        const res = await request(app)
            .post('/webhooks/resend')
            .send(payload)
            .set('Content-Type', 'application/json');

        console.log(`Webhook responded with status: ${res.status}`);

        // Verify user is deleted
        const user = await prisma.users.findUnique({
            where: { email: dummyEmail }
        });

        if (!user) {
            console.log("✅ SUCCESS: Unverified user was correctly deleted by the webhook.");
        } else {
            console.error("❌ FAILED: User was not deleted.");
        }

    } catch (e) {
        console.error("Error during test:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testWebhook();
