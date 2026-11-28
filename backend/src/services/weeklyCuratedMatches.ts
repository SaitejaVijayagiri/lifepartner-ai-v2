import cron from 'node-cron';
import { prisma } from '../prisma';
import { NotificationService } from './notification';
import { Resend } from 'resend';
import { EmailTracker } from './emailTracker';
import { AIMatchEngine } from './aiMatchEngine';
import { resolveUserTimezone, getUserLocalTime } from './timezoneHelper';
import { formatFirstName } from './femaleMatchReminders';
import { sanitizePhotoUrl, extractPhotosList, hasValidPhoto, isPhotoPrivacyShieldEnabled, getBlockedUserIdSet } from '../utils/photoUrl';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

// Maximum campaign emails per batch to strictly preserve OTP budget
const MAX_CAMPAIGN_EMAILS_PER_RUN = 10;

export interface CuratedMaleMatch {
    id: string;
    name: string;
    age: number | null;
    city: string;
    profession: string;
    education: string;
    photoUrl: string | null;
    photosCount: number;
    compatibilityScore: number;
    matchReasons: string[];
    strengths: string[];
}

/**
 * Evaluates male candidate profile quality & aesthetic completeness
 * (High-res real photos, complete career, education, and genuine bio).
 */
export function scoreMaleProfileQuality(candidate: any): number {
    let score = 40;
    const meta = (candidate.profiles?.metadata as any) || {};
    const photosList = extractPhotosList(candidate.profiles, meta, candidate.avatar_url);
    const validPhotos = photosList.filter((p: any) => typeof p === 'string' && hasValidPhoto(p));

    // Real Photo Quality & Count
    if (validPhotos.length >= 3) score += 35;
    else if (validPhotos.length === 2) score += 25;
    else if (validPhotos.length === 1) score += 15;
    else score -= 25; // No real photos

    // Profession
    const prof = meta.career?.profession || '';
    if (prof && prof.trim().length >= 3 && !prof.toLowerCase().includes('other')) {
        score += 15;
    }

    // Education
    const edu = (meta.career?.educationLevel || meta.career?.education || '').toLowerCase();
    if (edu && (edu.includes('master') || edu.includes('bachelor') || edu.includes('doctor') || edu.includes('phd') || edu.includes('engineer'))) {
        score += 10;
    }

    // Bio substance
    const bio = candidate.profiles?.raw_prompt || meta.bio || meta.aboutMe || '';
    if (bio && bio.trim().length >= 40) {
        score += 10;
    }

    // Lifestyle & clean habits
    const smoking = (meta.lifestyle?.smoking || meta.lifestyle?.smoke || '').toLowerCase();
    if (smoking === 'no') score += 5;

    return Math.max(0, Math.min(100, score));
}

/**
 * Discovers and computes the Top 3 personalized matches for a specific female user
 * based on deep AI compatibility and male profile quality.
 */
export async function getCuratedMatchesForFemale(
    femaleUser: any,
    topMalesPool: any[],
    excludeUserIds: Set<string>
): Promise<CuratedMaleMatch[]> {
    const femaleAge = femaleUser.age || 25;
    const femaleId = femaleUser.id;

    const scored: Array<{ male: any; analysis: any; totalScore: number }> = [];

    for (const male of topMalesPool) {
        if (male.id === femaleId || excludeUserIds.has(male.id)) continue;

        // Comfortable age proximity filter (-2 to +8 years)
        if (male.age) {
            const ageDiff = male.age - femaleAge;
            if (ageDiff < -3 || ageDiff > 10) continue;
        }

        const analysis = AIMatchEngine.computeMatch(femaleUser, male);
        const qualityScore = scoreMaleProfileQuality(male);

        // Combined score: 70% AI Compatibility + 30% Male Profile Quality
        const compositeScore = Math.round((analysis.score * 0.7) + (qualityScore * 0.3));

        scored.push({
            male,
            analysis,
            totalScore: Math.min(99, Math.max(50, compositeScore))
        });
    }

    scored.sort((a, b) => b.totalScore - a.totalScore);
    const topThree = scored.slice(0, 3);

    return topThree.map(({ male, analysis, totalScore }) => {
        const meta = (male.profiles?.metadata as any) || {};
        const rawPhotos = extractPhotosList(male.profiles, meta, male.avatar_url);
        const validPhotos = rawPhotos.filter((p: any) => typeof p === 'string' && hasValidPhoto(p));
        const mainPhoto = validPhotos[0]
            ? sanitizePhotoUrl(validPhotos[0], male.full_name || male.id)
            : sanitizePhotoUrl(male.avatar_url, male.full_name || male.id);

        const locParts = [meta.location?.city || male.city, meta.location?.state || male.state].filter(Boolean);
        const locationStr = locParts.length > 0 ? locParts.join(', ') : (meta.location?.country || male.location_name || 'Verified Member');

        return {
            id: male.id,
            name: (male.full_name || 'Member').trim().split(' ')[0], // First name for warmth & privacy
            age: male.age,
            city: locationStr,
            profession: meta.career?.profession || 'Professional',
            education: meta.career?.educationLevel || meta.career?.education || '',
            photoUrl: mainPhoto,
            photosCount: validPhotos.length,
            compatibilityScore: totalScore,
            matchReasons: analysis.reasons.slice(0, 2),
            strengths: analysis.strengths.slice(0, 2)
        };
    });
}

