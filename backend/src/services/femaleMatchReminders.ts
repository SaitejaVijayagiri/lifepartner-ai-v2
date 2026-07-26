import cron from 'node-cron';
import { prisma } from '../prisma';
import { NotificationService } from './notification';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

function generateMatchWaitingEmail(firstName: string, waitingCount: number, totalVerifiedMen: number): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Matches Are Waiting | LifePartner AI</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 12px;">

  <!-- Main Card -->
  <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 15px 45px rgba(0,0,0,0.08);border:1px solid #f1f5f9;">

    <!-- Gradient Header Banner -->
    <div style="background:linear-gradient(135deg,#e11d48 0%,#8b5cf6 50%,#3b82f6 100%);padding:48px 32px 36px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;display:inline-block;">💌</div>
      <h1 style="margin:0 0 10px 0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">
        Matches are waiting for you,<br/>
        <span style="color:#fef08a;">${firstName}</span> ✨
      </h1>
      <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);font-weight:400;">
        Your profile is generating high interest on LifePartner AI
      </p>
    </div>

    <!-- Match Counter Highlight -->
    <div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border-bottom:1px solid #fde68a;padding:18px 24px;text-align:center;">
      <p style="margin:0;font-size:15px;color:#92400e;font-weight:600;">
        🔥 <strong style="font-size:24px;color:#dc2626;">${waitingCount > 0 ? waitingCount : totalVerifiedMen}+</strong> ${waitingCount > 0 ? 'new pending interests & verified matches' : 'verified men looking for a partner like you'} waiting
      </p>
    </div>

    <!-- Body Section -->
    <div style="padding:36px 32px;">
      <p style="font-size:16px;color:#1e293b;font-weight:700;margin:0 0 12px 0;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px 0;">
        Verified matches are waiting to connect with you! Our AI has found genuine, verified profiles aligned with your values, lifestyle, and personality.
      </p>

      <!-- Key Benefits Card -->
      <div style="background:#f8fafc;border-radius:18px;padding:22px 24px;border:1px solid #e2e8f0;margin-bottom:28px;">
        <h3 style="margin:0 0 14px 0;font-size:13px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;">Why log in today 💫</h3>
        
        <div style="margin-bottom:14px;">
          <strong style="font-size:14px;color:#0f172a;">🎯 AI Compatibility Matching</strong>
          <p style="margin:3px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">Connect based on emotional alignment, life vision, and mutual respect.</p>
        </div>

        <div style="margin-bottom:14px;">
          <strong style="font-size:14px;color:#0f172a;">🛡️ 100% Verified Profiles</strong>
          <p style="margin:3px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">Every match is verified for safety & trust in a secure environment.</p>
        </div>

        <div>
          <strong style="font-size:14px;color:#0f172a;">🔒 Complete Privacy Control</strong>
          <p style="margin:3px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">Your contact details remain 100% private until you accept a connection.</p>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align:center;margin:32px 0 16px 0;">
        <a href="${FRONTEND_URL}/dashboard?tab=requests"
           style="display:inline-block;padding:16px 44px;background:linear-gradient(135deg,#e11d48,#7c3aed);color:#ffffff;text-decoration:none;border-radius:50px;font-size:16px;font-weight:700;box-shadow:0 8px 20px rgba(225,29,72,0.3);">
          View My Matches 💖
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px;text-align:center;background:#f8fafc;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">LifePartner AI · Connecting verified hearts safely.</p>
    </div>

  </div>
</div>
</body>
</html>
    `;
}

export async function runFemaleMatchesReminderCampaign() {
    console.log('[CRON] Starting Female Matches Reminder Notification Campaign...');
    try {
        const femaleUsers = await prisma.users.findMany({
            where: {
                is_banned: false,
                AND: [
                    {
                        OR: [
                            { gender: 'Female' },
                            { gender: 'female' },
                            { gender: 'FEMALE' }
                        ]
                    },
                    {
                        OR: [
                            { is_deactivated: false },
                            { is_deactivated: null },
                            { deactivated_until: { lt: new Date() } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                gender: true,
                is_verified: true
            }
        });

        const totalVerifiedMen = await prisma.users.count({
            where: {
                OR: [{ gender: 'Male' }, { gender: 'male' }],
                is_verified: true,
                is_banned: false
            }
        });

        console.log(`[CRON] Processing ${femaleUsers.length} female users...`);

        for (const user of femaleUsers) {
            const name = user.full_name || 'there';
            const firstName = name.split(' ')[0];

            const pendingRequests = await prisma.interactions.count({
                where: {
                    to_user_id: user.id,
                    status: 'PENDING'
                }
            });

            const notificationTitle = `💌 ${firstName}, your matches are waiting!`;
            const notificationBody = pendingRequests > 0
                ? `You have ${pendingRequests} pending match request${pendingRequests > 1 ? 's' : ''} waiting for your response.`
                : `Over ${totalVerifiedMen}+ verified matches are waiting to meet someone like you on LifePartner AI.`;

            // In-app Notification
            await prisma.notifications.create({
                data: {
                    user_id: user.id,
                    type: 'match_waiting_reminder',
                    message: notificationBody,
                    data: {
                        type: 'match_reminder',
                        pendingCount: pendingRequests,
                        actionUrl: '/dashboard?tab=requests'
                    }
                }
            }).catch(() => {});

            // Realtime Push Notification
            NotificationService.getInstance().sendToUser(
                user.id,
                notificationTitle,
                notificationBody,
                {
                    type: 'match_reminder',
                    pendingCount: String(pendingRequests),
                    actionUrl: '/dashboard?tab=requests'
                }
            ).catch(() => {});

            // Email
            if (user.email && resend) {
                const subject = pendingRequests > 0
                    ? `${firstName}, you have ${pendingRequests} pending match request${pendingRequests > 1 ? 's' : ''} waiting! 💌`
                    : `${firstName}, your match is waiting for you 💌`;

                resend.emails.send({
                    from: FROM,
                    to: user.email,
                    subject,
                    html: generateMatchWaitingEmail(firstName, pendingRequests, totalVerifiedMen)
                }).catch((e: any) => console.error(`[CRON Email Error] ${user.email}:`, e.message));
            }

            await new Promise((r) => setTimeout(r, 300));
        }

        console.log('[CRON] Female Matches Reminder Campaign completed successfully.');
    } catch (e: any) {
        console.error('[CRON] Error in runFemaleMatchesReminderCampaign:', e.message);
    }
}

export function initFemaleMatchRemindersCron() {
    // Schedule cron job to run every 3 days at 10:00 AM
    cron.schedule('0 10 */3 * *', () => {
        runFemaleMatchesReminderCampaign();
    });
    console.log('⏰ Female Matches Reminder Cron Job Scheduled (Every 3 days at 10:00 AM).');
}
