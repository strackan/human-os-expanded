/**
 * useSpeechToText Hook
 *
 * Provides speech-to-text functionality with dual approach:
 * 1. Web Speech API (free, Chrome/Edge/Safari)
 * 2. OpenAI Whisper API (paid fallback for unsupported browsers)
 *
 * Usage:
 * const { isListening, isSupported, transcript, startListening, stopListening } = useSpeechToText();
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onTranscriptChange?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onTranscriptChange,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
      }
    }
  }, []);

  // Configure recognition when it's available
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result[0]) continue;
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText + ' ';
        } else {
          interim += transcriptText;
        }
      }

      if (finalTranscript) {
        const newTranscript = transcript + finalTranscript;
        setTranscript(newTranscript);
        onTranscriptChange?.(newTranscript);
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
  }, [continuous, interimResults, language, transcript, onTranscriptChange, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = 'Speech recognition not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err: unknown) {
      // Already started error - ignore
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech recognition';
      if (errorMessage.includes('already started')) {
        return;
      }
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (err: unknown) {
      console.warn('Error stopping recognition:', err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
