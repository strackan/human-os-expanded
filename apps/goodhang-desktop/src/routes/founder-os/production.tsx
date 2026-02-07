/**
 * Production Mode Page
 *
 * Main production chat interface for Founder OS.
 * Wires together: ProductionLayout, ProductionChat, streaming API,
 * mode system, keyboard shortcuts, and session management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionLayout } from '@/components/production/ProductionLayout';
import { ProductionChat } from '@/components/production/ProductionChat';
import { useChatState } from '@/lib/hooks/useChatState';
import {
  sendStreamingMessage,
  createStreamingHookCallbacks,
} from '@/lib/api/chat';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
import type { CompleteEvent } from '@/lib/api/streaming';
import type {
  ProductionMode,
  DoGateResult,
  ClarificationOption,
  ProductionMetadata,
} from '@/lib/types/production';

export default function ProductionPage() {
  const { token } = useAuthStore();
  const { status } = useUserStatusStore();

  // Session state
  const [sessionId] = useState(() => crypto.randomUUID());
  const [mode, setMode] = useState<ProductionMode>('default');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [sessionDuration, setSessionDuration] = useState('0m');
  const [initialized, setInitialized] = useState(false);

  // do() gate state
  const [lastDoGateResult, setLastDoGateResult] = useState<DoGateResult | null>(null);
  const [clarificationOptions, setClarificationOptions] = useState<ClarificationOption[] | null>(null);

  // Entity slug from user status
  const entitySlug = status?.contexts?.active || 'user';

  // Chat state
  const chatState = useChatState();
  const {
    messages,
    inputValue,
    isLoading,
    isStreaming,
    messagesEndRef,
    setInputValue,
    addUserMessage,
  } = chatState;

  // Abort controller ref
  const abortRef = useRef<AbortController | null>(null);

  // ==========================================================================
  // SESSION DURATION TIMER
  // ==========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        setSessionDuration(`${hours}h ${minutes % 60}m`);
      } else {
        setSessionDuration(`${minutes}m`);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // ==========================================================================
  // SEND MESSAGE
  // ==========================================================================
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      // Clear previous do() gate state
      setLastDoGateResult(null);
      setClarificationOptions(null);

      // Add user message (unless it's __init__)
      if (messageText !== '__init__') {
        addUserMessage(messageText);
        setInputValue('');
      }

      // Abort previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const callbacks = createStreamingHookCallbacks(
        {
          addStreamingPlaceholder: chatState.addStreamingPlaceholder,
          appendToLastAssistantMessage: chatState.appendToLastAssistantMessage,
          finalizeStreamingMessage: chatState.finalizeStreamingMessage,
          setIsStreaming: chatState.setIsStreaming,
          setIsLoading: chatState.setIsLoading,
        },
        {
          onComplete: (event: CompleteEvent) => {
            const metadata = event.metadata as ProductionMetadata | undefined;
            if (!metadata) return;

            // Update do() gate result
            if (metadata.doGateResult) {
              setLastDoGateResult(metadata.doGateResult);
              if (metadata.doGateResult.clarification) {
                setClarificationOptions(metadata.doGateResult.clarification);
              }
            }

            // Handle NLP mode switch
            if (metadata.modeSwitch) {
              setMode(metadata.modeSwitch.to);
            }
          },
        }
      );

      await sendStreamingMessage(
        'production',
        messageText,
        messages,
        {
          entity_slug: entitySlug,
          mode,
          session_id: sessionId,
        },
        callbacks,
        {
          token,
          signal: abortRef.current.signal,
        }
      );
    },
    [
      isLoading,
      addUserMessage,
      setInputValue,
      chatState,
      messages,
      entitySlug,
      mode,
      sessionId,
      token,
    ]
  );

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      sendMessage('__init__');
    }
  }, [initialized, sendMessage]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleSend = useCallback(() => {
    sendMessage(inputValue);
  }, [sendMessage, inputValue]);

  const handleQuickAction = useCallback(
    (value: string) => {
      sendMessage(value);
    },
    [sendMessage]
  );

  const handleModeChange = useCallback(
    (newMode: ProductionMode) => {
      setMode(newMode);
      // Optionally send a system-like message about the mode change
      if (newMode !== 'default') {
        // Don't send a message, just update the mode — the next user message
        // will use the new mode in the system prompt
      }
    },
    []
  );

  const handleClarificationSelect = useCallback(
    (option: ClarificationOption) => {
      setClarificationOptions(null);
      sendMessage(`I meant ${option.label} (${option.entitySlug})`);
    },
    [sendMessage]
  );

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + key combos
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'j':
            e.preventDefault();
            handleModeChange(mode === 'journal' ? 'default' : 'journal');
            break;
          case 'b':
            e.preventDefault();
            handleModeChange(mode === 'brainstorm' ? 'default' : 'brainstorm');
            break;
          case '/':
            e.preventDefault();
            handleModeChange(mode === 'search' ? 'default' : 'search');
            break;
          case 't':
            e.preventDefault();
            // Tasks quick action placeholder
            break;
          case '\\':
            e.preventDefault();
            setSidebarCollapsed((prev) => !prev);
            break;
        }
      }

      // Escape exits current mode
      if (e.key === 'Escape' && mode !== 'default') {
        handleModeChange('default');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleModeChange]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <ProductionLayout
      mode={mode}
      onModeChange={handleModeChange}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      sessionDuration={sessionDuration}
    >
      <ProductionChat
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        isLoading={isLoading}
        isStreaming={isStreaming}
        mode={mode}
        onQuickAction={handleQuickAction}
        messagesEndRef={messagesEndRef}
        lastDoGateResult={lastDoGateResult}
        clarificationOptions={clarificationOptions}
        onClarificationSelect={handleClarificationSelect}
      />
    </ProductionLayout>
  );
}
