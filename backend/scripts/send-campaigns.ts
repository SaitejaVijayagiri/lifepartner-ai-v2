/**
 * One-off script: send onboarding reminder emails to all users who have NOT
 * completed their profile (i.e. no row in the `profiles` table) AND send 
 * find-matches emails to users who HAVE completed their profile.
 *
 * Usage:
 *   Set DATABASE_URL, RESEND_API_KEY, and optionally FRONTEND_URL in your env,
 *   then run:
 *     npx ts-node scripts/send-campaigns.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { Resend } from 'resend';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('🔍 Fetching users…');

    const { rows: users } = await pool.query<{ id: string; email: string; full_name: string; has_profile: boolean }>(`
        SELECT u.id, u.email, u.full_name, (p.user_id IS NOT NULL) as has_profile
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.is_banned = false
        ORDER BY u.created_at DESC
    `);

    if (users.length === 0) {
        console.log('✅ No users found!');
        await pool.end();
        return;
    }

    const notOnboarded = users.filter(u => !u.has_profile);
    const onboarded = users.filter(u => u.has_profile);

    console.log(`\n📋 Found ${notOnboarded.length} user(s) who haven't onboarded.`);
    console.log(`📋 Found ${onboarded.length} user(s) who have onboarded.`);

    let sentOnboarding = 0;
    let failedOnboarding = 0;
    
    let sentMatches = 0;
    let failedMatches = 0;

    console.log('\n📧 Sending ONBOARDING reminder emails…\n');
    for (const user of notOnboarded) {
        const firstName = user.full_name?.split(' ')[0] || 'there';
        try {
            await resend.emails.send({
                from: 'LifePartner AI <hello@lifepartnerai.in>',
                to: user.email,
                subject: `${firstName}, your profile is waiting for you 💫`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: white;">You're Almost There! 💕</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">You signed up on LifePartner AI but haven't completed your profile yet. Your perfect match could already be looking for someone exactly like you — don't keep them waiting!</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">It only takes <strong style="color: #f5f5f5;">2 minutes</strong> to set up your profile and start getting matched by our AI.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${FRONTEND_URL}/onboarding" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">Complete My Profile →</a>
                            </div>
                            <p style="font-size: 13px; color: #666; text-align: center;">LifePartner AI · Hyderabad, India</p>
                        </div>
                    </div>
                `
            });
            console.log(`  ✅ Sent Onboarding Nudge to ${user.email}`);
            sentOnboarding++;
        } catch (err: any) {
            console.error(`  ❌ Failed for ${user.email}: ${err?.message}`);
            failedOnboarding++;
        }
        await sleep(150); // stay within Resend rate limits
    }

    console.log('\n📧 Sending FIND-MATCHES emails…\n');
    for (const user of onboarded) {
        const firstName = user.full_name?.split(' ')[0] || 'there';
        try {
            await resend.emails.send({
                from: 'LifePartner AI <hello@lifepartnerai.in>',
                to: user.email,
                subject: `${firstName}, your matches are waiting 💌`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #059669, #0EA5E9); padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: white;">Your AI Matches Are Ready ✨</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">Great news — your profile is all set! Our AI has been working hard to find people who truly align with your values, personality, and life goals.</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">Genuine connections are waiting for you. Explore your matches and start a conversation today.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #059669, #0EA5E9); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">See My Matches →</a>
                            </div>
                            <p style="font-size: 13px; color: #666; text-align: center;">LifePartner AI · Hyderabad, India</p>
                        </div>
                    </div>
                `
            });
            console.log(`  ✅ Sent Match Nudge to ${user.email}`);
            sentMatches++;
        } catch (err: any) {
            console.error(`  ❌ Failed for ${user.email}: ${err?.message}`);
            failedMatches++;
        }
        await sleep(150); // stay within Resend rate limits
    }

    console.log(`\n🎉 Done!`);
    console.log(`   Onboarding Emails: Sent ${sentOnboarding}, Failed ${failedOnboarding}`);
    console.log(`   Matches Emails   : Sent ${sentMatches}, Failed ${failedMatches}`);
    await pool.end();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
