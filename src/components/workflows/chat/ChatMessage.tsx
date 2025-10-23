'use client';

/**
 * ChatMessage Component
 *
 * Individual chat message with zen aesthetic
 * Supports user and assistant messages with different styling
 */

import { Bot, User } from 'lucide-react';
import type { MessageRole } from '@/lib/workflows/chat/ChatService';

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  timestamp?: string;
  className?: string;
}

export default function ChatMessage({
  role,
  content,
  timestamp,
  className = ''
}: ChatMessageProps) {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isSystem = role === 'system';

  // Format timestamp
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (isSystem) {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="text-xs text-gray-400 px-3 py-1 bg-gray-50 rounded-full">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-purple-100'
              : 'bg-white border border-gray-200'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-purple-600" />
          ) : (
            <Bot className="w-4 h-4 text-gray-600" />
          )}
        </div>

        {/* Message bubble */}
        <div className="flex flex-col gap-1">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-purple-100 text-gray-800'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>

          {/* Timestamp */}
          {formattedTime && (
            <span className={`text-xs text-gray-400 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
              {formattedTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
