'use client';

/**
 * StepMessages - Displays chat messages within a step container
 *
 * Renders messages with:
 * - User/AI message bubbles
 * - Action buttons (when active)
 * - Loading indicators
 */

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Loader2 } from 'lucide-react';
import type { StepMessagesProps } from '../../types/step-chat';
import type { ChatMessage } from '@/components/workflows/sections/ChatRenderer';

/**
 * Single message bubble
 */
function MessageBubble({
  message,
  onButtonClick,
  isActive,
}: {
  message: ChatMessage;
  onButtonClick: (value: string) => void;
  isActive: boolean;
}) {
  const isUser = message.sender === 'user';
  const isLoading = message.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">Thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-100' : 'bg-purple-100'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-blue-600" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-purple-600" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div
          className={`px-3 py-2 rounded-lg text-sm ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap break-words">{message.text}</span>
          ) : (
            <div className="step-message-markdown break-words prose prose-sm max-w-none
              prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
              prose-headings:my-1 prose-strong:text-gray-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Buttons (only for AI messages, only when active) */}
        {!isUser && message.buttons && message.buttons.length > 0 && isActive && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.buttons.map((button, idx) => (
              <button
                key={idx}
                onClick={() => onButtonClick(button.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-full
                           bg-white border border-gray-200 text-gray-700
                           hover:bg-gray-50 hover:border-gray-300
                           transition-colors"
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StepMessages({
  messages,
  onButtonClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onComponentValueChange: _onComponentValueChange,
  isActive,
}: StepMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-400">
        No messages yet
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="px-4 py-3 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-300"
    >
      {messages.map((message, idx) => (
        <MessageBubble
          key={message.id || idx}
          message={message}
          onButtonClick={onButtonClick}
          isActive={isActive}
        />
      ))}
    </div>
  );
}

export default StepMessages;
