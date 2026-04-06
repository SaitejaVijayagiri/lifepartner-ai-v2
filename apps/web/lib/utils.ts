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
        parts = [
            location.city,
            location.district,
            location.state,
            location.country
        ].filter(Boolean).flatMap(p => String(p).split(',').map(s => s.trim()));
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
