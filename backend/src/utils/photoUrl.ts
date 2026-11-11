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

const BACKEND_URL = process.env.BACKEND_URL || 'https://lifepartner-backend-295663053086.asia-south1.run.app';

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
 * Converts a Supabase storage URL to our proxy URL.
 * Cloudinary, base64, and other URLs pass through unchanged.
 */
export const extractPhotosList = (profileObj: any, meta: any = {}, defaultAvatarUrl?: string | null): string[] => {
    const colPhotos = Array.isArray(profileObj?.photos) && profileObj.photos.length > 0 ? profileObj.photos : null;
    const metaPhotos = Array.isArray(meta?.photos) && meta.photos.length > 0 ? meta.photos : null;
    const rawList = colPhotos || metaPhotos || (defaultAvatarUrl ? [defaultAvatarUrl] : []);
    const validStrings = rawList.filter((p: any) => typeof p === 'string' && p.trim().length > 0);

    // If user has custom uploaded photos (Cloudinary, Supabase, base64, uploads),
    // remove any imported Google placeholder avatars so real photos are not overshadowed
    const hasCustomPhotos = validStrings.some((p: string) =>
        p.includes('cloudinary') || p.includes('supabase') || p.includes('r2.dev') || p.includes('r2.cloudflarestorage.com') || p.startsWith('data:image') || p.startsWith('/uploads/')
    );
    if (hasCustomPhotos) {
        return validStrings.filter((p: string) => !p.includes('googleusercontent.com'));
    }
    return validStrings;
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

    // Cloudflare R2: direct public CDN delivery (globally fast, zero backend proxy overhead)
    if (trimmed.includes('r2.dev')) return trimmed;

    // Cloudflare R2 internal S3 endpoint or legacy proxy URL -> map to direct public CDN domain
    if (trimmed.includes('r2.cloudflarestorage.com') || trimmed.includes('/photo/r2/')) {
        const publicDomain = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-3b58a918534743dbadb291e05279a459.r2.dev').replace(/\/+$/, '');
        const keyMatch = trimmed.match(/(?:profiles|chat|stories|instants)\/.+$/);
        if (keyMatch) {
            return `${publicDomain}/${keyMatch[0]}`;
        }
    }

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

/**
 * Returns true if the target profile has the Photo Privacy Shield enabled.
 */
export const isPhotoPrivacyShieldEnabled = (meta: any): boolean => {
    const mode = meta?.photo_privacy || meta?.photoPrivacy;
    return mode === 'blurred_until_accept';
};

/**
 * Resolves mutual interaction status, prioritizing established connections ('accepted' / 'connected')
 * over one-sided pending or rejected requests.
 */
export const resolveMatchStatus = (sentStatus?: string | null, receivedStatus?: string | null): string | null => {
    if (sentStatus === 'connected' || sentStatus === 'accepted' || receivedStatus === 'connected' || receivedStatus === 'accepted') {
        return sentStatus === 'accepted' || receivedStatus === 'accepted' ? 'accepted' : 'connected';
    }
    return sentStatus || receivedStatus || null;
};

/**
 * Returns true if sender has Privacy Shield enabled and viewer is not yet connected.
 */
export const isNotificationPhotoBlurred = (meta: any, isConnected: boolean): boolean => {
    return isPhotoPrivacyShieldEnabled(meta) && !isConnected;
};

/**
 * Redacts raw media URLs from story/highlight items when a profile is behind the Privacy Shield.
 */
export const redactStoriesIfBlurred = (stories: any[], isBlurred: boolean): any[] => {
    if (!Array.isArray(stories)) return [];
    if (!isBlurred) return stories;
    return stories.map((s: any) => ({
        id: s.id,
        type: s.type,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isHighlight: Boolean(s.isHighlight || s.is_highlight),
        isLocked: true,
        url: ''
    }));
};

/**
 * Fetches the set of user IDs blocked by or blocking `userId`.
 */
export const getBlockedUserIdSet = async (prismaClient: any, userId: string): Promise<Set<string>> => {
    const blockedIds = new Set<string>();
    if (!userId) return blockedIds;
    const rows = await prismaClient.blocks.findMany({
        where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
        select: { blocker_id: true, blocked_id: true }
    });
    for (const row of rows || []) {
        if (row.blocker_id !== userId) blockedIds.add(row.blocker_id);
        if (row.blocked_id !== userId) blockedIds.add(row.blocked_id);
    }
    return blockedIds;
};

/**
 * Fetches the set of user IDs currently connected ('accepted' or 'connected') with `userId`.
 */
export const getConnectedUserIdSet = async (prismaClient: any, userId: string): Promise<Set<string>> => {
    const connectedIds = new Set<string>();
    if (!userId) return connectedIds;
    const rows = await prismaClient.interactions.findMany({
        where: {
            OR: [
                { from_user_id: userId, status: { in: ['accepted', 'connected'] } },
                { to_user_id: userId, status: { in: ['accepted', 'connected'] } }
            ]
        },
        select: { from_user_id: true, to_user_id: true }
    });
    for (const row of rows || []) {
        if (row.from_user_id !== userId) connectedIds.add(row.from_user_id);
        if (row.to_user_id !== userId) connectedIds.add(row.to_user_id);
    }
    return connectedIds;
};

/**
 * Checks whether two users have an established ('accepted' or 'connected') interaction.
 */
export const areUsersConnected = async (prismaClient: any, userA: string, userB: string): Promise<boolean> => {
    if (!userA || !userB || userA === userB) return userA === userB;
    const match = await prismaClient.interactions.findFirst({
        where: {
            OR: [
                { from_user_id: userA, to_user_id: userB, status: { in: ['accepted', 'connected'] } },
                { from_user_id: userB, to_user_id: userA, status: { in: ['accepted', 'connected'] } }
            ]
        },
        select: { id: true }
    });
    return Boolean(match);
};


