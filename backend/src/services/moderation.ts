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
    ): Promise<{ isValid: boolean; reason?: string }> {
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

            // --- Step 3: Gemini Vision Face Detection ---
            const faceResult = await this.detectFaceWithGemini(base64Data);

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
    ): Promise<{ hasFace: boolean; reason?: string }> {
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

            const promptText = `Analyze this image strictly as a moderator for a dating platform. 
Is there a real, clear human face visible as the primary subject?

You MUST REJECT (return hasFace: false) if the image contains:
- Gods, deities, idols, or religious statues.
- Cartoons, anime, illustrations, AI-generated art, or drawings.
- Animals, pets, scenery, landscapes, memes, text, or inanimate objects.
- A human face that is completely obscured by a mask, helmet, or heavy sunglasses.
- Only children without an adult present.

You MUST ACCEPT (return hasFace: true) ONLY if there is at least one clear, real human face visible.

If you reject it, provide a short, polite reason (e.g., "The photo appears to be a scenery.", "The photo contains a deity/idol.", "No clear human face is visible.").`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
                            maxOutputTokens: 100,
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: "OBJECT",
                                properties: {
                                    hasFace: { 
                                        type: "BOOLEAN", 
                                        description: "True if a real human face is clearly visible, False otherwise." 
                                    },
                                    reason: { 
                                        type: "STRING", 
                                        description: "If hasFace is false, a polite 1-sentence reason why it was rejected." 
                                    }
                                },
                                required: ["hasFace"]
                            }
                        }
                    }),
                    signal: AbortSignal.timeout(15000) // 15s timeout
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[ModerationService] Gemini API error ${response.status}: ${errText.substring(0, 200)}`);
                // Soft pass on API error to avoid blocking onboarding flow if quota/key issues happen
                console.warn('[ModerationService] Gemini API error — soft-passing photo to prevent onboarding block.');
                return { hasFace: true };
            }

            const data: any = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!rawText) {
                console.error('[ModerationService] Empty response from Gemini.');
                console.warn('[ModerationService] Soft-passing on empty Gemini response.');
                return { hasFace: true };
            }

            let result;
            try {
                result = JSON.parse(rawText);
            } catch (err) {
                console.error('[ModerationService] Failed to parse Gemini structured JSON:', rawText);
                console.warn('[ModerationService] Soft-passing on failed JSON parse.');
                return { hasFace: true };
            }

            console.log(`[ModerationService] Gemini face check result:`, result);
            
            return {
                hasFace: result.hasFace === true,
                reason: result.reason ? `Photo rejected: ${result.reason} Please upload a clear photo of your face.` : undefined
            };

        } catch (e: any) {
            console.error('[ModerationService] Gemini Vision call failed or timed out:', e.message);
            // Soft pass on timeout or network error to avoid blocking onboarding
            console.warn('[ModerationService] Gemini Vision call failed or timed out — soft-passing photo.');
            return { hasFace: true };
        }
    }
}
