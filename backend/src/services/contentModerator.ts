/**
 * contentModerator.ts
 *
 * Lightweight, zero-overhead content moderator.
 * TensorFlow & NSFWJS have been completely removed per user request.
 * Safety moderation is handled exclusively by Gemini Vision in moderation.ts.
 */

export interface ModerationCheckResult {
    isSafe: boolean;
    reason?: string;
    scores?: any;
}

export class ContentModerator {
    static async getModel(): Promise<any> {
        return null;
    }

    static async preload(): Promise<void> {
        // No-op: TensorFlow & NSFWJS removed
    }

    static async checkBase64(base64Str: string): Promise<ModerationCheckResult> {
        return { isSafe: true };
    }

    static async checkFile(filePath: string): Promise<ModerationCheckResult> {
        return { isSafe: true };
    }

    static async checkBuffer(buffer: Buffer, mimeType?: string): Promise<ModerationCheckResult> {
        return { isSafe: true };
    }
}
