// Hook: useGlitchLifecycle
// Extracted from components/GlitchIntroV2.tsx (lines 114-189)

import { useState, useEffect, useRef } from 'react';
import { visitTracking } from '@/utils/glitchSequence';

interface UseGlitchLifecycleParams {
  onComplete: () => void;
}

export function useGlitchLifecycle({ onComplete }: UseGlitchLifecycleParams) {
  const [shouldSkip, setShouldSkip] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const isAliveRef = useRef(true);

  // Check if we should skip or compress
  useEffect(() => {
    console.log('[GlitchIntroV2] Component mounted');

    if (visitTracking.shouldSkipGlitch()) {
      console.log('[GlitchIntroV2] Skipping glitch intro');
      // Clear emergency skip flag if it was set
      visitTracking.clearEmergencySkip();
      setShouldSkip(true);
      onComplete();
      return;
    }

    if (visitTracking.shouldUseCompressed()) {
      console.log('[GlitchIntroV2] Using compressed animation');
      setIsCompressed(true);
    } else {
      console.log('[GlitchIntroV2] Using full animation');
    }

    visitTracking.markCurrentSession();

    // Mark content as loaded after a brief delay
    const loadTimer = setTimeout(() => {
      console.log('[GlitchIntroV2] Content loaded');
      setContentLoaded(true);
      // Clear emergency skip flag since we loaded successfully
      visitTracking.clearEmergencySkip();
    }, 100);

    return () => clearTimeout(loadTimer);
  }, [onComplete]);

  // Emergency refresh if page gets stuck (check if glitch intro hangs)
  useEffect(() => {
    if (visitTracking.shouldSkipGlitch()) return;

    console.log('[GlitchIntroV2] Starting emergency timeout monitor (3s)');

    // Check after 3 seconds if content has rendered
    const emergencyTimeout = setTimeout(() => {
      if (!isAliveRef.current) {
        console.log('[GlitchIntroV2] Emergency timeout passed - component already completed');
        return;
      }

      // Check if the main content (quote) has actually rendered to the DOM
      const mainContent = document.querySelector('.glitch-content .glitch-quote');

      if (!mainContent) {
        // No content rendered = we're hanging
        console.error('[GlitchIntroV2] Emergency timeout triggered - no content rendered after 3s, forcing refresh');
        localStorage.setItem('goodhang_glitch_emergency_skip', 'true');
        window.location.reload();
      } else {
        // Content is showing, glitch is playing normally - let it continue for full 15s
        console.log('[GlitchIntroV2] Content rendered successfully, glitch playing normally');
      }
    }, 3000); // 3 second threshold

    return () => {
      clearTimeout(emergencyTimeout);
      console.log('[GlitchIntroV2] Emergency timeout monitor cleaned up');
    };
  }, []);

  // Prevent body scroll during intro
  useEffect(() => {
    if (visitTracking.shouldSkipGlitch()) return;

    // Disable scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Re-enable scroll when component unmounts
      document.body.style.overflow = '';
    };
  }, []);

  return { shouldSkip, isCompressed, contentLoaded, isAliveRef };
}
