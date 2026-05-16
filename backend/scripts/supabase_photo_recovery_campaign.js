/**
 * supabase_photo_recovery_campaign.js
 *
 * Targets the ~16 users whose photos are locked in Supabase due to egress limits.
 * Asks them to re-upload their photo because we upgraded our CDN.
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

function buildRecoveryEmail(firstName) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 48px 32px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 12px;">⚠️</div>
            <h1 style="margin: 0; font-size: 26px; color: white; line-height: 1.3;">
                ${firstName}, we need you to<br/>
                <span style="color: #fde68a;">re-upload your photo!</span>
            </h1>
        </div>
        <div style="padding: 36px 32px;">
            <p style="font-size: 16px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                We recently upgraded our photo hosting infrastructure to a blazing-fast global network. Unfortunately, your previously uploaded profile picture could not be migrated and is currently showing up as a blank avatar on your profile.
            </p>
            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">
                Profiles without photos receive significantly fewer matches. Please take 30 seconds to re-upload your best photo so other members can see you!
            </p>

            <div style="text-align: center; margin: 36px 0;">
                <a href="${APP_URL}/dashboard"
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                    Re-upload My Photo →
                </a>
            </div>

            <p style="font-size: 13px; color: #555; text-align: center;">
                LifePartner AI · Hyderabad, India<br/>
                We apologize for the inconvenience and thank you for being an early member!
            </p>
        </div>
    </div>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(DRY_RUN ? '🔍 DRY-RUN — no emails will be sent.' : '🚀 Starting Supabase recovery campaign...');

    const users = await prisma.users.findMany({
        where: {
            avatar_url: { contains: 'supabase.co' },
            email: { not: 'saitejavijayagiri@gmail.com' } // Exclude admin
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    console.log(`\n📊 Found ${users.length} users with locked Supabase photos.\n`);

    if (users.length === 0) {
        console.log('✅ No users affected. Exiting.');
        return;
    }

    let sent = 0, failed = 0;

    for (const user of users) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        const subject = `Action Required: Please re-upload your profile photo 📸`;

        if (DRY_RUN) {
            console.log(`[DRY-RUN] ${user.email} → "${subject}"`);
            continue;
        }

        try {
            await resend.emails.send({
                from: FROM,
                to: user.email,
                subject,
                html: buildRecoveryEmail(firstName)
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
        console.log(`\n🔍 Dry-run complete. ${users.length} emails would be sent.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
