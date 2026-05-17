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
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #f0f0f0;">
                        <!-- Hero Header -->
                        <div style="background: linear-gradient(135deg, #E11D48 0%, #9333EA 100%); padding: 50px 30px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">✨💍✨</div>
                            <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">
                                Welcome to LifePartner AI!
                            </h1>
                            <p style="color: #fde68a; font-size: 16px; margin-top: 10px; font-weight: 500;">
                                Your journey to finding true love starts here.
                            </p>
                        </div>

                        <!-- Body Content -->
                        <div style="padding: 40px 32px;">
                            <p style="font-size: 18px; color: #1e293b; font-weight: 600;">Hi ${name},</p>
                            
                            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                                We are absolutely thrilled to have you join our community! You've just taken the first and most important step toward meeting highly compatible, genuine matches.
                            </p>

                            <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
                                <h3 style="margin: 0 0 16px 0; font-size: 15px; color: #E11D48; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Next Steps 🚀</h3>
                                
                                <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #334155; line-height: 1.8;">
                                    <li style="margin-bottom: 8px;"><strong>Complete your profile:</strong> Add your hobbies, interests, and bio.</li>
                                    <li style="margin-bottom: 8px;"><strong>Upload a clear photo:</strong> Profiles with a face photo get 8x more matches!</li>
                                    <li style="margin-bottom: 0;"><strong>Start connecting:</strong> Browse your AI-curated matches today.</li>
                                </ul>
                            </div>

                            <p style="font-size: 16px; color: #475569; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                                Don't keep your future partner waiting. Let's get your profile set up!
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" 
                                   style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #E11D48, #9333EA); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.3);">
                                    Go to Dashboard ✨
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="font-size: 13px; color: #64748b; margin: 0;">
                                <strong>LifePartner AI</strong> · Hyderabad, India<br/>
                                <span style="font-size: 12px; margin-top: 8px; display: inline-block;">Connecting hearts, safely and smartly.</span>
                            </p>
                        </div>
                    </div>
                `
            });
            console.log(`Welcome email sent to ${email}`);
        } catch (error) {
            console.error('Email Error:', error);
        }
    }

    static async sendInterestReceivedEmail(email: string, name: string, senderDetails: { name: string, age?: number | string, location?: string, job?: string, photoUrl?: string }) {
        if (!process.env.RESEND_API_KEY) return;

        const senderName = senderDetails.name || "Someone";
        const photoUrl = senderDetails.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`;
        
        const detailsList = [];
        if (senderDetails.age) detailsList.push(`${senderDetails.age} yrs`);
        if (senderDetails.job) detailsList.push(senderDetails.job);
        if (senderDetails.location) detailsList.push(senderDetails.location);
        const detailsString = detailsList.join(' • ');

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
                to: email,
                subject: `✨ ${senderName} is interested in you!`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 30px 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; color: white;">You have a new admirer! 💖</h1>
                        </div>
                        <div style="padding: 40px 30px; text-align: center;">
                            <img src="${photoUrl}" alt="${senderName}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #4F46E5; margin-bottom: 20px;" />
                            <h2 style="margin: 0 0 10px 0; color: #fff; font-size: 22px;">${senderName}</h2>
                            <p style="margin: 0 0 20px 0; color: #aaa; font-size: 16px;">${detailsString}</p>
                            
                            <p style="font-size: 15px; color: #ccc; line-height: 1.6; margin-bottom: 30px;">
                                <strong>${senderName}</strong> saw your profile and sent you an interest request. Don't keep them waiting!
                            </p>
                            
                            <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">View Profile & Respond</a>
                        </div>
                        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-top: 1px solid #333;">
                            <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LifePartner AI. All rights reserved.</p>
                        </div>
                    </div>
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
    /**
     * Sent to non-registered people (marketing / invite campaign)
     * Pass any email address — no user account needed.
     */
    static async sendInviteEmail(email: string, invitedByName?: string) {
        if (!process.env.RESEND_API_KEY) return;

        const referrer = invitedByName ? `<strong>${invitedByName}</strong> thinks` : 'Someone thinks';

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>',
                to: email,
                subject: '💌 You have been invited to find your life partner with AI',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 48px 32px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 16px;">💖</div>
                            <h1 style="margin: 0; font-size: 28px; color: white; line-height: 1.3;">Your Life Partner<br/>Could Be One Click Away</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hey there 👋</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">${referrer} you're ready to find someone truly special. LifePartner AI uses advanced AI to match you based on personality, values, and life goals — not just photos.</p>
                            <ul style="font-size: 14px; color: #ccc; line-height: 2; padding-left: 20px;">
                                <li>🤖 AI-powered compatibility matching</li>
                                <li>🎙️ Voice bio & video calling built-in</li>
                                <li>🔐 Verified profiles & safe community</li>
                                <li>💬 Chat, gifts, and icebreaker games</li>
                            </ul>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/register" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">Join Free Today →</a>
                            </div>
                            <p style="font-size: 12px; color: #555; text-align: center;">LifePartner AI · Hyderabad, India<br/>If you didn't expect this email, you can safely ignore it.</p>
                        </div>
                    </div>
                `
            });
            console.log(`Invite email sent to ${email}`);
        } catch (error) {
            console.error('Invite Email Error:', error);
        }
    }

    /**
     * Sent to registered users who haven't used the app in 7+ days
     */
    static async sendReEngagementEmail(email: string, name: string, daysSinceLastSeen: number) {
        if (!process.env.RESEND_API_KEY) return;

        const firstName = name?.split(' ')[0] || 'there';
        const urgencyLine = daysSinceLastSeen >= 30
            ? `It's been over a month since we last saw you.`
            : `It's been ${daysSinceLastSeen} days since your last visit.`;

        try {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>',
                to: email,
                subject: `${firstName}, we miss you 💭 New people are waiting`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #1e1b4b, #4c1d95); padding: 48px 32px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 16px;">🌙</div>
                            <h1 style="margin: 0; font-size: 26px; color: white;">We Miss You, ${firstName}</h1>
                        </div>
                        <div style="padding: 32px;">
                            <p style="font-size: 17px; color: #e5e5e5;">Hey <strong>${firstName}</strong>,</p>
                            <p style="font-size: 15px; color: #aaa; line-height: 1.8;">${urgencyLine} Since then, our AI has found new people who match your values and personality. Your perfect match might already be looking for someone just like you.</p>
                            <div style="background: #1a1a2e; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #9333EA;">
                                <p style="margin: 0; font-size: 14px; color: #c4b5fd;">✨ <strong>New matches this week</strong> · 🎙️ New voice profiles · 📸 New story updates</p>
                            </div>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">See Who's Waiting →</a>
                            </div>
                            <p style="font-size: 12px; color: #555; text-align: center;">LifePartner AI · Hyderabad, India<br/>Unsubscribe anytime from your account settings.</p>
                        </div>
                    </div>
                `
            });
            console.log(`Re-engagement email sent to ${email}`);
        } catch (error) {
            console.error('Re-engagement Email Error:', error);
        }
    }
}
