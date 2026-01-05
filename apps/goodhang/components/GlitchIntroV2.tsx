'use client';

import '../app/glitch-v2.css';
import { GlitchPhase, visitTracking } from '@/utils/glitchSequence';
import { DEFAULT_QUOTE, TRIANGLE_POSITIONS } from '@/lib/constants/glitchIntroConfig';
import { getPhaseClass as getPhaseClassName, getTextClasses as getTextClassNames } from '@/lib/utils/glitch/glitchClassNames';
import { useGlitchImages } from '@/lib/hooks/glitch/useGlitchImages';
import { useGlitchLifecycle } from '@/lib/hooks/glitch/useGlitchLifecycle';
import { useGlitchAnimation } from '@/lib/hooks/glitch/useGlitchAnimation';
import { useGlitchControls } from '@/lib/hooks/glitch/useGlitchControls';
import {
  GlitchBackgroundImage,
  GlitchBackgroundEffects,
  GlitchTriangles,
  GlitchSkipButton,
  GlitchSubliminalFlash,
  GlitchMainContent,
  GlitchImageFlashes,
} from './glitch-intro';

interface GlitchIntroProps {
  onComplete: () => void;
  quote?: string;
}

export function GlitchIntroV2({ onComplete, quote = DEFAULT_QUOTE }: GlitchIntroProps) {
  // Hook 1: Lifecycle management
  const { shouldSkip, isCompressed, contentLoaded: _contentLoaded, isAliveRef } = useGlitchLifecycle({ onComplete });

  // Hook 2: Image preloading
  const { flashImages, backgroundImages } = useGlitchImages();

  // Hook 3: Animation loop (with memory leak fixes)
  const {
    phase,
    elapsed: _elapsed,
    displayText,
    activeFlashes,
    activeBackground,
    subliminalMessage,
    showSubliminal,
    flashBackground
  } = useGlitchAnimation({
    quote: quote || DEFAULT_QUOTE,
    isCompressed,
    onComplete
  });

  // Hook 4: Skip controls
  const { handleSkip, showWarning } = useGlitchControls({ onComplete, isAliveRef });

  // Early return if we should skip
  if (shouldSkip || visitTracking.shouldSkipGlitch()) {
    return null;
  }

  // Compute derived values
  const showEdgeCorruption = phase !== GlitchPhase.INITIAL && phase !== GlitchPhase.RESOLUTION;
  const showTriangles = phase === GlitchPhase.CORRUPTION || phase === GlitchPhase.CHAOS;
  const showBackgroundEffects = phase !== GlitchPhase.INITIAL;
  const showColorShift = phase === GlitchPhase.CORRUPTION;
  const textClasses = getTextClassNames(phase);

  const containerStyle = flashBackground ? { background: Math.random() > 0.5 ? '#ffffff' : '#000000' } : {};

  return (
    <div className={`glitch-intro-container ${getPhaseClassName(phase)}`} style={containerStyle}>
      {/* Component 1: Full-screen background image oscillation */}
      <GlitchBackgroundImage
        activeBackground={activeBackground}
        backgroundImages={backgroundImages}
      />

      {/* Component 2: Background effects (film grain, CRT, VHS, heat distortion, edge corruption) */}
      <GlitchBackgroundEffects
        showBackgroundEffects={showBackgroundEffects}
        showEdgeCorruption={showEdgeCorruption}
      />

      {/* Component 3: Triangle Chaos - Background geometric patterns */}
      <GlitchTriangles
        show={showTriangles}
        positions={TRIANGLE_POSITIONS}
      />

      {/* Component 4: Skip button - fades in after 3 seconds in upper right */}
      <GlitchSkipButton
        show={showWarning}
        onClick={handleSkip}
      />

      {/* Component 5: Subliminal Message Flash */}
      <GlitchSubliminalFlash
        show={showSubliminal}
        message={subliminalMessage}
        flashBackground={flashBackground}
      />

      {/* Component 6: Main content */}
      <GlitchMainContent
        displayText={displayText}
        textClasses={textClasses}
        phase={phase}
        showColorShift={showColorShift}
      />

      {/* Component 7: Macabre Image Flashes - Positioned at edges with EXTREME distortion */}
      <GlitchImageFlashes
        activeFlashes={activeFlashes}
        flashImages={flashImages}
      />

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
          overflow: hidden;
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
