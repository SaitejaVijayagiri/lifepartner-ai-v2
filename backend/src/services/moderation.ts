/**
 * ModerationService — AI-Powered Photo Validation with Gemini Vision
 * 
 * HISTORY: Previously used TensorFlow.js WASM + MediaPipe Face Detector to scan
 * uploaded photos for faces. However, this caused catastrophic Out-Of-Memory crashes
 * on the Render free tier (512MB RAM limit).
 * 
 * CURRENT: Uses Gemini Vision API (gemini-2.5-flash) for face detection via a 
 * pure HTTP call — zero local RAM overhead. Falls back gracefully if the API
 * is unavailable to avoid blocking legitimate user onboarding.
 */

import { ContentModerator } from './contentModerator';

export class ModerationService {
    // Maximum allowed image size for profile photos (6MB)
    private static readonly MAX_IMAGE_BYTES = 6 * 1024 * 1024;

    // Minimum image size to filter out garbage/corrupt uploads (1KB)
    private static readonly MIN_IMAGE_BYTES = 1024;

    /**
     * Validates an uploaded profile picture:
     * 1. Valid base64 image format (JPEG, PNG, WebP)
     * 2. Reasonable file size (between 1KB and 6MB)
     * 3. Gemini Vision API check: image must contain a clear human face
     * 
     * @param base64Data - Raw base64 image string
     * @param isFirstPhoto - If true, strictly enforce face detection (primary avatar). 
     *                       If false, face detection is best-effort (won't block upload on API failure).
     */
    static async validateProfilePhoto(
        base64Data: string,
        isFirstPhoto: boolean = true
    ): Promise<{ isValid: boolean; reason?: string; isProhibited?: boolean }> {
        try {
            if (!base64Data || typeof base64Data !== 'string') {
                return { isValid: false, reason: 'Invalid image data. Please upload a valid photo.' };
            }

            // --- Step 1: Format validation ---
            const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            const hasValidPrefix = validFormats.some(fmt => base64Data.includes(fmt));

            if (base64Data.startsWith('data:') && !hasValidPrefix) {
                return { isValid: false, reason: 'Unsupported image format. Please upload JPEG, PNG, or WebP.' };
            }

            // --- Step 2: Size validation ---
            let rawB64 = base64Data;
            if (base64Data.includes('base64,')) {
                rawB64 = base64Data.split('base64,')[1];
            }

            if (!rawB64 || rawB64.length < 100) {
                return { isValid: false, reason: 'Image appears to be corrupt or empty. Please re-upload.' };
            }

            const approxBytes = Math.ceil(rawB64.length * 0.75);

            if (approxBytes < this.MIN_IMAGE_BYTES) {
                return { isValid: false, reason: 'Image file is too small. Please upload a clear photo.' };
            }

            if (approxBytes > this.MAX_IMAGE_BYTES) {
                return { isValid: false, reason: 'Image is too large (max 6MB). Please upload a smaller photo.' };
            }

            // --- Step 2.5: Local NSFWJS Content Moderation (Hard safety check for ALL photos) ---
            try {
                const nsfwCheck = await ContentModerator.checkBase64(base64Data);
                if (!nsfwCheck.isSafe) {
                    console.warn(`🚨 [ModerationService] Local NSFWJS blocked photo: ${nsfwCheck.reason}`);
                    return {
                        isValid: false,
                        isProhibited: true,
                        reason: nsfwCheck.reason || 'This photo contains adult or prohibited content, violating our safety guidelines.'
                    };
                }
            } catch (nsfwErr: any) {
                console.warn('[ModerationService] Local NSFW check error (non-blocking):', nsfwErr?.message || nsfwErr);
            }

            // --- Step 3: Gemini Vision Face & Safety Detection ---
            const faceResult = await this.detectFaceWithGemini(base64Data);

            if (faceResult.isProhibited) {
                return {
                    isValid: false,
                    isProhibited: true,
                    reason: faceResult.reason || 'Prohibited content detected in photo.'
                };
            }

            if (!faceResult.hasFace) {
                // Strict for primary photo, soft-fail for secondary photos
                if (isFirstPhoto) {
                    return {
                        isValid: false,
                        reason: faceResult.reason || 'No human face detected in your primary photo. Please upload a clear selfie or portrait.'
                    };
                } else {
                    // Log but allow — secondary photos can be lifestyle shots
                    console.warn('[ModerationService] Non-face secondary photo allowed through (soft mode).');
                }
            }

            console.log(`✅ [ModerationService] Photo validated (${Math.round(approxBytes / 1024)}KB, face: ${faceResult.hasFace}).`);
            return { isValid: true };

        } catch (e: any) {
            console.error(`❌ [ModerationService] Validation error:`, e.message);
            // On unexpected errors, allow the photo through to avoid blocking onboarding
            return { isValid: true };
        }
    }

