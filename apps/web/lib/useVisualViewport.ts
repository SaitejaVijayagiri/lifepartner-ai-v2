'use client';

import { useState, useEffect } from 'react';

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
 * Accurately detects virtual keyboard open/close transitions, iOS Safari viewport shifts,
 * and Android virtual keyboard resizes, ensuring mobile chat inputs and typed text
 * are NEVER hidden under the virtual keyboard.
 */
export function useVisualViewport(): VisualViewportState {
    const [state, setState] = useState<VisualViewportState>({
        isMobile: false,
        isKeyboardOpen: false,
        viewportHeight: 0,
        viewportTop: 0,
        keyboardHeight: 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateViewport = () => {
            const isMobileScreen = window.innerWidth < 768;
            const vv = window.visualViewport;

            if (vv && isMobileScreen) {
                const currentHeight = Math.round(vv.height);
                const currentTop = Math.round(vv.offsetTop || 0);
                const windowHeight = window.innerHeight;
                const heightDiff = windowHeight - currentHeight;
                // Virtual keyboard is considered open when height shrinks by > 120px
                const keyboardVisible = heightDiff > 120;

                setState({
                    isMobile: true,
                    isKeyboardOpen: keyboardVisible,
                    viewportHeight: currentHeight,
                    viewportTop: currentTop,
                    keyboardHeight: keyboardVisible ? Math.max(0, heightDiff) : 0,
                });
            } else if (isMobileScreen) {
                setState({
                    isMobile: true,
                    isKeyboardOpen: false,
                    viewportHeight: window.innerHeight,
                    viewportTop: 0,
                    keyboardHeight: 0,
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
        window.addEventListener('orientationchange', updateViewport);

        return () => {
            if (vv) {
                vv.removeEventListener('resize', updateViewport);
                vv.removeEventListener('scroll', updateViewport);
            }
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', updateViewport);
        };
    }, []);

    return state;
}
