import * as faceapi from '@vladmandic/face-api';
// Use dynamic import or require for canvas to avoid TS strictness issues with undocumented types
const canvas = require('canvas');
import path from 'path';

// Monkey patch the node.js environment to behave like a browser for face-api
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

export class ModerationService {
    private static modelsLoaded = false;
    private static loadPromise: Promise<void> | null = null;

    /**
     * Bootstraps the Face API Tiny Face Detector weights purely offline.
     */
    static async initModels() {
        if (this.modelsLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        const modelsPath = path.join(__dirname, '../../public/models');
        console.log(`🤖 [ModerationService] Loading Tiny Face Detector from: ${modelsPath}`);

        this.loadPromise = faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath).then(() => {
            this.modelsLoaded = true;
            console.log(`✅ [ModerationService] Offline Face AI Initialized!`);
        }).catch(err => {
            console.error(`❌ [ModerationService] Failed to load Face AI:`, err);
            // reset promise on fail
            this.loadPromise = null;
        });

        return this.loadPromise;
    }

    /**
     * Determines if an uploaded profile picture contains exactly one human face.
     * Rejects scenery, empty photos, cartoons without faces, or group photos.
     * 
     * @param base64Data Standard base64 data URL string (e.g. data:image/jpeg;base64,...)
     */
    static async validateProfilePhoto(base64Data: string): Promise<{ isValid: boolean; reason?: string }> {
        try {
            await this.initModels();

            if (!this.modelsLoaded) {
                // Fail-open if the ML system crashes (prevent locking out all users globally)
                console.warn(`⚠️ [ModerationService] Bypassing moderation because models failed to load.`);
                return { isValid: true };
            }

            // Extract pure base64
            let rawB64 = base64Data;
            if (base64Data.includes('base64,')) {
                rawB64 = base64Data.split('base64,')[1];
            }

            if (!rawB64) return { isValid: false, reason: 'Invalid image format.' };

            // Load buffer into Canvas Image element for face-api
            const buffer = Buffer.from(rawB64, 'base64');
            const img = new Image();

            // Wait for image wrap
            await new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = (err: any) => reject(err);
                img.src = buffer;
            });

            // Run detection 
            const detections = await faceapi.detectAllFaces(
                img as any,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            );

            console.log(`🔍 [ModerationService] Detected ${detections.length} face(s) in upload.`);

            if (detections.length === 0) {
                return {
                    isValid: false,
                    reason: "We couldn't detect a face in this picture. Please upload a clear photo of yourself."
                };
            }

            if (detections.length > 1) {
                return {
                    isValid: false,
                    reason: "Multiple faces detected. For your main profile verification, please upload a solo picture."
                };
            }

            return { isValid: true };

        } catch (e: any) {
            console.error(`❌ [ModerationService] Exception during scan:`, e);
            // Fail open on hard API exceptions so we don't block users if the canvas lib breaks
            return { isValid: true };
        }
    }
}
