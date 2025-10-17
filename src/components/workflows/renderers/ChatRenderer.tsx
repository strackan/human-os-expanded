'use client';

/**
 * ChatRenderer Component
 *
 * Renders chat content for workflow slides, including:
 * - Greeting messages with typing animation
 * - AI messages
 * - Button groups
 * - Inline interactive components (sliders, inputs, etc.)
 * - Chat history
 */

import React, { useState, useEffect } from 'react';
import { WorkflowSlide, DynamicChatBranch } from '@/components/artifacts/workflows/config/WorkflowConfig';
import InlineComponentRenderer from '../InlineComponentRenderer';

interface ChatRendererProps {
  slide: WorkflowSlide;
  slideIndex: number;
  customerName: string;
  workflowState: Record<string, any>;
  onButtonClick: (buttonValue: string) => void;
  onComponentSubmit: (componentId: string, value: any, branch: DynamicChatBranch) => void;
  chatMessages?: Array<{ text: string; sender: 'user' | 'ai'; timestamp: Date }>;
}

export default function ChatRenderer({
  slide,
  slideIndex,
  customerName,
  workflowState,
  onButtonClick,
  onComponentSubmit,
  chatMessages = []
}: ChatRendererProps) {
  const [greetingText, setGreetingText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);

  const initialMessage = slide.chat?.initialMessage;

  // Replace variables in text
  const replaceVariables = (text: string): string => {
    let result = text.replace(/\{\{customerName\}\}/g, customerName);

    // Replace workflow state variables
    Object.keys(workflowState).forEach(key => {
      const placeholder = `{{${key}}}`;
      if (result.includes(placeholder)) {
        result = result.replace(new RegExp(placeholder, 'g'), String(workflowState[key]));
      }
    });

    return result;
  };

  const fullGreeting = replaceVariables(initialMessage?.text || '');

  // Typing animation for greeting on first slide
  useEffect(() => {
    if (slideIndex === 0 && greetingText.length < fullGreeting.length) {
      const timeout = setTimeout(() => {
        setGreetingText(fullGreeting.slice(0, greetingText.length + 1));
      }, 5);
      return () => clearTimeout(timeout);
    } else if (greetingText.length === fullGreeting.length && !showButtons) {
      setTimeout(() => setShowButtons(true), 300);
    }
  }, [greetingText, slideIndex, fullGreeting, showButtons]);

  // Get current branch if one is active
  const activeBranch = currentBranch && slide.chat?.branches?.[currentBranch]
    ? slide.chat.branches[currentBranch]
    : null;

  // First slide: Show greeting with typing animation
  if (slideIndex === 0) {
    return (
      <div className="flex items-center justify-center p-12 h-full">
        <div className="max-w-lg w-full">
          <div className="bg-gray-100 rounded-2xl p-6 mb-6">
            <p className="text-gray-800 leading-relaxed">{greetingText}</p>
          </div>

          {showButtons && initialMessage?.buttons && (
            <div className="flex gap-4 animate-fade-in">
              {initialMessage.buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => onButtonClick(button.value)}
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${
                    button['label-background'] || 'bg-purple-600 hover:bg-purple-700'
                  } ${button['label-text'] || 'text-white'}`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Other slides: Show chat history + current message + inline components
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Chat History */}
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-6 ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-2 ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {/* Current Message */}
          {initialMessage?.text && !activeBranch && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-gray-100 rounded-2xl p-6">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {replaceVariables(initialMessage.text)}
                </p>
              </div>
            </div>
          )}

          {/* Active Branch Message */}
          {activeBranch && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-gray-100 rounded-2xl p-6">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {replaceVariables(activeBranch.response)}
                </p>
              </div>
            </div>
          )}

          {/* Inline Component (if active branch has one) */}
          {activeBranch?.component && (
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <InlineComponentRenderer
                  component={activeBranch.component}
                  onSubmit={(value) => {
                    onComponentSubmit(activeBranch.component!.id, value, activeBranch);
                  }}
                  initialValue={workflowState[activeBranch.component.id]}
                  autoFocus={true}
                />
              </div>
            </div>
          )}

          {/* Buttons (if initial message or active branch has them) */}
          {!activeBranch?.component && initialMessage?.buttons && (
            <div className="flex gap-4 justify-center">
              {initialMessage.buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => onButtonClick(button.value)}
                  className={`py-4 px-8 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${
                    button['label-background'] || 'bg-purple-600 hover:bg-purple-700'
                  } ${button['label-text'] || 'text-white'}`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          {activeBranch?.buttons && !activeBranch.component && (
            <div className="flex gap-4 justify-center">
              {activeBranch.buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => onButtonClick(button.value)}
                  className={`py-4 px-8 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg ${
                    button['label-background'] || 'bg-purple-600 hover:bg-purple-700'
                  } ${button['label-text'] || 'text-white'}`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
