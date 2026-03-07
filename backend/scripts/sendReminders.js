const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();
// Fallback to testing key if not set, though ideally it should be in .env
const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

async function sendOnboardingReminders() {
    console.log('Fetching users who have not completed onboarding...');

    try {
        // Find verified users (who completed OTP) but have NO profiles record (meaning they abandoned onboarding)
        const unonboardedUsers = await prisma.users.findMany({
            where: {
                is_verified: true, // They verified their email
                profiles: null // But they never completed the onboarding step
            },
            select: {
                id: true,
                email: true,
                full_name: true
            }
        });

        console.log(`Found ${unonboardedUsers.length} users who abandoned onboarding.`);

        if (unonboardedUsers.length === 0) {
            console.log("No emails to send. Exiting.");
            return;
        }

        if (!process.env.RESEND_API_KEY) {
            console.log("⚠️ Warning: RESEND_API_KEY is not set in your .env file!");
            console.log("The script will attempt to use Resend, but it will likely fail without a real key.");
        }

        let successCount = 0;
        let failCount = 0;

        for (const user of unonboardedUsers) {
            const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';

            try {
                process.stdout.write(`Sending email to ${user.email}... `);

                const data = await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'LifePartner AI <auth@lifepartnerai.in>',
                    to: user.email,
                    subject: `${firstName}, your perfect match is waiting! 💍`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                            <h2>Hello ${firstName},</h2>
                            <p>We noticed you verified your email but haven't finished setting up your profile on <strong>LifePartner AI</strong>.</p>
                            
                            <p>Until your profile is complete, our AI matching algorithm cannot find compatible partners for you, and your profile remains hidden from the community.</p>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #4f46e5;">Why finish onboarding?</h3>
                                <ul style="padding-left: 20px;">
                                    <li>Unlock personalized AI matchmaking based on your astrology, career, and values</li>
                                    <li>Become visible to hundreds of verified, premium members looking for a serious connection</li>
                                    <li>Claim your <strong>20 free coins</strong> for completing your profile</li>
                                </ul>
                            </div>
                            
                            <p>It only takes 2 minutes to complete your preferences.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://lifepartnerai.in/login" style="background-color: #4f46e5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                                    Complete Profile Now
                                </a>
                            </div>
                            
                            <p>We are excited to help you find your life partner!</p>
                            <p>Best regards,<br>The LifePartner AI Team</p>
                        </div>
                    `
                });

                if (data.error) {
                    process.stdout.write(`❌ Failed: ${data.error.message}\n`);
                    failCount++;
                } else {
                    process.stdout.write(`✅ Sent (ID: ${data.data.id})\n`);
                    successCount++;
                }
            } catch (err) {
                process.stdout.write(`❌ Error: ${err.message}\n`);
                failCount++;
            }

            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n--- Email Campaign Complete ---');
        console.log(`✅ Successfully sent: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);

    } catch (e) {
        console.error("Database Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

sendOnboardingReminders();
