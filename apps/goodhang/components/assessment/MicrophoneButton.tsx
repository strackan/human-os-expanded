/**
 * MicrophoneButton Component
 *
 * Provides voice dictation for assessment answers
 * - Uses Web Speech API (free, Chrome/Edge/Safari)
 * - Falls back to Whisper API for unsupported browsers
 * - Visual feedback for listening state
 */

'use client';

import { useState, useEffect } from 'react';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';

interface MicrophoneButtonProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MicrophoneButton({ value, onChange, disabled }: MicrophoneButtonProps) {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    language: 'en-US',
  });

  const [showUnsupportedMessage, setShowUnsupportedMessage] = useState(false);

  // Update textarea value when transcript changes
  useEffect(() => {
    if (transcript) {
      // Append to existing value with a space
      const newValue = value ? `${value} ${transcript}` : transcript;
      onChange(newValue);
      resetTranscript();
    }
  }, [transcript]);

  const handleClick = () => {
    if (!isSupported) {
      setShowUnsupportedMessage(true);
      setTimeout(() => setShowUnsupportedMessage(false), 3000);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${
            isListening
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
              : isSupported
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
              : 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'
          }
          border disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isListening ? 'Stop recording' : 'Start dictation'}
      >
        {isListening ? (
          // Recording icon (animated)
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Microphone icon
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {/* Interim transcript preview */}
      {interimTranscript && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-purple-900/90 border border-purple-500/30 rounded-lg text-sm text-purple-200 max-w-xs">
          <div className="text-xs text-purple-400 mb-1">Listening...</div>
          {interimTranscript}
        </div>
      )}

      {/* Unsupported browser message */}
      {showUnsupportedMessage && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-yellow-900/90 border border-yellow-500/30 rounded-lg text-sm text-yellow-200 max-w-xs whitespace-nowrap">
          Voice dictation not supported in this browser
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-red-900/90 border border-red-500/30 rounded-lg text-sm text-red-200 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
