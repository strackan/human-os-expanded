'use client';

/**
 * String-Tie Quick Capture Popover
 *
 * Global header component for quickly capturing reminders with voice or text input.
 * Appears in the header next to other global actions.
 */

import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/components/auth/AuthProvider';

// Voice recognition configuration
const SPEECH_SILENCE_TIMEOUT = 5000; // 5 seconds of silence before auto-stop

export default function QuickCapturePopover() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true; // Keep listening for continuous speech
      recognition.interimResults = true; // Get partial results while speaking
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Clear previous silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Get the latest transcript
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input with current speech
        setInput(finalTranscript || interimTranscript);

        // Set new silence timeout - auto-stop after SPEECH_SILENCE_TIMEOUT ms of silence
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('[QuickCapture] Silence timeout - stopping recognition');
          recognition.stop();
        }, SPEECH_SILENCE_TIMEOUT);
      };

      recognition.onerror = (event: any) => {
        console.error('[QuickCapture] Speech recognition error:', event.error);
        setError(`Voice error: ${event.error}`);
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      recognition.onend = () => {
        console.log('[QuickCapture] Recognition ended');
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        // Auto-submit if we have input
        if (input.trim()) {
          handleSubmit(input);
        }
      };

      recognitionRef.current = recognition;
    }

    // Cleanup on unmount
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (text?: string) => {
    const content = (text || input).trim();
    if (!content) {
      setError('Please enter a reminder');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Parse with LLM
      const parseResponse = await fetch('/api/string-ties/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          defaultOffsetMinutes: 60
        })
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse reminder');
      }

      const parseResult = await parseResponse.json();
      const { reminderText, offsetMinutes } = parseResult.preview || parseResult;

      // 2. Create reminder
      const createResponse = await fetch('/api/string-ties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          reminderText,
          offsetMinutes,
          priority: 'medium'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create reminder');
      }

      // Success!
      setSuccess(true);
      setInput('');

      // Auto-close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('[QuickCapture] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-gray-400 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1 transition-colors"
          aria-label="Quick Reminder"
          title="Create quick reminder"
        >
          {/* String-Tie Icon - Bookmark with Plus */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m6-6H6"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 z-50 bg-white" align="end">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Quick Reminder</h3>
          <p className="text-sm text-gray-600">
            Type or speak a reminder
          </p>
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="remind me to call Sarah in 2 hours..."
              className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              disabled={loading || isListening}
            />
            <button
              onClick={toggleVoiceInput}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
              disabled={loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          </div>

          {/* Status Messages */}
          {isListening && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Listening... Speak your reminder
            </p>
          )}

          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}

          {success && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Reminder created!
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim() || isListening}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Reminder'}
          </button>
        </div>

        {/* Quick Tip */}
        <div className="px-4 pb-4 text-xs text-gray-500">
          <p>💡 Try: &quot;call John tomorrow&quot; or &quot;review proposal in 2 hours&quot;</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
