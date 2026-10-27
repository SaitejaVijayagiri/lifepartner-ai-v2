/**
 * Ad Rewards & Monetization Manager
 * Handles value-exchange rewarded video ads for full video song playback and shared listening sessions.
 * Follows Google AdMob guidelines (non-intrusive, 100% opt-in, highest eCPM).
 */

const UNLOCK_DURATION_MS = 45 * 60 * 1000; // 45 minutes of unlimited full songs per ad
const REWARD_KEY = 'lifepartner_media_unlocked_until';

export function isMediaUnlocked(currentUser?: any): boolean {
    if (typeof window === 'undefined') return false;

    // 1. VIP / Premium users ALWAYS have unlimited ad-free access
    if (currentUser && Boolean(currentUser.is_premium || currentUser.isPremium)) {
        return true;
    }

    // 2. Check active session unlock timestamp
    try {
        const stored = localStorage.getItem(REWARD_KEY);
        if (stored) {
            const until = Number(stored);
            if (!isNaN(until) && until > Date.now()) {
                return true;
            }
        }
    } catch (_) {}

    return false;
}

export function getRemainingUnlockedMinutes(): number {
    if (typeof window === 'undefined') return 0;
    try {
        const stored = localStorage.getItem(REWARD_KEY);
        if (stored) {
            const diff = Number(stored) - Date.now();
            return diff > 0 ? Math.ceil(diff / (60 * 1000)) : 0;
        }
    } catch (_) {}
    return 0;
}

export function grantMediaUnlockReward(minutes: number = 45): void {
    if (typeof window === 'undefined') return;
    try {
        const until = Date.now() + minutes * 60 * 1000;
        localStorage.setItem(REWARD_KEY, until.toString());
    } catch (_) {}
}
