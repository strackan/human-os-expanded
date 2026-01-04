'use client';

/**
 * Phase 1.3 String-Tie Testing Page
 *
 * Standalone test environment for String-Tie LLM parsing and reminder creation.
 * Tests: Natural language parsing, reminder creation, time offset parsing, API integration
 * Features: Voice dictation with Chrome Web Speech API + OpenAI Whisper fallback
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Button from '@/components/ui/Button';

interface ParseResult {
  reminderText: string;
  offsetMinutes: number;
}

// Voice recognition configuration
const SPEECH_SILENCE_TIMEOUT = 5000; // 5 seconds of silence before auto-stop

export default function StringTieTestPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReminder, setCreatedReminder] = useState<any | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userId = user?.id;

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
          console.log('[StringTieTest] Silence timeout - stopping recognition');
          recognition.stop();
        }, SPEECH_SILENCE_TIMEOUT);
      };

      recognition.onerror = (event: any) => {
        console.error('[StringTieTest] Speech recognition error:', event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      recognition.onend = () => {
        console.log('[StringTieTest] Recognition ended');
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
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

  const handleParse = async () => {
    if (!input.trim()) {
      setError('Please enter a reminder');
      return;
    }

    setLoading(true);
    setError(null);
    setParseResult(null);

    try {
      const response = await fetch('/api/string-ties/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input.trim(),
          defaultOffsetMinutes: 60 // 1 hour default
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Not authenticated. Please sign out and sign back in.');
        }
        throw new Error(errorData.error || 'Failed to parse reminder');
      }

      const result = await response.json();
      // API returns nested structure, extract the actual parse result
      if (result.parsedReminder) {
        setParseResult({
          reminderText: result.preview.reminderText,
          offsetMinutes: result.preview.offsetMinutes
        });
      } else {
        setParseResult(result);
      }
    } catch (err) {
      console.error('[StringTieTest] Parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!userId) {
      setError('Please sign in to create reminders');
      return;
    }

    if (!parseResult) {
      setError('Please parse a reminder first');
      return;
    }

    setLoading(true);
    setError(null);
    setCreatedReminder(null);

    try {
      const response = await fetch('/api/string-ties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reminderText: parseResult.reminderText,
          offsetMinutes: parseResult.offsetMinutes,
          priority: 'medium'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reminder');
      }

      const reminder = await response.json();
      setCreatedReminder(reminder);

      // Clear form
      setInput('');
      setParseResult(null);
    } catch (err) {
      console.error('[StringTieTest] Create error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault();
      handleParse();
    }
  };

  const testCases = [
    "remind me to call Sarah in 2 hours",
    "follow up with client tomorrow at 9am",
    "check project status in 30 minutes",
    "ping the team about the release next week",
    "review the contract on Friday",
    "send email to John in 15 minutes"
  ];

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-700 mb-6">
            Please sign in to test String-Tie functionality
          </p>
          <Button className="w-full">
            <a href="/signin" className="block w-full text-white">
              Sign In
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              String-Tie Test Page
            </h1>
            <p className="text-gray-700">
              Test natural language reminder parsing with Claude AI
            </p>
          </div>

          {/* Test Input with Voice */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Natural Language Reminder
            </label>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., remind me to call Sarah in 2 hours (press Enter to parse)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                rows={3}
              />
              <button
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            </div>
            {isListening && (
              <p className="text-sm text-red-600 mt-2">🔴 Listening... Speak your reminder</p>
            )}
          </div>

          {/* Quick Test Cases */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Quick Test Cases
            </label>
            <div className="grid grid-cols-2 gap-2">
              {testCases.map((testCase, index) => (
                <button
                  key={index}
                  onClick={() => setInput(testCase)}
                  className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md transition-colors"
                >
                  {testCase}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleParse}
              disabled={loading || !input.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
            >
              {loading ? 'Parsing...' : '1. Parse with LLM'}
            </Button>
            <Button
              onClick={handleCreateReminder}
              disabled={loading || !parseResult}
              variant="secondary"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
            >
              {loading ? 'Creating...' : '2. Create Reminder'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Parse Result */}
          {parseResult && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ Parse Result
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">Reminder Text:</span>
                  <p className="text-gray-900 font-medium">{parseResult.reminderText}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Time Offset:</span>
                  <p className="text-gray-900 font-medium">
                    {parseResult.offsetMinutes} minutes
                    {parseResult.offsetMinutes >= 60 && (
                      <span className="text-gray-700 ml-2">
                        ({Math.floor(parseResult.offsetMinutes / 60)} hours
                        {parseResult.offsetMinutes % 60 > 0 && ` ${parseResult.offsetMinutes % 60} min`})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Reminder Time:</span>
                  <p className="text-gray-900 font-medium">
                    {new Date(Date.now() + parseResult.offsetMinutes * 60000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Created Reminder */}
          {createdReminder && (
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ Reminder Created
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">ID:</span>
                  <span className="text-gray-700 ml-2">{createdReminder.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Text:</span>
                  <span className="text-gray-900 ml-2">{createdReminder.reminder_text}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Reminder At:</span>
                  <span className="text-gray-900 ml-2">
                    {new Date(createdReminder.reminder_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Status:</span>
                  <span className="text-gray-900 ml-2">{createdReminder.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">How It Works</h4>
            <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
              <li>Enter a natural language reminder or click a test case (or use voice 🎤)</li>
              <li>Click &quot;Parse with LLM&quot; to extract reminder text and time offset</li>
              <li>Review the parsed result</li>
              <li>Click &quot;Create Reminder&quot; to save it to the database</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-700">
                <strong>Voice Input:</strong> Uses Chrome Web Speech API (free). OpenAI Whisper fallback available (requires OPENAI_API_KEY).
              </p>
              <p className="text-xs text-gray-700 mt-1">
                <strong>LLM Parsing:</strong> Requires ANTHROPIC_API_KEY to be set.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
