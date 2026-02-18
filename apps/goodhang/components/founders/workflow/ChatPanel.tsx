'use client';

import ReactMarkdown from 'react-markdown';
import { useWorkflowChat, useWorkflowLoading } from '@/lib/founders/workflow-context';
import type { WorkflowMessage } from '@/lib/founders/workflow-types';
import type { QuickAction } from '@/lib/founders/types';

function StepDivider() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--gh-dark-600)] to-transparent" />
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span>Next Step</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--gh-dark-600)] to-transparent" />
    </div>
  );
}

function QuickActions({ actions, onAction, disabled }: { actions: QuickAction[]; onAction: (action: QuickAction) => void; disabled?: boolean }) {
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-founders-fade-in">
      {actions.map((action, i) => (
        <button key={`${action.value}-${i}`} onClick={() => onAction(action)} disabled={disabled}
          className="px-4 py-2 bg-[var(--gh-dark-700)] hover:bg-[var(--gh-dark-600)] text-white text-sm rounded-lg border border-[var(--gh-dark-600)] hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {action.label}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ message, useMarkdown, onQuickAction, isLoading }: { message: WorkflowMessage; useMarkdown: boolean; onQuickAction: (action: QuickAction) => void; isLoading: boolean }) {
  const isUser = message.role === 'user';
  if (message.isStepDivider) return <StepDivider />;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} chat-message-enter`}>
      <div className="max-w-[85%] space-y-2">
        <div className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-blue-600 text-white' : 'bg-[var(--gh-dark-700)] text-white'}`}>
          {useMarkdown && !isUser && message.content ? (
            <div className="prose prose-invert prose-sm max-w-none break-words"><ReactMarkdown>{message.content}</ReactMarkdown></div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
        {message.quickActions && message.quickActions.length > 0 && (
          <QuickActions actions={message.quickActions} onAction={onQuickAction} disabled={isLoading} />
        )}
      </div>
    </div>
  );
}

export function ChatPanel({ className, useMarkdown = true }: { className?: string; useMarkdown?: boolean }) {
  const { messages, isLoading, quickActions, handleQuickAction, messagesEndRef } = useWorkflowChat();
  const loadingState = useWorkflowLoading();

  return (
    <div className={`flex-1 overflow-y-auto founders-scrollbar p-4 space-y-4 ${className ?? ''}`}>
      {messages.map((message, index) => (
        <MessageBubble key={`msg-${index}-${message.timestamp}`} message={message} useMarkdown={useMarkdown} onQuickAction={handleQuickAction} isLoading={isLoading} />
      ))}
      {quickActions.length > 0 && <QuickActions actions={quickActions} onAction={handleQuickAction} disabled={isLoading} />}
      {isLoading && !loadingState.isActive && (
        <div className="flex justify-start animate-founders-fade-in">
          <div className="bg-[var(--gh-dark-700)] rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      )}
      {loadingState.isActive && (
        <div className="flex justify-start animate-founders-fade-in">
          <div className="bg-[var(--gh-dark-700)] rounded-2xl px-4 py-3">
            <p className="text-sm text-gray-400">{loadingState.currentMessage}</p>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
