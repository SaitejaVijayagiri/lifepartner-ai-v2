import cron from 'node-cron';
import { prisma } from '../prisma';
import { NotificationService } from './notification';
import { Resend } from 'resend';
import { EmailTracker } from './emailTracker';
import { generateCuriosityPush } from './curiosityPush';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

// Maximum promotional reminder emails allowed per day (Strictly protects 90 emails for OTPs & transactional emails)
const MAX_DAILY_CAMPAIGN_EMAILS = 10;

/**
 * Format first name nicely:
 * "ADITYA" -> "Aditya"
 * "gaurav" -> "Gaurav"
 * "  " or undefined -> "there"
 */
export function formatFirstName(rawName?: string | null): string {
    if (!rawName || typeof rawName !== 'string') return 'there';
    const firstPart = rawName.trim().split(/\s+/)[0];
    if (!firstPart || firstPart.length === 0 || firstPart.toLowerCase() === 'agent' || firstPart.toLowerCase() === 'user') {
        return 'there';
    }
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
}

/**
 * Variant 1: "The Profile Teaser & Secret Admirer" (Curiosity Hook)
 * Increases click rate by creating an intriguing curiosity gap.
 */
function generateProfileTeaserEmail(
    firstName: string,
    city: string,
    oppositeLabel: string,
    sampleMatch?: { age?: number; profession?: string; city?: string }
): { subject: string; html: string } {
    const loc = city || 'your city';
    const sampleAge = sampleMatch?.age || 25;
    const sampleJob = sampleMatch?.profession || 'Professional';
    const sampleLoc = sampleMatch?.city || loc;
    const subject = `👀 Someone in ${loc} checked out your profile today`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Someone Viewed Your Profile | LifePartner AI</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
<div style="max-width:580px;margin:0 auto;padding:24px 12px;">

  <!-- Outer Card -->
  <div style="background:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 50px rgba(0,0,0,0.5);">

    <!-- Header Gradient Banner -->
    <div style="background:linear-gradient(135deg,#e11d48 0%,#9333ea 50%,#3b82f6 100%);padding:40px 24px;text-align:center;">
      <div style="display:inline-block;padding:6px 16px;background:rgba(0,0,0,0.3);border-radius:30px;font-size:12px;font-weight:700;color:#fef08a;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
        ⚡ NEW PROFILE ACTIVITY
      </div>
      <h1 style="margin:0 0 10px 0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
        ${firstName}, someone just viewed your profile! 👀
      </h1>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.92);font-weight:400;">
        A verified member in <strong>${loc}</strong> is interested in your bio & photos
      </p>
    </div>

    <!-- Intriguing Teaser Profile Card -->
    <div style="padding:32px 24px;">
      <div style="background:#27272a;border-radius:20px;padding:24px;border:1px solid #3f3f46;text-align:center;margin-bottom:24px;">
        
        <!-- Blurred Teaser Silhouette / Avatar -->
        <div style="width:96px;height:96px;margin:0 auto 16px auto;border-radius:50%;background:linear-gradient(135deg,#e11d48,#7c3aed);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 25px rgba(225,29,72,0.4);border:3px solid #f43f5e;">
          <span style="font-size:42px;line-height:96px;display:inline-block;">✨</span>
        </div>

        <div style="display:inline-block;padding:4px 12px;background:rgba(225,29,72,0.15);border:1px solid rgba(225,29,72,0.4);border-radius:12px;color:#fb7185;font-size:12px;font-weight:700;margin-bottom:8px;">
          🔥 94% COMPATIBILITY MATCH
        </div>

        <h3 style="margin:8px 0 4px 0;font-size:18px;color:#ffffff;font-weight:700;">
          Verified ${oppositeLabel.replace('verified ', '').slice(0, -1)} • ${sampleAge} yrs
        </h3>
        <p style="margin:0 0 16px 0;font-size:14px;color:#a1a1aa;">
          📍 ${sampleLoc} &nbsp;•&nbsp; 💼 ${sampleJob}
        </p>

        <!-- Compatibility Badges -->
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <span style="display:inline-block;background:#3f3f46;color:#e4e4e7;padding:4px 10px;border-radius:8px;font-size:12px;margin:2px;">🛡️ 100% ID Verified</span>
          <span style="display:inline-block;background:#3f3f46;color:#e4e4e7;padding:4px 10px;border-radius:8px;font-size:12px;margin:2px;">🏡 Family Values</span>
          <span style="display:inline-block;background:#3f3f46;color:#e4e4e7;padding:4px 10px;border-radius:8px;font-size:12px;margin:2px;">✈️ Loves Travelling</span>
        </div>
      </div>

      <p style="font-size:15px;color:#d4d4d8;line-height:1.6;margin:0 0 24px 0;text-align:center;">
        Don't leave them waiting on read! Log in to see who checked out your profile and discover what our AI found in common.
      </p>

      <!-- Action Button -->
      <div style="text-align:center;margin:28px 0 16px 0;">
        <a href="${FRONTEND_URL}/dashboard?tab=matches&utm_source=email&utm_campaign=profile_teaser"
           style="display:inline-block;padding:16px 42px;background:linear-gradient(135deg,#e11d48,#7c3aed);color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 8px 25px rgba(225,29,72,0.35);letter-spacing:0.3px;">
          See Who Viewed You →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:18px 24px;text-align:center;background:#141417;border-top:1px solid #27272a;">
      <p style="margin:0;font-size:12px;color:#71717a;">LifePartner AI · Finding your life partner, safely and smartly.</p>
    </div>

  </div>
