'use client';

import { useEffect } from 'react';

export default function PageViewTracker() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isNewVisitor = !localStorage.getItem('lp_visited');
        if (isNewVisitor) {
            localStorage.setItem('lp_visited', 'true');
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${API_URL}/analytics/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: window.location.pathname,
                is_unique: isNewVisitor,
                referrer: document.referrer || 'direct'
            })
        }).catch(() => {});
    }, []);

    return null;
}
