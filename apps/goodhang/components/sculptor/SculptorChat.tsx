'use client';

/**
 * SculptorChat Component
 *
 * Main chat interface for Sculptor interview sessions.
 * Handles conversation state, LLM communication, and voice input.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import VoiceInputToggle from './VoiceInputToggle';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SculptorChatProps {
  sessionId: string;
  entityName?: string | undefined;
  templateName?: string | undefined;
  initialMessages?: StoredMessage[];
  onSessionComplete?: () => void;
}

export default function SculptorChat({
  sessionId,
  entityName = 'the subject',
  templateName = 'The Sculptor',
  initialMessages = [],
  onSessionComplete,
}: SculptorChatProps) {
  // Convert stored messages to full Message objects
  const convertedInitialMessages: Message[] = initialMessages.map((m, i) => ({
    id: `restored-${i}`,
    role: m.role,
    content: m.content,
    timestamp: new Date(), // We don't store timestamps, use current
  }));

  const [messages, setMessages] = useState<Message[]>(convertedInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Skip initialization if we already have messages from history
  const [initialized, setInitialized] = useState(initialMessages.length > 0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Generate initial AI message on mount
  useEffect(() => {
    if (!initialized) {
      generateInitialMessage();
    }
  }, [initialized]);

  const generateInitialMessage = async () => {
    setIsLoading(true);
    setInitialized(true);

    try {
      // Send empty message to trigger initial AI greeting
      const response = await fetch(`/api/sculptor/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '[Session started]',
          conversation_history: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();

      // Add AI's opening message
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError('Failed to start the interview. Please refresh and try again.');
      console.error('Error starting session:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`/api/sculptor/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        },
      ]);

      // Check if session is completed
      if (data.session_status === 'completed') {
        onSessionComplete?.();
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, messages, isLoading, onSessionComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript);
    // Optionally auto-send after voice input
    // sendMessage(transcript);
  };

  const handleReset = async () => {
    if (!confirm('Reset this session? All conversation history will be cleared.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sculptor/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (response.ok) {
        // Reload the page to start fresh
        window.location.reload();
      } else {
        setError('Failed to reset session. Please try again.');
      }
    } catch (err) {
      console.error('Error resetting session:', err);
      setError('Failed to reset session. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div>
              <h2 className="font-semibold text-amber-100/90 tracking-wide">{templateName}</h2>
              <p className="text-xs text-amber-200/40">Session with {entityName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-amber-200/30 hover:text-amber-200/60 hover:bg-gradient-to-br from-stone-800/80 to-stone-800/40 border border-amber-800/20 rounded-lg transition-colors"
            title="Reset session"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 min-h-0">
        {messages.map((message, index) => {
          // Check if this is the latest assistant message awaiting response
          const isLatestAssistant =
            message.role === 'assistant' &&
            index === messages.length - 1 &&
            !isLoading;

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start mb-8'
              )}
            >
              {message.role === 'assistant' && (
                <div
                  className={cn(
                    'w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0',
                    isLatestAssistant && 'ring-2 ring-amber-600/30 ring-offset-2'
                  )}
                >
                  S
                </div>
              )}

              <div
                className={cn(
                  'max-w-5xl rounded-2xl px-6 py-4',
                  message.role === 'user'
                    ? 'bg-amber-600/20 border border-amber-600/30 text-white'
                    : 'bg-gradient-to-br from-stone-800/80 to-stone-800/40 border border-amber-800/20',
                  // Highlight the active question
                  isLatestAssistant && 'ring-2 ring-amber-600/30 shadow-lg shadow-amber-900/20'
                )}
              >
                <div className="space-y-3">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => {
                        const text = String(children);
                        const isDialogue = text.startsWith('"') || text.startsWith('"');

                        if (message.role === 'user') {
                          return <p style={{ color: 'white' }} className="text-base leading-relaxed">{children}</p>;
                        }
                        
                        return isDialogue ? (
                          <p className="text-amber-50 text-base font-normal leading-relaxed pl-3 border-l-2 border-amber-500/60 bg-transparent py-2 pr-3 rounded-r">
                            {children}
                          </p>
                        ) : (
                          <p className="text-stone-300 text-base leading-relaxed">{children}</p>
                        );
                      },
                      em: ({ children }) => (
                        message.role === 'user'
                          ? <em className="text-white/80 not-italic font-normal">{children}</em>
                          : <span className="block text-stone-400 text-base not-italic font-normal leading-relaxed">{children}</span>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 mt-2',
                    message.role === 'user' ? 'justify-end' : 'justify-between'
                  )}
                >
                  <p
                    className="text-xs"
                    style={{ color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : undefined }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {/* "Your turn to respond" indicator for active question */}
                  {isLatestAssistant && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400/80 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                      Your turn to respond
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
              S
            </div>
            <div className="bg-gradient-to-br from-stone-800/80 to-stone-800/40 border border-amber-800/20 rounded-2xl px-6 py-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - with ~4rem gap from last message */}
      <div className="relative pt-8 pb-[18vh] px-4">
        {/* Gradient fade overlay */}
        <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-stone-900 to-transparent pointer-events-none" />

        {/* Claude-style input container */}
        <div className="bg-stone-800/60 border border-amber-800/30 rounded-2xl shadow-sm p-4">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What would you say?"
                disabled={isLoading}
                rows={1}
                className={cn(
                  'w-full resize-none bg-transparent px-1 py-1',
                  'focus:outline-none',
                  'placeholder:text-amber-100 text-lg',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
            </div>

            <button
              type="button"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'p-2.5 rounded-lg transition-all flex-shrink-0',
                inputValue.trim() && !isLoading
                  ? 'bg-amber-600/20 border border-amber-600/30 hover:bg-amber-500 text-white'
                  : 'bg-stone-700/50 text-stone-500 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Bottom toolbar row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-700/50">
            <VoiceInputToggle
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
              className="text-stone-500 hover:text-stone-700"
            />
            <span className="text-xs text-stone-400">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
