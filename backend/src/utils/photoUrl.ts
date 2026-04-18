/**
 * Shared photo URL utilities
 *
 * Background: Supabase storage URLs are DNS-blocked by some Indian ISPs (as of Feb 2026).
 * We route all Supabase storage URLs through our Render-hosted image proxy (/photo?url=...)
 * to ensure images load reliably for all users.
 *
 * base64 data URIs (~200KB compressed) are stored directly in Postgres as a fallback
 * when Supabase storage is unavailable. They are passed through as-is.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://lifepartner-ai.onrender.com';

/**
 * Converts a Supabase storage URL to our proxy URL.
 * Other URLs (absolute HTTP, data URIs) are passed through unchanged.
 */
export const toProxyUrl = (url: string): string => {
    if (!url || !url.includes('supabase.co/storage')) return url;
    return `${BACKEND_URL}/photo?url=${encodeURIComponent(url)}`;
};

/**
 * Returns a safe, always-renderable photo URL:
 * - base64 data URIs → returned as-is (already safe)
 * - Supabase storage URLs → proxied through backend
 * - null / undefined → DiceBear initials avatar using the provided seed
 */
export const sanitizePhotoUrl = (url: string | null | undefined, seed: string): string => {
    if (url && url.startsWith('data:image')) {
        return url;
    }
    if (!url) {
        return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
    }
    return toProxyUrl(url);
};
