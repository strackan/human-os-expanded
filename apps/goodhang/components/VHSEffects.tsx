'use client';

export function VHSEffects() {
  return (
    <>
      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* Optional: Add chromatic aberration on hover for interactive elements */}
      <style jsx global>{`
        .chromatic-aberration {
          position: relative;
        }

        .chromatic-aberration:hover {
          animation: chromatic 0.3s ease-in-out;
        }

        @keyframes chromatic {
          0%, 100% {
            text-shadow: 0 0 0 transparent;
          }
          25% {
            text-shadow: -2px 0 0 rgba(255, 0, 0, 0.5), 2px 0 0 rgba(0, 255, 255, 0.5);
          }
          50% {
            text-shadow: -3px 0 0 rgba(255, 0, 0, 0.7), 3px 0 0 rgba(0, 255, 255, 0.7);
          }
          75% {
            text-shadow: -2px 0 0 rgba(255, 0, 0, 0.5), 2px 0 0 rgba(0, 255, 255, 0.5);
          }
        }
      `}</style>
    </>
  );
}
