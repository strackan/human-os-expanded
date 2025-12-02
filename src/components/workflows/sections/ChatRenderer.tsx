'use client';

/**
 * ChatRenderer - Chat Branching System Implementation
 *
 * Renders chat conversations with support for:
 * - Message history (AI + User messages)
 * - Inline components (slider, textarea, input, radio, dropdown, checkbox, star-rating)
 * - Branch navigation based on user responses
 * - Auto-advance after component input
 * - Action execution (launch-artifact, nextSlide, etc.)
 *
 * This component enables form-based interactions to happen conversationally
 * within the chat panel, reserving the artifacts panel for rich documents only.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Check } from 'lucide-react';
import { WorkflowSlide, InlineComponent, DynamicChatBranch } from '@/components/artifacts/workflows/config/WorkflowConfig';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  component?: InlineComponent;
  componentValue?: any;
  buttons?: Array<{
    label: string;
    value: string;
    'label-background'?: string;
    'label-text'?: string;
  }>;
  /** The slide this message belongs to (for chat continuity) */
  slideId?: string;
  /** Whether this message is from a previous slide (for visual distinction) */
  isHistorical?: boolean;
  /** Separator/divider message between slides (for continuous chat) */
  isSlideSeparator?: boolean;
  /** Alias for isSlideSeparator */
  isDivider?: boolean;
  /** Loading indicator for LLM generation in progress */
  isLoading?: boolean;
}

interface ChatRendererProps {
  currentSlide: WorkflowSlide;
  chatMessages: ChatMessage[];
  workflowState: Record<string, any>;
  customerName: string;
  onSendMessage: (message: string) => void;
  onBranchNavigation: (branchName: string, value?: any) => void;
  onComponentValueChange: (componentId: string, value: any) => void;
  onButtonClick?: (buttonValue: string) => void;
  getNextButtonLabel?: (originalLabel: string, buttonValue: string) => string;
  getPreviousButtonLabel?: (originalLabel: string, buttonValue: string) => string;
}

