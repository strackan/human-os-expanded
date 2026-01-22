/**
 * Chat Panel Component
 *
 * Unified chat display for workflow mode.
 * Renders messages, loading indicators, quick actions, and inline components.
 */

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useWorkflowChat, useWorkflowLoading } from '@/lib/contexts';
import { LoadingIndicator } from '@/components/chat';
import { StagedLoadingIndicator } from './StagedLoadingIndicator';
import { InlineComponent } from './InlineComponent';
import type { ChatPanelProps, WorkflowMessage } from '@/lib/types/workflow';
import type { QuickAction } from '@/lib/types/shared';

// =============================================================================
// STEP DIVIDER
// =============================================================================

function StepDivider() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gh-dark-600 to-transparent" />
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span>Next Step</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gh-dark-600 to-transparent" />
    </div>
  );
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
  disabled?: boolean;
}

function QuickActions({ actions, onAction, disabled }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mt-3"
    >
      {actions.map((action, i) => (
        <button
          key={`${action.value}-${i}`}
          onClick={() => onAction(action)}
          disabled={disabled}
          className="px-4 py-2 bg-gh-dark-700 hover:bg-gh-dark-600 text-white text-sm rounded-lg border border-gh-dark-600 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </motion.div>
  );
}

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

interface MessageBubbleProps {
  message: WorkflowMessage;
  index: number;
  useMarkdown: boolean;
  onQuickAction: (action: QuickAction) => void;
  onInlineSubmit: (id: string, value: unknown) => void;
  isLoading: boolean;
}

function MessageBubble({
  message,
  index,
  useMarkdown,
  onQuickAction,
  onInlineSubmit,
  isLoading,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Step divider message
  if (message.isStepDivider) {
    return <StepDivider key={`divider-${index}`} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[85%] space-y-2">
        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gh-dark-700 text-white'
          }`}
        >
          {useMarkdown && !isUser && message.content ? (
            <div className="prose prose-invert prose-sm max-w-none break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Inline component */}
        {message.inlineComponent && (
          <InlineComponent
            config={message.inlineComponent}
            onSubmit={(value) => onInlineSubmit(message.inlineComponent!.id, value)}
            disabled={isLoading}
          />
        )}

        {/* Quick actions */}
        {message.quickActions && message.quickActions.length > 0 && (
          <QuickActions
            actions={message.quickActions}
            onAction={onQuickAction}
            disabled={isLoading}
          />
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChatPanel({ className, useMarkdown = true }: ChatPanelProps) {
  const {
    messages,
    isLoading,
    quickActions,
    handleQuickAction,
    submitInlineComponent,
    messagesEndRef,
  } = useWorkflowChat();

  const loadingState = useWorkflowLoading();

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className ?? ''}`}>
      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <MessageBubble
            key={`msg-${index}-${message.timestamp}`}
            message={message}
            index={index}
            useMarkdown={useMarkdown}
            onQuickAction={handleQuickAction}
            onInlineSubmit={submitInlineComponent}
            isLoading={isLoading}
          />
        ))}
      </AnimatePresence>

      {/* Global quick actions (not attached to a message) */}
      {quickActions.length > 0 && (
        <QuickActions
          actions={quickActions}
          onAction={handleQuickAction}
          disabled={isLoading}
        />
      )}

      {/* Loading indicator */}
      {isLoading && !loadingState.isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-gh-dark-700 rounded-2xl px-4 py-3">
            <LoadingIndicator />
          </div>
        </motion.div>
      )}

      {/* Staged loading */}
      {loadingState.isActive && (
        <StagedLoadingIndicator
          stages={loadingState.stages}
          currentStage={loadingState.currentStage}
          progress={loadingState.progress}
          message={loadingState.currentMessage}
        />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatPanel;
