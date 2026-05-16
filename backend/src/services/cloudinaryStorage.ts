/**
 * cloudinaryStorage.ts
 *
 * Replaces Supabase storage for profile photo uploads.
 * Cloudinary free tier: 25 GB storage + 25 GB bandwidth/month — no egress fees.
 * URLs are served from Cloudinary's global CDN — no proxy needed.
 *
 * Setup (one-time):
 *   1. Sign up at https://cloudinary.com (free forever)
 *   2. Go to Dashboard → copy Cloud name, API Key, API Secret
 *   3. Add to .env:
 *        CLOUDINARY_CLOUD_NAME=your_cloud_name
 *        CLOUDINARY_API_KEY=your_api_key
 *        CLOUDINARY_API_SECRET=your_api_secret
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure on first import
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const isConfigured = (): boolean => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

/**
 * Uploads a base64 image to Cloudinary and returns the secure URL.
 * Returns null if upload fails — caller should fall back to base64 storage.
 *
 * @param base64    data:image/... URI
 * @param userId    used as the folder path for organisation
 * @param index     photo index (0 = primary avatar, 1+ = additional photos)
 */
export const uploadToCloudinary = async (
    base64: string,
    userId: string,
    index: number = 0
): Promise<string | null> => {
    if (!isConfigured()) {
        console.warn('[Cloudinary] Not configured — skipping upload. Add CLOUDINARY_* env vars.');
        return null;
    }

    if (!base64 || !base64.startsWith('data:image')) {
        // Already a URL — return as-is
        return base64;
    }

    try {
        const result = await cloudinary.uploader.upload(base64, {
            folder: `lifepartner/profiles/${userId}`,
            public_id: `photo_${index}_${Date.now()}`,
            resource_type: 'image',
            // Auto-optimize: convert to WebP, quality 85, max 1200px wide
            transformation: [
                { width: 1200, crop: 'limit', quality: 85, fetch_format: 'auto' }
            ],
            overwrite: false
        });

        console.log(`✅ [Cloudinary] Uploaded photo ${index} for user ${userId}: ${result.secure_url}`);
        return result.secure_url;
    } catch (e: any) {
        console.error(`[Cloudinary] Upload failed for user ${userId} photo ${index}:`, e?.message || e);
        return null;
    }
};

/**
 * Returns true if the URL is a Cloudinary-hosted image.
 * These URLs don't need proxying — they're on Cloudinary's own CDN.
 */
export const isCloudinaryUrl = (url: string): boolean => {
    return typeof url === 'string' && url.includes('res.cloudinary.com');
};
