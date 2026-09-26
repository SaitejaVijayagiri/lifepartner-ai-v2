import express from 'express';
import { prisma } from '../prisma';
import { getIO } from '../socket';
import { EmailTracker } from '../services/emailTracker';

const router = express.Router();

/**
 * POST /webhooks/resend
 * Endpoint to receive Resend webhooks for email delivery, opens, clicks, and bounces.
 */
router.post('/resend', async (req, res) => {
    try {
        const payload = req.body;

        if (!payload || !payload.type) {
            return res.status(400).send('Invalid payload');
        }

        const data = payload.data || {};
        const emailList = Array.isArray(data.to) ? data.to : (data.to ? [data.to] : []);
        const recipientEmail = emailList.length > 0 ? emailList[0].toLowerCase().trim() : null;
        const messageId = data.email_id || data.id || null;
        const tracker = EmailTracker.getInstance();

        // 1. Handle Click Events
        if (payload.type === 'email.clicked') {
            const linkUrl = data.click?.link || data.link || null;
            if (recipientEmail) {
                await tracker.recordClick(recipientEmail, messageId, linkUrl);
            }
        }
        // 2. Handle Open Events
        else if (payload.type === 'email.opened') {
            if (recipientEmail) {
                await tracker.recordOpen(recipientEmail, messageId);
            }
        }
        // 3. Handle Delivery Events
        else if (payload.type === 'email.delivered') {
            if (recipientEmail) {
                await tracker.recordDelivery(recipientEmail, messageId);
            }
        }
        // 4. Handle Bounce & Suppression Events
        else if (payload.type === 'email.bounced' || payload.type === 'email.complained') {
            if (recipientEmail) {
                console.log(`[Webhook] Resend bounced/complained email detected: ${recipientEmail}`);
                await tracker.recordBounce(recipientEmail, payload.type);

                // Find the user associated with this email
                const user = await prisma.users.findUnique({
                    where: { email: recipientEmail }
                });

                if (user) {
                    if (!user.is_verified) {
                        console.log(`[Webhook] Deleting unverified user due to bounce: ${user.id}`);
                        await prisma.users.delete({
                            where: { id: user.id }
                        }).catch(() => {});
                    } else {
                        console.warn(`[Webhook] WARNING: Bounced email for a VERIFIED user: ${user.id}. Suppressed for future emails.`);
                    }
                }
            }
        }

        // Always return 200 OK to acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        console.error('[Webhook] Error processing Resend webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
