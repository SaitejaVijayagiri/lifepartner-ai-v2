import { prisma } from './src/prisma';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

// All identified females, EXCLUDING Harika (per user request)
const FEMALE_USERS = [
    { id: '7ca6e2af-0e82-4e81-92f5-9b9adbddec0a', name: 'Amrita' },
    { id: '4f3f1243-0aca-4630-bf2e-3733088b3f5b', name: 'Soumya Pushkar' },
    { id: '38000bba-5efe-4759-8be5-d5eea3f2822f', name: 'Lucy Verma' },
    { id: '3e289e58-3ac0-478b-987e-27ec807813c9', name: 'Shwetagagotia' },
    { id: '2356c678-abff-4e29-8343-5e1cf8480b8c', name: 'Tanishka Vuthuri' },
    { id: 'f763aa5c-1178-4611-9154-e26e5395e028', name: 'Tanu Singh' },
    // Unverified but still update gender + email
    { id: '32e49c6c-d57d-47c6-b1fd-802a516aa2db', name: 'Ramya' },
    { id: '55993005-5cc8-4d1d-bc3f-7ce5e11b7e41', name: 'Rajnandini panda' },
    { id: 'c0ccd101-9dd3-4fb4-8e1e-fe131298d809', name: 'Ashwarya Chughra' },
    { id: '2af1260b-af38-477d-ae35-a0f5d1946fb0', name: 'Krithi' },
    { id: 'b28d3099-8b1b-4b6b-b265-c1b45f0ae7e7', name: 'Krithi' },
    { id: '163a318c-622f-4963-82fe-f6b32337852b', name: 'Krithi reddy' },
];

function generateMatchWaitingEmail(firstName: string, totalMaleMatches: number): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:620px;margin:0 auto;padding:20px 10px;">

  <!-- Card -->
  <div style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);border:1px solid #f0e6ff;">

    <!-- Hero Banner -->
    <div style="background:linear-gradient(135deg,#E11D48 0%,#7C3AED 50%,#1D4ED8 100%);padding:52px 32px 40px;text-align:center;position:relative;">
      <div style="font-size:52px;margin-bottom:12px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">💌</div>
      <h1 style="margin:0 0 8px 0;font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
        Someone is waiting for you,<br/>
        <span style="color:#FDE68A;">${firstName}</span> ✨
      </h1>
      <p style="margin:12px 0 0 0;font-size:16px;color:rgba(255,255,255,0.85);font-weight:400;line-height:1.5;">
        Your profile is attracting attention on LifePartner AI
      </p>
    </div>

    <!-- Animated Match Counter Badge -->
    <div style="background:linear-gradient(135deg,#FFF7ED,#FEF3C7);border-bottom:1px solid #FDE68A;padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:15px;color:#92400E;font-weight:600;">
        🔥 <strong style="font-size:28px;color:#DC2626;">${totalMaleMatches}+</strong> verified men are looking for someone just like you right now
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding:40px 36px;">

      <p style="font-size:17px;color:#1e293b;font-weight:600;margin:0 0 12px 0;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#475569;line-height:1.8;margin:0 0 24px 0;">
        We noticed your LifePartner AI account is set up, but your match hasn't heard from you yet. 
        Our AI has found <strong>${totalMaleMatches}+ genuine, verified men</strong> who are actively looking for 
        a partner with your qualities — but they can only connect with you once you visit your dashboard.
      </p>

      <!-- 3 Reasons Card -->
      <div style="background:#F8FAFF;border-radius:16px;padding:24px 28px;border:1px solid #E0E7FF;margin-bottom:28px;">
        <h3 style="margin:0 0 16px 0;font-size:13px;color:#6366F1;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Why you shouldn't wait 💫</h3>
        
        <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
          <div style="font-size:22px;margin-right:14px;flex-shrink:0;">🎯</div>
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">AI-Curated Compatibility</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:#64748b;line-height:1.6;">Our AI matches you based on values, lifestyle & personality — not just looks.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
          <div style="font-size:22px;margin-right:14px;flex-shrink:0;">🛡️</div>
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">100% Verified Profiles</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:#64748b;line-height:1.6;">Every match is manually verified. You're always in a safe, trusted space.</p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;">
          <div style="font-size:22px;margin-right:14px;flex-shrink:0;">🔒</div>
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">Your Privacy is Protected</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:#64748b;line-height:1.6;">Contact details are only shared after mutual consent. You're always in control.</p>
          </div>
        </div>
      </div>

      <!-- Urgency nudge -->
      <div style="background:linear-gradient(135deg,#FFF1F2,#FFF0FB);border-radius:12px;padding:16px 20px;border-left:4px solid #E11D48;margin-bottom:28px;">
        <p style="margin:0;font-size:14px;color:#9F1239;line-height:1.6;">
          <strong>⏳ Don't miss out:</strong> New verified men join every day. The sooner you complete your profile, the more likely you are to find the right one first.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0 20px 0;">
        <a href="${FRONTEND_URL}/dashboard"
           style="display:inline-block;padding:18px 52px;background:linear-gradient(135deg,#E11D48,#7C3AED);color:#ffffff;text-decoration:none;border-radius:50px;font-size:17px;font-weight:700;box-shadow:0 8px 25px rgba(225,29,72,0.35);letter-spacing:0.3px;">
          View My Matches 💖
        </a>
      </div>
      <p style="text-align:center;font-size:13px;color:#94A3B8;margin:16px 0 0 0;">
        Takes less than 2 minutes · No credit card required
      </p>
    </div>

    <!-- Testimonial -->
    <div style="background:#F8FAFF;padding:28px 36px;border-top:1px solid #E0E7FF;border-bottom:1px solid #E0E7FF;">
      <p style="margin:0 0 12px 0;font-size:13px;color:#6366F1;font-weight:700;text-transform:uppercase;letter-spacing:1px;">💬 From our community</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.8;font-style:italic;">
        "I almost didn't complete my profile — I'm so glad I did. I met my fiancé on LifePartner AI 
        within 3 weeks. The AI matchmaking is genuinely different from other apps."
      </p>
      <p style="margin:12px 0 0 0;font-size:13px;color:#64748b;font-weight:600;">— Priya M., Hyderabad ⭐⭐⭐⭐⭐</p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 36px;text-align:center;background:#FAFAFA;">
      <div style="font-size:24px;margin-bottom:8px;">💍</div>
      <p style="margin:0 0 4px 0;font-size:13px;color:#64748b;font-weight:600;">LifePartner AI · Hyderabad, India</p>
      <p style="margin:0;font-size:12px;color:#94A3B8;">Connecting hearts, safely and smartly.</p>
      <p style="margin:12px 0 0 0;font-size:11px;color:#CBD5E1;">
        You're receiving this because you signed up at lifepartnerai.in.<br/>
        <a href="${FRONTEND_URL}" style="color:#6366F1;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>

  </div>
