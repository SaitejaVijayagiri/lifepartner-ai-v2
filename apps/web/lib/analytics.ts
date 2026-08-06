const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://lifepartner-ai.onrender.com';

// Helper to get or generate persistent anonymous session ID
function getSessionId(): string {
    if (typeof window === 'undefined') return 'server_side';
    let sid = sessionStorage.getItem('lp_session_id');
    if (!sid) {
        sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        sessionStorage.setItem('lp_session_id', sid);
    }
    return sid;
}

/**
 * Sends telemetry event to backend analytics service silently
 */
export async function trackEvent(
    eventType: string,
    page?: string,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        if (typeof window === 'undefined') return;
        const sessionId = getSessionId();
        const currentPage = page || window.location.pathname;

        const payload = {
            event_type: eventType,
            page: currentPage,
            session_id: sessionId,
            metadata: metadata || {}
        };

        // Use sendBeacon if available for non-blocking unload safety
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(`${API_BASE}/analytics/event`, blob);
        } else {
            fetch(`${API_BASE}/analytics/event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        }
    } catch {
        // Silently swallow analytics errors
    }
}

/**
 * Tracks when a match/user photo fails to load in browser
 */
export function trackImageFailure(url: string, component: string, matchId?: string): void {
    trackEvent('image_load_failure', undefined, {
        url,
        component,
        matchId: matchId || 'unknown'
    });
}

/**
 * Tracks user drop-off signals (e.g. leaving page, session timeout, empty matches)
 */
export function trackDropOff(stage: string, reason?: string): void {
    trackEvent('drop_off_detected', undefined, {
        stage,
        reason: reason || 'exit'
    });
}

/**
 * Submits user app experience feedback rating
 */
export async function submitAppFeedback(data: {
    rating: number;
    category?: string;
    feedback_text?: string;
    user_name?: string;
    prompt_context?: string;
}): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await fetch(`${API_BASE}/analytics/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        return { success: res.ok, message: json.message };
    } catch {
        return { success: false, message: 'Network error submitting feedback' };
    }
}
