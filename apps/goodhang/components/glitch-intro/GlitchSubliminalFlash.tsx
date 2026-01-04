import React from 'react';

interface GlitchSubliminalFlashProps {
  show: boolean;
  message: string;
  flashBackground: boolean;
}

export function GlitchSubliminalFlash({ show, message, flashBackground: _flashBackground }: GlitchSubliminalFlashProps) {
  if (!show) return null;

  return (
    <>
      <div className="subliminal-flash">
        {message}
      </div>
      <style jsx>{`
        .subliminal-flash {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 4rem;
          font-weight: bold;
          color: #f00;
          mix-blend-mode: difference;
          z-index: 10002;
          font-family: var(--font-geist-mono), monospace;
          text-transform: uppercase;
          letter-spacing: 4px;
          pointer-events: none;
          text-shadow:
            0 0 10px #f00,
            0 0 20px #f00,
            0 0 30px #f00;
        }

        @media (max-width: 768px) {
          .subliminal-flash {
            font-size: 2rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .subliminal-flash {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
