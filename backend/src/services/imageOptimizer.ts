import sharp from 'sharp';

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
            return await sharp(buffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toBuffer();
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
