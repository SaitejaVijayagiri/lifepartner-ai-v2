/**
 * contentModerator.ts
 *
 * Local, AI-powered content moderation service using NSFWJS & TensorFlow.js.
 * Operates 100% locally on the backend server:
 *  - 0 API fees (no third-party costs)
 *  - Intercepts and drops adult / prohibited content in memory
 *  - Protects Cloudinary from policy violations and account termination
 */

import * as tf from '@tensorflow/tfjs';
import * as jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

// Lazy import fluent-ffmpeg and ffmpeg-static
let ffmpeg: any = null;
try {
    ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
    }
} catch (e: any) {
    console.warn('[ContentModerator] ffmpeg initialization warning:', e?.message || e);
}

// Lazy-loaded NSFWJS module
let nsfwModel: any = null;
let isModelLoading = false;
let loadPromise: Promise<any> | null = null;

export interface ModerationCheckResult {
    isSafe: boolean;
    reason?: string;
    scores?: {
        porn: number;
        hentai: number;
        sexy: number;
        neutral: number;
        drawing: number;
    };
}

// Configurable thresholds (can be customized via environment variables)
const PORN_THRESHOLD = parseFloat(process.env.NSFW_PORN_THRESHOLD || '0.25');
const HENTAI_THRESHOLD = parseFloat(process.env.NSFW_HENTAI_THRESHOLD || '0.25');
const SEXY_THRESHOLD = parseFloat(process.env.NSFW_SEXY_THRESHOLD || '0.70');

export class ContentModerator {
    /**
     * Loads the NSFWJS MobileNetV2 model into memory once and caches it.
     */
    static async getModel(): Promise<any> {
        if (nsfwModel) return nsfwModel;

        if (isModelLoading && loadPromise) {
            return loadPromise;
        }

        isModelLoading = true;
        loadPromise = (async () => {
            try {
                const nsfw = require('nsfwjs');
                console.log('⏳ [ContentModerator] Loading local NSFWJS model...');
                nsfwModel = await nsfw.load();
                console.log('✅ [ContentModerator] Local NSFWJS model loaded and active.');
                return nsfwModel;
            } catch (err: any) {
                console.error('❌ [ContentModerator] Failed to load NSFWJS model:', err?.message || err);
                throw err;
            } finally {
                isModelLoading = false;
            }
        })();

        return loadPromise;
    }

    /**
     * Preloads and warms up the model (called during server startup).
     */
    static async preload(): Promise<void> {
        try {
            await this.getModel();
        } catch (e: any) {
            console.warn('[ContentModerator] Preload warning:', e?.message || e);
        }
    }

    /**
     * Checks if a base64 string contains prohibited or NSFW content.
     */
    static async checkBase64(base64Str: string): Promise<ModerationCheckResult> {
        if (!base64Str || typeof base64Str !== 'string') {
            return { isSafe: false, reason: 'Invalid or empty image data.' };
        }

        try {
            let cleanB64 = base64Str;
            let mimeType = 'image/jpeg';

            if (base64Str.startsWith('data:')) {
                const parts = base64Str.split(';base64,');
                const mimeMatch = parts[0].match(/data:(.*?)$/);
                if (mimeMatch) mimeType = mimeMatch[1];
                cleanB64 = parts[1] || '';
            }

            if (!cleanB64 || cleanB64.length < 50) {
                return { isSafe: false, reason: 'Image payload is too small or corrupt.' };
            }

            const buffer = Buffer.from(cleanB64, 'base64');
            return await this.checkBuffer(buffer, mimeType);
        } catch (err: any) {
            console.error('[ContentModerator] checkBase64 error:', err?.message || err);
            return { isSafe: false, reason: 'Unable to parse image data.' };
        }
    }

