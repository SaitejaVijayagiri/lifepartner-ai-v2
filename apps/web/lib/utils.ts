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
