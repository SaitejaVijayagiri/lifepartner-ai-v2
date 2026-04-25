import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from './prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TARGET_EMAILS = [
    'z74550437@gmail.com',
    'truegodseeker001@gmail.com'
];

async function sendFakePhotoReminderEmail(email: string, firstName: string) {
    const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
        to: email,
        subject: '📸 Action Required: Update Your Profile Photo for More Matches',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 40px 32px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">📸</div>
                    <h1 style="margin: 0; font-size: 24px; color: white;">Your Profile Photo Needs Attention</h1>
                </div>
                <div style="padding: 32px;">
                    <p style="font-size: 17px; color: #e5e5e5;">Hi <strong>${firstName}</strong>,</p>

                    <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                        Our AI profile verification system has flagged that your current profile photo may <strong style="color: #fbbf24;">not be an original or authentic photo of you</strong>.
                    </p>

                    <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                        This is affecting your visibility on the platform. Members with authentic, clear profile photos receive <strong style="color: #f5f5f5;">up to 5x more matches</strong> compared to those without verified photos.
                    </p>

                    <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 14px; color: #fcd34d; line-height: 1.8;">
                            <strong>📋 What makes a great profile photo?</strong><br/>
                            ✅ A clear, recent photo clearly showing your face<br/>
                            ✅ Good lighting — natural daylight works best<br/>
                            ✅ A genuine smile — profiles with smiling photos get more interest<br/>
                            ❌ Avoid group photos, blurry images, or downloaded stock photos
                        </p>
                    </div>

                    <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                        Uploading a real, authentic photo of yourself not only builds trust with potential matches but also unlocks our AI-powered matching to find you the most compatible partners.
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard"
                           style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                            Update My Profile Photo →
                        </a>
                    </div>

                    <p style="font-size: 13px; color: #666; text-align: center; line-height: 1.8;">
                        Questions? Reply to this email or reach us at support@lifepartnerai.in<br/>
                        LifePartner AI · Hyderabad, India
                    </p>
                </div>
            </div>
        `
    });

    if (error) throw error;
}

async function main() {
    console.log(`\n🚀 Starting Photo Reminder Campaign for ${TARGET_EMAILS.length} users...\n`);

    for (const email of TARGET_EMAILS) {
        try {
            console.log(`🔍 Looking up: ${email}`);
            const user = await prisma.users.findFirst({ where: { email } });
            const firstName = user?.full_name?.split(' ')[0] || 'there';

            if (!user) {
                console.warn(`⚠️  User not found in DB: ${email} — sending email anyway.`);
            } else {
                console.log(`   Found: ${user.full_name} (ID: ${user.id})`);
            }

            await sendFakePhotoReminderEmail(email, firstName);
            console.log(`✅ Reminder email sent to: ${email}\n`);

            // Small delay to avoid email rate limits
            await new Promise(r => setTimeout(r, 600));

        } catch (err: any) {
            console.error(`❌ Failed for ${email}:`, err?.message || err);
        }
    }

    console.log('🎉 Campaign completed!\n');
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
