import express from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { getIO } from '../socket';
import { EmailTracker } from '../services/emailTracker';

const router = express.Router();

function verifyResendSvixSignature(req: express.Request): boolean {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) return false;

    const svixId = req.headers['svix-id'] as string | undefined;
    const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;
    const svixSignature = req.headers['svix-signature'] as string | undefined;
    if (!svixId || !svixTimestamp || !svixSignature) return false;

    const tsNum = Number(svixTimestamp);
    if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
        return false;
    }

    const rawBody = (req as any).rawBody
        ? (req as any).rawBody.toString('utf8')
        : JSON.stringify(req.body || {});
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
    const expected = crypto
        .createHmac('sha256', secretBytes)
        .update(`${svixId}.${svixTimestamp}.${rawBody}`)
        .digest('base64');

    const candidates = svixSignature.split(' ').map((part) => {
        const idx = part.indexOf(',');
        return idx >= 0 ? { version: part.slice(0, idx), sig: part.slice(idx + 1) } : null;
    }).filter((x): x is { version: string; sig: string } => Boolean(x && x.version === 'v1' && x.sig));

    const expectedBuf = Buffer.from(expected);
    return candidates.some(({ sig }) => {
        const sigBuf = Buffer.from(sig);
        return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
    });
}

/**
 * POST /webhooks/resend
 * Endpoint to receive Resend webhooks for email delivery, opens, clicks, and bounces.
 */
router.post('/resend', async (req, res) => {
    try {
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
        const isSignatureVerified = webhookSecret ? verifyResendSvixSignature(req) : false;
        if (webhookSecret && !isSignatureVerified) {
            return res.status(401).send('Invalid webhook signature');
        }

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
                    if (!user.is_verified && isSignatureVerified) {
                        console.log(`[Webhook] Deleting unverified user due to verified bounce: ${user.id}`);
                        await prisma.users.delete({
                            where: { id: user.id }
                        }).catch(() => {});
                    } else if (!user.is_verified) {
                        console.warn(`[Webhook] Bounced email for unverified user ${user.id}, skipping deletion (RESEND_WEBHOOK_SECRET not configured).`);
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
