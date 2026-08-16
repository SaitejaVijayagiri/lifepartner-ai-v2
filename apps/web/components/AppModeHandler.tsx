'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function AppModeHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clean up stale localStorage flag if present from previous sessions
    localStorage.removeItem('isAppMode');

    // Strict detection of actual installed App container / Standalone PWA mode:
    // 1. Running inside native Android/Capacitor APK WebView
    const isCapacitor = Capacitor.isNativePlatform();

    // 2. Launched as standalone PWA app from home screen icon
    const isPwaStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // 3. Launched with explicit manifest app start URL parameter (?app=true or ?mode=standalone)
    const isAppUrlParam = window.location.search.includes('app=true') || window.location.search.includes('mode=standalone');

    // 4. Native User-Agent string check
    const isNativeUserAgent = typeof navigator !== 'undefined' && (
      navigator.userAgent.includes('CapacitorApp') || 
      navigator.userAgent.includes('LifePartnerApp')
    );

    const isInstalledApp = isCapacitor || isPwaStandalone || isAppUrlParam || isNativeUserAgent;

    // ONLY redirect if running in actual installed App container on root route
    if (isInstalledApp && (pathname === '/' || pathname === '')) {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (token && userId) {
        console.log('[AppModeHandler] Installed App launched - Redirecting logged-in user to /dashboard');
        router.replace('/dashboard');
      } else {
        console.log('[AppModeHandler] Installed App launched - Redirecting unauthenticated user to /login');
        router.replace('/login');
      }
    }
  }, [pathname, router]);

  return null;
}
