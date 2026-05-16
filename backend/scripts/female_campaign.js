const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
    console.log("Fetching female users...");
    const femaleUsers = await prisma.users.findMany({
        where: {
            gender: {
                in: ['female', 'Female', 'FEMALE']
            }
        },
        select: {
            email: true,
            full_name: true
        }
    });

    console.log(`Found ${femaleUsers.length} female users.`);

    for (const user of femaleUsers) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        console.log(`Sending to ${user.email}...`);

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
                to: user.email,
                subject: `${firstName}, your perfect match is waiting for you! 💖`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: white;">Something Unique Is Waiting ✨</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hi <strong>${firstName}</strong>,</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">We have some exciting news! There are highly compatible matches waiting to connect with you on LifePartner AI right now.</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">Our AI has found some unique profiles that align perfectly with your values and personality. Don't keep them waiting—come online and start a conversation!</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="https://lifepartnerai.in/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">See My Matches →</a>
                            </div>
                            <p style="font-size: 13px; color: #666; text-align: center;">LifePartner AI · Hyderabad, India</p>
                        </div>
                    </div>
                `
            });
            console.log(`✅ Sent to ${user.email}`);
        } catch (e) {
            console.error(`❌ Failed for ${user.email}:`, e.message);
        }
        
        // Sleep 500ms to avoid Resend rate limits
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("Campaign finished.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
