// Removed sharp entirely due to local win32 binding compilation errors
// We will just return the buffer natively

export class ImageOptimizer {
    static async optimize(input: Buffer | string): Promise<Buffer> {
        let buffer: Buffer;

        if (typeof input === 'string') {
            // Handle Base64
            // Remove prefix if present (e.g. "data:image/jpeg;base64,")
            const base64Data = input.replace(/^data:image\/\w+;base64,/, "");
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            buffer = input;
        }

        try {
            // Bypass sharp, just return raw image buffer to prevent API crashes
            return buffer;
        } catch (error) {
            console.error("Image Optimization Failed", error);
            // Fallback: return original buffer if optimization fails (or throw)
            return buffer;
        }
    }

    static isBase64(str: string): boolean {
        return typeof str === 'string' && str.startsWith('data:image');
    }
}
