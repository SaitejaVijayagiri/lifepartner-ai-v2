'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function AppModeHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if running inside installed APK / Capacitor / PWA Standalone Mode
    const isCapacitor = Capacitor.isNativePlatform();
    const isPwaStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isAppUrlParam = window.location.search.includes('app=true') || window.location.search.includes('mode=standalone');
    const isAppStorage = localStorage.getItem('isAppMode') === 'true';

    const isAppMode = isCapacitor || isPwaStandalone || isAppUrlParam || isAppStorage;

    if (isAppMode) {
      localStorage.setItem('isAppMode', 'true');

      // If user lands on root home page in app mode, bypass marketing landing page completely
      if (pathname === '/' || pathname === '') {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token && userId) {
          console.log('[AppModeHandler] Installed App mode detected - Redirecting logged-in user straight to /dashboard');
          router.replace('/dashboard');
        } else {
          console.log('[AppModeHandler] Installed App mode detected - Redirecting user to Login / Register page');
          router.replace('/login');
        }
      }
    }
  }, [pathname, router]);

  return null;
}
