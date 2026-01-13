import { useState, useRef, useCallback } from 'react';

/**
 * useChatUI Hook
 *
 * Manages UI-related state for the chat interface:
 * - Recording state (voice input)
 * - Button visibility toggle
 * - Typing animation tracking
 * - Scroll behavior
 */
export function useChatUI() {
  const [isRecording, setIsRecording] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [typingMessages, setTypingMessages] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const toggleButtonMode = useCallback(() => {
    setShowButtons(prev => !prev);
  }, []);

  const addTypingMessage = useCallback((messageId: number) => {
    setTypingMessages(prev => new Set(prev).add(messageId));
  }, []);

  const removeTypingMessage = useCallback((messageId: number) => {
    setTypingMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  }, []);

  return {
    isRecording,
    setIsRecording,
    showButtons,
    setShowButtons,
    toggleButtonMode,
    typingMessages,
    addTypingMessage,
    removeTypingMessage,
    messagesEndRef,
    scrollToBottom,
  };
}
