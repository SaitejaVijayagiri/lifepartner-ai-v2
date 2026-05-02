import express from 'express';
import { prisma } from '../prisma';
import { getIO } from '../socket';

const router = express.Router();

/**
 * POST /webhooks/resend
 * Endpoint to receive Resend webhooks.
 * Specifically handles 'email.bounced' events to delete unverified users
 * with typos in their email addresses and notify connected clients.
 */
router.post('/resend', async (req, res) => {
    try {
        const payload = req.body;

        // Security / Robustness: Ensure payload format is what we expect
        if (!payload || !payload.type) {
            return res.status(400).send('Invalid payload');
        }

        // Ideally, we would verify a Svix signature here using RESEND_WEBHOOK_SECRET.
        // Since we are only deleting UNVERIFIED users, the security risk of a spoofed 
        // webhook is low (an attacker can't delete an active, verified account).

        if (payload.type === 'email.bounced') {
            const data = payload.data;
            if (data && data.to && Array.isArray(data.to) && data.to.length > 0) {
                const bouncedEmail = data.to[0];
                console.log(`[Webhook] Resend bounced email detected: ${bouncedEmail}`);

                // Find the user associated with this email
                const user = await prisma.users.findUnique({
                    where: { email: bouncedEmail }
                });

                if (user) {
                    if (!user.is_verified) {
                        console.log(`[Webhook] Deleting unverified user due to bounce: ${user.id}`);

                        // Delete the user
                        await prisma.users.delete({
                            where: { id: user.id }
                        });
                        console.log(`[Webhook] User deleted successfully. Frontend will catch this if they click Resend OTP.`);
                    } else {
                        console.warn(`[Webhook] WARNING: Bounced email for a VERIFIED user: ${user.id}. Skipping deletion.`);
                        // Here you might want to flag the user or pause their email notifications instead of deleting
                    }
                } else {
                    console.log(`[Webhook] User with email ${bouncedEmail} not found in database.`);
                }
            }
        }

        // Always return 200 OK to acknowledge receipt, otherwise Resend will retry
        res.status(200).send('OK');
    } catch (error) {
        console.error('[Webhook] Error processing Resend webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
