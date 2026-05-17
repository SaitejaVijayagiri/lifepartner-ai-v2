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
export const isCloudinaryUrl = (url: string): boolean => {
    return typeof url === 'string' && url.includes('res.cloudinary.com');
};

/**
 * Uploads a local file to Cloudinary and returns the secure URL and public_id.
 * Supports both images and videos.
 *
 * @param filePath  local path to the file
 * @param userId    used as the folder path for organisation
 */
export const uploadFileToCloudinary = async (
    filePath: string,
    userId: string,
    options?: { startOffset?: number, endOffset?: number }
): Promise<{ url: string, publicId: string } | null> => {
    if (!isConfigured()) {
        console.warn('[Cloudinary] Not configured — skipping upload.');
        return null;
    }

    try {
        const uploadOptions: any = {
            folder: `lifepartner/stories/${userId}`,
            public_id: `story_${Date.now()}`,
            resource_type: 'auto', // auto detects video or image
            overwrite: false
        };

        if (options?.startOffset !== undefined || options?.endOffset !== undefined) {
            uploadOptions.transformation = [
                {
                    ...(options.startOffset !== undefined && { start_offset: options.startOffset }),
                    ...(options.endOffset !== undefined && { end_offset: options.endOffset })
                }
            ];
        }

        const result = await cloudinary.uploader.upload(filePath, uploadOptions);

        console.log(`✅ [Cloudinary] Uploaded file for user ${userId}: ${result.secure_url}`);
        return { url: result.secure_url, publicId: result.public_id };
    } catch (e: any) {
        console.error(`[Cloudinary] File upload failed for user ${userId}:`, e?.message || e);
        return null;
    }
};

/**
 * Deletes a file from Cloudinary by its public_id.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    if (!isConfigured() || !publicId) return false;

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️ [Cloudinary] Deleted file ${publicId}:`, result);
        return result.result === 'ok';
    } catch (e: any) {
        console.error(`[Cloudinary] Delete failed for ${publicId}:`, e?.message || e);
        return false;
    }
};

/**
 * Generates a video slideshow URL from multiple image public_ids.
 * @param publicIds Array of Cloudinary image public IDs
 */
export const generateSlideshowUrl = (publicIds: string[]): string | null => {
    if (!isConfigured() || publicIds.length === 0) return null;
    
    // We use the first image as the base video (Cloudinary allows generating a video from a single image)
    const baseId = publicIds[0];
    const transformation: any[] = [
        { width: 720, height: 1280, crop: 'fill', background: 'black' },
        { duration: 3 } // Duration per slide
    ];

    // For every subsequent image, splice it with a transition
    for (let i = 1; i < publicIds.length; i++) {
        transformation.push(
            { overlay: publicIds[i].replace(/\//g, ':') }, // Cloudinary overlay syntax requires colons for folders
            { flags: 'splice', effect: 'transition:name_fade;du_1' },
            { flags: 'layer_apply' }
        );
    }

    // Force output to mp4
    return cloudinary.url(baseId, {
        resource_type: 'video',
        format: 'mp4',
        transformation: transformation,
        secure: true
    });
};
