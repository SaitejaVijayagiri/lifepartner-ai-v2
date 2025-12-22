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
                from: 'LifePartner AI <onboarding@resend.dev>', // Use verified domain in prod
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
                from: 'LifePartner AI <no-reply@resend.dev>',
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
                from: 'LifePartner AI <no-reply@resend.dev>',
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
}