/**
 * Builds the elegant, responsive HTML email showcasing the top curated matches for a female user.
 * Strictly avoids superficial wording ("handsome") — focuses on high compatibility, career, and values.
 */
export function generateWeeklyCuratedEmail(
    firstName: string,
    matches: CuratedMaleMatch[]
): { subject: string; html: string } {
    const topScore = matches[0]?.compatibilityScore || 96;
    const subject = `✨ ${firstName}, your 3 weekly top matches are here (Up to ${topScore}% Match)`;

    const matchCardsHtml = matches.map((m, idx) => {
        const profileLink = `${FRONTEND_URL}/dashboard?tab=matches&highlight=${m.id}&utm_source=email&utm_campaign=weekly_curated`;
        const avatarSrc = m.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`;
        const tags = [...m.matchReasons, ...m.strengths].slice(0, 2);

        return `
        <!-- Match Card ${idx + 1} -->
        <div style="background:#27272a;border-radius:20px;padding:20px;border:1px solid #3f3f46;margin-bottom:18px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="90" valign="top" style="padding-right:16px;">
                <img src="${avatarSrc}" alt="${m.name}"
                     width="84" height="84"
                     style="width:84px;height:84px;border-radius:18px;object-fit:cover;border:2px solid #a855f7;display:block;" />
              </td>
              <td valign="top">
                <div style="display:inline-block;padding:3px 10px;background:rgba(168,85,247,0.18);border:1px solid rgba(168,85,247,0.45);border-radius:12px;color:#d8b4fe;font-size:11px;font-weight:700;margin-bottom:6px;">
                  🔥 ${m.compatibilityScore}% COMPATIBILITY
                </div>
                <h3 style="margin:0 0 4px 0;font-size:18px;color:#ffffff;font-weight:700;">
                  ${m.name}${m.age ? `, ${m.age}` : ''}
                </h3>
                <p style="margin:0 0 6px 0;font-size:13px;color:#a1a1aa;line-height:1.4;">
                  📍 ${m.city} &nbsp;•&nbsp; 💼 ${m.profession}
                </p>
                ${m.education ? `<p style="margin:0 0 8px 0;font-size:12px;color:#c084fc;">🎓 ${m.education}</p>` : ''}
                ${tags.length > 0 ? `
                  <div style="margin:6px 0 12px 0;">
                    ${tags.map(t => `<span style="display:inline-block;background:#3f3f46;color:#e4e4e7;padding:3px 8px;border-radius:6px;font-size:11px;margin:2px 3px 2px 0;">${t}</span>`).join('')}
                  </div>
                ` : ''}
                <div>
                  <a href="${profileLink}"
                     style="display:inline-block;padding:8px 18px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#ffffff;text-decoration:none;border-radius:24px;font-size:12px;font-weight:700;letter-spacing:0.2px;">
                    View Profile & Connect →
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </div>
        `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Top Matches | LifePartner AI</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
<div style="max-width:580px;margin:0 auto;padding:24px 12px;">

  <!-- Outer Card -->
  <div style="background:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 50px rgba(0,0,0,0.5);">

    <!-- Header Gradient Banner -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 50%,#f59e0b 100%);padding:36px 24px;text-align:center;">
      <div style="display:inline-block;padding:5px 14px;background:rgba(0,0,0,0.35);border-radius:30px;font-size:11px;font-weight:800;color:#fef08a;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
        ✨ WEEKLY AI CURATED MATCHES
      </div>
      <h1 style="margin:0 0 10px 0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.25;">
        ${firstName}, your top 3 matches this week! 🎯
      </h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.92);font-weight:400;line-height:1.5;">
        Our AI evaluated verified profiles to find your strongest alignment in values, career ambitions, and lifestyle.
      </p>
    </div>

    <!-- Match Cards Container -->
    <div style="padding:28px 20px;">
      ${matchCardsHtml}

      <!-- Main Action CTA -->
      <div style="text-align:center;margin:28px 0 12px 0;">
        <a href="${FRONTEND_URL}/dashboard?tab=matches&utm_source=email&utm_campaign=weekly_curated_all"
           style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#9333ea,#e11d48);color:#ffffff;text-decoration:none;border-radius:50px;font-size:15px;font-weight:700;box-shadow:0 8px 25px rgba(147,51,234,0.35);">
          Explore All Curated Matches →
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#71717a;margin:12px 0 0 0;">
        🛡️ Verified Profiles • Women-First Privacy • 100% Free Direct Chat
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:18px 24px;text-align:center;background:#141417;border-top:1px solid #27272a;">
      <p style="margin:0 0 6px 0;font-size:12px;color:#a1a1aa;">
        You're receiving this weekly digest because you are a verified member on LifePartner AI.
      </p>
      <p style="margin:0;font-size:11px;color:#71717a;">
        LifePartner AI · Finding your life partner, safely and smartly.
      </p>
    </div>

  </div>
</div>
</body>
</html>
    `;

    return { subject, html };
}

/**
 * Runs the Weekly Curated Matches Campaign for all verified female users.
 * - Analyzes top verified male profiles.
 * - Computes top 3 personalized compatible matches for each female.
 * - Sends in-app + push notification.
 * - Sends rich curated HTML email (strictly within email budget and 6-day cooldown).
 */
export async function runWeeklyCuratedMatchesCampaign(options?: {
    dryRun?: boolean;
    forceSend?: boolean;
    targetEmail?: string;
}): Promise<{
    success: boolean;
    femalesScanned: number;
    pushSent: number;
    emailsSent: number;
    skippedQuietHours: number;
    skippedRecentlySent: number;
}> {
    console.log('🚀 [Weekly Curated Matches] Starting weekly curated matching campaign for females...');
    const emailTracker = EmailTracker.getInstance();
    const notificationService = NotificationService.getInstance();

    const dryRun = Boolean(options?.dryRun);
    const forceSend = Boolean(options?.forceSend);
    const targetEmail = options?.targetEmail?.trim().toLowerCase();

    // 1. Fetch top verified male candidate pool (with photos, verified, active)
    const topMales = await prisma.users.findMany({
        where: {
            OR: [{ gender: 'Male' }, { gender: 'male' }, { gender: 'MALE' }],
            is_verified: true,
            is_banned: false,
            age: { gte: 18 },
            full_name: { not: null },
            avatar_url: { not: null },
            AND: [
                { OR: [{ is_deactivated: false }, { is_deactivated: null }, { deactivated_until: { lt: new Date() } }] }
            ]
        },
        include: {
            profiles: true
        },
        take: 150
    });

    // Score and filter high-quality males
    const qualifiedMales = topMales
        .filter(m => {
            const url = m.avatar_url || '';
            return url && !url.includes('dicebear') && !url.includes('api.dicebear.com') && url.trim() !== '';
        })
        .sort((a, b) => scoreMaleProfileQuality(b) - scoreMaleProfileQuality(a));

    if (qualifiedMales.length === 0) {
        console.warn('[Weekly Curated Matches] No qualified verified males found in pool.');
        return { success: false, femalesScanned: 0, pushSent: 0, emailsSent: 0, skippedQuietHours: 0, skippedRecentlySent: 0 };
    }

    // 2. Fetch female users
    const whereFemale: any = {
        OR: [{ gender: 'Female' }, { gender: 'female' }, { gender: 'FEMALE' }],
        is_verified: true,
        is_banned: false,
        AND: [
            { OR: [{ is_deactivated: false }, { is_deactivated: null }, { deactivated_until: { lt: new Date() } }] }
        ]
    };
    if (targetEmail) {
        whereFemale.email = { equals: targetEmail, mode: 'insensitive' };
    }

    const femaleUsers = await prisma.users.findMany({
        where: whereFemale,
        include: {
            profiles: true
        },
        take: 500
    });

    let pushSent = 0;
    let emailsSent = 0;
    let skippedQuietHours = 0;
    let skippedRecentlySent = 0;

    const dailySentCount = await emailTracker.getDailyCampaignSentCount();
    let remainingBudget = Math.max(0, MAX_CAMPAIGN_EMAILS_PER_RUN - dailySentCount);

    const now = Date.now();
    const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000);

    for (const female of femaleUsers) {
        const userTimezone = resolveUserTimezone(female);
        const local = getUserLocalTime(userTimezone);

        if (!forceSend && local.isQuietHours) {
            skippedQuietHours++;
            continue;
        }

        const meta = (female.profiles?.metadata as any) || {};
        if (!forceSend && meta.last_weekly_curated_email_at) {
            const lastSent = new Date(meta.last_weekly_curated_email_at);
            if (lastSent > sixDaysAgo) {
                skippedRecentlySent++;
                continue;
            }
        }

        // Fetch blocked or connected IDs for this female
        const blockedIds = await getBlockedUserIdSet(prisma, female.id);
        const interactions = await prisma.interactions.findMany({
            where: {
                OR: [
                    { from_user_id: female.id },
                    { to_user_id: female.id, status: { in: ['accepted', 'connected'] } }
                ]
            },
            select: { to_user_id: true, from_user_id: true, status: true }
        });
        const excludeSet = new Set<string>([female.id, ...blockedIds]);
        for (const i of interactions) {
            if (i.from_user_id === female.id && i.to_user_id) excludeSet.add(i.to_user_id);
            if (i.to_user_id === female.id && i.from_user_id && (i.status === 'accepted' || i.status === 'connected')) {
                excludeSet.add(i.from_user_id);
            }
        }

        const curatedMatches = await getCuratedMatchesForFemale(female, qualifiedMales, excludeSet);
        if (curatedMatches.length === 0) continue;

        const firstName = formatFirstName(female.full_name);
        const pushTitle = `✨ ${firstName}, your 3 weekly top matches are ready!`;
        const pushBody = `Our AI analyzed top verified profiles to find your highest compatibility matches this week. Tap to explore.`;
        const pushUrl = `/dashboard?tab=matches&utm_source=weekly_curated`;

        if (!dryRun) {
            // 1. Dispatch In-App & Push Notification
            await prisma.notifications.create({
                data: {
                    user_id: female.id,
                    type: 'weekly_curated_matches',
                    message: pushTitle,
                    data: {
                        body: pushBody,
                        screen: 'matches',
                        url: pushUrl,
                        matchCount: curatedMatches.length,
                        topMatchId: curatedMatches[0]?.id
                    }
                }
            }).catch(() => {});

            notificationService.sendToUser(female.id, pushTitle, pushBody, {
                type: 'weekly_curated_matches',
                screen: 'matches',
                url: pushUrl
            }).catch(() => {});
            pushSent++;

            // 2. Dispatch Curated HTML Email if budget & cooldown permits
            if (remainingBudget > 0 && female.email && resend) {
                const isSuppressed = await emailTracker.isSuppressed(female.email);
                if (!isSuppressed) {
                    const emailData = generateWeeklyCuratedEmail(firstName, curatedMatches);
                    try {
                        await resend.emails.send({
                            from: FROM,
                            to: female.email,
                            subject: emailData.subject,
                            html: emailData.html
                        });

                        await emailTracker.recordCampaignSent(female.email, 'weekly_curated_matches', emailData.subject);
                        emailsSent++;
                        remainingBudget--;

                        await prisma.profiles.update({
                            where: { user_id: female.id },
                            data: {
                                metadata: {
                                    ...meta,
                                    last_weekly_curated_email_at: new Date().toISOString()
                                }
                            }
                        }).catch(() => {});

                        console.log(`  📧 [Weekly Curated Email Sent] ${female.email} | Subject: "${emailData.subject}"`);
                    } catch (emailErr: any) {
                        console.error(`  ❌ [Weekly Curated Email Error] ${female.email}:`, emailErr?.message || emailErr);
                    }
                }
            }
        } else {
            pushSent++;
            if (female.email) emailsSent++;
        }
    }

    console.log(`[Weekly Curated Matches] Finished: ${pushSent} push, ${emailsSent} emails sent (Skipped: ${skippedQuietHours} quiet hours, ${skippedRecentlySent} recently sent).`);

    return {
        success: true,
        femalesScanned: femaleUsers.length,
        pushSent,
        emailsSent,
        skippedQuietHours,
        skippedRecentlySent
    };
}

/**
 * Initializes the Weekly Curated Matches Cron Job.
 * Runs every Sunday at 10:00 AM.
 */
export function initWeeklyCuratedMatchesCron() {
    // Every Sunday at 10:00 AM (0 10 * * 0)
    cron.schedule('0 10 * * 0', async () => {
        try {
            const { withCronLock } = require('../utils/cronLock');
            await withCronLock('weekly_curated_matches', 3600, async () => {
                await runWeeklyCuratedMatchesCampaign();
            });
        } catch (err: any) {
            console.error('[CRON] Weekly Curated Matches error:', err?.message || err);
        }
    });
    console.log('⏰ Weekly Curated Matches Cron Job Scheduled (Runs every Sunday at 10:00 AM).');
}
