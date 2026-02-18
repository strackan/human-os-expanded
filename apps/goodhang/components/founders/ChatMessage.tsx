'use client';

import ReactMarkdown from 'react-markdown';
import type { Message } from '@/lib/founders/types';

interface ChatMessageProps {
  message: Message;
  useMarkdown?: boolean;
  userClassName?: string;
  assistantClassName?: string;
}

export function ChatMessage({
  message,
  useMarkdown = true,
  userClassName,
  assistantClassName,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  const defaultUserClass = 'bg-gray-100 text-gray-900';
  const defaultAssistantClass = 'bg-[var(--gh-dark-700)] text-white';

  const bubbleClass = isUser
    ? userClassName || defaultUserClass
    : assistantClassName || defaultAssistantClass;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} chat-message-enter`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${bubbleClass}`}>
        <div className={`whitespace-pre-wrap ${isUser ? 'text-gray-900' : 'text-white'}`}>
          {useMarkdown && !isUser ? (
            <div className="prose prose-invert prose-sm max-w-none break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
}
