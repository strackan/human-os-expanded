'use client';

/**
 * ChatPanel Component
 *
 * Main chat interface for workflow steps
 * Integrates all chat subcomponents with zen aesthetic
 * Uses useChatService hook for state management
 */

import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { useChatService } from './useChatService';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import SuggestedResponses from './SuggestedResponses';

interface ChatPanelProps {
  workflowExecutionId: string;
  stepExecutionId: string;
  workflowId: string;
  stepId: string;
  systemPrompt?: string;
  customerName?: string;
  customerData?: Record<string, any>;
  /** INTEL summary for customer context */
  intelSummary?: string;
  className?: string;
}

export default function ChatPanel({
  workflowExecutionId,
  stepExecutionId,
  workflowId,
  stepId,
  systemPrompt,
  customerName,
  customerData,
  intelSummary,
  className = ''
}: ChatPanelProps) {
  const {
    messages,
    loading,
    error,
    sendMessage,
    threadId,
    initialized
  } = useChatService({
    workflowExecutionId,
    stepExecutionId,
    workflowId,
    stepId,
    systemPrompt,
    customerName,
    customerData,
    intelSummary,
  });

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when initialized
  useEffect(() => {
    if (initialized) {
      inputRef.current?.focus();
    }
  }, [initialized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const content = inputValue.trim();
    setInputValue('');

    // Resize textarea back to single line
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSuggestedResponse = (response: string) => {
    setInputValue(response);
    inputRef.current?.focus();
  };

  // Loading state
  if (!initialized) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <MessageCircle className="w-8 h-8 text-purple-300 animate-pulse" />
          <p className="text-sm text-gray-400">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-purple-200 mb-3" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Start a conversation
            </h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Ask questions or use suggested responses below to get started
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.created_at}
          />
        ))}

        {loading && <TypingIndicator />}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Responses */}
      <SuggestedResponses
        workflowId={workflowId}
        stepId={stepId}
        onResponseClick={handleSuggestedResponse}
      />

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Shift+Enter for new line)"
              disabled={loading}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading}
            className="flex-shrink-0 w-11 h-11 bg-purple-600 text-white rounded-2xl flex items-center justify-center hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </p>
          {threadId && (
            <p className="text-xs text-gray-300 font-mono">
              Thread: {threadId.slice(0, 8)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
