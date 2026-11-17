'use client';

import { useState, useEffect, useRef } from 'react';

export interface VisualViewportState {
    /** True if current window width is less than 768px (standard mobile breakpoint) */
    isMobile: boolean;
    /** True if virtual keyboard is detected as active on the screen */
    isKeyboardOpen: boolean;
    /** Exact visible height in pixels from window.visualViewport, or 0 on desktop/SSR */
    viewportHeight: number;
    /** Offset from top of layout viewport to visual viewport (iOS scroll shift) */
    viewportTop: number;
    /** Approximate height occupied by the virtual keyboard in pixels */
    keyboardHeight: number;
}

/**
 * Custom hook to track window.visualViewport on mobile devices.
 * Accurately detects virtual keyboard open/close transitions across ALL mobile devices:
 * - iOS Safari (where layout viewport stays fixed but visualViewport shrinks & shifts)
 * - Android Chrome / WebView / Firefox (where window.innerHeight shrinks with the keyboard)
 * - PWA & Fullscreen WebViews
 * Ensures mobile chat inputs and typed text are NEVER hidden under the virtual keyboard.
 */
export function useVisualViewport(): VisualViewportState {
    const [state, setState] = useState<VisualViewportState>({
        isMobile: false,
        isKeyboardOpen: false,
        viewportHeight: 0,
        viewportTop: 0,
        keyboardHeight: 0,
    });

    const baseHeightRef = useRef<number>(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkInputActive = () => {
            const activeEl = document.activeElement;
            if (!activeEl) return false;
            const tag = activeEl.tagName.toUpperCase();
            return tag === 'INPUT' || tag === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable;
        };

        const updateViewport = () => {
            const isMobileScreen = window.innerWidth < 768;
            const vv = window.visualViewport;
            const isInputActive = checkInputActive();

            if (isMobileScreen) {
                const currentHeight = vv ? Math.round(vv.height) : window.innerHeight;
                const currentTop = vv ? Math.round(vv.offsetTop || 0) : 0;

                // When keyboard is closed (no input active), calibrate the unconstrained screen baseline height
                if (!isInputActive) {
                    baseHeightRef.current = Math.max(baseHeightRef.current, currentHeight, window.innerHeight);
                } else if (baseHeightRef.current === 0) {
                    baseHeightRef.current = Math.max(window.screen.height, window.innerHeight);
                }

                // 1. iOS Safari: window.innerHeight stays constant while vv.height drops
                const iosDiff = window.innerHeight - currentHeight;
                // 2. Android: window.innerHeight drops with vv.height, so we compare against calibrated baseline
                const androidDiff = baseHeightRef.current > 0 ? baseHeightRef.current - currentHeight : 0;

                const heightDiff = Math.max(iosDiff, androidDiff);
                // Virtual keyboard is considered open if viewport shrunk by > 100px or input is focused with > 50px reduction
                const keyboardVisible = heightDiff > 100 || (isInputActive && heightDiff > 50);

                setState({
                    isMobile: true,
                    isKeyboardOpen: keyboardVisible,
                    viewportHeight: currentHeight,
                    viewportTop: currentTop,
                    keyboardHeight: keyboardVisible ? Math.max(0, heightDiff) : 0,
                });
            } else {
                setState({
                    isMobile: false,
                    isKeyboardOpen: false,
                    viewportHeight: 0,
                    viewportTop: 0,
                    keyboardHeight: 0,
                });
            }
        };

        updateViewport();

        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener('resize', updateViewport);
            vv.addEventListener('scroll', updateViewport);
        }
        window.addEventListener('resize', updateViewport);

        const handleOrientationChange = () => {
            baseHeightRef.current = 0;
            setTimeout(updateViewport, 150);
        };
        window.addEventListener('orientationchange', handleOrientationChange);

        const handleFocusIn = () => {
            setTimeout(updateViewport, 60);
            setTimeout(updateViewport, 250);
        };
        const handleFocusOut = () => {
            setTimeout(updateViewport, 100);
            setTimeout(updateViewport, 300);
        };
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            if (vv) {
                vv.removeEventListener('resize', updateViewport);
                vv.removeEventListener('scroll', updateViewport);
            }
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    return state;
}
