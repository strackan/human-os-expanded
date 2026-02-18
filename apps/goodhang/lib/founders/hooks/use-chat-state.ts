'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '../types';

export interface UseChatStateOptions {
  initialMessages?: Message[];
  autoScroll?: boolean;
}

export interface UseChatStateReturn {
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  isStreaming: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setInputValue: (value: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  addStreamingPlaceholder: () => void;
  appendToLastAssistantMessage: (chunk: string) => void;
  finalizeStreamingMessage: (content: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearMessages: () => void;
  scrollToBottom: () => void;
}

export function useChatState(options: UseChatStateOptions = {}): UseChatStateReturn {
  const { initialMessages = [], autoScroll = true } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      { role: 'user', content, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const addAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const addStreamingPlaceholder = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date().toISOString() },
    ]);
  }, []);

  const appendToLastAssistantMessage = useCallback((chunk: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i]?.role === 'assistant') {
          updated[i] = {
            ...updated[i]!,
            content: (updated[i]?.content || '') + chunk,
          };
          break;
        }
      }
      return updated;
    });
  }, []);

  const finalizeStreamingMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i]?.role === 'assistant') {
          updated[i] = {
            ...updated[i]!,
            content,
            timestamp: new Date().toISOString(),
          };
          break;
        }
      }
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    inputValue,
    isLoading,
    isStreaming,
    messagesEndRef,
    setInputValue,
    setIsLoading,
    setIsStreaming,
    addUserMessage,
    addAssistantMessage,
    addStreamingPlaceholder,
    appendToLastAssistantMessage,
    finalizeStreamingMessage,
    setMessages,
    clearMessages,
    scrollToBottom,
  };
}
