import cron from 'node-cron';
import { prisma } from '../prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function initAngelTimer() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            // 1. Find dates that started exactly 45-46 mins ago and haven't triggered safety check yet
            const datesToPing: any[] = await prisma.$queryRawUnsafe(`
                SELECT d.*, 
                       u.email as receiver_email, 
                       u.full_name as receiver_name,
                       u.phone as receiver_phone
                FROM meet_dates d
                JOIN users u ON d.receiver_id = u.id
                WHERE d.status = 'accepted'
                  AND d.safety_check_triggered = false
                  AND d.date_time <= NOW() - INTERVAL '45 minutes'
                  AND d.date_time > NOW() - INTERVAL '50 minutes'
            `);

            for (const date of datesToPing) {
                // Send push notification to the receiver asking if they are okay
                try {
                    const { getFirebaseApp } = require('../firebase');
                    const admin = getFirebaseApp();
                    const tokens = await prisma.device_tokens.findMany({ where: { user_id: date.receiver_id } });

                    if (tokens.length > 0) {
                        const messages = tokens.map((t: any) => ({
                            token: t.token,
                            notification: {
                                title: "🛡️ Safety Check-in",
                                body: "You've been on your date for 45 minutes. Are you feeling safe? Tap here to confirm."
                            },
                            data: {
                                type: "SAFETY_CHECK",
                                dateId: date.id,
                                click_action: "FLUTTER_NOTIFICATION_CLICK"
                            },
                            android: {
                                priority: "high",
                                notification: { channelId: "safety_channel", defaultSound: true, defaultVibrateTimings: true }
                            }
                        }));
                        await admin.messaging().sendEach(messages as any);
                    }
                } catch (e) {
                    console.error('Angel Timer Push Error:', e);
                }

                // Mark as triggered so we don't spam
                await prisma.$queryRawUnsafe(`
                    UPDATE meet_dates SET safety_check_triggered = true WHERE id = $1::uuid;
                `, date.id);
            }

            // 2. Find dates that were triggered 15 mins ago but haven't been 'completed' or 'cancelled'
            // and we need to alert the emergency contact.
            // (Assuming they click "Yes, I'm safe" which sets status to 'safe' or 'completed')
            const datesToAlert: any[] = await prisma.$queryRawUnsafe(`
                SELECT d.*, 
                       u.full_name as receiver_name,
                       u.id as receiver_id,
                       p.metadata as profile_metadata,
                       sender.full_name as partner_name,
                       sender.phone as partner_phone
                FROM meet_dates d
                JOIN users u ON d.receiver_id = u.id
                JOIN profiles p ON p.user_id = u.id
                JOIN users sender ON d.sender_id = sender.id
                WHERE d.status = 'accepted'
                  AND d.safety_check_triggered = true
                  AND d.date_time <= NOW() - INTERVAL '60 minutes'
                  AND d.date_time > NOW() - INTERVAL '65 minutes'
            `);

            for (const date of datesToAlert) {
                const metadata = typeof date.profile_metadata === 'string' ? JSON.parse(date.profile_metadata) : (date.profile_metadata || {});
                const emergencyContact = metadata.emergency_contact;

                if (emergencyContact && emergencyContact.email) {
                    // Send SOS Email
                    await resend.emails.send({
                        from: 'LifePartner Safety <safety@lifepartner.in>',
                        to: emergencyContact.email,
                        subject: `🚨 URGENT: Safety Alert for ${date.receiver_name}`,
                        html: `
                            <h2>Safety Check Missed</h2>
                            <p><strong>${date.receiver_name}</strong> went on a date 1 hour ago and missed their automated safety check-in.</p>
                            <h3>Date Details:</h3>
                            <ul>
                                <li><strong>Partner Name:</strong> ${date.partner_name}</li>
                                <li><strong>Location:</strong> ${date.location_name}</li>
                                <li><strong>Started At:</strong> ${new Date(date.date_time).toLocaleString()}</li>
                            </ul>
                            <p>Please try reaching out to them immediately. If you cannot reach them and are concerned, consider contacting local authorities.</p>
                        `
                    });
                }
            }

        } catch (error) {
            console.error('Angel Timer Cron Error:', error);
        }
    });
}
