/**
 * useChatState Hook
 *
 * Reusable state management for chat interfaces.
 * Handles messages, input, loading states, and scroll-to-bottom.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/types';

export interface UseChatStateOptions {
  /** Initial messages to populate */
  initialMessages?: Message[];
  /** Auto-scroll to bottom on new messages */
  autoScroll?: boolean;
}

export interface UseChatStateReturn {
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setInputValue: (value: string) => void;
  setIsLoading: (loading: boolean) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearMessages: () => void;
  scrollToBottom: () => void;
}

export function useChatState(options: UseChatStateOptions = {}): UseChatStateReturn {
  const { initialMessages = [], autoScroll = true } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const addAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    inputValue,
    isLoading,
    messagesEndRef,
    setInputValue,
    setIsLoading,
    addUserMessage,
    addAssistantMessage,
    setMessages,
    clearMessages,
    scrollToBottom,
  };
}