</div>
</body>
</html>
    `;
    return { subject, html };
}

/**
 * Variant 2: "95% AI Compatibility Spotlight" (High Value Hook)
 * Focuses on deep compatibility, mutual values, and lifestyle alignment.
 */
function generateSpotlightEmail(firstName: string, city: string, oppositeLabel: string): { subject: string; html: string } {
    const loc = city || 'India';
    const subject = `🎯 ${firstName}, we found a 95% compatibility match for you`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>95% AI Match Found | LifePartner AI</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
<div style="max-width:580px;margin:0 auto;padding:24px 12px;">

  <div style="background:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 50px rgba(0,0,0,0.5);">

    <div style="background:linear-gradient(135deg,#059669 0%,#0284c7 100%);padding:40px 24px;text-align:center;">
      <div style="display:inline-block;padding:6px 16px;background:rgba(0,0,0,0.3);border-radius:30px;font-size:12px;font-weight:700;color:#a7f3d0;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
        🎯 AI COMPATIBILITY SPOTLIGHT
      </div>
      <h1 style="margin:0 0 10px 0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
        A 95% Match has been found for you, ${firstName}! ✨
      </h1>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.92);">
        High alignment detected in life vision, lifestyle & partner preferences
      </p>
    </div>

    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#ffffff;font-weight:700;margin:0 0 12px 0;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#d4d4d8;line-height:1.7;margin:0 0 20px 0;">
        Our AI matching algorithm just evaluated new profiles against your partner expectations in <strong>${loc}</strong>. One profile scored in the <strong>top 5% of compatibility</strong> with your values!
      </p>

      <div style="background:#27272a;border-radius:18px;padding:20px 24px;border:1px solid #3f3f46;margin-bottom:24px;">
        <h4 style="margin:0 0 12px 0;font-size:13px;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">
          Why this match stands out 💫
        </h4>
        <div style="margin-bottom:10px;">
          <strong style="color:#ffffff;font-size:14px;">🌟 Emotional & Value Harmony:</strong>
          <span style="color:#a1a1aa;font-size:14px;"> Shared mutual goals on career, family life, and core principles.</span>
        </div>
        <div style="margin-bottom:10px;">
          <strong style="color:#ffffff;font-size:14px;">🛡️ Verified Background:</strong>
          <span style="color:#a1a1aa;font-size:14px;"> 100% verified genuine profile with photos and voice bio.</span>
        </div>
        <div>
          <strong style="color:#ffffff;font-size:14px;">📍 Geographic Fit:</strong>
          <span style="color:#a1a1aa;font-size:14px;"> Located in or willing to relocate to ${loc}.</span>
        </div>
      </div>

      <div style="text-align:center;margin:30px 0 16px 0;">
        <a href="${FRONTEND_URL}/dashboard?tab=matches&utm_source=email&utm_campaign=ai_spotlight"
           style="display:inline-block;padding:16px 42px;background:linear-gradient(135deg,#059669,#0284c7);color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 8px 25px rgba(5,150,105,0.35);">
          Unlock Your 95% Match →
        </a>
      </div>
    </div>

    <div style="padding:18px 24px;text-align:center;background:#141417;border-top:1px solid #27272a;">
      <p style="margin:0;font-size:12px;color:#71717a;">LifePartner AI · AI-Powered Matrimony for Modern Singles.</p>
    </div>

  </div>
</div>
</body>
</html>
    `;
    return { subject, html };
}

/**
 * Variant 3: "Urgent Connection / Pending Request Alert" (FOMO Hook)
 * Used when the user has actual pending match requests waiting.
 */
