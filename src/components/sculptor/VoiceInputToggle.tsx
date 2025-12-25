'use client';

/**
 * VoiceInputToggle Component
 *
 * Toggle button for voice input using Web Speech API.
 * Shows recording state with visual feedback.
 */

import { useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useVoiceRecording } from '@/lib/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceInputToggleProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInputToggle({
  onTranscript,
  disabled = false,
  className = '',
}: VoiceInputToggleProps) {
  const {
    isRecording,
    transcript,
    isSupported,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceRecording();

  // When recording stops and we have a transcript, send it
  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
      // Transcript is updated via the hook, parent will receive it via effect
    } else {
      resetTranscript();
      startRecording();
    }
  };

  // Send transcript to parent when recording stops (must be in useEffect, not during render)
  useEffect(() => {
    if (!isRecording && transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [isRecording, transcript, onTranscript, resetTranscript]);

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'p-2 rounded-lg text-slate-400 cursor-not-allowed',
          className
        )}
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isRecording ? (
          <Mic className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-red-100 text-red-700 text-xs rounded-lg whitespace-nowrap flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}