    /**
     * Uses Gemini Vision (gemini-2.5-flash) to check whether a human face
     * is clearly visible in the image. This is a pure HTTP call — no local RAM usage.
     */
    private static async detectFaceWithGemini(
        base64Data: string
    ): Promise<{ hasFace: boolean; isProhibited?: boolean; reason?: string }> {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.includes('your_') || apiKey.length < 10) {
            console.warn('[ModerationService] GEMINI_API_KEY not configured — skipping face detection.');
            return { hasFace: true }; // Soft pass if API key is not set
        }

        try {
            // Extract mime type and raw base64
            let mimeType = 'image/jpeg';
            let rawB64 = base64Data;

            if (base64Data.startsWith('data:')) {
                const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                    mimeType = match[1];
                    rawB64 = match[2];
                }
            }

            const promptText = `Analyze this image as a moderator for a dating & matrimony platform.
1. Is there a real human person / face visible in this photo?
2. Does this photo contain any prohibited content (nudity, pornography, sexually explicit poses, underwear/lingerie, violence, or hate symbols)?

You MUST ACCEPT (return hasFace: true, isProhibited: false) if the image shows:
- Any real human selfie, portrait, full-body photo, mirror selfie, or side-profile photo.
- Photos with beauty filters, Snapchat/Instagram filters, makeup, glasses/sunglasses, or traditional attire (e.g. saree, dupatta, veil, hijab).

You MUST FLAG PROHIBITED (return hasFace: false, isProhibited: true) if the image shows:
- Nudity, exposed genitals, exposed breasts/buttocks, transparent clothing, underwear, lingerie, or sexually provocative poses.
- Graphic gore, violence, weapons, or hate symbols.

You MUST REJECT (return hasFace: false, isProhibited: false) ONLY if the image contains NO real human and instead shows:
- Gods, deities, idols, or religious statues.
- Pure cartoons, anime, illustrations, or memes.
- Only animals, pets, scenery, landscapes, flowers, food, or inanimate objects.

If you reject or flag it, provide a short, polite reason.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: promptText },
                                { inlineData: { mimeType, data: rawB64 } }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0,
                            maxOutputTokens: 120,
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: "OBJECT",
                                properties: {
                                    hasFace: { 
                                        type: "BOOLEAN", 
                                        description: "True if a real human person/face is visible, False otherwise." 
                                    },
                                    isProhibited: {
                                        type: "BOOLEAN",
                                        description: "True if image contains nudity, sexual content, violence, or prohibited material."
                                    },
                                    reason: { 
                                        type: "STRING", 
                                        description: "If hasFace is false or isProhibited is true, a polite reason why." 
                                    }
                                },
                                required: ["hasFace", "isProhibited"]
                            }
                        }
                    }),
                    signal: AbortSignal.timeout(10000) // 10s timeout
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[ModerationService] Gemini API error ${response.status}: ${errText.substring(0, 200)}`);
                // If Gemini rejected due to safety filters, do NOT soft-pass!
                if (errText.includes('SAFETY') || errText.includes('HARM_CATEGORY')) {
                    return {
                        hasFace: false,
                        isProhibited: true,
                        reason: 'Photo rejected due to safety policy violation.'
                    };
                }
                return { hasFace: true };
            }

            const data: any = await response.json();
            
            // Check for Gemini Safety block
            const blockReason = data?.promptFeedback?.blockReason;
            const finishReason = data?.candidates?.[0]?.finishReason;
            if (blockReason === 'SAFETY' || finishReason === 'SAFETY') {
                console.warn(`🚨 [ModerationService] Gemini safety filter triggered: blockReason=${blockReason}, finishReason=${finishReason}`);
                return {
                    hasFace: false,
                    isProhibited: true,
                    reason: 'Photo rejected: content violates acceptable safety guidelines.'
                };
            }

            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                console.error('[ModerationService] Empty response from Gemini.');
                return { hasFace: true };
            }

            let result;
            try {
                result = JSON.parse(rawText);
            } catch (err) {
                console.error('[ModerationService] Failed to parse Gemini structured JSON:', rawText);
                return { hasFace: true };
            }

            console.log(`[ModerationService] Gemini check result:`, result);
            
            return {
                hasFace: result.hasFace === true,
                isProhibited: result.isProhibited === true,
                reason: result.reason ? `Photo rejected: ${result.reason}` : undefined
            };

        } catch (e: any) {
            console.error('[ModerationService] Gemini Vision call failed or timed out:', e.message);
            return { hasFace: true };
        }
    }
}
