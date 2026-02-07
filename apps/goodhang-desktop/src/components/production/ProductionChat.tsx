/**
 * Production Chat
 *
 * Chat area component for production mode.
 * Reuses ChatMessage and ChatInput, adds quick actions,
 * tool execution cards, and clarification prompts.
 */

import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ModeQuickActions } from './ModeQuickActions';
import { ToolExecutionCard } from './ToolExecutionCard';
import { ClarificationPrompt } from './ClarificationPrompt';
import type { Message } from '@/lib/types';
import type {
  ProductionMode,
  DoGateResult,
  ClarificationOption,
} from '@/lib/types/production';

interface ProductionChatProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  mode: ProductionMode;
  onQuickAction: (value: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  /** Latest do() gate result for tool execution feedback */
  lastDoGateResult?: DoGateResult | null;
  /** Clarification options if entities are ambiguous */
  clarificationOptions?: ClarificationOption[] | null;
  onClarificationSelect?: (option: ClarificationOption) => void;
}

export function ProductionChat({
  messages,
  inputValue,
  onInputChange,
  onSend,
  isLoading,
  isStreaming,
  mode,
  onQuickAction,
  messagesEndRef,
  lastDoGateResult,
  clarificationOptions,
  onClarificationSelect,
}: ProductionChatProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.timestamp}-${index}`}
            message={message}
            index={index}
            useMarkdown
            assistantClassName="bg-gh-dark-750 text-white"
          />
        ))}

        {/* Tool execution card */}
        {lastDoGateResult?.matched && (
          <ToolExecutionCard result={lastDoGateResult} />
        )}

        {/* Clarification prompt */}
        {clarificationOptions && clarificationOptions.length > 0 && onClarificationSelect && (
          <ClarificationPrompt
            options={clarificationOptions}
            onSelect={onClarificationSelect}
          />
        )}

        {/* Loading indicator */}
        {isLoading && !isStreaming && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gh-dark-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <ModeQuickActions
        mode={mode}
        onAction={onQuickAction}
        disabled={isLoading || isStreaming}
      />

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        placeholder={getPlaceholder(mode)}
        disabled={isLoading || isStreaming}
        sendButtonColor="orange"
      />
    </div>
  );
}

function getPlaceholder(mode: ProductionMode): string {
  switch (mode) {
    case 'journal': return 'Write your thoughts...';
    case 'brainstorm': return 'Throw out an idea...';
    case 'checkin': return 'How are you feeling?';
    case 'crisis': return 'What do you need right now?';
    case 'post': return 'What do you want to share?';
    case 'search': return 'Who are you looking for?';
    default: return 'What can I help with?';
  }
}

export default ProductionChat;
