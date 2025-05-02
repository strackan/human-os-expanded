'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Customer } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const SAMPLE_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    avatar: 'SC'
  },
  {
    id: 'u2',
    name: 'Michael Rodriguez',
    email: 'michael.r@company.com',
    avatar: 'MR'
  },
  {
    id: 'u3',
    name: 'Alex Kim',
    email: 'alex.kim@company.com',
    avatar: 'AK'
  }
];

export default function ChatModal({ isOpen, onClose, customer }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customer) {
      setMessages([{
        role: 'assistant',
        content: `I'm ready to discuss the renewal for ${customer.name}. What aspects would you like to explore?`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [customer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setMentionStartIndex(lastAtIndex);
      setMentionQuery('');
      setShowMentions(true);
    } else if (lastAtIndex !== -1 && mentionStartIndex === lastAtIndex) {
      const query = value.slice(lastAtIndex + 1);
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const beforeMention = messageInput.slice(0, mentionStartIndex);
    const newMessage = `${beforeMention}@${user.name} `;
    setMessageInput(newMessage);
    setShowMentions(false);
    setMentionStartIndex(-1);

    // Add system message for user joining
    setMessages(prev => [...prev, {
      role: 'system',
      content: `${user.name} has joined the discussion`,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !customer) return;

    const newMessages = [
      ...messages,
      { 
        role: 'user',
        content: messageInput,
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(newMessages);
    setMessageInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `I understand your interest in ${messageInput.toLowerCase()}. Based on ${customer.name}'s renewal data, this relates to their current status and upcoming renewal. Would you like me to provide more specific information or discuss potential actions?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg w-full max-w-[1000px] h-[700px] border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
            <h3 className="ml-2 text-lg font-semibold text-gray-900">
              {customer ? `Discussion: ${customer.name}` : 'Chat'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close discussion"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 h-[calc(100%-8rem)] overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'system' 
                  ? 'flex justify-center'
                  : message.role === 'assistant' 
                    ? 'flex' 
                    : 'flex flex-row-reverse'
              }`}
            >
              {message.role === 'system' ? (
                <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">
                  {message.content}
                </div>
              ) : (
                <>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2">
                      <SparklesIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-3/4 p-4 rounded-lg shadow-sm ${
                      message.role === 'assistant'
                        ? 'bg-white border border-gray-100 text-gray-800'
                        : 'bg-blue-600/90 backdrop-blur-sm text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                      <span className="text-white text-sm">You</span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200/80 bg-gray-50/50">
          <div className="relative">
            <div className="flex space-x-4">
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message... Use @ to mention someone"
                className="flex-1 px-4 py-2 bg-white/90 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700/90 transition-colors shadow-sm"
              >
                Send
              </button>
            </div>

            {/* Mentions Dropdown */}
            {showMentions && (
              <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg">
                <div className="p-2">
                  {SAMPLE_USERS.filter(user =>
                    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
                  ).map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleMentionSelect(user)}
                      className="w-full flex items-center p-2 hover:bg-gray-50 rounded-md"
                    >
                      <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                        {user.avatar}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 