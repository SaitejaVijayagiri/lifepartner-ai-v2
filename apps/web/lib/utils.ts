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
    if (typeof userObj.avatar_url === 'string' && userObj.avatar_url.trim()) return userObj.avatar_url;
    if (typeof userObj.photoUrl === 'string' && userObj.photoUrl.trim()) return userObj.photoUrl;
    if (typeof userObj.photo_url === 'string' && userObj.photo_url.trim()) return userObj.photo_url;

    const photos = userObj.photos || userObj.photo_urls;
    if (Array.isArray(photos) && photos.length > 0) {
        for (const item of photos) {
            if (typeof item === 'string' && item.trim()) return item;
            if (item && typeof item.url === 'string' && item.url.trim()) return item.url;
            if (item && typeof item.photo_url === 'string' && item.photo_url.trim()) return item.photo_url;
        }
    }

    if (userObj.user) {
        return getProfilePhotoUrl(userObj.user);
    }

    return '';
}
