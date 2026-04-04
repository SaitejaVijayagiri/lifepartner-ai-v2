/**
 * runCampaign.ts
 * ───────────────────────────────────────────────────────────────────────────
 * Bulk email campaign runner. Run from backend root:
 *   npx ts-node runCampaign.ts [campaign] [--invite-list=a@b.com,c@d.com]
 *
 * Campaigns:
 *   onboarding    → Registered users who never completed a profile
 *   reengagement  → Registered users inactive for 7+ days
 *   invite        → Non-registered / external email list (comma-separated)
 *   all           → Run onboarding + reengagement (default)
 * ───────────────────────────────────────────────────────────────────────────
 */
import { PrismaClient } from '@prisma/client';
import { EmailService } from './src/services/email';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const campaignArg = args.find(a => !a.startsWith('--')) || 'all';
const inviteArg   = args.find(a => a.startsWith('--invite-list='))?.replace('--invite-list=', '');

const INACTIVE_DAYS = 7; // Days without login before re-engagement

async function runOnboarding() {
    console.log('\n📧  [Campaign: Onboarding Reminders]');
    const users = await prisma.users.findMany({
        where: { is_banned: false },
        select: {
            id: true, email: true, full_name: true,
            profiles: { select: { user_id: true } }
        }
    });

    const notOnboarded = users.filter((u: any) => !u.profiles);
    console.log(`   Found ${notOnboarded.length} users without a profile.`);

    let sent = 0;
    for (const user of notOnboarded) {
        try {
            await EmailService.sendOnboardingReminderEmail(user.email, user.full_name || 'Valued User');
            sent++;
        } catch (e: any) {
            console.error(`   ✗ ${user.email}: ${e.message}`);
        }
    }
    console.log(`   ✓ Sent ${sent}/${notOnboarded.length} onboarding emails.`);
}

async function runReEngagement() {
    console.log('\n💭  [Campaign: Re-engagement]');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);

    // Use created_at as proxy for last activity (last_seen_at column doesn't exist yet)
    // The metadata last_seen field set by login endpoint is checked first
    const users = await prisma.users.findMany({
        where: {
            is_banned: false,
            profiles: { isNot: null }, // Only users who completed onboarding
        },
        select: { id: true, email: true, full_name: true, created_at: true, profiles: { select: { metadata: true } } }
    });

    const inactiveUsers = users.filter((u: any) => {
        const meta = (u.profiles?.metadata as any) || {};
        const lastSeen = meta.last_seen_at ? new Date(meta.last_seen_at) : (u.created_at ? new Date(u.created_at) : null);
        if (!lastSeen) return false;
        return lastSeen < cutoff;
    });

    console.log(`   Found ${inactiveUsers.length} inactive users (${INACTIVE_DAYS}+ days).`);

    let sent = 0;
    for (const user of inactiveUsers) {
        try {
            const meta = (user.profiles?.metadata as any) || {};
            const lastSeen = meta.last_seen_at ? new Date(meta.last_seen_at) : new Date(user.created_at!);
            const daysDiff = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
            await EmailService.sendReEngagementEmail(user.email, user.full_name || 'there', daysDiff);
            sent++;
        } catch (e: any) {
            console.error(`   ✗ ${user.email}: ${e.message}`);
        }
    }
    console.log(`   ✓ Sent ${sent}/${inactiveUsers.length} re-engagement emails.`);
}

async function runInvite(emailList: string) {
    console.log('\n💌  [Campaign: Invites to Non-Registered]');
    const emails = emailList.split(',').map(e => e.trim()).filter(Boolean);
    console.log(`   Sending to ${emails.length} external addresses.`);

    let sent = 0;
    for (const email of emails) {
        try {
            await EmailService.sendInviteEmail(email);
            sent++;
        } catch (e: any) {
            console.error(`   ✗ ${email}: ${e.message}`);
        }
    }
    console.log(`   ✓ Sent ${sent}/${emails.length} invite emails.`);
}

async function run() {
    console.log(`\n🚀  LifePartner AI Email Campaigns — running: ${campaignArg}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);

    try {
        if (campaignArg === 'onboarding') {
            await runOnboarding();
        } else if (campaignArg === 'reengagement') {
            await runReEngagement();
        } else if (campaignArg === 'invite') {
            if (!inviteArg) {
                console.error('  ✗ Provide --invite-list=email1@x.com,email2@y.com');
                process.exit(1);
            }
            await runInvite(inviteArg);
        } else {
            // default: all automated campaigns
            await runOnboarding();
            await runReEngagement();
        }
        console.log('\n✅  Campaign completed successfully!\n');
    } catch (e: any) {
        console.error('Fatal Error:', e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
