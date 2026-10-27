/**
 * Story Utilities
 * Handles strict 24-hour story expiration vs permanent profile highlights (Instagram & MNC standard)
 * and merging of profile stories and metadata stories.
 */

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if a story was created strictly within the last 24 hours.
 * Highlighting a story does NOT prolong its 24-hour active feed/tray lifespan.
 */
export function isStory24hActive(s: any, now: Date = new Date()): boolean {
    if (!s) return false;
    const nowMs = now.getTime();

    // 1. Explicit expiration date
    const expStr = s.expiresAt || s.expires_at;
    if (expStr) {
        const expMs = new Date(expStr).getTime();
        if (!isNaN(expMs)) return expMs > nowMs;
    }

    // 2. Created date (strict 24h window)
    const createdStr = s.createdAt || s.created_at || s.timestamp;
    if (createdStr) {
        const createdMs = new Date(createdStr).getTime();
        if (!isNaN(createdMs)) return (nowMs - createdMs) < TWENTY_FOUR_HOURS_MS;
    }

    // 3. Fallback: Unix timestamp in ms (id)
    if (s.id && typeof s.id === 'string' && /^\d{13}$/.test(s.id)) {
        const idMs = Number(s.id);
        if (!isNaN(idMs)) return (nowMs - idMs) < TWENTY_FOUR_HOURS_MS;
    }

    return false;
}

/**
 * Checks if a story is pinned as a permanent profile highlight.
 */
export function isStoryHighlight(s: any): boolean {
    if (!s) return false;
    return Boolean(s.isHighlight || s.is_highlight);
}

/**
 * Checks if a story should be retained on a user's profile.
 * Retained if it is a permanent highlight OR currently within 24h active window.
 */
export function isStoryActive(s: any, now: Date = new Date()): boolean {
    if (!s) return false;
    if (isStoryHighlight(s)) return true;
    return isStory24hActive(s, now);
}

/**
 * Filters stories for the active 24-hour feed tray or avatar rings.
 * Highlights older than 24 hours are NOT included here.
 */
export function filterActive24hStories(stories: any[], now: Date = new Date()): any[] {
    return (stories || []).filter(s => isStory24hActive(s, now));
}

/**
 * Filters stories pinned as permanent profile highlights.
 */
export function filterHighlights(stories: any[]): any[] {
    return (stories || []).filter(isStoryHighlight);
}

/**
 * Filters stories for profile display (retains permanent highlights + active 24h stories).
 */
export function filterActiveStories(stories: any[], now: Date = new Date()): any[] {
    return (stories || []).filter(s => isStoryActive(s, now));
}

export function mergeStoriesHelper(directStories: any[] = [], metaStories: any[] = [], onlyActive: boolean = true, now: Date = new Date()): any[] {
    const storyMap = new Map<string, any>();
    
    for (const s of (metaStories || [])) {
        if (s && s.id) {
            storyMap.set(String(s.id), {
                ...s,
                isHighlight: Boolean(s.isHighlight || s.is_highlight)
            });
        }
    }
    
    for (const s of (directStories || [])) {
        if (s && s.id) {
            const sid = String(s.id);
            const existing = storyMap.get(sid);
            const isH = Boolean(s.isHighlight || s.is_highlight || existing?.isHighlight);
            if (existing) {
                storyMap.set(sid, {
                    ...existing,
                    ...s,
                    isHighlight: isH
                });
            } else {
                storyMap.set(sid, {
                    ...s,
                    isHighlight: isH
                });
            }
        }
    }
    
    const all = Array.from(storyMap.values());
    return onlyActive ? filterActiveStories(all, now) : all;
}
