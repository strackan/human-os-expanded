'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Message type definition
 */
export interface Message {
  id: number;
  role: 'ai' | 'user';
  text: string;
}

/**
 * Button type definition
 */
export interface Button {
  label: string;
  value: string;
}

/**
 * ChatPanel Props
 */
interface ChatPanelProps {
  messages: Message[];
  buttons: Button[];
  onButtonClick: (value: string) => void;
}

/**
 * ChatPanel Component
 *
 * Displays a chat interface with:
 * - Message list (AI and User messages)
 * - Action buttons at the bottom
 * - Auto-scroll to latest message
 *
 * Checkpoint 1.3: Basic chat functionality
 * - AI messages: Left-aligned, gray background
 * - User messages: Right-aligned, blue background
 * - Buttons: Fixed at bottom, trigger actions
 */
export function ChatPanel({ messages, buttons, onButtonClick }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                rounded-lg p-3 max-w-[80%]
                ${
                  message.role === 'ai'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white'
                }
              `}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Button Area */}
      {buttons && buttons.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex gap-3 flex-wrap">
            {buttons.map((button) => (
              <button
                key={button.value}
                onClick={() => onButtonClick(button.value)}
                className="
                  px-4 py-2 rounded-lg font-medium transition-colors
                  bg-blue-600 text-white hover:bg-blue-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                "
                aria-label={button.label}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
