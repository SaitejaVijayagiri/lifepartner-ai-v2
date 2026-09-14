'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
    const pathname = usePathname();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const currentPath = pathname || window.location.pathname;
        if (lastTrackedPath.current === currentPath) return;
        lastTrackedPath.current = currentPath;

        const isNewVisitor = !localStorage.getItem('lp_visited');
        if (isNewVisitor) {
            localStorage.setItem('lp_visited', 'true');
        }

        const timeZone = Intl?.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
        const browserLang = navigator.language || 'en';

        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || (isLocal ? 'http://localhost:4000' : 'https://lifepartner-ai.onrender.com');

        fetch(`${API_URL}/analytics/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: currentPath,
                is_unique: isNewVisitor,
                referrer: document.referrer || 'direct',
                timezone: timeZone,
                language: browserLang
            })
        }).catch(() => {});
    }, [pathname]);

    return null;
}
