import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from './prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const TARGET_EMAIL = 'hrramesh1991@gmail.com';

async function main() {
    console.log(`\n🔍 Looking up user: ${TARGET_EMAIL}...`);

    const user = await prisma.users.findFirst({
        where: { email: TARGET_EMAIL },
        include: { profiles: true }
    });

    if (!user) {
        console.error(`❌ User not found: ${TARGET_EMAIL}`);
        process.exit(1);
    }

    const name = user.full_name?.split(' ')[0] || 'there';
    console.log(`✅ Found user: ${user.full_name} (ID: ${user.id})`);
    console.log(`   Current avatar_url: ${user.avatar_url}`);

    // Step 1: Remove profile photo from users table
    console.log('\n🗑️  Clearing profile photo...');
    await prisma.users.update({
        where: { id: user.id },
        data: { avatar_url: null }
    });

    // Step 2: Clear photos from profiles.metadata
    const existingMeta = (user.profiles?.metadata as any) || {};
    const updatedMeta = { ...existingMeta, photos: [] };

    if (user.profiles) {
        await prisma.profiles.update({
            where: { user_id: user.id },
            data: { metadata: updatedMeta }
        });
    }

    console.log('✅ Profile photo cleared from database.');

    // Step 3: Send warning email
    console.log('\n📧 Sending warning email...');
    const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
        to: TARGET_EMAIL,
        subject: '⚠️ Important: Your Profile Photo Has Been Reported',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #b91c1c, #7f1d1d); padding: 40px 32px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                    <h1 style="margin: 0; font-size: 24px; color: white;">Profile Photo Warning</h1>
                </div>
                <div style="padding: 32px;">
                    <p style="font-size: 17px; color: #e5e5e5;">Dear <strong>${name}</strong>,</p>

                    <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                        We are writing to inform you that your profile photo has been <strong style="color: #f87171;">reported as inappropriate</strong> by another user on LifePartner AI.
                    </p>

                    <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                        To protect the safety and trust of our community, we have <strong style="color: #f87171;">temporarily removed your profile photo</strong> while we handle this report.
                    </p>

                    <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #ef4444;">
                        <p style="margin: 0; font-size: 14px; color: #fca5a5; line-height: 1.7;">
                            <strong>What this means for you:</strong><br/>
                            • Your profile is currently <strong>hidden from matches</strong> until you upload a new, appropriate photo.<br/>
                            • Please ensure your new photo clearly shows your face and complies with our Community Guidelines.<br/>
                            • Repeated violations may result in account suspension.
                        </p>
                    </div>

                    <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                        To restore visibility and start getting matches again, please upload a new profile photo immediately:
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard"
                           style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                            Update My Profile Photo →
                        </a>
                    </div>

                    <p style="font-size: 13px; color: #666; text-align: center; line-height: 1.8;">
                        If you believe this was a mistake, please reply to this email or contact our support team.<br/>
                        LifePartner AI · Hyderabad, India
                    </p>
                </div>
            </div>
        `
    });

    if (error) {
        console.error('❌ Failed to send warning email:', error);
    } else {
        console.log('✅ Warning email sent successfully!');
    }

    console.log('\n🎉 Done! Summary:');
    console.log(`   User: ${user.full_name} (${TARGET_EMAIL})`);
    console.log('   ✓ avatar_url cleared');
    console.log('   ✓ photos[] cleared from metadata');
    console.log('   ✓ Warning email sent');

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
