/**
 * r2Storage.ts
 *
 * Cloudflare R2 Object Storage Service.
 * - S3-compatible API with ZERO egress bandwidth fees.
 * - Perfect for private chat media, sensitive UGC, profile pictures, and backups.
 * - Files are never scanned or terminated by third-party CDNs.
 *
 * Required environment variables in .env:
 *   R2_ACCOUNT_ID=your_cloudflare_account_id
 *   R2_ACCESS_KEY_ID=your_r2_access_key_id
 *   R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
 *   R2_BUCKET_NAME=lifepartner-media
 *   R2_PUBLIC_DOMAIN=https://media.lifepartnerai.in (optional: for public assets like avatars)
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';

let s3Client: S3Client | null = null;

export const isR2Configured = (): boolean => {
    return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    );
};

const getS3Client = (): S3Client => {
    if (!s3Client) {
        const accountId = process.env.R2_ACCOUNT_ID || '';
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
            forcePathStyle: true,
        });
    }
    return s3Client;
};

const getBucketName = (): string => {
    return process.env.R2_BUCKET_NAME || 'lifepartner-media';
};

/**
 * Uploads a Buffer directly to Cloudflare R2.
 * @param buffer       File buffer
 * @param key          Storage path/filename (e.g. "chat/user123/photo.jpg")
 * @param contentType  MIME type (e.g. "image/jpeg", "video/mp4")
 * @param isPublic     If true and R2_PUBLIC_DOMAIN is configured, returns public URL.
 *                     If false, returns the pre-signed URL or key for private access.
 */
export const uploadBufferToR2 = async (
    buffer: Buffer,
    key: string,
    contentType: string = 'application/octet-stream',
    isPublic: boolean = false
): Promise<{ url: string; key: string } | null> => {
    if (!isR2Configured()) {
        console.warn('[Cloudflare R2] Not configured. Missing R2_* environment variables.');
        return null;
    }

    try {
        const client = getS3Client();
        const bucket = getBucketName();

        await client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            })
        );

        console.log(`✅ [Cloudflare R2] Uploaded buffer to: ${key}`);

        // If a public domain or r2.dev URL is configured and asset is public:
        const publicDomain = process.env.R2_PUBLIC_DOMAIN;
        if (isPublic && publicDomain) {
            const cleanDomain = publicDomain.replace(/\/+$/, '');
            return {
                url: `${cleanDomain}/${key}`,
                key,
            };
        }

        // For public assets (profile photos, stories): generate permanent URL via backend route
        if (isPublic) {
            const backendUrl = (process.env.BACKEND_URL || 'https://lifepartner-ai.onrender.com').replace(/\/+$/, '');
            return {
                url: `${backendUrl}/photo/r2/${key}`,
                key,
            };
        }

        // For private media (e.g. chat), generate a secure pre-signed URL (valid for 24 hours for chat delivery)
        const presignedUrl = await getSignedDownloadUrl(key, 86400); // 24 hours
        return {
            url: presignedUrl || key,
            key,
        };
    } catch (e: any) {
        console.error(`❌ [Cloudflare R2] Upload failed for ${key}:`, e?.message || e);
        return null;
    }
};

/**
 * Uploads a base64 string to Cloudflare R2.
 */
export const uploadBase64ToR2 = async (
    base64Data: string,
    key: string,
    isPublic: boolean = true
): Promise<string | null> => {
    if (!isR2Configured()) return null;

    try {
        let cleanB64 = base64Data;
        let contentType = 'image/jpeg';

        if (base64Data.startsWith('data:')) {
            const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
                contentType = match[1];
                cleanB64 = match[2];
            }
        }

        const buffer = Buffer.from(cleanB64, 'base64');
        const result = await uploadBufferToR2(buffer, key, contentType, isPublic);
        return result?.url || null;
    } catch (e: any) {
        console.error(`❌ [Cloudflare R2] Base64 upload failed for ${key}:`, e?.message || e);
        return null;
    }
};

/**
 * Generates a temporary, secure pre-signed download URL for a private R2 object.
 * Perfect for private 1-on-1 chat media without exposing files publicly.
 *
 * @param key             The storage key (e.g. "chat/user_123/xyz.jpg")
 * @param expiresInSeconds Duration until the URL expires (default: 300s / 5 mins)
 */
export const getSignedDownloadUrl = async (
    key: string,
    expiresInSeconds: number = 300
): Promise<string | null> => {
    if (!isR2Configured()) return null;

    try {
        const client = getS3Client();
        const bucket = getBucketName();

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const signedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
        return signedUrl;
    } catch (e: any) {
        console.error(`❌ [Cloudflare R2] Failed to generate signed URL for ${key}:`, e?.message || e);
        return null;
    }
};

/**
 * Deletes an object from Cloudflare R2 by key.
 */
export const deleteFromR2 = async (key: string): Promise<boolean> => {
    if (!isR2Configured() || !key) return false;

    try {
        const client = getS3Client();
        const bucket = getBucketName();

        await client.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
        console.log(`🗑️ [Cloudflare R2] Deleted object: ${key}`);
        return true;
    } catch (e: any) {
        console.error(`❌ [Cloudflare R2] Delete failed for ${key}:`, e?.message || e);
        return false;
    }
};

/**
 * Retrieves an object stream and metadata from Cloudflare R2 by key.
 */
export const getObjectFromR2 = async (key: string): Promise<{ body: any; contentType: string } | null> => {
    if (!isR2Configured() || !key) return null;

    try {
        const client = getS3Client();
        const bucket = getBucketName();

        const response = await client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );

        return {
            body: response.Body,
            contentType: response.ContentType || 'image/jpeg',
        };
    } catch (e: any) {
        console.error(`❌ [Cloudflare R2] Get object failed for ${key}:`, e?.message || e);
        return null;
    }
};
