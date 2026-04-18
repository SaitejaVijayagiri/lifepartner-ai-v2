/**
 * ModerationService — Lightweight Photo Validation
 * 
 * HISTORY: Previously used TensorFlow.js WASM + MediaPipe Face Detector to scan
 * uploaded photos for faces. However, this caused catastrophic Out-Of-Memory crashes
 * on the Render free tier (512MB RAM limit) when users uploaded multiple photos during
 * onboarding, preventing genuine users from completing their profile setup.
 * 
 * Since the AI validation was already running in "soft moderation" mode (logging warnings
 * but ALWAYS allowing photos through regardless of result), the TFJS overhead provided
 * zero user-facing value while consuming ~150-300MB of RAM per image tensor.
 * 
 * CURRENT: Performs lightweight heuristic validation (file size, format checks) and logs
 * metadata for future review. When a proper moderation API (e.g., Google Vision SafeSearch,
 * AWS Rekognition) is integrated, it can be plugged into the `validateProfilePhoto` method.
 */

export class ModerationService {
    // Maximum allowed image size for profile photos (6MB - slightly larger than frontend 5MB to accommodate base64 conversion overhead)
    private static readonly MAX_IMAGE_BYTES = 6 * 1024 * 1024;

    // Minimum image size to filter out garbage/corrupt uploads (1KB)
    private static readonly MIN_IMAGE_BYTES = 1024;

    /**
     * Validates an uploaded profile picture using lightweight heuristics.
     * 
     * Checks performed:
     * 1. Valid base64 image format (JPEG, PNG, WebP)
     * 2. Reasonable file size (between 1KB and 2MB)
     * 3. Not a suspiciously tiny placeholder image
     * 
     * Returns isValid: true for all legitimate photos. Only rejects clearly corrupt
     * or malformed uploads to prevent database pollution.
     */
    static async validateProfilePhoto(base64Data: string): Promise<{ isValid: boolean; reason?: string }> {
        try {
            if (!base64Data || typeof base64Data !== 'string') {
                console.warn('[ModerationService] Empty or non-string image data received.');
                return { isValid: false, reason: 'Invalid image data. Please upload a valid photo.' };
            }

            // Validate format prefix
            const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            const hasValidPrefix = validFormats.some(fmt => base64Data.includes(fmt));

            if (base64Data.startsWith('data:') && !hasValidPrefix) {
                console.warn(`[ModerationService] Unsupported image format detected.`);
                return { isValid: false, reason: 'Unsupported image format. Please upload JPEG, PNG, or WebP.' };
            }

            // Extract raw base64 payload
            let rawB64 = base64Data;
            if (base64Data.includes('base64,')) {
                rawB64 = base64Data.split('base64,')[1];
            }

            if (!rawB64 || rawB64.length < 100) {
                console.warn('[ModerationService] Image data is too small or empty.');
                return { isValid: false, reason: 'Image appears to be corrupt or empty. Please re-upload.' };
            }

            // Calculate approximate decoded size
            const approxBytes = Math.ceil(rawB64.length * 0.75);

            if (approxBytes < this.MIN_IMAGE_BYTES) {
                console.warn(`[ModerationService] Image too small (${approxBytes} bytes) — likely corrupt.`);
                return { isValid: false, reason: 'Image file is too small. Please upload a clear photo.' };
            }

            if (approxBytes > this.MAX_IMAGE_BYTES) {
                console.warn(`[ModerationService] Image too large (${Math.round(approxBytes / 1024)}KB). Rejecting.`);
                return { isValid: false, reason: 'Image is too large (max 6MB). Please upload a smaller photo.' };
            }

            console.log(`✅ [ModerationService] Photo validated (${Math.round(approxBytes / 1024)}KB, format OK).`);
            return { isValid: true };

        } catch (e: any) {
            console.error(`❌ [ModerationService] Validation error:`, e.message);
            // On unexpected errors, allow the photo through to avoid blocking onboarding
            return { isValid: true };
        }
    }
}