export default function ChatRenderer({
  currentSlide,
  chatMessages,
  workflowState,
  customerName,
  onSendMessage,
  onBranchNavigation,
  onComponentValueChange,
  onButtonClick,
  getNextButtonLabel,
  getPreviousButtonLabel
}: ChatRendererProps) {
  const [pendingComponentValue, setPendingComponentValue] = useState<any>(null);
  const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeparatorRef = useRef<HTMLDivElement>(null);
  const previousSlideIdRef = useRef<string | null>(null);

  // Auto-scroll behavior:
  // - When a new slide starts (separator added), scroll to the separator (top of new section)
  // - Otherwise, scroll to the bottom for new messages
  useEffect(() => {
    if (chatMessages.length === 0) return;

    // Find the most recent separator to detect slide changes
    const lastSeparator = [...chatMessages].reverse().find(m => m.isSlideSeparator || m.isDivider);
    const currentSlideId = lastSeparator?.slideId || chatMessages[chatMessages.length - 1]?.slideId;

    // Check if we just entered a new slide
    if (lastSeparator && currentSlideId !== previousSlideIdRef.current) {
      // Scroll to the separator (top of new section)
      setTimeout(() => {
        lastSeparatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      previousSlideIdRef.current = currentSlideId || null;
    } else {
      // Normal case: scroll to bottom for new messages
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle inline component value changes
  const handleComponentChange = (componentId: string, value: any) => {
    setPendingComponentValue(value);
    setCurrentComponentId(componentId);
  };

  // Submit component value (triggers branch navigation)
  const handleComponentSubmit = (componentId: string, value: any) => {
    onComponentValueChange(componentId, value);
    setPendingComponentValue(null);
    setCurrentComponentId(null);
  };

  // Render inline slider component
  const renderSlider = (component: InlineComponent & { type: 'slider' }, messageId: string) => {
    if (component.type !== 'slider') return null;

    const value = pendingComponentValue ?? component.defaultValue ?? component.min;
    const accentColor = component.accentColor || 'blue';
    const colorClasses = {
      purple: 'accent-purple-600 bg-purple-600',
      blue: 'accent-blue-600 bg-blue-600',
      red: 'accent-red-600 bg-red-600',
      green: 'accent-green-600 bg-green-600',
      orange: 'accent-orange-600 bg-orange-600'
    };

    return (
      <div className="my-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          {component.labels && (
            <>
              <span className="text-xs text-gray-500">{component.labels.min}</span>
              {component.showValue !== false && (
                <span className={`text-lg font-semibold text-${accentColor}-600`}>{value}</span>
              )}
              <span className="text-xs text-gray-500">{component.labels.max}</span>
            </>
          )}
        </div>
        <input
          type="range"
          min={component.min}
          max={component.max}
          step={component.step || 1}
          value={value}
          onChange={(e) => handleComponentChange(component.id, Number(e.target.value))}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${colorClasses[accentColor]}`}
        />
        <button
          onClick={() => handleComponentSubmit(component.id, value)}
          className={`mt-3 w-full py-2 px-4 ${colorClasses[accentColor].replace('accent-', 'bg-').replace('bg-bg-', 'bg-')} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline textarea component
  const RenderTextarea = ({ component, messageId }: { component: InlineComponent & { type: 'textarea' }, messageId: string }) => {
    const [value, setValue] = useState('');

    return (
      <div className="my-4">
        <textarea
          placeholder={component.placeholder || 'Type your response...'}
          rows={component.rows || 4}
          maxLength={component.maxLength}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        {component.maxLength && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {value.length} / {component.maxLength}
          </div>
        )}
        <button
          onClick={() => {
            if (component.required && !value.trim()) return;
            handleComponentSubmit(component.id, value);
          }}
          disabled={component.required && !value.trim()}
          className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline input component
  const RenderInput = ({ component, messageId }: { component: InlineComponent & { type: 'input' }, messageId: string }) => {
    const [value, setValue] = useState('');

    return (
      <div className="my-4">
        <input
          type={component.inputType || 'text'}
          placeholder={component.placeholder || 'Type your response...'}
          maxLength={component.maxLength}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => {
            if (component.required && !value.trim()) return;
            handleComponentSubmit(component.id, value);
          }}
          disabled={component.required && !value.trim()}
          className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline radio component
  const RenderRadio = ({ component, messageId }: { component: InlineComponent & { type: 'radio' }, messageId: string }) => {
    const [selectedValue, setSelectedValue] = useState<string | null>(null);

    return (
      <div className="my-4 space-y-2">
        {component.options.map((option, idx) => (
          <label
            key={idx}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedValue === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={component.id}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{option.label}</div>
              {option.description && (
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              )}
            </div>
          </label>
        ))}
        <button
          onClick={() => {
            if (component.required && !selectedValue) return;
            handleComponentSubmit(component.id, selectedValue);
          }}
          disabled={component.required && !selectedValue}
          className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline dropdown component
  const RenderDropdown = ({ component, messageId }: { component: InlineComponent & { type: 'dropdown' }, messageId: string }) => {
    const [selectedValue, setSelectedValue] = useState<string>('');

    return (
      <div className="my-4">
        <select
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="" disabled>
            {component.placeholder || 'Select an option...'}
          </option>
          {component.options.map((option, idx) => (
            <option key={idx} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            if (component.required && !selectedValue) return;
            handleComponentSubmit(component.id, selectedValue);
          }}
          disabled={component.required && !selectedValue}
          className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline checkbox component
  const RenderCheckbox = ({ component, messageId }: { component: InlineComponent & { type: 'checkbox' }, messageId: string }) => {
    const [selectedValues, setSelectedValues] = useState<string[]>([]);

    const handleCheckboxChange = (value: string, checked: boolean) => {
      if (checked) {
        if (component.maxSelections && selectedValues.length >= component.maxSelections) {
          return;
        }
        setSelectedValues([...selectedValues, value]);
      } else {
        setSelectedValues(selectedValues.filter(v => v !== value));
      }
    };

    const isValid = () => {
      if (component.minSelections && selectedValues.length < component.minSelections) return false;
      if (component.required && selectedValues.length === 0) return false;
      return true;
    };

    return (
      <div className="my-4 space-y-2">
        {component.options.map((option, idx) => {
          const isChecked = selectedValues.includes(option.value);
          const isDisabled =
            !isChecked &&
            component.maxSelections !== undefined &&
            selectedValues.length >= component.maxSelections;

          return (
            <label
              key={idx}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                isChecked
                  ? 'border-blue-500 bg-blue-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={isChecked}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                disabled={isDisabled}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                  {option.label}
                </div>
                {option.description && (
                  <div className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
        {(component.minSelections || component.maxSelections) && (
          <div className="text-xs text-gray-500 mt-2">
            {component.minSelections && component.maxSelections
              ? `Select ${component.minSelections}-${component.maxSelections} options`
              : component.minSelections
              ? `Select at least ${component.minSelections} option${component.minSelections > 1 ? 's' : ''}`
              : `Select up to ${component.maxSelections} option${component.maxSelections! > 1 ? 's' : ''}`}
          </div>
        )}
        <button
          onClick={() => handleComponentSubmit(component.id, selectedValues)}
          disabled={!isValid()}
          className="mt-2 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline star rating component
  const RenderStarRating = ({ component, messageId }: { component: InlineComponent & { type: 'star-rating' }, messageId: string }) => {
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);

    const min = component.min || 1;
    const max = component.max || 5;
    const labels = component.labels || {};

    const getLabel = (rating: number): string => {
      return labels[rating] || '';
    };

    const displayRating = hoveredRating || selectedRating || 0;

    return (
      <div className="my-4 p-4 bg-white border border-gray-200 rounded-lg">
        {/* Star Display */}
        <div className="flex justify-center gap-2 mb-3">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setSelectedRating(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none"
            >
              {rating <= displayRating ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        {/* Label Display */}
        {displayRating > 0 && (
          <div className="text-center text-sm font-medium text-gray-700 mb-3">
            {getLabel(displayRating)}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={() => {
            if (component.required && !selectedRating) return;
            handleComponentSubmit(component.id, selectedRating);
          }}
          disabled={component.required && !selectedRating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    );
  };

  // Render inline component based on type
  const renderInlineComponent = (component: InlineComponent, messageId: string) => {
    switch (component.type) {
      case 'slider':
        return renderSlider(component, messageId);
      case 'textarea':
        return <RenderTextarea component={component} messageId={messageId} />;
      case 'input':
        return <RenderInput component={component} messageId={messageId} />;
      case 'radio':
        return <RenderRadio component={component} messageId={messageId} />;
      case 'dropdown':
        return <RenderDropdown component={component} messageId={messageId} />;
      case 'checkbox':
        return <RenderCheckbox component={component} messageId={messageId} />;
      case 'star-rating':
        return <RenderStarRating component={component} messageId={messageId} />;
      default:
        return null;
    }
  };

  // Render buttons from message
  const renderButtons = (buttons: ChatMessage['buttons']) => {
    if (!buttons || buttons.length === 0) return null;

    // Determine if button is a "proceed" action (goes on right) or "back/cancel" action (goes on left)
    const isProceedButton = (button: typeof buttons[number]) => {
      const proceedValues = ['start', 'continue', 'next', 'complete', 'submit'];
      const proceedLabels = ['continue', 'next', 'start', 'complete', 'submit', 'yes', 'proceed'];
      return (
        proceedValues.includes(button.value.toLowerCase()) ||
        proceedLabels.some(label => button.label.toLowerCase().includes(label))
      );
    };

    // Sort buttons: back/cancel on left, proceed on right
    const sortedButtons = [...buttons].sort((a, b) => {
      const aIsProceed = isProceedButton(a);
      const bIsProceed = isProceedButton(b);
      if (aIsProceed && !bIsProceed) return 1;  // a goes right
      if (!aIsProceed && bIsProceed) return -1; // a goes left
      return 0; // keep original order
    });

    return (
      <div className="flex gap-3 mt-4">
        {sortedButtons.map((button, index) => {
          // Get dynamic button label (try both previous and next button label callbacks)
          let displayLabel = button.label;

          // Try getPreviousButtonLabel first (for back buttons)
          if (getPreviousButtonLabel) {
            const prevLabel = getPreviousButtonLabel(button.label, button.value);
            if (prevLabel !== button.label) {
              displayLabel = prevLabel;
            }
          }

          // If still unchanged, try getNextButtonLabel (for forward buttons)
          if (displayLabel === button.label && getNextButtonLabel) {
            displayLabel = getNextButtonLabel(button.label, button.value);
          }

          return (
            <button
              key={index}
              onClick={() => onButtonClick?.(button.value)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md ${
                button['label-background'] || 'bg-purple-600 hover:bg-purple-700'
              } ${button['label-text'] || 'text-white'}`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    );
  };

  // Replace {{customerName}} and other template variables
  const replaceTemplateVars = (text: string): string => {
    return text.replace(/\{\{customerName\}\}/g, customerName);
  };

  // Convert markdown-style formatting to HTML
  const formatTextToHTML = (text: string): string => {
    let formatted = replaceTemplateVars(text);

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  return (
    <div className="flex flex-col justify-end p-12 pb-8 h-full overflow-y-auto">
      <div className="max-w-2xl w-full space-y-6 mx-auto mt-auto">
        {chatMessages.map((message, index) => {
          // Check if this is the last separator in the list (for scroll ref)
          const isLastSeparator = (message.isSlideSeparator || message.isDivider) &&
            !chatMessages.slice(index + 1).some(m => m.isSlideSeparator || m.isDivider);

          // Render slide separator
          if (message.isSlideSeparator) {
            return (
              <div
                key={message.id}
                ref={isLastSeparator ? lastSeparatorRef : undefined}
                className="flex items-center gap-3 py-2"
              >
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500 font-medium px-2">
                  {message.text}
                </span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
            );
          }

          // Handle system/divider messages (slide transitions in continuous chat)
          if (message.sender === 'system' || message.isDivider) {
            return (
              <div
                key={message.id}
                ref={isLastSeparator ? lastSeparatorRef : undefined}
                className="flex items-center justify-center my-4"
              >
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="h-px w-12 bg-gray-200"></div>
                  <span className="font-medium uppercase tracking-wider">{message.text}</span>
                  <div className="h-px w-12 bg-gray-200"></div>
                </div>
              </div>
            );
          }

          // Apply opacity for historical messages
          const historicalClass = message.isHistorical ? 'opacity-60' : '';

          return (
            <div key={message.id} className={`space-y-3 ${historicalClass}`}>
              {/* Message Row with Avatar */}
              <div
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                } items-start gap-2`}
              >
                {/* AI Avatar */}
                {message.sender === 'ai' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    message.isHistorical ? 'bg-gray-400' : 'bg-gray-600'
                  }`}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Message Content Column (bubble, components, buttons all same width) */}
                <div className="flex flex-col gap-3 max-w-lg w-full">
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-5 py-3 ${
                      message.sender === 'user'
                        ? message.isHistorical ? 'bg-blue-400 text-white' : 'bg-blue-600 text-white'
                        : message.isHistorical ? 'bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatTextToHTML(message.text) }}
                    />
                  </div>

                  {/* Inline Component (only for AI messages, not historical) */}
                  {message.sender === 'ai' && message.component && !message.isHistorical && (
                    <div>{renderInlineComponent(message.component, message.id)}</div>
                  )}

                  {/* Buttons (only for AI messages, not historical) */}
                  {message.sender === 'ai' && message.buttons && !message.isHistorical && (
                    <div>{renderButtons(message.buttons)}</div>
                  )}

                  {/* Submitted Component Value Display */}
                  {message.componentValue !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Submitted: {JSON.stringify(message.componentValue)}</span>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {message.sender === 'user' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    message.isHistorical ? 'bg-blue-400' : 'bg-blue-600'
                  }`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
