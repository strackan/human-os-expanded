'use client';

import { Loader2 } from 'lucide-react';

interface SynthesisProgressArtifactProps {
  isRunning: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function SynthesisProgressArtifact({ isRunning, error, onRetry }: SynthesisProgressArtifactProps) {
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg font-medium mb-2">Synthesis Error</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center animate-founders-fade-in">
        <Loader2 className={`w-12 h-12 text-purple-500 mx-auto mb-4 ${isRunning ? 'animate-spin' : ''}`} />
        <p className="text-gray-300 text-lg font-medium mb-2">
          {isRunning ? 'Building your Human OS profile...' : 'Synthesis complete!'}
        </p>
        <p className="text-gray-500 text-sm">
          {isRunning ? 'Synthesizing your interview, voice, and personality data' : 'Your profile is ready for review'}
        </p>
      </div>
    </div>
  );
}
