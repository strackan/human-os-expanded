'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GlitchPhase,
  getPhaseFromElapsed,
  shouldShowFlash,
  corruptCharacter,
  visitTracking,
  getGlitchIntensity,
  GLITCH_TIMING
} from '@/utils/glitchSequence';

interface GlitchIntroProps {
  onComplete: () => void;
  quote?: string;
}

const DEFAULT_QUOTE = "Fully alive, well connected, and supported human beings are unstoppable.";

export function GlitchIntro({ onComplete, quote = DEFAULT_QUOTE }: GlitchIntroProps) {
  const [phase, setPhase] = useState<GlitchPhase>(GlitchPhase.INITIAL);
  const [_elapsed, setElapsed] = useState(0);
  const [displayText, setDisplayText] = useState(quote);
  const [showFlash, setShowFlash] = useState(false);
  const [flashType, setFlashType] = useState<'tech' | 'social'>('tech');
  const [_flashIndex, setFlashIndex] = useState(0);
  const [showWarning, setShowWarning] = useState(true);
  const [isCompressed, setIsCompressed] = useState(false);

  // Check if we should skip or compress
  useEffect(() => {
    if (visitTracking.shouldSkipGlitch()) {
      onComplete();
      return;
    }

    if (visitTracking.shouldUseCompressed()) {
      setIsCompressed(true);
    }

    // Mark session
    visitTracking.markCurrentSession();
  }, [onComplete]);

  // Main animation loop
  useEffect(() => {
    if (visitTracking.shouldSkipGlitch()) return;

    const maxTime = isCompressed ? GLITCH_TIMING.COMPRESSED : GLITCH_TIMING.TOTAL;
    let animationFrame: number;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const newElapsed = now - startTime;

      if (newElapsed >= maxTime) {
        visitTracking.markGlitchSeen();
        onComplete();
        return;
      }

      setElapsed(newElapsed);

      // Update phase
      const newPhase = getPhaseFromElapsed(newElapsed);
      setPhase(newPhase);

      // Check for flashes
      if (!isCompressed) {
        const flashInfo = shouldShowFlash(newElapsed);
        if (flashInfo.show) {
          setShowFlash(true);
          setFlashType(flashInfo.type as 'tech' | 'social');
          setFlashIndex(flashInfo.index);
        } else {
          setShowFlash(false);
        }
      }

      // Corrupt text based on phase
      const intensity = getGlitchIntensity(newPhase);
      if (intensity > 0 && Math.random() < 0.3) {
        setDisplayText(corruptCharacter(quote, intensity));
      } else if (intensity === 0) {
        setDisplayText(quote);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [onComplete, quote, isCompressed]);

  // Skip handler
  const handleSkip = useCallback(() => {
    visitTracking.markGlitchSeen();
    onComplete();
  }, [onComplete]);

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

  // Hide warning after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarning(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Get container classes based on phase
  const getContainerClasses = () => {
    const classes = ['glitch-intro-container'];

    if (phase === GlitchPhase.SOMETHING_WRONG && Math.random() > 0.7) {
      classes.push('glitch-flicker');
    }

    if (phase === GlitchPhase.CORRUPTION) {
      classes.push('glitch-text-corrupt');
    }

    if (phase === GlitchPhase.CHAOS) {
      classes.push('glitch-signal-loss');
    }

    if (phase === GlitchPhase.RESOLUTION) {
      classes.push('glitch-crt-on');
    }

    return classes.join(' ');
  };

  // Get text classes based on phase
  const getTextClasses = () => {
    const classes = ['glitch-quote'];

    if (phase === GlitchPhase.CORRUPTION || phase === GlitchPhase.CHAOS) {
      classes.push('glitch-rgb-split');
    }

    return classes.join(' ');
  };

  if (visitTracking.shouldSkipGlitch()) {
    return null;
  }

  return (
    <div className={getContainerClasses()}>
      {/* Accessibility warning */}
      {showWarning && (
        <div className="glitch-warning">
          <p>⚠️ Warning: Flashing imagery ahead</p>
          <button onClick={handleSkip} className="glitch-skip-btn">
            Skip Animation
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="glitch-content">
        <blockquote className={getTextClasses()}>
          {displayText}
        </blockquote>
        {phase === GlitchPhase.INITIAL && (
          <p className="glitch-attribution">— Brené Brown</p>
        )}
      </div>

      {/* VHS tracking line */}
      {(phase === GlitchPhase.CORRUPTION || phase === GlitchPhase.CHAOS) && (
        <div className="vhs-tracking-line" />
      )}

      {/* Static overlay */}
      {phase === GlitchPhase.CHAOS && <div className="static-overlay" />}

      {/* Flash images */}
      {showFlash && !isCompressed && (
        <div className="glitch-flash active">
          <div className={`flash-content flash-${flashType}`}>
            {/* Placeholder for flash images - will be replaced with actual images */}
            <div className="flash-placeholder" />
          </div>
        </div>
      )}

      {/* Color washes */}
      {phase === GlitchPhase.CORRUPTION && Math.random() > 0.8 && (
        <div className={`glitch-flash active color-wash-${Math.random() > 0.5 ? 'cyan' : 'magenta'}`} />
      )}

      {/* Screen tear effect */}
      {phase === GlitchPhase.CHAOS && (
        <div className="glitch-screen-tear" />
      )}

      <style jsx>{`
        .glitch-intro-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          color: #f5f5f5;
        }

        .glitch-warning {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid #f5f5f5;
          padding: 20px 30px;
          text-align: center;
          font-family: var(--font-geist-sans), sans-serif;
          z-index: 10001;
        }

        .glitch-warning p {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #f5f5f5;
        }

        .glitch-skip-btn {
          background: transparent;
          border: 1px solid #f5f5f5;
          color: #f5f5f5;
          padding: 8px 20px;
          cursor: pointer;
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.2s;
        }

        .glitch-skip-btn:hover {
          background: #f5f5f5;
          color: #000000;
        }

        .glitch-content {
          max-width: 800px;
          padding: 40px;
          text-align: center;
        }

        .glitch-quote {
          font-family: 'Crimson Text', 'Georgia', serif;
          font-size: 2.5rem;
          line-height: 1.5;
          font-weight: 400;
          margin: 0;
          color: #f5f5f5;
        }

        .glitch-attribution {
          font-family: var(--font-geist-sans), sans-serif;
          font-size: 1.2rem;
          margin-top: 20px;
          color: #cccccc;
          font-style: italic;
        }

        .flash-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #00ffff 0%, #ff00ff 100%);
          opacity: 0.3;
        }

        @media (max-width: 768px) {
          .glitch-quote {
            font-size: 1.8rem;
          }

          .glitch-content {
            padding: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glitch-intro-container * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
