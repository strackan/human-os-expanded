'use client';

import { useState } from 'react';
import { SparklesIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContract?: {
    id: string;
    customerName: string;
  } | null;
}

const AIChatBox = ({ isOpen, onClose, selectedContract }: AIChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newMessage: Message = {
      role: 'user',
      content: inputValue.trim()
    };
    setMessages(prev => [...prev, newMessage]);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: 'I understand your question. Let me help you with that.'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInputValue('');
  };

  const getContextualActions = () => {
    if (selectedContract) {
      return [
        {
          label: 'Draft Amendment',
          icon: DocumentIcon,
          action: () => {
            setMessages([]);
            setInputValue('Could you help me draft an amendment?');
          }
        },
        {
          label: 'Analyze Terms',
          icon: SparklesIcon,
          action: () => {
            setMessages([]);
            setInputValue('Could you analyze the terms?');
          }
        }
      ];
    }
    return [];
  };

  if (!isOpen) return null;

  const contextualActions = getContextualActions();

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-blue-500" />
          <span className="font-medium">AI Assistant</span>
          {selectedContract && (
            <>
              <span className="text-gray-400 mx-1">•</span>
              <span className="text-gray-600">{selectedContract.customerName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedContract && (
            <button
              onClick={() => {
                setMessages([]);
                setInputValue('Could you help me draft an amendment?');
              }}
              className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <DocumentIcon className="h-4 w-4" />
              <span>Draft Amendment</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close chat"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Welcome Message or Chat */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <SparklesIcon className="h-8 w-8 text-blue-500 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              {selectedContract 
                ? `How can I help with ${selectedContract.customerName}'s contract?`
                : "Welcome to Renewals HQ"}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              {selectedContract
                ? "I can help analyze terms, draft amendments, suggest optimizations, or answer any questions about the contract."
                : "I'm your AI assistant for Renewals HQ. I can help you manage contracts, analyze renewals, and answer any questions you have about the platform."}
            </p>
            {contextualActions.length > 0 && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {contextualActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="flex items-center justify-center gap-2 p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                  >
                    <action.icon className="h-5 w-5 text-blue-500" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm">You</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600 flex items-center gap-2"
          >
            <span>Send</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatBox; 