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
    <div className="typing-dots">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="typing-dot"
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
    <div id="onboarding-chat">
      <div ref={scrollRef} className="chat-messages">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`msg-row ${msg.role}`}
            >
              <div className={`msg-bubble ${msg.role}`}>
                <p className="msg-text">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="typing-row"
          >
            <div className="typing-bubble">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-bar">
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTyping ? '' : 'Type your message...'}
            disabled={disabled || isTyping}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={disabled || isTyping || !input.trim()}
            className="chat-send-btn"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
