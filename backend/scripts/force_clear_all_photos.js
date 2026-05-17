const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

function buildPhotoRemovedEmail(firstName) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 48px 32px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 12px;">⚠️</div>
            <h1 style="margin: 0; font-size: 26px; color: white; line-height: 1.3;">
                ${firstName}, your profile photo<br/>
                <span style="color: #fde68a;">has been removed</span>
            </h1>
        </div>
        <div style="padding: 36px 32px;">
            <p style="font-size: 16px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                Our moderation team reviewed your profile photo and found it did not meet our community guidelines
                for a genuine, real-person profile image. Because of this, it has been fully removed from your gallery and avatar.
            </p>
            <div style="background: #1a1a2e; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #E11D48;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #f9a8d4;">📋 Photo Requirements</p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #ccc; line-height: 2;">
                    <li>A clear, well-lit photo of <strong>your actual face</strong></li>
                    <li>No group photos, cartoons, or avatars as primary photo</li>
                    <li>Smile naturally — it makes a great first impression</li>
                    <li>Recent photo (within the last 2 years)</li>
                </ul>
            </div>
            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                Please upload a new, clear face photo to continue appearing in matches. Profiles without photos receive
                <strong style="color: #fff;">significantly fewer connection requests.</strong>
            </p>
            <div style="text-align: center; margin: 36px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard"
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                    Upload a New Photo →
                </a>
            </div>
            <p style="font-size: 13px; color: #555; text-align: center;">
                LifePartner AI · Hyderabad, India<br/>
                Questions? Reply to this email and we'll help you out.
            </p>
        </div>
    </div>`;
}

async function main() {
    const TARGET_EMAILS = [
        'venusagar882@gmail.com',         // Gopal
        'nikhilkumarjogi12@gmail.com',    // Nikhil Kumar
        'z74550437@gmail.com',            // Mirza Sameer
        'truegodseeker001@gmail.com',     // A k m
        'smateen198@gmail.com'            // Mat
    ];

    const targets = await prisma.users.findMany({
        where: { email: { in: TARGET_EMAILS } },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    for (const user of targets) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        
        // 1. Clear users.avatar_url
        await prisma.users.update({
            where: { id: user.id },
            data: { avatar_url: null }
        });

        // 2. Fetch profiles to check metadata
        const profile = await prisma.profiles.findUnique({
            where: { user_id: user.id }
        });

        if (profile) {
            let metadata = profile.metadata;
            if (typeof metadata === 'string') {
                try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
            }
            if (!metadata || typeof metadata !== 'object') {
                metadata = {};
            }

            // 3. Clear photos inside metadata JSON as well
            metadata.photos = [];

            await prisma.profiles.update({
                where: { user_id: user.id },
                data: {
                    photos: [], // Clear primary photos array
                    metadata: metadata // Clear metadata photos array
                }
            });
        }

        console.log(`✅ Deep-cleaned all photos for: ${user.full_name} (${user.email})`);

        try {
            await resend.emails.send({
                from: FROM,
                to: user.email,
                subject: `${firstName}, please upload a genuine profile photo`,
                html: buildPhotoRemovedEmail(firstName)
            });
            console.log(`📧 Reminder Notified: ${user.email}`);
        } catch (e) {
            console.error(`❌ Email failed for ${user.email}: ${e.message}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
