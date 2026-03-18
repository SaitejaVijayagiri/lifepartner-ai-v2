import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123'); // Default formatted key to prevent crash on init if missing

export class EmailService {

    static async sendWelcomeEmail(email: string, name: string) {
        if (!process.env.RESEND_API_KEY) {
            console.log("Skipping Email: No API Key");
            return;
        }

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <auth@lifepartnerai.in>', // Configurable sender
                to: email,
                subject: 'Welcome to LifePartner AI 💖',
                html: `
                    <h1>Welcome, ${name}!</h1>
                    <p>We are thrilled to have you on board.</p>
                    <p>Complete your profile to start finding your perfect match today.</p>
                    <br/>
                    <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" style="padding: 10px 20px; background: #E11D48; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                `
            });
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error('Email Error:', error);
        }
    }

    static async sendInterestReceivedEmail(email: string, name: string, senderName: string) {
        if (!process.env.RESEND_API_KEY) return;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
                to: email,
                subject: `✨ ${senderName} is interested in you!`,
                html: `
                    <h2>You have a new admirer!</h2>
                    <p><strong>${senderName}</strong> just sent you an interest request.</p>
                    <p>Log in now to view their profile and respond.</p>
                    <br/>
                    <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" style="padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">View Profile</a>
                `
            });
        } catch (error) {
            console.error('Email Error:', error);
        }
    }

    static async sendMatchAcceptedEmail(email: string, name: string, partnerName: string) {
        if (!process.env.RESEND_API_KEY) return;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
                to: email,
                subject: `💖 It's a Match! You and ${partnerName} are connected.`,
                html: `
                    <h1>Congratulations!</h1>
                    <p>You and <strong>${partnerName}</strong> are now connected.</p>
                    <p>You can now chat, video call, and get to know each other.</p>
                    <br/>
                    <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" style="padding: 10px 20px; background: #059669; color: white; text-decoration: none; border-radius: 5px;">Start Chatting</a>
                `
            });
        } catch (error) {
            console.error('Email Error:', error);
        }
    }

    static async sendOnboardingReminderEmail(email: string, name: string) {
        if (!process.env.RESEND_API_KEY) return;

        const firstName = name?.split(' ')[0] || 'there';

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>',
                to: email,
                subject: `${firstName}, your profile is waiting for you 💫`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: white;">You're Almost There! 💕</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">You signed up on LifePartner AI but haven't completed your profile yet. Your perfect match could already be looking for someone exactly like you — don't keep them waiting!</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">It only takes <strong style="color: #f5f5f5;">2 minutes</strong> to set up your profile and start getting matched by our AI.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/onboarding" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">Complete My Profile →</a>
                            </div>
                            <p style="font-size: 13px; color: #666; text-align: center;">LifePartner AI · Hyderabad, India</p>
                        </div>
                    </div>
                `
            });
        } catch (error) {
            console.error('Email Error:', error);
        }
    }

    static async sendFindMatchesEmail(email: string, name: string) {
        if (!process.env.RESEND_API_KEY) return;

        const firstName = name?.split(' ')[0] || 'there';

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>',
                to: email,
                subject: `${firstName}, your matches are waiting 💌`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #059669, #0EA5E9); padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; color: white;">Your AI Matches Are Ready ✨</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">Great news — your profile is all set! Our AI has been working hard to find people who truly align with your values, personality, and life goals.</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.7;">Genuine connections are waiting for you. Explore your matches and start a conversation today.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #059669, #0EA5E9); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">See My Matches →</a>
                            </div>
                            <p style="font-size: 13px; color: #666; text-align: center;">LifePartner AI · Hyderabad, India</p>
                        </div>
                    </div>
                `
            });
        } catch (error) {
            console.error('Email Error:', error);
        }
    }
}
