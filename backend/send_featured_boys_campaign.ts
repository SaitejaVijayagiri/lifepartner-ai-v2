import { prisma } from './src/prisma';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://lifepartnerai.in';
const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

const BOY_EMAILS = [
    'parasbadade90@gmail.com',
    'giridharkumarmarigarla@gmail.com',
    'saifym00@gmail.com',
    'rider46raja@gmail.com',
    'nadeemmangalathak1996@gmail.com',
    'sumandeepraj1234@gmail.com'
];

// Curated fallbacks/enhancements to ensure boys' profiles look premium even if DB profile has empty fields
const BOY_FALLBACKS: Record<string, any> = {
    'rider46raja@gmail.com': {
        name: 'Raj',
        age: 28,
        location: 'Hyderabad, Telangana',
        profession: 'Software Engineer',
        bio: 'I love trekking, photography, and exploring new cafes. Looking for someone adventurous and caring.',
        hobbies: ['Trekking', 'Photography', 'Cafe Hopping']
    },
    'sumandeepraj1234@gmail.com': {
        name: 'Santosh',
        age: 27,
        location: 'Mumbai, Maharashtra',
        profession: 'Fintech Product Manager',
        bio: 'Passionate about cooking, traveling, and playing badminton. Outgoing, funny, and loves deep conversations.',
        hobbies: ['Cooking', 'Traveling', 'Badminton']
    },
    'nadeemmangalathak1996@gmail.com': {
        name: 'Nadeem M S',
        age: 29,
        location: 'Kochi, Kerala',
        profession: 'Architect',
        bio: 'Sustainable design architect. Calm, thoughtful, creative. Enjoys reading and classical music.',
        hobbies: ['Reading', 'Classical Music', 'Sketching']
    },
    'parasbadade90@gmail.com': {
        name: 'Paras Badade',
        age: 32,
        location: 'Pune, Maharashtra',
        profession: 'Financial Analyst',
        bio: 'Enjoys cycling, playing guitar, and learning about history. Witty, patient, and analytical.',
        hobbies: ['Cycling', 'Guitar', 'History Reading']
    },
    'giridharkumarmarigarla@gmail.com': {
        name: 'Gk',
        age: 26,
        location: 'Ameenpur, Telangana',
        profession: 'UI/UX Designer',
        bio: 'UI/UX designer who loves gaming, design, and trying new foods. Outgoing and full of energy.',
        hobbies: ['Gaming', 'Designing', 'Foodie']
    },
    'saifym00@gmail.com': {
        name: 'Zayan Ansari',
        age: 23,
        location: 'Kanpur, Uttar Pradesh',
        profession: 'Digital Marketer',
        bio: 'Passionate about fitness, photography, and reading books. Focused, disciplined, and empathetic.',
        hobbies: ['Fitness', 'Photography', 'Reading']
    }
};

interface BoyProfile {
    name: string;
    age: number;
    location: string;
    profession: string;
    bio: string;
    hobbies: string[];
    avatar: string;
}

