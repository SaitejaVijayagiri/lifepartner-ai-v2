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
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed.includes('supabase.co/storage')) return trimmed;
    return `${BACKEND_URL}/photo?url=${encodeURIComponent(trimmed)}`;
};

/**
 * Checks if a user has a valid custom photo uploaded (not null, default, or empty).
 */
export const hasValidPhoto = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed || trimmed === '/avatar-fallback.svg' || trimmed.includes('dicebear.com')) return false;
    return true;
};

/**
 * Returns a safe, always-renderable photo URL:
 * - Cloudinary URLs       → returned as-is (global CDN, no ISP block)
 * - base64 data URIs      → returned as-is (inline, no network request)
 * - Supabase storage URLs → proxied through backend (bypasses ISP block)
 * - Relative upload URLs  → prepended with BACKEND_URL
 * - Localhost in prod     → converted to BACKEND_URL
 * - null / empty / broken → DiceBear initials avatar using the provided seed
 */
export const sanitizePhotoUrl = (url: string | null | undefined, seed: string): string => {
    const cleanSeed = (seed && seed.trim()) ? seed.trim() : 'User';
    const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanSeed)}`;

    if (!url || typeof url !== 'string') {
        return fallbackUrl;
    }
    
    let trimmed = url.trim();
    if (!trimmed) return fallbackUrl;

    // base64: inline — browser renders directly, no network request
    if (trimmed.startsWith('data:image')) return trimmed;
    
    // Relative uploads path
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
        const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return `${BACKEND_URL}${cleanPath}`;
    }

    // Convert localhost URLs to BACKEND_URL in production environment
    if (trimmed.includes('localhost:') && process.env.NODE_ENV === 'production') {
        trimmed = trimmed.replace(/http:\/\/localhost:\d+/, BACKEND_URL);
    }

    // Cloudinary: own CDN, globally accessible, no proxy needed
    if (trimmed.includes('res.cloudinary.com')) return trimmed;

    // Supabase: ISP-blocked in India → route through backend proxy
    if (trimmed.includes('supabase.co/storage')) {
        return toProxyUrl(trimmed);
    }

    // Ensure valid http/https scheme or return fallback
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
        return fallbackUrl;
    }

    return trimmed;
};

