/**
 * useMobileDetection Hook
 *
 * Detects if the current viewport is mobile-sized
 *
 * Features:
 * - Configurable breakpoint (default 768px)
 * - Debounced resize listener for performance
 * - SSR-safe (returns null on server)
 * - Returns mobile, desktop, and current width
 *
 * Usage:
 * ```
 * const { isMobile, isDesktop, width } = useMobileDetection();
 * const { isMobile } = useMobileDetection(1024); // Custom breakpoint
 * ```
 */

'use client';

import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean | null;
  isDesktop: boolean | null;
  width: number | null;
}

export function useMobileDetection(breakpoint: number = 768): MobileDetectionResult {
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Set initial width
    setWindowWidth(window.innerWidth);

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Return null during SSR
  if (windowWidth === null) {
    return {
      isMobile: null,
      isDesktop: null,
      width: null,
    };
  }

  const isMobile = windowWidth < breakpoint;

  return {
    isMobile,
    isDesktop: !isMobile,
    width: windowWidth,
  };
}
