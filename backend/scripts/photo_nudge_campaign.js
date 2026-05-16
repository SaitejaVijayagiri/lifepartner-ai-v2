/**
 * photo_nudge_campaign.js
 *
 * Targets ONLY users with absolutely no photo (null / DiceBear placeholder).
 * base64 users are EXCLUDED — their photos render fine in the browser and
 * passed face moderation when originally uploaded.
 */

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';
const APP_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildNoPhotoEmail(firstName) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 48px 32px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 12px;">📸</div>
            <h1 style="margin: 0; font-size: 26px; color: white; line-height: 1.3;">
                ${firstName}, profiles with photos get<br/>
                <span style="color: #fde68a;">8× more matches!</span>
            </h1>
        </div>
        <div style="padding: 36px 32px;">
            <p style="font-size: 16px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                You've set up your profile — great start! But we noticed you haven't added a profile photo yet.
                Profiles with a clear photo receive <strong style="color: #fff;">8× more interest requests</strong> than those without one.
            </p>

            <div style="background: #1a1a2e; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #E11D48;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #f9a8d4;">📋 Photo Tips for Best Results</p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #ccc; line-height: 2;">
                    <li>Use a clear, well-lit photo where your face is visible</li>
                    <li>Smile naturally — it makes a great first impression</li>
                    <li>Avoid group photos as your primary picture</li>
                    <li>Recent photos work best (within the last 2 years)</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 36px 0;">
                <a href="${APP_URL}/dashboard"
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                    Upload My Photo Now →
                </a>
            </div>

            <p style="font-size: 13px; color: #555; text-align: center;">
                LifePartner AI · Hyderabad, India<br/>
                Your photo is stored securely and only shown to verified members.
            </p>
        </div>
    </div>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(DRY_RUN ? '🔍 DRY-RUN — no emails will be sent.' : '🚀 Starting photo nudge campaign...');

    // Only target onboarded users with truly no photo
    const users = await prisma.users.findMany({
        where: {
            age: { not: null },
            gender: { not: null },
            // Exclude your own admin account
            email: { not: 'saitejavijayagiri@gmail.com' }
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    // Filter: only null, empty, or DiceBear avatars (truly no photo)
    const noPhotoUsers = users.filter(u => {
        const url = u.avatar_url || '';
        return !url || url.includes('dicebear') || url.trim() === '';
    });

    console.log(`\n📊 Truly no photo: ${noPhotoUsers.length} users (base64 users excluded — their photos render fine)\n`);

    if (noPhotoUsers.length === 0) {
        console.log('✅ No users need nudging. All onboarded users have photos.');
        return;
    }

    let sent = 0, failed = 0;

    for (const user of noPhotoUsers) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        const subject = `${firstName}, your profile is missing a photo 📸`;

        if (DRY_RUN) {
            console.log(`[DRY-RUN] ${user.email} → "${subject}"`);
            continue;
        }

        try {
            await resend.emails.send({
                from: FROM,
                to: user.email,
                subject,
                html: buildNoPhotoEmail(firstName)
            });
            console.log(`✅ Sent to ${user.email}`);
            sent++;
        } catch (e) {
            console.error(`❌ Failed for ${user.email}: ${e.message}`);
            failed++;
        }

        await new Promise(r => setTimeout(r, 400));
    }

    if (!DRY_RUN) {
        console.log(`\n✅ Campaign complete. Sent: ${sent} | Failed: ${failed}`);
    } else {
        console.log(`\n🔍 Dry-run complete. ${noPhotoUsers.length} emails would be sent.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