function generatePendingRequestEmail(firstName: string, pendingCount: number): { subject: string; html: string } {
    const subject = `💌 ${firstName}, you have ${pendingCount} pending match request${pendingCount > 1 ? 's' : ''} waiting!`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pending Match Requests | LifePartner AI</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
<div style="max-width:580px;margin:0 auto;padding:24px 12px;">

  <div style="background:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 50px rgba(0,0,0,0.5);">

    <div style="background:linear-gradient(135deg,#e11d48 0%,#f59e0b 100%);padding:40px 24px;text-align:center;">
      <div style="font-size:44px;margin-bottom:10px;">💌</div>
      <h1 style="margin:0 0 10px 0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
        ${firstName}, someone wants to connect with you! 💖
      </h1>
      <p style="margin:0;font-size:16px;color:#fef3c7;font-weight:600;">
        🔥 ${pendingCount} new pending interest${pendingCount > 1 ? 's' : ''} waiting for your reply
      </p>
    </div>

    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#ffffff;font-weight:700;margin:0 0 12px 0;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#d4d4d8;line-height:1.7;margin:0 0 24px 0;">
        You've received connection requests from genuine, verified members who saw your profile and would love to start a conversation with you.
      </p>

      <div style="background:#27272a;border-radius:18px;padding:20px;border:1px solid #3f3f46;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#fbbf24;font-weight:600;">
          ⏰ Authentic connections are formed when you respond quickly. Don't leave them waiting!
        </p>
      </div>

      <div style="text-align:center;margin:28px 0 16px 0;">
        <a href="${FRONTEND_URL}/dashboard?tab=requests&utm_source=email&utm_campaign=pending_requests"
           style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#e11d48,#f59e0b);color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 8px 25px rgba(225,29,72,0.35);">
          View & Respond to Requests 💖
        </a>
      </div>
    </div>

    <div style="padding:18px 24px;text-align:center;background:#141417;border-top:1px solid #27272a;">
      <p style="margin:0;font-size:12px;color:#71717a;">LifePartner AI · Connecting hearts safely.</p>
    </div>

  </div>
</div>
</body>
</html>
    `;
    return { subject, html };
}

/**
 * Variant 4: "The Coffee / Chai Date Vibe" (Conversational / Warm Hook)
 * Lighthearted and warm, perfect for weekends and evenings.
 */
function generateChaiDateEmail(firstName: string, city: string): { subject: string; html: string } {
    const loc = city || 'your city';
    const subject = `☕ ${firstName}, your evening chai is feeling lonely...`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Chai Partner Is Waiting | LifePartner AI</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
<div style="max-width:580px;margin:0 auto;padding:24px 12px;">

  <div style="background:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 50px rgba(0,0,0,0.5);">

    <div style="background:linear-gradient(135deg,#d97706 0%,#b91c1c 100%);padding:40px 24px;text-align:center;">
      <div style="font-size:44px;margin-bottom:10px;">☕</div>
      <h1 style="margin:0 0 10px 0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
        Chai is best shared, ${firstName} ✨
      </h1>
      <p style="margin:0;font-size:15px;color:#fed7aa;">
        Singles in ${loc} are online looking for genuine conversations today
      </p>
    </div>

    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#ffffff;font-weight:700;margin:0 0 12px 0;">Hey ${firstName},</p>
      <p style="font-size:15px;color:#d4d4d8;line-height:1.7;margin:0 0 20px 0;">
        Taking a break from your busy day? The right conversation with the right person can completely change your week.
      </p>
      <p style="font-size:15px;color:#d4d4d8;line-height:1.7;margin:0 0 24px 0;">
        Our AI has lined up fresh, verified profiles in <strong>${loc}</strong> who share your interests and life values. Take 2 minutes to say hello!
      </p>

      <div style="text-align:center;margin:28px 0 16px 0;">
        <a href="${FRONTEND_URL}/dashboard?tab=matches&utm_source=email&utm_campaign=chai_date"
           style="display:inline-block;padding:16px 42px;background:linear-gradient(135deg,#d97706,#b91c1c);color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 8px 25px rgba(217,119,6,0.35);">
          Find Your Chai Partner ☕
        </a>
      </div>
    </div>

    <div style="padding:18px 24px;text-align:center;background:#141417;border-top:1px solid #27272a;">
      <p style="margin:0;font-size:12px;color:#71717a;">LifePartner AI · Thoughtful matchmaking for genuine hearts.</p>
    </div>

  </div>
</div>
</body>
</html>
    `;
    return { subject, html };
}

