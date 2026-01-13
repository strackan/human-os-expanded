import { useState, useCallback } from 'react';
import { ChatContext } from '../components/chat/ChatContext';
import { ChatMessage } from '../components/customers/shared/CustomerChatDialog';

interface UseChatWorkflowProps {
  steps: any[];
  onComplete?: () => void;
}

export const useChatWorkflow = ({ steps, onComplete }: UseChatWorkflowProps) => {
  const [chatContext] = useState(() => new ChatContext(steps));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleUserMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    
    // Process the message through the chat context
    const response = chatContext.processUserInput(message.content);
    
    if (response) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content: response,
        timestamp: new Date()
      }]);
    }

    // Check if the workflow is complete
    if (chatContext.isComplete()) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [chatContext, onComplete]);

  const initialize = useCallback(() => {
    const initialMessage = chatContext.initialize();
    if (initialMessage) {
      setMessages([{
        id: Date.now().toString(),
        type: 'bot',
        content: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [chatContext]);

  return {
    messages,
    isComplete,
    handleUserMessage,
    initialize
  };
}; 