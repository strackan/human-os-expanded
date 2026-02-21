'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface OnboardingChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  disabled: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gray-300"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingChat({
  messages,
  onSendMessage,
  isTyping,
  disabled,
}: OnboardingChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages or typing
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when not disabled
  useEffect(() => {
    if (!disabled && !isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled || isTyping) return;
    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-2xl rounded-bl-md">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTyping ? '' : 'Type your message...'}
            disabled={disabled || isTyping}
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm
              focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200
              disabled:bg-gray-50 disabled:text-gray-400
              placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={disabled || isTyping || !input.trim()}
            className="rounded-full bg-orange-500 p-2.5 text-white
              hover:bg-orange-600 transition-colors
              disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
