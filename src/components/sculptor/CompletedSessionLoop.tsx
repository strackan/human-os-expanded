'use client';

/**
 * CompletedSessionLoop Component
 *
 * Displays when a Sculptor session has been completed.
 * Shows the "lake water" loop message with atmospheric styling.
 */

interface CompletedSessionLoopProps {
  entityName?: string;
}

export default function CompletedSessionLoop({
  entityName = 'You',
}: CompletedSessionLoopProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Atmospheric water effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main message */}
      <div className="relative z-10 text-center max-w-lg">
        <p className="text-2xl md:text-3xl font-light leading-relaxed mb-8 text-slate-200">
          {entityName} {entityName === 'You' ? 'are' : 'is'} in{' '}
          {entityName === 'You' ? 'your' : 'their'} bed wondering how{' '}
          {entityName === 'You' ? 'you' : 'they'} ended up drenched in lake water.
        </p>

        {/* Subtle wave animation */}
        <div className="flex justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 h-4 bg-blue-400/40 rounded-full"
              style={{
                animation: `wave 1.5s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Session complete notice */}
        <p className="mt-8 text-sm text-slate-400">
          This session has ended. The Sculptor has disintegrated.
        </p>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            height: 1rem;
            opacity: 0.4;
          }
          50% {
            height: 2rem;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
