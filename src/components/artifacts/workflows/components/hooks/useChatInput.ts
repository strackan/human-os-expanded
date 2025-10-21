import { useState, useRef, useEffect, useCallback } from 'react';

interface UseChatInputProps {
  onSendMessage: (text: string) => void;
}

/**
 * useChatInput Hook
 *
 * Manages chat input state and behavior:
 * - Input value management
 * - Textarea auto-resize
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 */
export function useChatInput({ onSendMessage }: UseChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return {
    inputValue,
    setInputValue,
    textareaRef,
    handleSend,
    handleKeyPress,
  };
}
