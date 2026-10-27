import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatLocationString = (location: any) => {
    if (!location) return "Unknown City";
    
    let parts: string[] = [];

    if (typeof location === 'string') {
        // If it's a string, split it by commas
        parts = location.split(',').map(s => s.trim());
    } else {
        // If it's an object, gather all relevant fields
        const c = location.city;
        const d = location.district;
        const s = location.state;
        const ctr = location.country;
        
        parts = [
            c || d, // Prefer city. If city is missing, fallback to district.
            s,
            ctr
        ].filter(Boolean).flatMap(p => String(p).split(',').map(str => str.trim()));
    }
    
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const p of parts) {
        if (!p) continue;
        const lower = p.toLowerCase();
        // Ignore "Unknown" markers
        if (lower === "unknown city" || lower === "unknown state" || lower === "unknown country") continue;
        
        if (!seen.has(lower)) {
            seen.add(lower);
            unique.push(p);
        }
    }
    
    return unique.join(', ') || "Unknown City";
};

export function getProfilePhotoUrl(userObj: any): string {
    if (!userObj) return '';

    const extractString = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string' && val.trim() && val !== '[object Object]') return val.trim();
        if (typeof val === 'object') {
            if (typeof val.url === 'string' && val.url.trim()) return val.url.trim();
            if (typeof val.photo_url === 'string' && val.photo_url.trim()) return val.photo_url.trim();
            if (typeof val.avatar_url === 'string' && val.avatar_url.trim()) return val.avatar_url.trim();
        }
        return '';
    };

    const directAvatar = extractString(userObj.avatar_url);
    if (directAvatar) return directAvatar;

    const directPhotoUrl = extractString(userObj.photoUrl);
    if (directPhotoUrl) return directPhotoUrl;

    const directPhoto_url = extractString(userObj.photo_url);
    if (directPhoto_url) return directPhoto_url;

    const photos = userObj.photos || userObj.photo_urls;
    if (Array.isArray(photos) && photos.length > 0) {
        for (const item of photos) {
            const extracted = extractString(item);
            if (extracted) return extracted;
        }
    }

    if (userObj.user) {
        return getProfilePhotoUrl(userObj.user);
    }

    return '';
}

/**
 * Strict 24-Hour Story Expiration Check (Instagram / MNC standard)
 * Stories expire strictly 24 hours after creation for the active feed/tray and avatar rings.
 * Highlighting does NOT keep a story in the 24h tray after 24 hours.
 */
export function isStory24hActive(s: any): boolean {
    if (!s) return false;
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // 1. Explicit expiresAt / expires_at timestamp
    const expStr = s.expiresAt || s.expires_at;
    if (expStr) {
        const expMs = new Date(expStr).getTime();
        if (!isNaN(expMs)) return expMs > now;
    }

    // 2. CreatedAt / created_at / timestamp check (strict 24h)
    const createdStr = s.createdAt || s.created_at || s.timestamp;
    if (createdStr) {
        const createdMs = new Date(createdStr).getTime();
        if (!isNaN(createdMs)) return (now - createdMs) < TWENTY_FOUR_HOURS_MS;
    }

    // 3. 13-digit Unix Millisecond timestamp ID (Date.now())
    if (s.id && typeof s.id === 'string' && /^\d{13}$/.test(s.id)) {
        const idMs = Number(s.id);
        if (!isNaN(idMs)) return (now - idMs) < TWENTY_FOUR_HOURS_MS;
    }

    // If no verifiable active timestamp within 24h, treat as expired
    return false;
}

/**
 * Checks if a story is saved as a permanent Profile Highlight.
 */
export function isStoryHighlight(s: any): boolean {
    if (!s) return false;
    return Boolean(s.isHighlight || s.is_highlight);
}

/**
 * Story is retained on profile if it is a permanent Highlight OR strictly within 24h active window.
 */
export function isStoryActive(s: any): boolean {
    if (!s) return false;
    if (isStoryHighlight(s)) return true;
    return isStory24hActive(s);
}

/**
 * Filters stories strictly for 24-hour feed trays, avatar rings, and real-time viewing.
 */
export function filterActive24hStories<T = any>(stories: T[]): T[] {
    if (!Array.isArray(stories)) return [];
    return stories.filter(isStory24hActive);
}

/**
 * Filters stories saved as permanent profile highlights.
 */
export function filterHighlights<T = any>(stories: T[]): T[] {
    if (!Array.isArray(stories)) return [];
    return stories.filter(isStoryHighlight);
}

/**
 * Filters stories retained for profile view (retains permanent highlights + active 24h stories).
 */
export function filterActiveStories<T = any>(stories: T[]): T[] {
    if (!Array.isArray(stories)) return [];
    return stories.filter(isStoryActive);
}