</div>
</body>
</html>
  `;
}

async function main() {
    // Count total verified males for the email
    const maleCount = await prisma.users.count({
        where: { gender: 'Male', is_verified: true }
    });

    console.log(`\n🚀 Starting: Update gender + Send emails to ${FEMALE_USERS.length} female users (excl. Harika)`);
    console.log(`📊 Total verified males to reference in email: ${maleCount}\n`);

    let emailsSent = 0;
    let genderUpdated = 0;
    let emailsFailed = 0;

    for (const user of FEMALE_USERS) {
        const firstName = user.name.split(' ')[0];
        console.log(`\n━━━ Processing: ${user.name} (${user.id})`);

        // Step 1: Fetch their email from DB
        const dbUser = await prisma.users.findUnique({
            where: { id: user.id },
            select: { email: true, gender: true }
        });

        if (!dbUser) {
            console.log(`  ❌ User not found in DB, skipping`);
            continue;
        }

        // Step 2: Update gender to Female
        try {
            await prisma.users.update({
                where: { id: user.id },
                data: { gender: 'Female' }
            });
            console.log(`  ✅ Gender updated → Female`);
            genderUpdated++;
        } catch (e: any) {
            console.log(`  ⚠️ Gender update failed: ${e.message}`);
        }

        // Step 3: Send email
        if (!dbUser.email) {
            console.log(`  ⚠️ No email address, skipping email`);
            continue;
        }

        try {
            const result = await resend.emails.send({
                from: FROM,
                to: dbUser.email,
                subject: `${firstName}, your match is waiting for you 💌`,
                html: generateMatchWaitingEmail(firstName, maleCount)
            });
            console.log(`  📧 Email sent → ${dbUser.email} (id: ${(result as any).id || 'ok'})`);
            emailsSent++;
        } catch (e: any) {
            console.log(`  ❌ Email failed: ${e.message}`);
            emailsFailed++;
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
    }

    // Final stats
    console.log(`\n\n═══════════════════════════════`);
    console.log(`✅ DONE`);
    console.log(`  Gender updated:  ${genderUpdated}/${FEMALE_USERS.length}`);
    console.log(`  Emails sent:     ${emailsSent}`);
    console.log(`  Emails failed:   ${emailsFailed}`);
    console.log(`═══════════════════════════════\n`);

    // Show new female total
    const newFemaleTotal = await prisma.users.count({ where: { gender: 'Female', is_verified: true } });
    console.log(`📊 New verified female total: ${newFemaleTotal}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
