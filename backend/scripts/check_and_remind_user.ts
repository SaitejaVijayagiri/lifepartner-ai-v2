/**
 * Admin script: check a specific user's profile and send them a photo reminder.
 *
 * Usage:
 *   npx ts-node scripts/check_and_remind_user.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { Resend } from 'resend';

const TARGET_EMAIL = 'nikhilkumarjogi12@gmail.com';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';

async function main() {
    console.log(`\n🔍 Looking up user: ${TARGET_EMAIL}\n`);

    // 1. Find the user
    const { rows: users } = await pool.query(
        `SELECT u.id, u.email, u.full_name, u.created_at
         FROM users u
         WHERE LOWER(u.email) = LOWER($1)
         LIMIT 1`,
        [TARGET_EMAIL]
    );

    if (users.length === 0) {
        console.log(`❌ User not found: ${TARGET_EMAIL}`);
        await pool.end();
        return;
    }

    const user = users[0];
    console.log(`✅ Found user:`);
    console.log(`   Name     : ${user.full_name}`);
    console.log(`   Email    : ${user.email}`);
    console.log(`   Joined   : ${user.created_at}`);
    console.log(`   ID       : ${user.id}`);

    // 2. Look up their profile (all personal data lives inside the 'metadata' JSONB column)
    const { rows: profiles } = await pool.query(
        `SELECT p.user_id,
                p.photos,
                p.location_name,
                p.metadata->>'name'        as name,
                p.metadata->>'height'      as height,
                p.metadata->>'aboutMe'     as about_me,
                p.metadata->'basics'->>'height' as basics_height,
                jsonb_array_length(p.photos) as photo_count
         FROM profiles p
         WHERE p.user_id = $1
         LIMIT 1`,
        [user.id]
    );

    if (profiles.length === 0) {
        console.log(`\n⚠️  No profile found for this user — they haven't completed onboarding.`);
    } else {
        const profile = profiles[0];
        console.log(`\n📋 Profile details:`);
        console.log(`   Height (top-level)   : "${profile.height || '(empty)'}"`);
        console.log(`   Height (basics.*)    : "${profile.basics_height || '(empty)'}"`);
        console.log(`   Location             : ${profile.location_name || '(none)'}`);
        console.log(`   Photo count          : ${profile.photo_count ?? 0}`);
        console.log(`   Photos URLs          : ${JSON.stringify(profile.photos)}`);
        console.log(`   Bio (first 100)      : ${(profile.about_me || '').slice(0, 100)}...`);
        console.log(`\n   ⚠️  Check the Photos URLs above to review the uploaded images.`);
    }

    // 3. Send the personalised photo-reminder email
    console.log(`\n📧 Sending photo reminder email to ${user.email}…`);
    const firstName = user.full_name?.split(' ')[0] || 'there';

    try {
        await resend.emails.send({
            from: 'LifePartner AI <hello@lifepartnerai.in>',
            to: user.email,
            subject: `${firstName}, update your profile photo to get more matches 📸`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 40px 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; color: white;">Your Profile Photo Needs an Update 📸</h1>
                    </div>
                    <div style="padding: 32px;">
                        <p style="font-size: 17px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
                        <p style="font-size: 15px; color: #aaa; line-height: 1.7;">
                            We noticed that your current profile photo may not be showing your best self. 
                            Profiles with a <strong style="color: #f5f5f5;">clear face photo</strong> get up to 
                            <strong style="color: #f5f5f5;">10× more matches</strong> on LifePartner AI!
                        </p>
                        <p style="font-size: 15px; color: #aaa; line-height: 1.7;">
                            Please make sure your main photo:
                        </p>
                        <ul style="font-size: 15px; color: #aaa; line-height: 2;">
                            <li>Shows your <strong style="color:#e5e5e5;">face clearly</strong></li>
                            <li>Is a real, recent photo of <strong style="color:#e5e5e5;">you</strong></li>
                            <li>Is not a landscape, cartoon, or group photo</li>
                        </ul>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">
                                Update My Profile →
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #888; line-height: 1.7;">
                            Go to <strong>Edit Profile → Photos</strong> to upload a clear, recent face photo. 
                            Our AI verifies every photo to maintain a safe, authentic community.
                        </p>
                        <p style="font-size: 13px; color: #666; text-align: center; margin-top: 32px;">LifePartner AI · Hyderabad, India</p>
                    </div>
                </div>
            `
        });
        console.log(`\n✅ Photo reminder email sent successfully to ${user.email}`);
    } catch (err: any) {
        console.error(`\n❌ Failed to send email: ${err?.message}`);
    }

    await pool.end();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
