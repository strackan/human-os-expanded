/**
 * Workflow Chat Panel
 *
 * Hybrid chat interface supporting:
 * - Fixed branches (deterministic button responses)
 * - LLM branches (dynamic AI conversations)
 * - Saved actions (snooze, skip, escalate)
 *
 * Phase 2.2a: Chat UI Foundation (Database-driven)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import { BranchList, ChatBranch as BranchType } from './BranchRenderer';
import * as ChatService from '@/services/ChatService';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// =====================================================
// Types
// =====================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

// Re-export ChatBranch from BranchRenderer for convenience
export type ChatBranch = BranchType;

export interface WorkflowChatPanelProps {
  workflowId: string;
  stepId: string;
  executionId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStep?: (stepId: string) => void;
}

// =====================================================
// WorkflowChatPanel Component
// =====================================================

export const WorkflowChatPanel: React.FC<WorkflowChatPanelProps> = ({
  workflowId,
  stepId,
  executionId,
  isOpen,
  onClose,
  onNavigateToStep
}) => {
  const [branches, setBranches] = useState<ChatBranch[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<'branches' | 'chat'>('branches');
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // User preferences (persisted to backend)
  const { preferences, updatePreference } = useUserPreferences();
  const shiftEnterToSubmit = preferences.chat_shift_enter_to_submit || false;

  // Track sidebar collapse state for full-screen mode positioning
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('#global-sidebar');
      if (sidebar) {
        const isCollapsed = sidebar.getAttribute('data-collapsed') === 'true';
        setIsSidebarCollapsed(isCollapsed);
      }
    };

    // Check initial state
    checkSidebarState();

    // Set up a MutationObserver to watch for changes to data-collapsed attribute
    const sidebar = document.querySelector('#global-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['data-collapsed'] });

      return () => observer.disconnect();
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when entering chat mode
  useEffect(() => {
    if (activeMode === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeMode]);

  // Fetch branches when step changes
  useEffect(() => {
    if (isOpen && workflowId && stepId) {
      fetchBranches();
    }
  }, [isOpen, workflowId, stepId]);

  // Fetch available branches from ChatService
  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      // Using ChatService (currently mock, will be real API in Phase 2.2b)
      const branches = await ChatService.fetchBranches(workflowId, stepId);
      setBranches(branches);
    } catch (error) {
      console.error('[WorkflowChatPanel] Error fetching branches:', error);
      setBranches([]); // Clear branches on error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fixed branch click
  const handleFixedBranch = (branch: ChatBranch) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: branch.branch_label,
      timestamp: new Date()
    };

    // Add bot response
    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content: branch.response_text || 'Done!',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);

    // Navigate to next step if specified
    if (branch.next_step_id && onNavigateToStep) {
      setTimeout(() => {
        onNavigateToStep(branch.next_step_id!);
      }, 500);
    }
  };

  // Handle saved action branch
  const handleSavedAction = async (branch: ChatBranch) => {
    // Execute saved actions silently (no chat messages)
    // These are administrative actions (snooze, skip, escalate) that should be handled
    // separately from the conversational flow
    setIsLoading(true);

    try {
      // Execute action via ChatService
      const result = await ChatService.executeAction(
        branch.saved_action_id || 'unknown',
        executionId
      );

      console.log('[WorkflowChatPanel] Saved action executed:', result.action_type, result.message);

      // Show friendly confirmation message
      const actionMessages: Record<string, string> = {
        'snooze': "Task snoozed. I'll remind you about it in a couple of days.",
        'skip': "Task skipped. Moving on to the next item.",
        'escalate': "Task escalated to your manager for review.",
      };

      const friendlyMessage = actionMessages[result.action_type] || result.message || 'Action completed successfully.';
      alert(friendlyMessage);

    } catch (error) {
      console.error('[WorkflowChatPanel] Error executing action:', error);

      // For errors, we might want to show an alert or toast
      // For now, just log it
      alert(`Error executing ${branch.branch_label}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle LLM branch - switch to chat mode
  const handleLLMBranch = async (branch: ChatBranch) => {
    setActiveMode('chat');

    // Add system message
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: 'You can now ask questions. Type your message below.',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, systemMessage]);

    try {
      // Create thread via ChatService
      const thread = await ChatService.createThread(
        executionId,
        stepId,
        branch.branch_type === 'rag' ? 'rag' : 'llm'
      );
      setCurrentThreadId(thread.id);
    } catch (error) {
      console.error('[WorkflowChatPanel] Error creating thread:', error);
      // Fallback to local thread ID
      setCurrentThreadId(`fallback-thread-${Date.now()}`);
    }
  };

  // Send message in LLM chat mode
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentThreadId) return;

    const messageContent = inputValue; // Capture before clearing

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message via ChatService and get AI response
      const aiMessage = await ChatService.sendMessage(currentThreadId, messageContent);

      const botMessage: ChatMessage = {
        id: aiMessage.id,
        role: 'assistant',
        content: aiMessage.content,
        timestamp: new Date(aiMessage.created_at),
        metadata: aiMessage.metadata
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('[WorkflowChatPanel] Error sending message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Re-focus input after response (setTimeout ensures it happens after state update)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Return to branch selection
  const handleBackToBranches = () => {
    setActiveMode('branches');
    setCurrentThreadId(null);
  };

  // Unified branch click handler - routes to appropriate handler based on type
  const handleBranchClick = (branch: ChatBranch) => {
    if (branch.branch_type === 'fixed') {
      handleFixedBranch(branch);
    } else if (branch.branch_type === 'saved_action') {
      handleSavedAction(branch);
    } else if (branch.branch_type === 'llm' || branch.branch_type === 'rag') {
      handleLLMBranch(branch);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="workflow-chat-panel"
      data-mode={activeMode}
      data-expanded={isExpanded}
      className={`
        fixed top-16 bg-white border-l border-gray-200 shadow-xl
        transition-all duration-300 flex flex-col z-50
        ${isExpanded
          ? `${isSidebarCollapsed ? 'left-16' : 'left-64'} right-0 h-[calc(100vh-4rem)]`
          : 'right-0 w-96 h-[calc(100vh-4rem)]'}
      `}
    >
      {/* Header */}
      <div id="chat-panel-header" className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            id="chat-panel-expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? 'Exit full screen' : 'Expand to full screen'}
            aria-label={isExpanded ? 'Exit full screen' : 'Expand to full screen'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 id="chat-panel-title" className="font-semibold text-gray-900">
            {activeMode === 'chat' ? 'Chat Assistant' : 'What would you like to do?'}
          </h3>
        </div>

        <button
          id="chat-panel-close-button"
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          title="Close chat"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div id="chat-panel-content" className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeMode === 'branches' ? (
          /* Branch Selection Mode */
          <div id="chat-branch-mode" className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-chat">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Loading options...</div>
            ) : (
              <BranchList
                branches={branches}
                onBranchClick={handleBranchClick}
                disabled={isLoading}
                emptyMessage="No options available for this step"
              />
            )}

            {/* Message History (if any) */}
            {messages.length > 0 && (
              <div id="chat-recent-activity" className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
                <div id="chat-message-history" className="space-y-2">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`p-2 rounded text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-blue-900 ml-4'
                          : message.role === 'assistant'
                          ? 'bg-gray-100 text-gray-900 mr-4'
                          : 'bg-yellow-50 text-yellow-900 text-center'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Chat Mode */
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {/* Messages */}
            <div id="chat-messages-container" className="h-full overflow-y-auto p-4 pb-28 space-y-3 scrollbar-chat">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      rounded-lg p-3 max-w-[80%]
                      ${message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'assistant'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-yellow-50 text-yellow-900'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div id="chat-input-area" className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
              <div className="flex space-x-2 items-end">
                <textarea
                  id="chat-message-input"
                  ref={inputRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // When checkbox is CHECKED (shiftEnterToSubmit = false): Enter sends, Shift+Enter creates new line
                      // When checkbox is UNCHECKED (shiftEnterToSubmit = true): Shift+Enter sends, Enter creates new line

                      if (shiftEnterToSubmit) {
                        // Inverted mode: Shift+Enter sends
                        if (e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        // Enter without shift: do nothing (allow newline)
                      } else {
                        // Normal mode: Enter sends
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                        // Shift+Enter: do nothing (allow newline)
                      }
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={isLoading}
                  aria-label="Type your message"
                />
                <button
                  id="chat-send-button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  id="chat-back-to-branches-button"
                  onClick={handleBackToBranches}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  aria-label="Back to options"
                >
                  ← Back to options
                </button>

                {/* Enter key preference toggle */}
                <label id="chat-enter-preference" className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    id="chat-enter-preference-checkbox"
                    type="checkbox"
                    checked={!shiftEnterToSubmit}
                    onChange={(e) => updatePreference('chat_shift_enter_to_submit', !e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    aria-label="Toggle Enter to send preference"
                  />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors select-none">
                    ⏎ Enter to send
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
