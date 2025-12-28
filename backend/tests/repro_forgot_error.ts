import { prisma } from '../src/prisma';
import { Resend } from 'resend';

// Mock Express Response
const res = {
    json: (data: any) => console.log('Response JSON:', data),
    status: (code: number) => {
        console.log('Response Status:', code);
        return { json: (data: any) => console.log('Response Error JSON:', data) };
    }
};

async function reproduceError() {
    const email = 'saitejavijayagiri@gmail.com'; // Use real user email
    console.log(`Reproducing Forgot Password for: ${email}`);

    try {
        // Copy-paste logic from auth.ts
        const user = await prisma.users.findUnique({
            where: { email },
            select: { id: true, full_name: true }
        });

        if (!user) {
            console.log("User not found!");
            return;
        }
        console.log("User found:", user.id);

        const otp = '123456';
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        console.log("Updating DB...");
        await prisma.users.update({
            where: { id: user.id },
            data: { otp_code: otp, otp_expires_at: otpExpiresAt }
        });
        console.log("DB Update Success.");

        console.log("Attempting Email Send...");
        // Replicate logic EXACTLY including env var check
        try {
            const apiKey = process.env.RESEND_API_KEY;
            console.log("API Key Check:", apiKey ? "Present" : "Missing");

            if (apiKey && !apiKey.toLowerCase().includes('mock')) {
                const resend = new Resend(apiKey); // Initialize LOCALLY to test key validity
                // Note: actual route uses global `resend`, but let's test isolation first.

                await resend.emails.send({
                    from: 'LifePartner AI Safety <security@resend.dev>',
                    to: email,
                    subject: 'Repro Test',
                    html: '<p>Test</p>'
                });
                console.log("Email Sent via Resend.");
            } else {
                console.log("Skipping email (mock/missing key).");
            }
        } catch (emailErr) {
            console.error("Inner Email Error:", emailErr);
        }

    } catch (e) {
        console.error("CRITICAL EXCEPTION (The one causing 'Request failed'):", e);
    } finally {
        await prisma.$disconnect();
    }
}

reproduceError();
