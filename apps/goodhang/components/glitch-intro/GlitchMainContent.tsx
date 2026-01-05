import React from 'react';
import { GlitchPhase } from '@/utils/glitchSequence';

interface GlitchMainContentProps {
  displayText: string;
  textClasses: string;
  phase: GlitchPhase;
  showColorShift: boolean;
}

export function GlitchMainContent({ displayText, textClasses, phase, showColorShift }: GlitchMainContentProps) {
  const shouldShowAttribution = phase === GlitchPhase.INITIAL;

  return (
    <>
      <div className={`glitch-content ${showColorShift ? 'color-channel-shift' : ''}`}>
        <blockquote className={textClasses}>
          {displayText}
        </blockquote>
        {shouldShowAttribution && (
          <p className="glitch-attribution">— Brené Brown</p>
        )}
      </div>
      <style jsx>{`
        .glitch-content {
          max-width: 800px;
          padding: 40px;
          text-align: center;
          position: relative;
          z-index: 100;
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

        @media (max-width: 768px) {
          .glitch-quote {
            font-size: 1.8rem;
          }

          .glitch-content {
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
}
