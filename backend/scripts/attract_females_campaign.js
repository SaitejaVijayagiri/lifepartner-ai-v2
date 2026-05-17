const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const emailsToTarget = [
    'sirilenkalapelli@gmail.com', 'sanashaik4519@gmail.com', 'sofiyayasmeen764@gmail.com',
    'sharanyajaladanki@gmail.com', 'yashodakinnera0233@gmail.com', 'sumaiyanishath094@gmail.com',
    'supriyagunde09@gmail.com', 'gomasaashwini149@gmail.com', 'tharunisampathkumar1@gmail.com',
    'sindhujaelthuri112@gmail.com', 'nikhilakotha21@gmail.com', 'atikatakreem@gmail.com',
    'anjalibandari1234@gmail.com', 'shivaniii11155@gmail.com', 'rajyalakshmibokkala@gmail.com',
    'nikshithakalakotla@gmail.com', 'sonajannu451@gmail.com', 'nasreennashu6305@gmail.com',
    'mogiliramya2004@gmail.com', 'gugulothshirisha563@gmail.com', 'laharibiri05@gmail.com',
    'iamshruthi12@gmail.com', 'suchitrakotha28@gmail.com', 'kalyanisodari2@gmail.com',
    'shirishamandala2415@gmail.com', 'sannuO50916@gmail.com', 'nandinimarapaka@gmail.com',
    'manasasappidi12@gmail.com', 'roshnivuke@gmail.com', 'sameenasulithana15@gmail.com',
    'sirikuthadi2@gmail.com', 'navyachalla1108@gmail.com', 'kodemmaheshwari74@gmail.com',
    'pakasandhya10@gmail.com', 'bhavanasarva1204@gmail.com', 'shreyathatikayala@gmail.com',
    'akhilamadhu119@gmail.com', 'rajbhukya807@gmail.com', 'srijakodam20@gmail.com',
    'chinnapakarashmitha@gmail.com', 'maneeshakadem1@gmail.com', 'mandatirishika@gmail.com',
    'srujanachintam143@gmail.com', 'asmithagudepu23@gmail.com', 'halavathsonisoni@gmail.com',
    'premalathameesala0612@gmail.com', 'appalahasini112@gmail.com', 'sadhanapalliprasanna@gmail.com',
    'verpulapriya6@gmail.com', 'pendyalapranitha4@gmail.com', 'sravaniboda033@gmail.com',
    'sadhuvalavyshali2004@gmail.com', 'middapakasrivani@gmail.com', 'akhilajatothu81@gmail.com'
];

async function main() {
    console.log(`Starting campaign for ${emailsToTarget.length} female users...`);

    // Fetch existing users to personalize with their names
    const existingUsers = await prisma.users.findMany({
        where: { email: { in: emailsToTarget } },
        select: { email: true, full_name: true }
    });

    const userMap = new Map();
    existingUsers.forEach(u => userMap.set(u.email.toLowerCase(), u.full_name));

    for (let i = 0; i < emailsToTarget.length; i++) {
        const rawEmail = emailsToTarget[i];
        const email = rawEmail.toLowerCase().trim();
        const fullName = userMap.get(email);
        const firstName = fullName ? fullName.split(' ')[0] : 'there';

        console.log(`[${i+1}/${emailsToTarget.length}] Sending to ${email} (Name: ${firstName})...`);

        const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #f0f0f0;">
                
                <!-- Hero Header -->
                <div style="background: linear-gradient(135deg, #E11D48 0%, #9333EA 100%); padding: 50px 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">✨💍✨</div>
                    <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">
                        Find Your Forever.
                    </h1>
                    <p style="color: #fde68a; font-size: 16px; margin-top: 10px; font-weight: 500;">
                        The smarter way to find your life partner.
                    </p>
                </div>

                <!-- Body Content -->
                <div style="padding: 40px 32px;">
                    <p style="font-size: 18px; color: #1e293b; font-weight: 600;">Hi ${firstName},</p>
                    
                    <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                        You're just a few steps away from meeting highly compatible, genuinely verified matches on <strong>LifePartner AI</strong>. Thousands of verified individuals are actively searching for someone just like you.
                    </p>

                    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin: 0 0 16px 0; font-size: 15px; color: #E11D48; font-weight: 700; text-transform: uppercase; tracking: wider;">Why Women Choose Us 💖</h3>
                        
                        <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #334155; line-height: 1.8;">
                            <li style="margin-bottom: 8px;"><strong>100% Face Verified:</strong> No fake profiles or scammers.</li>
                            <li style="margin-bottom: 8px;"><strong>Smart AI Matching:</strong> We match based on values, not just looks.</li>
                            <li style="margin-bottom: 8px;"><strong>Total Privacy:</strong> You control who sees your photos and details.</li>
                            <li style="margin-bottom: 0;"><strong>Safe Connections:</strong> In-built secure chat & video calling.</li>
                        </ul>
                    </div>

                    <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                        Don't let your perfect match wait any longer. Take 2 minutes to complete your profile today.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://lifepartnerai.in/dashboard" 
                           style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #E11D48, #9333EA); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.3);">
                            Start My Journey ✨
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 13px; color: #64748b; margin: 0;">
                        <strong>LifePartner AI</strong> · Hyderabad, India<br/>
                        <span style="font-size: 12px; margin-top: 8px; display: inline-block;">Empowering women to find true love safely.</span>
                    </p>
                </div>
            </div>
        `;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>',
                to: email,
                subject: `${firstName}, your perfect match is waiting for you! 💖`,
                html: htmlContent
            });
            console.log(`   ✅ Success`);
        } catch (e) {
            console.error(`   ❌ Failed:`, e.message);
        }
        
        // Sleep 500ms to avoid Resend rate limits
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("Campaign finished successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
