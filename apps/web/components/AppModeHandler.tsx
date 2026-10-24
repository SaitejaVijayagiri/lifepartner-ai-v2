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

    // 3. Launched with explicit manifest app start URL parameter (?app=native, ?app=true, or ?mode=standalone)
    const isAppUrlParam = window.location.search.includes('app=') || window.location.search.includes('mode=standalone');

    // 4. Native Bridge injection check (AndroidBridge / androidBridge)
    const isNativeBridge = typeof window !== 'undefined' && !!((window as any).AndroidBridge || (window as any).androidBridge);

    // 5. Native User-Agent string check
    const isNativeUserAgent = typeof navigator !== 'undefined' && /LifePartnerApp|Capacitor/i.test(navigator.userAgent);

    const isInstalledApp = isCapacitor || isPwaStandalone || isAppUrlParam || isNativeBridge || isNativeUserAgent;

    if (isInstalledApp) {
      document.documentElement.setAttribute('data-capacitor', 'true');
      document.documentElement.classList.add('native-app-mode');
    }

    // Direct routing for installed App container:
    if (isInstalledApp && (pathname === '/' || pathname === '' || pathname === '/register')) {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (token && userId) {
        console.log('[AppModeHandler] Installed App launched - Redirecting logged-in user to /dashboard');
        router.replace('/dashboard');
      } else if (pathname === '/' || pathname === '') {
        console.log('[AppModeHandler] Installed App launched - Redirecting unauthenticated user to /register');
        router.replace('/register');
      }
    }
  }, [pathname, router]);

  return null;
}
