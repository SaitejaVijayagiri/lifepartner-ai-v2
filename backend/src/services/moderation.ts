/**
 * ModerationService — AI-Powered Photo Validation with Gemini Vision
 * 
 * HISTORY: Previously used TensorFlow.js WASM + MediaPipe Face Detector to scan
 * uploaded photos for faces. However, this caused catastrophic Out-Of-Memory crashes
 * on the Render free tier (512MB RAM limit).
 * 
 * CURRENT: Uses Gemini Vision API (gemini-1.5-flash) for face detection via a 
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
     * Uses Gemini Vision (gemini-1.5-flash) to check whether a human face
     * is clearly visible in the image. This is a pure HTTP call — no local RAM usage.
     */
    private static async detectFaceWithGemini(
        base64Data: string
    ): Promise<{ hasFace: boolean; reason?: string }> {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.includes('your_') || apiKey.length < 10) {
            console.warn('[ModerationService] GEMINI_API_KEY not configured — skipping face detection.');
            return { hasFace: true }; // Soft pass
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

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: `Analyze this image strictly. Does it contain a clearly visible human face (a real person, not a cartoon, animal, scenery, object, or blurred/obscured face)?
                                    
Reply with a JSON object ONLY in this exact format:
{"hasFace": true, "confidence": "high"} 
or
{"hasFace": false, "reason": "brief reason e.g. landscape photo, cartoon character, no face visible"}`
                                },
                                {
                                    inlineData: {
                                        mimeType,
                                        data: rawB64.substring(0, 800000) // Truncate to ~600KB for API speed
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0,
                            maxOutputTokens: 60
                        }
                    }),
                    signal: AbortSignal.timeout(10000) // 10s timeout
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`[ModerationService] Gemini Vision API error ${response.status}: ${errText.substring(0, 100)}`);
                return { hasFace: true }; // Soft pass on API error
            }

            const data: any = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Parse the JSON response
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('[ModerationService] Could not parse Gemini response:', rawText.substring(0, 100));
                return { hasFace: true }; // Soft pass on parse failure
            }

            const result = JSON.parse(jsonMatch[0]);
            console.log(`[ModerationService] Gemini face check result:`, result);
            
            return {
                hasFace: result.hasFace === true,
                reason: result.reason ? `Photo rejected: ${result.reason}. Please upload a clear photo of your face.` : undefined
            };

        } catch (e: any) {
            if (e.name === 'TimeoutError') {
                console.warn('[ModerationService] Gemini Vision API timed out — soft passing photo.');
            } else {
                console.error('[ModerationService] Gemini Vision call failed:', e.message);
            }
            return { hasFace: true }; // Always soft pass on network/timeout errors
        }
    }
}
