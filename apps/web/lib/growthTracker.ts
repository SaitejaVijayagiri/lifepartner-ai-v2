'use client';

import { getApiUrl } from './api';

interface TrackEventPayload {
    event_name: string;
    user_id?: string | null;
    session_id?: string | null;
    traffic_source?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    country?: string;
    gender?: string | null;
    metadata?: Record<string, any>;
}

// Memory cache to prevent duplicate events within the same page session
const sentEventsCache = new Set<string>();

/**
 * Extracts and persists UTM parameters in sessionStorage.
 */
function getStoredUTM() {
    if (typeof window === 'undefined') return { utm_source: '', utm_medium: '' };
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');

        if (utmSource) {
            sessionStorage.setItem('lp_utm_source', utmSource);
        }
        if (utmMedium) {
            sessionStorage.setItem('lp_utm_medium', utmMedium);
        }

        return {
            utm_source: utmSource || sessionStorage.getItem('lp_utm_source') || '',
            utm_medium: utmMedium || sessionStorage.getItem('lp_utm_medium') || ''
        };
    } catch (_) {
        return { utm_source: '', utm_medium: '' };
    }
}

/**
 * Generates or retrieves a persistent anonymous session identifier.
 */
function getSessionId(): string {
    if (typeof window === 'undefined') return 'srv_session';
    try {
        let sid = sessionStorage.getItem('lp_growth_session_id');
        if (!sid) {
            sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            sessionStorage.setItem('lp_growth_session_id', sid);
        }
        return sid;
    } catch (_) {
        return 'anon_session';
    }
}

/**
 * Core event dispatcher to backend API.
 */
export async function trackEvent(
    eventName: string,
    extra: Partial<TrackEventPayload> = {},
    dedupKey?: string
): Promise<void> {
    if (typeof window === 'undefined') return;

    if (dedupKey && sentEventsCache.has(dedupKey)) {
        return; // Already sent in this browser session
    }
    if (dedupKey) {
        sentEventsCache.add(dedupKey);
    }

    try {
        const utm = getStoredUTM();
        const sessionId = getSessionId();
        const referrer = document.referrer || '';
        const userId = localStorage.getItem('userId') || null;

        const timeZone = Intl?.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

        const payload: TrackEventPayload = {
            event_name: eventName,
            user_id: extra.user_id || userId,
            session_id: sessionId,
            referrer,
            utm_source: utm.utm_source,
            utm_medium: utm.utm_medium,
            country: extra.country,
            gender: extra.gender,
            metadata: {
                path: window.location.pathname,
                timezone: timeZone,
                ...(extra.metadata || {})
            }
        };

        const apiUrl = getApiUrl();
        fetch(`${apiUrl}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {});
    } catch (_) {
        // Safe fail-silent
    }
}

export const growthTracker = {
    trackLandingVisit: (path?: string) => {
        const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
        trackEvent('landing_visit', { metadata: { path: currentPath } }, `landing_${currentPath}`);
    },

    trackRegistrationStarted: (gender?: string) => {
        trackEvent('registration_started', { gender }, 'reg_started_once');
    },

    trackProfileViewed: (profileId: string) => {
        trackEvent('profile_viewed', { metadata: { viewed_profile_id: profileId } }, `view_profile_${profileId}`);
    },

    trackMatchViewed: (matchId: string) => {
        trackEvent('match_viewed', { metadata: { match_id: matchId } }, `view_match_${matchId}`);
    }
};