    /**
     * Checks if an image or video file on disk contains prohibited content.
     */
    static async checkFile(filePath: string): Promise<ModerationCheckResult> {
        if (!filePath || !fs.existsSync(filePath)) {
            return { isSafe: false, reason: 'File not found on disk.' };
        }

        try {
            const ext = path.extname(filePath).toLowerCase();
            const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];

            if (videoExtensions.includes(ext)) {
                return await this.checkVideoFile(filePath);
            }

            // Image file
            const buffer = fs.readFileSync(filePath);
            return await this.checkBuffer(buffer);
        } catch (err: any) {
            console.error(`[ContentModerator] checkFile error for ${filePath}:`, err?.message || err);
            return { isSafe: false, reason: 'Failed to process media file for moderation.' };
        }
    }

    /**
     * Checks a video file by extracting snapshot frames and moderating them.
     */
    private static async checkVideoFile(filePath: string): Promise<ModerationCheckResult> {
        if (!ffmpeg) {
            console.warn('[ContentModerator] ffmpeg not available for video moderation — allowing file.');
            return { isSafe: true };
        }

        try {
            // Extract frame at 1s into a JPEG buffer
            const frameBuffer = await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                ffmpeg(filePath)
                    .seekInput(1)
                    .frames(1)
                    .toFormat('mjpeg')
                    .on('error', (err: any) => reject(err))
                    .pipe()
                    .on('data', (chunk: Buffer) => chunks.push(chunk))
                    .on('end', () => resolve(Buffer.concat(chunks)));
            });

            if (frameBuffer && frameBuffer.length > 0) {
                const result = await this.checkBuffer(frameBuffer, 'image/jpeg');
                if (!result.isSafe) {
                    return {
                        isSafe: false,
                        reason: `Video preview frame failed safety check: ${result.reason}`
                    };
                }
            }

            return { isSafe: true };
        } catch (err: any) {
            console.warn(`[ContentModerator] Video frame extraction failed (${err?.message}) — soft passing video.`);
            return { isSafe: true };
        }
    }

    /**
     * Converts any image buffer (JPEG, PNG, WebP, etc.) into raw RGB pixel values.
     */
    private static async decodeToPixels(buffer: Buffer, mimeType?: string): Promise<{
        width: number;
        height: number;
        data: Uint8Array | Uint8ClampedArray | Buffer;
    }> {
        // 1. Direct JPEG check (magic bytes 0xFF, 0xD8, 0xFF)
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            const decoded = jpeg.decode(buffer, { useTArray: true });
            return { width: decoded.width, height: decoded.height, data: decoded.data };
        }

        // 2. Direct PNG check (magic bytes 0x89, 0x50, 0x4E, 0x47)
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            const parsed = PNG.sync.read(buffer);
            return { width: parsed.width, height: parsed.height, data: parsed.data };
        }

        // 3. Fallback for WebP, HEIC, or other formats: convert via ffmpeg to JPEG in memory
        if (ffmpeg) {
            const convertedJpegBuffer = await new Promise<Buffer>((resolve, reject) => {
                const stream = new Readable();
                stream.push(buffer);
                stream.push(null);

                const chunks: Buffer[] = [];
                ffmpeg(stream)
                    .toFormat('mjpeg')
                    .on('error', (err: any) => reject(err))
                    .pipe()
                    .on('data', (chunk: Buffer) => chunks.push(chunk))
                    .on('end', () => resolve(Buffer.concat(chunks)));
            });

            const decoded = jpeg.decode(convertedJpegBuffer, { useTArray: true });
            return { width: decoded.width, height: decoded.height, data: decoded.data };
        }

        // Last resort: attempt jpeg-js decode
        const decoded = jpeg.decode(buffer, { useTArray: true });
        return { width: decoded.width, height: decoded.height, data: decoded.data };
    }

    /**
     * Checks an image buffer for explicit / prohibited content using NSFWJS.
     */
    static async checkBuffer(buffer: Buffer, mimeType?: string): Promise<ModerationCheckResult> {
        if (!buffer || buffer.length === 0) {
            return { isSafe: false, reason: 'Empty image buffer.' };
        }

        let tensor: tf.Tensor3D | null = null;

        try {
            const model = await this.getModel();
            const { width, height, data } = await this.decodeToPixels(buffer, mimeType);

            if (!width || !height || !data || data.length === 0) {
                return { isSafe: false, reason: 'Failed to decode image pixels.' };
            }

            // Convert decoded RGBA data to 3D Tensor RGB [height, width, 3]
            const numPixels = width * height;
            const values = new Int32Array(numPixels * 3);

            for (let i = 0; i < numPixels; i++) {
                values[i * 3] = data[i * 4];         // R
                values[i * 3 + 1] = data[i * 4 + 1]; // G
                values[i * 3 + 2] = data[i * 4 + 2]; // B
            }

            tensor = tf.tensor3d(values, [height, width, 3], 'int32');

            // Classify with NSFWJS
            const predictions = await model.classify(tensor);

            // Extract scores
            const scores = {
                porn: predictions.find((p: any) => p.className === 'Porn')?.probability || 0,
                hentai: predictions.find((p: any) => p.className === 'Hentai')?.probability || 0,
                sexy: predictions.find((p: any) => p.className === 'Sexy')?.probability || 0,
                neutral: predictions.find((p: any) => p.className === 'Neutral')?.probability || 0,
                drawing: predictions.find((p: any) => p.className === 'Drawing')?.probability || 0
            };

            // 1. Explicit Adult / Pornographic Content Check
            if (scores.porn >= PORN_THRESHOLD || scores.hentai >= HENTAI_THRESHOLD) {
                const maxExplicit = Math.max(scores.porn, scores.hentai);
                console.warn(`🚨 [ContentModerator] BLOCKED EXPLICIT CONTENT: Porn=${(scores.porn * 100).toFixed(1)}%, Hentai=${(scores.hentai * 100).toFixed(1)}%`);
                return {
                    isSafe: false,
                    reason: `Adult or sexually explicit content detected (${(maxExplicit * 100).toFixed(0)}% confidence). This violates community safety standards.`,
                    scores
                };
            }

            // 2. Overly Suggestive / Revealing Content Check (Matrimony safety)
            if (scores.sexy >= SEXY_THRESHOLD) {
                console.warn(`🚨 [ContentModerator] BLOCKED SUGGESTIVE CONTENT: Sexy=${(scores.sexy * 100).toFixed(1)}%`);
                return {
                    isSafe: false,
                    reason: `Image does not meet community modesty standards (${(scores.sexy * 100).toFixed(0)}% suggestive rating). Please choose an appropriate photo.`,
                    scores
                };
            }

            console.log(`✅ [ContentModerator] Image passed safety check (Neutral: ${(scores.neutral * 100).toFixed(1)}%, Porn: ${(scores.porn * 100).toFixed(1)}%)`);
            return { isSafe: true, scores };

        } catch (err: any) {
            console.warn('[ContentModerator] Non-fatal moderation error (soft-passing to Gemini Vision):', err?.message || err);
            // Do not block legitimate photos if local TensorFlow/model has an internal issue — Gemini Vision will handle safety detection
            return {
                isSafe: true
            };
        } finally {
            // ALWAYS free TensorFlow memory
            if (tensor) {
                tensor.dispose();
            }
        }
    }
}
