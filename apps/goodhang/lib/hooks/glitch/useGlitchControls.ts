// Hook: useGlitchControls
// Extracted from components/GlitchIntroV2.tsx (lines 316-346)
// CRITICAL: Fixed memory leak by cleaning up fade-in timer

import { useState, useEffect, useCallback } from 'react';
import { visitTracking } from '@/utils/glitchSequence';

interface UseGlitchControlsParams {
  onComplete: () => void;
  isAliveRef: React.MutableRefObject<boolean>;
}

export function useGlitchControls({ onComplete, isAliveRef }: UseGlitchControlsParams) {
  const [showWarning, setShowWarning] = useState(false);

  // Skip handler
  const handleSkip = useCallback(() => {
    console.log('[GlitchIntroV2] Skip button clicked');
    isAliveRef.current = false; // Mark as complete
    visitTracking.markGlitchSeen();
    document.body.style.overflow = ''; // Re-enable scroll
    onComplete();
  }, [onComplete, isAliveRef]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Fade in skip button after 3 seconds
  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setShowWarning(true);
    }, 3000);

    // CRITICAL FIX: Cleanup fade-in timer
    return () => {
      clearTimeout(fadeInTimer);
    };
  }, []);

  return { handleSkip, showWarning };
}
