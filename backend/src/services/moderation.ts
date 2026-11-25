import { callGeminiGenerate, isGeminiConfigured } from '../utils/geminiClient';

/**
 * ModerationService — AI-Powered Photo Validation with Gemini Vision
 * 
 * HISTORY: Previously used TensorFlow.js WASM + MediaPipe Face Detector to scan
 * uploaded photos for faces. However, this caused catastrophic Out-Of-Memory crashes
 * on the Render free tier (512MB RAM limit).
 * 
 * CURRENT: Uses Gemini Vision API (gemini-4-hydrogen -> gemini-2.5-flash) for face & safety
 * detection via pure HTTP calls — zero local RAM overhead.
 */

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
            const lower = base64Data.toLowerCase();
            if (lower.includes('image/svg')) {
                return { isValid: false, isProhibited: true, reason: 'SVG images are not allowed for security reasons.' };
            }
            const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif', 'image/gif', 'image/avif', 'image/'];
            const hasValidPrefix = validFormats.some(fmt => lower.includes(fmt));

            if (base64Data.startsWith('data:') && !hasValidPrefix) {
                return { isValid: false, isProhibited: true, reason: 'Unsupported or unsafe file format. Please upload a JPG, PNG, or WebP photo.' };
            }

            // --- Step 2: Size validation ---
            let rawB64 = base64Data;
            if (base64Data.includes('base64,')) {
                rawB64 = base64Data.split('base64,')[1];
            }

            if (!rawB64 || rawB64.length < 50) {
                return { isValid: false, reason: 'Image appears to be corrupt or empty. Please re-upload.' };
            }

            const approxBytes = Math.ceil(rawB64.length * 0.75);

            if (approxBytes < 100) {
                return { isValid: false, reason: 'Image file is too small. Please upload a clear photo.' };
            }

            if (approxBytes > this.MAX_IMAGE_BYTES) {
                return { isValid: false, reason: 'Image is too large (max 6MB). Please upload a smaller photo.' };
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

            if (faceResult.apiUnavailable) {
                if (isFirstPhoto) {
                    return {
                        isValid: false,
                        isProhibited: false,
                        reason: 'Photo safety check is temporarily unavailable. Please try uploading again in a moment.'
                    };
                }
                console.warn('[ModerationService] Vision check unavailable for secondary photo — soft passing.');
                return { isValid: true };
            }

            if (!faceResult.hasFace) {
                if (isFirstPhoto) {
                    return {
                        isValid: false,
                        isProhibited: false,
                        reason: faceResult.reason || 'Primary profile photo must clearly show your face (no cartoons, memes, or objects).'
                    };
                }
                console.warn('[ModerationService] Face not clearly identified on secondary photo — allowing non-prohibited upload.');
            }

            console.log(`✅ [ModerationService] Photo validated (${Math.round(approxBytes / 1024)}KB, face: ${faceResult.hasFace}).`);
            return { isValid: true };

        } catch (e: any) {
            console.error(`❌ [ModerationService] Validation error:`, e.message);
            if (isFirstPhoto) {
                return { isValid: false, isProhibited: false, reason: 'Could not verify primary photo safety. Please try another photo.' };
            }
            return { isValid: true };
        }
    }

    /**
     * Uses Gemini Vision (gemini-2.5-flash) to check whether a human face
     * is clearly visible in the image. This is a pure HTTP call — no local RAM usage.
     */
    private static async detectFaceWithGemini(
        base64Data: string
    ): Promise<{ hasFace: boolean; isProhibited?: boolean; apiUnavailable?: boolean; reason?: string }> {
        if (!isGeminiConfigured()) {
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

            const geminiRes = await callGeminiGenerate({
                contents: [{
                    role: 'user',
                    parts: [
                        { text: promptText },
                        { inlineData: { mimeType, data: rawB64 } }
                    ]
                }],
                temperature: 0,
                maxOutputTokens: 160,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        hasFace: {
                            type: 'BOOLEAN',
                            description: 'True if a real human person/face is visible, False otherwise.'
                        },
                        isProhibited: {
                            type: 'BOOLEAN',
                            description: 'True if image contains nudity, sexual content, violence, or prohibited material.'
                        },
                        reason: {
                            type: 'STRING',
                            description: 'If hasFace is false or isProhibited is true, a polite reason why.'
                        }
                    },
                    required: ['hasFace', 'isProhibited']
                },
                timeoutMs: 10000
            });

            if (geminiRes.blockedBySafety) {
                console.warn('🚨 [ModerationService] Gemini safety filter triggered.');
                return {
                    hasFace: false,
                    isProhibited: true,
                    reason: 'Photo rejected: content violates acceptable safety guidelines.'
                };
            }

            if (!geminiRes.text) {
                console.error('[ModerationService] Empty/unavailable response from Gemini.');
                return { hasFace: false, apiUnavailable: true };
            }

            let result;
            try {
                result = JSON.parse(geminiRes.text);
            } catch {
                console.error('[ModerationService] Failed to parse Gemini structured JSON:', geminiRes.text);
                return { hasFace: false, apiUnavailable: true };
            }

            console.log(`[ModerationService] Gemini (${geminiRes.modelUsed}) check result:`, result);

            return {
                hasFace: result.hasFace === true,
                isProhibited: result.isProhibited === true,
                reason: result.reason ? `Photo rejected: ${result.reason}` : undefined
            };
        } catch (e: any) {
            console.error('[ModerationService] Gemini Vision call failed or timed out:', e.message);
            return { hasFace: false, apiUnavailable: true };
        }
    }
}
