// Hook: useGlitchAnimation
// Extracted from components/GlitchIntroV2.tsx (lines 192-314)
// CRITICAL: Fixed memory leaks at lines 292 and 298 by storing timer IDs in refs

import { useState, useEffect, useRef } from 'react';
import {
  GlitchPhase,
  getPhaseFromElapsed,
  corruptCharacter,
  visitTracking,
  getGlitchIntensity,
  GLITCH_TIMING,
  FLASH_SCHEDULE,
  BACKGROUND_SCHEDULE
} from '@/utils/glitchSequence';
import { generateSubliminalMessage } from '@/lib/utils/glitch/glitchMessages';

interface UseGlitchAnimationParams {
  quote: string;
  isCompressed: boolean;
  onComplete: () => void;
}

interface UseGlitchAnimationReturn {
  phase: GlitchPhase;
  elapsed: number;
  displayText: string;
  activeFlashes: Array<{index: number; zone: string; type: string}>;
  activeBackground: {index: number; type: string} | null;
  subliminalMessage: string;
  showSubliminal: boolean;
  flashBackground: boolean;
}

export function useGlitchAnimation({
  quote,
  isCompressed,
  onComplete
}: UseGlitchAnimationParams): UseGlitchAnimationReturn {
  const [phase, setPhase] = useState<GlitchPhase>(GlitchPhase.INITIAL);
  const [elapsed, setElapsed] = useState(0);
  const [displayText, setDisplayText] = useState(quote);
  const [activeFlashes, setActiveFlashes] = useState<Array<{index: number; zone: string; type: string}>>([]);
  const [activeBackground, setActiveBackground] = useState<{index: number; type: string} | null>(null);
  const [subliminalMessage, setSubliminalMessage] = useState('');
  const [showSubliminal, setShowSubliminal] = useState(false);
  const [flashBackground, setFlashBackground] = useState(false);

  // Refs to track timer IDs for proper cleanup (MEMORY LEAK FIX)
  const subliminalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAliveRef = useRef(true);

  // Main animation loop
  useEffect(() => {
    if (visitTracking.shouldSkipGlitch()) return;

    const maxTime = isCompressed ? GLITCH_TIMING.COMPRESSED : GLITCH_TIMING.TOTAL;
    let animationFrame: number;
    const startTime = Date.now();
    let lastUpdateTime = Date.now();

    // Failsafe timeout - force complete after max time + buffer
    const failsafeTimeout = setTimeout(() => {
      console.warn('Glitch animation failsafe triggered');
      isAliveRef.current = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      visitTracking.markGlitchSeen();
      document.body.style.overflow = '';
      onComplete();
    }, maxTime + 1000); // 1 second buffer

    // Watchdog timer - detect if animation loop stops running
    const watchdogInterval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateTime;
      if (timeSinceLastUpdate > 2000) {
        console.error('Animation loop appears stuck - forcing completion');
        isAliveRef.current = false;
        clearInterval(watchdogInterval);
        clearTimeout(failsafeTimeout);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        visitTracking.markGlitchSeen();
        document.body.style.overflow = '';
        onComplete();
      }
    }, 1000);

    const animate = () => {
      const now = Date.now();
      const newElapsed = now - startTime;
      lastUpdateTime = now; // Update watchdog

      if (newElapsed >= maxTime) {
        console.log('[GlitchIntroV2] Animation complete naturally');
        isAliveRef.current = false; // Mark as complete
        clearTimeout(failsafeTimeout);
        clearInterval(watchdogInterval);
        visitTracking.markGlitchSeen();
        document.body.style.overflow = ''; // Re-enable scroll
        onComplete();
        return;
      }

      setElapsed(newElapsed);

      // Update phase
      const newPhase = getPhaseFromElapsed(newElapsed);
      setPhase(newPhase);

      // Check for active background image
      if (!isCompressed) {
        const activeBg = BACKGROUND_SCHEDULE.find((bg, _index) => {
          return newElapsed >= bg.time && newElapsed < bg.time + bg.duration;
        });

        if (activeBg) {
          setActiveBackground({
            index: BACKGROUND_SCHEDULE.indexOf(activeBg),
            type: activeBg.type
          });
        } else {
          setActiveBackground(null);
        }

        // Check for active overlay flashes
        const active = FLASH_SCHEDULE.filter((flash, _index) => {
          return newElapsed >= flash.time && newElapsed < flash.time + flash.duration;
        }).map((flash, _index) => ({
          index: FLASH_SCHEDULE.indexOf(flash),
          zone: flash.zone || 'top-left',
          type: flash.type
        }));

        setActiveFlashes(active);
      }

      // Corrupt text occasionally (not constantly)
      const intensity = getGlitchIntensity(newPhase);
      if (intensity > 0 && Math.random() < 0.15) {  // Reduced frequency
        setDisplayText(corruptCharacter(quote, intensity));
      } else if (Math.random() < 0.05) {
        setDisplayText(quote);  // Restore text occasionally
      }

      // Subliminal messages during CHAOS phase
      if (newPhase === GlitchPhase.CHAOS) {
        if (Math.random() > 0.92) {  // 8% chance per frame
          const randomMsg = generateSubliminalMessage();
          setSubliminalMessage(randomMsg);
          setShowSubliminal(true);

          // CRITICAL FIX: Store timer ID in ref for cleanup
          if (subliminalTimerRef.current) {
            clearTimeout(subliminalTimerRef.current);
          }
          subliminalTimerRef.current = setTimeout(() => {
            setShowSubliminal(false);
            subliminalTimerRef.current = null;
          }, 100);  // 100ms flash
        }

        // Random background flashes
        if (Math.random() > 0.95) {  // 5% chance per frame
          setFlashBackground(true);

          // CRITICAL FIX: Store timer ID in ref for cleanup
          if (flashTimerRef.current) {
            clearTimeout(flashTimerRef.current);
          }
          flashTimerRef.current = setTimeout(() => {
            setFlashBackground(false);
            flashTimerRef.current = null;
          }, 80);
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      clearTimeout(failsafeTimeout);
      clearInterval(watchdogInterval);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      // CRITICAL FIX: Clear subliminal and flash timers
      if (subliminalTimerRef.current) {
        clearTimeout(subliminalTimerRef.current);
      }
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [onComplete, quote, isCompressed]);

  return {
    phase,
    elapsed,
    displayText,
    activeFlashes,
    activeBackground,
    subliminalMessage,
    showSubliminal,
    flashBackground
  };
}