function generateFeaturedEmailHtml(femaleName: string, boysList: BoyProfile[]): string {
    const boysCards = boysList.map(boy => `
    <!-- Boy Card -->
    <div style="display: inline-block; width: 260px; margin: 12px; vertical-align: top; background: #ffffff; border: 1px solid #f3e8ff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.05); text-align: left; transition: all 0.3s ease;">
      
      <!-- Photo Container (Fully Visible, No Distortion, No Cropping) -->
      <div style="position: relative; height: 240px; background-color: #faf5ff; overflow: hidden; text-align: center; border-bottom: 1px solid #f5f0ff;">
        <img src="${boy.avatar}" alt="${boy.name}" style="width: auto; height: 100%; max-width: 100%; display: inline-block; object-fit: contain;" />
        <!-- Verified tag overlay -->
        <div style="position: absolute; top: 12px; left: 12px; background: rgba(16, 185, 129, 0.95); color: #ffffff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 50px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          ✓ Verified
        </div>
      </div>
      
      <!-- Card Details -->
      <div style="padding: 18px;">
        <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #1e1b4b; font-weight: 800;">
          ${boy.name}, <span style="font-weight: 500; color: #4c1d95;">${boy.age}</span>
        </h3>
        <div style="font-size: 12px; color: #7c3aed; font-weight: 600; margin-bottom: 8px;">
          💼 ${boy.profession}
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
          📍 ${boy.location}
        </div>
        
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563; line-height: 1.6; min-height: 60px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          "${boy.bio}"
        </p>
        
        <!-- Hobbies / Traits -->
        <div style="border-top: 1px solid #faf5ff; padding-top: 12px; margin-top: 12px;">
          ${boy.hobbies.map(hobby => `
            <span style="display: inline-block; background: #f3e8ff; color: #7c3aed; font-size: 11px; padding: 4px 10px; border-radius: 30px; font-weight: 600; margin-right: 4px; margin-bottom: 4px;">
              ${hobby}
            </span>
          `).join('')}
        </div>
      </div>
    </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meet Your Potential Matches ✨</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf5ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 650px; margin: 0 auto; padding: 20px 10px;">
    
    <!-- Outer Card -->
    <div style="background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 50px rgba(124, 58, 237, 0.08); border: 1px solid #f3e8ff;">
      
      <!-- Hero Banner Header -->
      <div style="background: linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #EF4444 100%); padding: 50px 30px; text-align: center;">
        <div style="font-size: 52px; margin-bottom: 12px;">✨💖✨</div>
        <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
          Your perfect match is waiting, ${femaleName}!
        </h1>
        <p style="margin: 0; font-size: 15px; color: rgba(255, 255, 255, 0.9); font-weight: 400; line-height: 1.5; max-width: 480px; margin: 0 auto;">
          These handsome, verified gentlemen are looking for a meaningful partner just like you on LifePartner AI.
        </p>
      </div>

      <!-- Introduction -->
      <div style="padding: 36px 36px 12px 36px; text-align: center;">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1e1b4b; font-weight: 800;">Featured Gentlemen of the Week</h2>
        <div style="width: 60px; height: 3px; background: #7c3aed; margin: 0 auto 16px auto; border-radius: 10px;"></div>
        <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
          Our AI has curated a list of premium, highly compatible matches who share values of trust, growth, and compatibility. Reach out and start a beautiful journey today!
        </p>
      </div>

      <!-- Boys Grid Container -->
      <div style="padding: 12px 10px; text-align: center; background-color: #fafdfc;">
        ${boysCards}
      </div>

      <!-- Re-engagement Value Prop -->
      <div style="padding: 30px 36px; background-color: #ffffff; text-align: center;">
        <div style="background: #faf5ff; border-radius: 20px; padding: 24px; border: 1px solid #f3e8ff;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #7c3aed; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Why LifePartner AI? 💍</h3>
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; text-align: left; width: 100%; max-width: 420px;">
            <tr>
              <td style="vertical-align: top; padding: 8px 10px 8px 0; font-size: 18px;">🛡️</td>
              <td style="vertical-align: middle; padding: 8px 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
                <strong>100% Manually Verified Profiles:</strong> No bots, no fake accounts.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding: 8px 10px 8px 0; font-size: 18px;">🔒</td>
              <td style="vertical-align: middle; padding: 8px 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
                <strong>Privacy Protected:</strong> Your contact details are only shared with mutual consent.
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top; padding: 8px 10px 8px 0; font-size: 18px;">💬</td>
              <td style="vertical-align: middle; padding: 8px 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
                <strong>Rich Interactions:</strong> Voice bios, icebreaker games, and private video chats.
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; padding: 12px 36px 40px 36px; background: #ffffff;">
        <a href="${FRONTEND_URL}/dashboard"
           style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #7C3AED, #EC4899); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 17px; font-weight: 700; box-shadow: 0 10px 30px rgba(236, 72, 153, 0.35); letter-spacing: 0.3px;">
          View Their Full Profiles 💖
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 16px 0 0 0;">
          Takes less than a minute · Free to respond & connect
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 28px 36px; text-align: center; background: #f9fafb; border-top: 1px solid #f3f4f6;">
        <div style="font-size: 24px; margin-bottom: 8px;">💍</div>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #4b5563; font-weight: 600;">LifePartner AI · Hyderabad, India</p>
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">Connecting hearts, safely and smartly.</p>
        <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          You are receiving this because you registered at <a href="${FRONTEND_URL}" style="color: #7c3aed; text-decoration: none;">lifepartnerai.in</a>.<br/>
          <a href="${FRONTEND_URL}/dashboard" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const testEmailIndex = args.indexOf('--test-email');
    const testEmail = testEmailIndex !== -1 ? args[testEmailIndex + 1] : null;

    // 1. Fetch boys details dynamically from DB
    console.log(`🔄 Fetching boys profiles from database...`);
    const dbBoys = await prisma.users.findMany({
        where: { email: { in: BOY_EMAILS } },
        include: { profiles: true }
    });

    const boysList: BoyProfile[] = dbBoys.map(user => {
        const fb = BOY_FALLBACKS[user.email.toLowerCase()] || {};
        const metadata = (user.profiles?.metadata as any) || {};
        
        const name = user.full_name || fb.name || 'User';
        const age = user.age || fb.age || 25;
        
        let location = user.location_name || fb.location;
        if (user.city && user.state) {
            location = `${user.city}, ${user.state}`;
        }
        
        let profession = metadata.career?.profession || fb.profession;
        let bio = user.profiles?.raw_prompt || metadata.aboutMe || metadata.bio || fb.bio;
        if (!bio || bio.trim() === '') {
            bio = fb.bio;
        }
        
        let hobbies = (user.profiles?.traits as any)?.hobbies || fb.hobbies || [];
        const avatar = user.avatar_url || fb.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

        return {
            name,
            age,
            location,
            profession,
            bio,
            hobbies,
            avatar
        };
    });

    console.log(`   Successfully loaded ${boysList.length} boys' profiles.\n`);

    // 2. Fetch target users: females
    const females = await prisma.users.findMany({
        where: { gender: 'Female' },
        select: { id: true, email: true, full_name: true, is_verified: true }
    });

    console.log("🚀 Matches Campaign Initialization");
    console.log(`   Total Target Female Users Found: ${females.length}`);
    console.log(`   Source Email: ${FROM}`);
    console.log(`   Frontend URL: ${FRONTEND_URL}\n`);

    if (dryRun) {
        console.log("📝 Running in --dry-run mode.");
        console.log("   Simulating generation and logging targets...");
        
        // Generate a preview file
        const previewHtml = generateFeaturedEmailHtml('Amrita', boysList);
        const previewPath = path.join(__dirname, 'featured_campaign_preview.html');
        fs.writeFileSync(previewPath, previewHtml, 'utf8');
        
        console.log(`   ✅ Preview HTML written to: ${previewPath}`);
        console.log("   👥 Recipients to match in actual campaign:");
        females.forEach((user, idx) => {
            console.log(`     ${idx + 1}. ${user.full_name} (${user.email}) [Verified: ${user.is_verified}]`);
        });
        console.log("\n🎉 Dry run completed successfully!");
        return;
    }

    if (testEmail) {
        console.log(`✉️ Sending test email to: ${testEmail}`);
        
        // Dynamically look up the recipient name from DB
        const testUser = await prisma.users.findFirst({
            where: { email: { equals: testEmail, mode: 'insensitive' } },
            select: { full_name: true }
        });

        let testName = 'there';
        if (testUser && testUser.full_name) {
            const cleanName = testUser.full_name.trim();
            const first = cleanName.split(' ')[0];
            testName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        }

        console.log(`   Resolved recipient name: ${testName}`);
        const html = generateFeaturedEmailHtml(testName, boysList);

        try {
            const result = await resend.emails.send({
                from: FROM,
                to: testEmail,
                subject: `${testName}, your matches are waiting 💌`,
                html,
                headers: {
                    'List-Unsubscribe': `<${FRONTEND_URL}/dashboard>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
            });
            console.log(`✅ Test email successfully sent! Result ID: ${(result as any).id || 'ok'}`);
        } catch (e: any) {
            console.error(`❌ Test email sending failed: ${e.message}`);
        }
        return;
    }

    // Actual execution mode
    if (!args.includes('--send')) {
        console.log("⚠️ Warning: No action flag provided.");
        console.log("   Use --dry-run to test locally.");
        console.log("   Use --test-email <email> to send a single test email.");
        console.log("   Use --send to run the campaign for all female users.");
        return;
    }

    console.log(`🔥 Starting full campaign launch to all ${females.length} female users...`);
    let sentCount = 0;
    let failCount = 0;

    for (const female of females) {
        let firstName = 'there';
        if (female.full_name) {
            const cleanName = female.full_name.trim();
            const first = cleanName.split(' ')[0];
            firstName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        }

        console.log(`   Processing: ${female.full_name} (${female.email}) -> Hello ${firstName}...`);

        if (!female.email || !female.email.includes('@')) {
            console.log("   ⚠️ Invalid email, skipping");
            continue;
        }

        try {
            const html = generateFeaturedEmailHtml(firstName, boysList);
            const result = await resend.emails.send({
                from: FROM,
                to: female.email,
                subject: `${firstName}, your matches are waiting 💌`,
                html,
                headers: {
                    'List-Unsubscribe': `<${FRONTEND_URL}/dashboard>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
            });
            console.log(`   ✅ Sent! (ID: ${(result as any).id || 'ok'})`);
            sentCount++;
        } catch (e: any) {
            console.error(`   ❌ Failed sending to ${female.email}: ${e.message}`);
            failCount++;
        }

        // Slight rate limit delay
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("\n📊 Campaign Summary:");
    console.log(`   - Sent successfully: ${sentCount}`);
    console.log(`   - Failed sends:      ${failCount}`);
    console.log(`   - Total processed:   ${sentCount + failCount}\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
