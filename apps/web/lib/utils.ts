import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatLocationString = (location: any) => {
    if (typeof location === 'string') return location;
    if (!location) return "Unknown City";
    
    // Extract pieces and split any comma separated lists
    const parts = [location.city, location.district, location.state]
        .flatMap(p => p ? String(p).split(',').map(s => s.trim()) : [])
        .filter(x => x && x !== "Unknown City" && x !== "Unknown State");
    
    const seen = new Set<string>();
    const unique = [];
    for (const p of parts) {
        const lower = p.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            // Title case the string or just use source
            unique.push(p);
        }
    }
    return unique.join(', ') || "Unknown City";
};
