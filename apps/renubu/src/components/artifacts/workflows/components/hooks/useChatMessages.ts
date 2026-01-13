import { useState, useCallback } from 'react';

export interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'buttons' | 'loading' | 'separator';
  buttons?: Array<{
    label: string;
    value: string;
    'label-background'?: string;
    'label-text'?: string;
  }>;
  'button-pos'?: string;
  stepName?: string; // For separator messages
}

interface UseChatMessagesProps {
  initialMessages: Message[];
}

/**
 * useChatMessages Hook
 *
 * Manages chat message state and operations:
 * - Message list management (add, reset, restore)
 * - Separator messages for step transitions
 * - Working/loading message state
 * - User and AI message handling
 */
export function useChatMessages({
  initialMessages
}: UseChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isWorkingOnIt, setIsWorkingOnIt] = useState(false);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    const message: Message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    addMessage(message);
    return message;
  }, [addMessage]);

  const addAIMessage = useCallback((
    text: string,
    options?: {
      buttons?: Message['buttons'];
      type?: Message['type'];
    }
  ) => {
    const message: Message = {
      id: Date.now() + 1,
      text,
      sender: 'ai',
      timestamp: new Date(),
      type: options?.buttons ? 'buttons' : (options?.type || 'text'),
      buttons: options?.buttons,
      'button-pos': options?.buttons ? 'center' : undefined
    };
    addMessage(message);
    return message;
  }, [addMessage]);

  const addSeparator = useCallback((stepTitle: string) => {
    console.log('useChatMessages: Adding separator for step:', stepTitle);
    const separatorMessage: Message = {
      id: `separator-${Date.now()}`,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      type: 'separator',
      stepName: stepTitle
    };
    addMessage(separatorMessage);
  }, [addMessage]);

  const showWorkingMessage = useCallback(() => {
    setIsWorkingOnIt(true);
  }, []);

  const hideWorkingMessage = useCallback(() => {
    setIsWorkingOnIt(false);
  }, []);

  const resetMessages = useCallback(() => {
    setMessages(initialMessages);
    setIsWorkingOnIt(false);
  }, [initialMessages]);

  const restoreState = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  return {
    messages,
    isWorkingOnIt,
    addMessage,
    addUserMessage,
    addAIMessage,
    addSeparator,
    showWorkingMessage,
    hideWorkingMessage,
    resetMessages,
    restoreState
  };
}
