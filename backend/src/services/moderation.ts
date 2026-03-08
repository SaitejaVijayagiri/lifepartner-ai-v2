import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-wasm';
import * as faceDetection from '@tensorflow-models/face-detection';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import path from 'path';

export class ModerationService {
    private static modelsLoaded = false;
    private static loadPromise: Promise<void> | null = null;
    private static detector: faceDetection.FaceDetector | null = null;

    /**
     * Bootstraps the MediaPipe Face Detector weights safely.
     */
    static async initModels() {
        if (this.modelsLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        console.log(`🤖 [ModerationService] Initializing TFJS WASM Edge runtime...`);

        this.loadPromise = (async () => {
            await tf.setBackend('wasm');
            await tf.ready();

            const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
            const detectorConfig = {
                runtime: 'tfjs' as const,
                maxFaces: 5,
            };

            this.detector = await faceDetection.createDetector(model, detectorConfig);
            this.modelsLoaded = true;
            console.log(`✅ [ModerationService] Lightweight Face AI Initialized locally!`);
        })().catch(err => {
            console.error(`❌ [ModerationService] Failed to load Face AI:`, err);
            this.loadPromise = null;
        });

        return this.loadPromise;
    }

    /**
     * Converts a Node Buffer directly to a pure 3D RGB Tensor without Canvas memory bloat
     */
    private static bufferToTensor(buffer: Buffer, isPng: boolean): tf.Tensor3D {
        let width, height, data;

        if (isPng) {
            const png = PNG.sync.read(buffer);
            width = png.width;
            height = png.height;
            data = png.data;
        } else {
            const rawImageData = jpeg.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 256 });
            width = rawImageData.width;
            height = rawImageData.height;
            data = rawImageData.data;
        }

        const numPixels = width * height;
        const rgbData = new Uint8Array(numPixels * 3);

        // Strip Alpha Channel (RGBA -> RGB) for MediaPipe compatibility
        for (let i = 0; i < numPixels; i++) {
            rgbData[i * 3] = data[i * 4];         // R
            rgbData[i * 3 + 1] = data[i * 4 + 1]; // G
            rgbData[i * 3 + 2] = data[i * 4 + 2]; // B
        }

        return tf.tensor3d(rgbData, [height, width, 3], 'int32');
    }

    /**
     * Determines if an uploaded profile picture contains exactly one human face.
     */
    static async validateProfilePhoto(base64Data: string): Promise<{ isValid: boolean; reason?: string }> {
        try {
            await this.initModels();

            if (!this.modelsLoaded || !this.detector) {
                console.warn(`⚠️ [ModerationService] Bypassing moderation because models failed to load.`);
                return { isValid: true };
            }

            let rawB64 = base64Data;
            let isPng = false;

            if (base64Data.includes('base64,')) {
                isPng = base64Data.includes('image/png');
                rawB64 = base64Data.split('base64,')[1];
            }

            if (!rawB64) return { isValid: false, reason: 'Invalid image format.' };

            const buffer = Buffer.from(rawB64, 'base64');
            const tensor = this.bufferToTensor(buffer, isPng);

            const start = Date.now();
            const faces = await this.detector.estimateFaces(tensor);
            console.log(`🔍 [ModerationService] Detected ${faces.length} face(s) in ${Date.now() - start}ms.`);

            tensor.dispose();

            if (faces.length === 0) {
                return {
                    isValid: false,
                    reason: "We couldn't detect a face in this picture. Please upload a clear photo of yourself."
                };
            }

            if (faces.length > 1) {
                return {
                    isValid: false,
                    reason: "Multiple faces detected. For your main profile verification, please upload a solo picture."
                };
            }

            return { isValid: true };

        } catch (e: any) {
            console.error(`❌ [ModerationService] Exception during scan:`, e);
            return { isValid: true };
        }
    }
}
