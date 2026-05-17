/**
 * remove_and_notify_photos.js
 *
 * Step 1: Find & display users named "gopal" or "mat"
 * Step 2: Clear their avatar_url from DB
 * Step 3: Send them an email asking to upload a proper photo
 * Step 4: Also send photo nudge emails to ALL users with no/dicebear photos
 *
 * Run: node scripts/remove_and_notify_photos.js --dry-run
 * Live: node scripts/remove_and_notify_photos.js
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

// ─── Email templates ──────────────────────────────────────────────────────────

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
                for a genuine, real-person profile image.
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
                Please upload a new photo to continue appearing in matches. Profiles without photos receive
                <strong style="color: #fff;">significantly fewer connection requests.</strong>
            </p>
            <div style="text-align: center; margin: 36px 0;">
                <a href="${APP_URL}/dashboard"
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
            <div style="text-align: center; margin: 36px 0;">
                <a href="${APP_URL}/dashboard"
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                    Upload My Photo Now →
                </a>
            </div>
            <p style="font-size: 13px; color: #555; text-align: center;">
                LifePartner AI · Hyderabad, India
            </p>
        </div>
    </div>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log(DRY_RUN ? '🔍 DRY-RUN — no changes will be made.\n' : '🚀 Starting photo removal + notification campaign...\n');

    // ── STEP 1: Find gopal & mat users ────────────────────────────────────────
    const targets = await prisma.users.findMany({
        where: {
            email: { not: 'saitejavijayagiri@gmail.com' },
            OR: [
                { full_name: { contains: 'gopal', mode: 'insensitive' } },
                { full_name: { contains: 'mat', mode: 'insensitive' } }
            ]
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    console.log(`🎯 Found ${targets.length} targeted users (gopal/mat):\n`);
    targets.forEach(u => {
        const hasPhoto = u.avatar_url && !u.avatar_url.includes('dicebear');
        console.log(`  • ${u.full_name} <${u.email}> — photo: ${hasPhoto ? '✅ ' + u.avatar_url.substring(0, 60) + '...' : '❌ none'}`);
    });

    // ── STEP 2: Clear their photos & notify ───────────────────────────────────
    let removed = 0, notified = 0;
    for (const user of targets) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        const hasPhoto = user.avatar_url && !user.avatar_url.includes('dicebear');

        if (hasPhoto) {
            if (!DRY_RUN) {
                await prisma.users.update({
                    where: { id: user.id },
                    data: { avatar_url: null }
                });
                await prisma.profiles.updateMany({
                    where: { user_id: user.id },
                    data: { photos: [] }
                });
            }
            console.log(`${DRY_RUN ? '[DRY]' : '✅'} Removed photo for: ${user.full_name} (${user.email})`);
            removed++;
        }

        // Send removal notification email
        if (!DRY_RUN) {
            try {
                await resend.emails.send({
                    from: FROM,
                    to: user.email,
                    subject: `${firstName}, please upload a genuine profile photo`,
                    html: buildPhotoRemovedEmail(firstName)
                });
                console.log(`📧 Notified: ${user.email}`);
                notified++;
            } catch (e) {
                console.error(`❌ Email failed for ${user.email}: ${e.message}`);
            }
        } else {
            console.log(`[DRY] Would email: ${user.email}`);
        }

        await new Promise(r => setTimeout(r, 400));
    }

    // ── STEP 3: Send nudge to ALL users with no photo ─────────────────────────
    console.log('\n─────────────────────────────────────────');
    console.log('📊 Running nudge campaign for users with no photo...\n');

    const allUsers = await prisma.users.findMany({
        where: {
            age: { not: null },
            gender: { not: null },
            email: { not: 'saitejavijayagiri@gmail.com' },
            // Exclude already-targeted users
            id: { notIn: targets.map(t => t.id) }
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    const noPhotoUsers = allUsers.filter(u => {
        const url = u.avatar_url || '';
        return !url || url.includes('dicebear') || url.trim() === '';
    });

    console.log(`Found ${noPhotoUsers.length} users with no photo (excluding already-targeted)\n`);

    let sent = 0, failed = 0;
    for (const user of noPhotoUsers) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        const subject = `${firstName}, your profile is missing a photo 📸`;

        if (DRY_RUN) {
            console.log(`[DRY-RUN] Would email: ${user.email}`);
            continue;
        }

        try {
            await resend.emails.send({ from: FROM, to: user.email, subject, html: buildNoPhotoEmail(firstName) });
            console.log(`✅ Nudged: ${user.email}`);
            sent++;
        } catch (e) {
            console.error(`❌ Failed: ${user.email} — ${e.message}`);
            failed++;
        }

        await new Promise(r => setTimeout(r, 400));
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════');
    console.log(`📋 SUMMARY`);
    console.log(`  Photos removed : ${DRY_RUN ? `${removed} (dry run)` : removed}`);
    console.log(`  Removal emails : ${DRY_RUN ? `${targets.length} (dry run)` : notified}`);
    console.log(`  Nudge emails   : ${DRY_RUN ? `${noPhotoUsers.length} (dry run)` : sent} sent, ${failed} failed`);
    console.log('═══════════════════════════════════════\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