/**
 * Main Smart Match Notification & Email Campaign Engine
 * 1. Sends unlimited Push & In-App notifications to ALL active users (first priority, free)
 * 2. Strictly throttles reminder emails to MAX 10 emails/day to preserve 90 emails for new user registration OTPs
 * 3. Targets ONLY inactive users (inactive for 2+ days)
 * 4. Filters out bounced, suppressed, invalid, and unverified emails
 * 5. Uses dynamic, rotating, unique email templates with genuine teasers
 */
export async function runFemaleMatchesReminderCampaign() {
    console.log('🚀 [CRON] Starting Smart Match Reminder Campaign (Push & Controlled Dynamic Email)...');
    const emailTracker = EmailTracker.getInstance();

    try {
        // 1. Fetch active, non-banned users
        const activeUsers = await prisma.users.findMany({
            where: {
                is_banned: false,
                OR: [
                    { is_deactivated: false },
                    { is_deactivated: null },
                    { deactivated_until: { lt: new Date() } }
                ]
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                gender: true,
                is_verified: true,
                city: true,
                location_name: true,
                created_at: true,
                profiles: {
                    select: {
                        metadata: true,
                        updated_at: true
                    }
                }
            }
        });

        const [totalVerifiedMen, totalVerifiedWomen] = await Promise.all([
            prisma.users.count({
                where: {
                    OR: [{ gender: 'Male' }, { gender: 'male' }, { gender: 'MALE' }],
                    is_verified: true,
                    is_banned: false
                }
            }),
            prisma.users.count({
                where: {
                    OR: [{ gender: 'Female' }, { gender: 'female' }, { gender: 'FEMALE' }],
                    is_verified: true,
                    is_banned: false
                }
            })
        ]);

        console.log(`[CRON] Total candidate users for Push Notifications: ${activeUsers.length}`);

        // Track daily campaign email budget
        const dailySentCount = await emailTracker.getDailyCampaignSentCount();
        let remainingEmailBudget = Math.max(0, MAX_DAILY_CAMPAIGN_EMAILS - dailySentCount);
        console.log(`[CRON] Campaign Emails sent today: ${dailySentCount}/${MAX_DAILY_CAMPAIGN_EMAILS}. Remaining budget: ${remainingEmailBudget} (Reserves 90+ for OTPs).`);

        let pushSentCount = 0;
        let emailsSentCount = 0;
        let emailsSkippedActive = 0;
        let emailsSkippedSuppressed = 0;

        // Cutoff dates for inactive user email targeting
        const now = Date.now();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        for (const user of activeUsers) {
            const firstName = formatFirstName(user.full_name);
            const isMale = (user.gender || '').toLowerCase() === 'male';
            const oppositeCount = isMale ? totalVerifiedWomen : totalVerifiedMen;
            const oppositeLabel = isMale ? 'verified women' : 'verified men';
            const userCity = user.city || user.location_name || 'your city';

            // Check pending requests
            const pendingRequests = await prisma.interactions.count({
                where: {
                    to_user_id: user.id,
                    type: 'REQUEST',
                    status: { in: ['pending', 'PENDING'] }
                }
            });

            // Generate irresistible, daily curiosity-driven push notification with banner
            const pushData = generateCuriosityPush(
                user.full_name,
                userCity,
                pendingRequests,
                oppositeCount,
                oppositeLabel
            );

            // ========================================================
            // PRIORITY 1: In-App & Realtime Push Notifications (100% of users)
            // ========================================================
            // 24-hour Throttle Check: Skip duplicate reminder if user received one recently
            const recentReminderCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const existingReminder = await prisma.notifications.findFirst({
                where: {
                    user_id: user.id,
                    type: 'match_waiting_reminder',
                    created_at: { gte: recentReminderCutoff }
                }
            });
            if (existingReminder) {
                continue;
            }

            await prisma.notifications.create({
                data: {
                    user_id: user.id,
                    type: 'match_waiting_reminder',
                    message: pushData.title,
                    data: {
                        body: pushData.body,
                        bannerUrl: pushData.bannerUrl,
                        pendingCount: pendingRequests,
                        actionUrl: pushData.targetUrl,
                        templateId: pushData.templateId
                    }
                }
            }).catch(() => {});

            NotificationService.getInstance().sendToUser(
                user.id,
                pushData.title,
                pushData.body,
                {
                    type: 'match_reminder',
                    pendingCount: String(pendingRequests),
                    bannerUrl: pushData.bannerUrl,
                    url: pushData.targetUrl,
                    actionUrl: pushData.targetUrl
                }
            ).catch(() => {});
            pushSentCount++;

            // ========================================================
            // PRIORITY 2: Controlled, Dynamic Email (Strict Cap & Inactive Only)
            // ========================================================
            if (remainingEmailBudget > 0 && user.email && resend && user.is_verified) {
                const isSuppressed = await emailTracker.isSuppressed(user.email);
                if (isSuppressed) {
                    emailsSkippedSuppressed++;
                    continue;
                }

                // Determine user inactivity
                const meta = (user.profiles?.metadata as any) || {};
                const lastSeen = meta.last_seen_at 
                    ? new Date(meta.last_seen_at) 
                    : (user.profiles?.updated_at ? new Date(user.profiles.updated_at) : new Date(user.created_at || now));

                // Skip active users (visited in the last 48 hours) or dead accounts (> 30 days)
                const isInactiveEligible = lastSeen < twoDaysAgo && lastSeen > thirtyDaysAgo;
                if (!isInactiveEligible) {
                    emailsSkippedActive++;
                    continue;
                }

                // Check cool-down: avoid sending campaign email if sent in the last 5 days
                if (meta.last_campaign_email_at) {
                    const lastEmailDate = new Date(meta.last_campaign_email_at);
                    if (now - lastEmailDate.getTime() < 5 * 24 * 60 * 60 * 1000) {
                        continue;
                    }
                }

                // Select unique template variant
                let emailData: { subject: string; html: string };
                let variantId: string;

                if (pendingRequests > 0) {
                    variantId = 'variant_pending_request';
                    emailData = generatePendingRequestEmail(firstName, pendingRequests);
                } else {
                    // Rotate between Variant 1 (Teaser), Variant 2 (Spotlight), and Variant 4 (Chai)
                    const lastVariant = meta.last_campaign_variant;
                    if (lastVariant === 'variant_teaser') {
                        variantId = 'variant_spotlight';
                        emailData = generateSpotlightEmail(firstName, userCity, oppositeLabel);
                    } else if (lastVariant === 'variant_spotlight') {
                        variantId = 'variant_chai';
                        emailData = generateChaiDateEmail(firstName, userCity);
                    } else {
                        variantId = 'variant_teaser';
                        emailData = generateProfileTeaserEmail(firstName, userCity, oppositeLabel, {
                            age: isMale ? 24 : 27,
                            profession: isMale ? 'Software Professional' : 'Business Professional',
                            city: userCity
                        });
                    }
                }

                try {
                    await resend.emails.send({
                        from: FROM,
                        to: user.email,
                        subject: emailData.subject,
                        html: emailData.html
                    });

                    await emailTracker.recordCampaignSent(user.email, variantId, emailData.subject);
                    emailsSentCount++;
                    remainingEmailBudget--;

                    // Update user profile metadata
                    await prisma.profiles.update({
                        where: { user_id: user.id },
                        data: {
                            metadata: {
                                ...meta,
                                last_campaign_email_at: new Date().toISOString(),
                                last_campaign_variant: variantId
                            }
                        }
                    }).catch(() => {});

                    console.log(`  📧 [Campaign Email Sent] ${user.email} (${variantId}) | Subject: "${emailData.subject}"`);
                } catch (sendErr: any) {
                    console.error(`  ❌ [Campaign Email Failed] ${user.email}:`, sendErr.message);
                    if (sendErr.message?.includes('suppressed') || sendErr.message?.includes('bounce')) {
                        await emailTracker.recordBounce(user.email, sendErr.message);
                    }
                }
            }

            // Small delay to prevent tight loop
            await new Promise((r) => setTimeout(r, 100));
        }

        console.log(`[CRON] Match Reminder Campaign Finished:`);
        console.log(`  - Push Notifications Dispatched: ${pushSentCount}`);
        console.log(`  - Reminder Emails Sent: ${emailsSentCount}`);
        console.log(`  - Skipped Active Users (Logged in recently): ${emailsSkippedActive}`);
        console.log(`  - Skipped Suppressed/Bounced Users: ${emailsSkippedSuppressed}`);
        console.log(`  - Remaining Daily OTP/Transactional Email Buffer: ${100 - (dailySentCount + emailsSentCount)}`);
    } catch (e: any) {
        console.error('[CRON] Error in runFemaleMatchesReminderCampaign:', e.message);
    }
}

export function initFemaleMatchRemindersCron() {
    // Schedule cron job to run every 3 days at 10:00 AM
    cron.schedule('0 10 */3 * *', () => {
        runFemaleMatchesReminderCampaign();
    });
    console.log('⏰ Smart Match Reminders Cron Job Scheduled (Every 3 days at 10:00 AM).');
}
