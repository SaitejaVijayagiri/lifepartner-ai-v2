'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isNativePlatform, getNativeBridge } from '@/lib/notifications';

export default function AppModeHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clean up stale localStorage flag if present from previous sessions
    localStorage.removeItem('isAppMode');

    // Installed native Android / Standalone PWA container check
    const isPwaStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isInstalledApp = isNativePlatform() || isPwaStandalone;

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

    // Dynamic Mobile Fullscreen & Landscape Orientation Handler
    // Automatically flips mobile screens to landscape on full screen videos
    const onFullscreenChange = async () => {
      const doc = document as any;
      const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      const bridge = (window as any).AndroidBridge || (window as any).androidBridge;

      if (isFullscreen) {
        if (bridge?.setLandscapeMode) {
          try {
            bridge.setLandscapeMode(true);
          } catch (_) {}
        }
        if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (_) {}
        }
      } else {
        if (bridge?.setLandscapeMode) {
          try {
            bridge.setLandscapeMode(false);
          } catch (_) {}
        }
        if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.unlock) {
          try {
            screen.orientation.unlock();
          } catch (_) {}
        }
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, [pathname, router]);

  return null;
}
