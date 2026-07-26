import { prisma } from '../prisma';
import { NotificationService } from '../services/notification';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

async function main() {
    console.log('====================================================');
    console.log('🚀 Starting Female Matches Reminder Notification Campaign');
    console.log('====================================================\n');

    // 1. Fetch all active female users
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

    // Count total verified males
    const totalVerifiedMen = await prisma.users.count({
        where: {
            OR: [{ gender: 'Male' }, { gender: 'male' }],
            is_verified: true,
            is_banned: false
        }
    });

    console.log(`📊 Found ${femaleUsers.length} female users in total.`);
    console.log(`📊 Total verified males available: ${totalVerifiedMen}\n`);

    let notificationsCreated = 0;
    let pushSentCount = 0;
    let emailsSentCount = 0;
    let emailsFailedCount = 0;

    for (const user of femaleUsers) {
        const name = user.full_name || 'there';
        const firstName = name.split(' ')[0];

        // 2. Count pending requests received by this female user
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

        console.log(`👉 Processing [${user.full_name || 'User'}] (${user.id}):`);
        console.log(`   - Pending Requests: ${pendingRequests}`);

        // 3. Create In-App Notification in DB
        try {
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
            });
            notificationsCreated++;
            console.log(`   ✅ In-App Notification created`);
        } catch (e: any) {
            console.error(`   ⚠️ Failed to create DB notification:`, e.message);
        }

        // 4. Send Realtime Push Notification via NotificationService
        try {
            await NotificationService.getInstance().sendToUser(
                user.id,
                notificationTitle,
                notificationBody,
                {
                    type: 'match_reminder',
                    pendingCount: String(pendingRequests),
                    actionUrl: '/dashboard?tab=requests'
                }
            );
            pushSentCount++;
            console.log(`   ✅ Push notification sent (or queued)`);
        } catch (e: any) {
            console.error(`   ⚠️ Push failed:`, e.message);
        }

        // 5. Send Email via Resend
        if (user.email && resend) {
            try {
                const subject = pendingRequests > 0
                    ? `${firstName}, you have ${pendingRequests} pending match request${pendingRequests > 1 ? 's' : ''} waiting! 💌`
                    : `${firstName}, your match is waiting for you 💌`;

                await resend.emails.send({
                    from: FROM,
                    to: user.email,
                    subject,
                    html: generateMatchWaitingEmail(firstName, pendingRequests, totalVerifiedMen)
                });
                emailsSentCount++;
                console.log(`   📧 Email sent → ${user.email}`);
            } catch (e: any) {
                emailsFailedCount++;
                console.error(`   ❌ Email failed to ${user.email}:`, e.message);
            }
        } else if (!resend) {
            console.log(`   ℹ️ Skipping email (RESEND_API_KEY not configured)`);
        } else {
            console.log(`   ℹ️ Skipping email (No email address on profile)`);
        }

        // Small pause between operations
        await new Promise((r) => setTimeout(r, 400));
    }

    console.log('\n====================================================');
    console.log('✅ CAMPAIGN COMPLETED SUMMARY');
    console.log('====================================================');
    console.log(` Total Female Users Processed: ${femaleUsers.length}`);
    console.log(` In-App Notifications Created: ${notificationsCreated}`);
    console.log(` Push Notifications Sent:       ${pushSentCount}`);
    console.log(` Emails Sent:                   ${emailsSentCount}`);
    console.log(` Emails Failed:                 ${emailsFailedCount}`);
    console.log('====================================================\n');
}

main()
    .catch((err) => {
        console.error('Fatal execution error:', err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
