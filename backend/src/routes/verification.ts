import express from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import { matchCache } from './matches';
import { ModerationService } from '../services/moderation';
import { ImageOptimizer } from '../services/imageOptimizer';
import { isR2Configured, uploadBase64ToR2 } from '../services/r2Storage';
import { isUserIdVerified } from '../utils/idVerification';
import { callGeminiGenerate, isGeminiConfigured } from '../utils/geminiClient';

const router = express.Router();

// 1. Submit Verification Request (requires genuine selfie / ID image or valid uploaded document URL)
router.post('/request', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { documentUrl } = req.body || {};

        if (!documentUrl || typeof documentUrl !== 'string' || !documentUrl.trim() || documentUrl.includes('example.com/mock')) {
            return res.status(400).json({ error: 'Please capture or upload a clear live selfie photo to request verification.' });
        }

        const cleanDoc = documentUrl.trim();

        // Check if pending or already approved
        const existingRequest = await prisma.verification_requests.findFirst({
            where: {
                user_id: userId,
                status: { in: ['PENDING', 'APPROVED'] }
            }
        });

        if (existingRequest?.status === 'APPROVED') {
            return res.status(400).json({ error: 'Your identity is already verified.' });
        }
        if (existingRequest) {
            return res.status(400).json({ error: 'Verification request already pending.' });
        }

        let storedDocUrl = cleanDoc;
        let aiPrecheckNote: string | null = null;

        // If the client uploaded a base64 selfie/ID image, validate safety/face via Gemini Vision & upload to R2
        if (ImageOptimizer.isBase64(cleanDoc)) {
            const modCheck = await ModerationService.validateProfilePhoto(cleanDoc, true);
            if (!modCheck.isValid || modCheck.isProhibited) {
                return res.status(400).json({
                    error: modCheck.reason || 'Verification photo must clearly show your face and meet safety guidelines.'
                });
            }
            aiPrecheckNote = 'AI Vision pre-check passed (real face detected, safety clear).';

            if (isGeminiConfigured() && !process.env.JEST_WORKER_ID) {
                try {
                    let mimeType = 'image/jpeg';
                    let rawB64 = cleanDoc;
                    const match = cleanDoc.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                        mimeType = match[1];
                        rawB64 = match[2];
                    }

                    // Optionally fetch user's primary profile photo to compare face match
                    let profilePhotoPart: { inlineData: { mimeType: string; data: string } } | null = null;
                    try {
                        const owner = await prisma.users.findUnique({
                            where: { id: userId },
                            select: { avatar_url: true, profiles: { select: { photos: true } } }
                        });
                        const candidateUrl = (Array.isArray(owner?.profiles?.photos) && owner.profiles.photos[0]) || owner?.avatar_url;
                        if (typeof candidateUrl === 'string' && candidateUrl.startsWith('http') && !candidateUrl.includes('dicebear')) {
                            const photoResp = await fetch(candidateUrl, { signal: AbortSignal.timeout(2500) });
                            if (photoResp.ok) {
                                const ct = photoResp.headers.get('content-type') || 'image/jpeg';
                                if (ct.startsWith('image/')) {
                                    const buf = Buffer.from(await photoResp.arrayBuffer());
                                    if (buf.length > 0 && buf.length < 3 * 1024 * 1024) {
                                        profilePhotoPart = { inlineData: { mimeType: ct.split(';')[0], data: buf.toString('base64') } };
                                    }
                                }
                            }
                        }
                    } catch {
                        // Non-fatal: continue liveness check even if profile photo fetch fails
                    }

                    const parts: any[] = [
                        {
                            text: profilePhotoPart
                                ? 'Assess photo 1 (submitted selfie) and compare against photo 2 (user profile photo). Confirm photo 1 is a genuine live selfie (NOT a photo of another phone/monitor screen, meme, stock photo, AI-generated image, or celebrity), and check if it looks like the same person as photo 2. Return strict JSON: { "isGenuineCapture": boolean, "faceMatchesProfile": boolean, "docType": "LIVE_SELFIE" | "SUSPICIOUS", "summary": "short reviewer note" }.'
                                : 'Assess this selfie verification photo. Is it a genuine live selfie of a real person (NOT a photo of another phone/monitor screen, meme, stock photo, AI image, or celebrity)? Return strict JSON: { "isGenuineCapture": boolean, "docType": "LIVE_SELFIE" | "SUSPICIOUS", "summary": "short reviewer note" }.'
                        },
                        { inlineData: { mimeType, data: rawB64 } }
                    ];
                    if (profilePhotoPart) {
                        parts.push(profilePhotoPart);
                    }

                    const authRes = await callGeminiGenerate({
                        contents: [{
                            role: 'user',
                            parts
                        }],
                        temperature: 0,
                        maxOutputTokens: 200,
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: 'OBJECT',
                            properties: {
                                isGenuineCapture: { type: 'BOOLEAN' },
                                faceMatchesProfile: { type: 'BOOLEAN' },
                                docType: { type: 'STRING' },
                                summary: { type: 'STRING' }
                            },
                            required: ['isGenuineCapture', 'docType', 'summary']
                        },
                        timeoutMs: 9000
                    });
                    if (authRes.text) {
                        const parsed = JSON.parse(authRes.text);
                        if (parsed.isGenuineCapture === false || parsed.docType === 'SUSPICIOUS') {
                            return res.status(400).json({
                                error: 'Please take a clear, live selfie (not a photo of another screen or stock image).'
                            });
                        }
                        const matchTag = typeof parsed.faceMatchesProfile === 'boolean'
                            ? (parsed.faceMatchesProfile ? ' • Profile face match: YES' : ' • Profile face match: UNCERTAIN/NO')
                            : '';
                        aiPrecheckNote = `AI Live Selfie Check (${parsed.docType}${matchTag}): ${parsed.summary}`;
                    }
                } catch (aiErr: any) {
                    console.warn('[verification] AI authenticity pre-check skipped:', aiErr?.message || aiErr);
                }
            }

            if (isR2Configured()) {
                try {
                    const r2Url = await uploadBase64ToR2(cleanDoc, `verifications/${userId}/doc_${Date.now()}.jpg`, true);
                    if (r2Url) storedDocUrl = r2Url;
                } catch (uploadErr: any) {
                    console.warn('[verification] R2 upload warning:', uploadErr?.message || uploadErr);
                }
            }
        }

        await prisma.verification_requests.create({
            data: {
                user_id: userId,
                document_url: storedDocUrl,
                status: 'PENDING',
                ...(aiPrecheckNote ? { admin_notes: aiPrecheckNote } : {})
            }
        });

        res.json({ success: true, message: 'Verification submitted! Our safety team will review it shortly.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Check My Identity Verification Status (distinct from email OTP `users.is_verified`)
router.get('/status', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        const [request, user] = await Promise.all([
            prisma.verification_requests.findFirst({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
                select: { status: true, created_at: true, admin_notes: true }
            }),
            prisma.users.findUnique({
                where: { id: userId },
                select: {
                    is_verified: true,
                    profiles: { select: { metadata: true } }
                }
            }).catch(() => null)
        ]);

        const meta = (user?.profiles?.metadata as any) || {};
        const isIdVerified =
            request?.status === 'APPROVED' ||
            (await isUserIdVerified(userId, meta));

        res.json({
            isVerified: isIdVerified,
            isIdVerified,
            isEmailVerified: Boolean(user?.is_verified),
            request: request || null
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- ADMIN ROUTES (Protected) ---

// 3. List All Pending Requests
router.get('/admin/pending', authenticateToken, adminAuth, async (req, res) => {
    try {
        const result = await prisma.verification_requests.findMany({
            where: { status: 'PENDING' },
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: {
                        full_name: true,
                        email: true,
                        avatar_url: true
                    }
                }
            }
        });

        const mapped = result.map(r => ({
            ...r,
            name: r.users?.full_name,
            email: r.users?.email,
            photo_url: r.users?.avatar_url
        }));

        res.json(mapped);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Approve/Reject
router.post('/admin/:id/resolve', authenticateToken, adminAuth, async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.verification_requests.update({
                where: { id },
                data: {
                    status,
                    admin_notes: notes
                }
            });

            if (updatedRequest.user_id) {
                matchCache.clear();
                const targetUserId = updatedRequest.user_id as string;

                if (status === 'APPROVED') {
                    await tx.users.update({
                        where: { id: targetUserId },
                        data: { is_verified: true }
                    });
                }

                // Sync true ID verification flag in profiles.metadata (safe against partial test mocks)
                const profilesModel = (tx as any)?.profiles;
                if (profilesModel && typeof profilesModel.findUnique === 'function' && typeof profilesModel.upsert === 'function') {
                    const existingProfile = await profilesModel.findUnique({
                        where: { user_id: targetUserId },
                        select: { metadata: true }
                    });
                    const existingMeta = (existingProfile?.metadata as Record<string, any>) || {};
                    await profilesModel.upsert({
                        where: { user_id: targetUserId },
                        create: {
                            user_id: targetUserId,
                            metadata: {
                                id_verified: status === 'APPROVED',
                                id_verified_at: status === 'APPROVED' ? new Date().toISOString() : null
                            }
                        },
                        update: {
                            metadata: {
                                ...existingMeta,
                                id_verified: status === 'APPROVED',
                                id_verified_at: status === 'APPROVED' ? new Date().toISOString() : null
                            }
                        }
                    });
                }
            }
        });

        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2025') {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
