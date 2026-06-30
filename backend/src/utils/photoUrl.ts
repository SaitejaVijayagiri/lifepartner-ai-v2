/**
 * Shared photo URL utilities
 *
 * Storage backends (in priority order):
 *  1. Cloudinary (primary) — free 25 GB, global CDN, no egress fees, no ISP block
 *  2. Supabase storage (legacy) — DNS-blocked by some Indian ISPs, routed via backend proxy
 *  3. base64 data URIs — stored directly in Postgres as last-resort fallback
 *
 * Rule: Only Supabase URLs need proxying. Cloudinary + base64 pass through as-is.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://lifepartner-ai.onrender.com';

/**
 * Converts a Supabase storage URL to our proxy URL.
 * Cloudinary, base64, and other URLs pass through unchanged.
 */
export const toProxyUrl = (url: string): string => {
    if (!url || !url.includes('supabase.co/storage')) return url;
    return `${BACKEND_URL}/photo?url=${encodeURIComponent(url)}`;
};

/**
 * Returns a safe, always-renderable photo URL:
 * - Cloudinary URLs       → returned as-is (global CDN, no ISP block)
 * - base64 data URIs      → returned as-is (inline, no network request)
 * - Supabase storage URLs → proxied through backend (bypasses ISP block)
 * - null / undefined      → DiceBear initials avatar using the provided seed
 */
export const sanitizePhotoUrl = (url: string | null | undefined, seed: string): string => {
    if (!url) {
        return `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(seed)}`;
    }
    // base64: inline — browser renders directly, no network request
    if (url.startsWith('data:image')) return url;
    // Cloudinary: own CDN, globally accessible, no proxy needed
    if (url.includes('res.cloudinary.com')) return url;
    // Supabase: ISP-blocked in India → route through backend proxy
    return toProxyUrl(url);
};
