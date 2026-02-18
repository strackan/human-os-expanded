'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductionLayout } from '@/components/founders/production/ProductionLayout';
import { ProductionChat } from '@/components/founders/production/ProductionChat';
import { useChatState } from '@/lib/founders/hooks/use-chat-state';
import { sendStreamingMessage, createStreamingHookCallbacks } from '@/lib/founders/chat-api';
import { useFoundersAuth } from '@/lib/founders/auth-context';
import type { CompleteEvent } from '@/lib/founders/streaming';
import type { ProductionMode, DoGateResult, ClarificationOption, ProductionMetadata } from '@/lib/founders/types';

export default function ProductionPage() {
  const { token, status } = useFoundersAuth();

  const [sessionId] = useState(() => crypto.randomUUID());
  const [mode, setMode] = useState<ProductionMode>('default');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [sessionDuration, setSessionDuration] = useState('0m');
  const [initialized, setInitialized] = useState(false);
  const [lastDoGateResult, setLastDoGateResult] = useState<DoGateResult | null>(null);
  const [clarificationOptions, setClarificationOptions] = useState<ClarificationOption[] | null>(null);

  const entitySlug = status?.contexts?.active || 'user';
  const chatState = useChatState();
  const { messages, inputValue, isLoading, isStreaming, messagesEndRef, setInputValue, addUserMessage } = chatState;
  const abortRef = useRef<AbortController | null>(null);

  // Session duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const hours = Math.floor(minutes / 60);
      setSessionDuration(hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`);
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    setLastDoGateResult(null);
    setClarificationOptions(null);
    if (messageText !== '__init__') { addUserMessage(messageText); setInputValue(''); }
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const callbacks = createStreamingHookCallbacks(
      { addStreamingPlaceholder: chatState.addStreamingPlaceholder, appendToLastAssistantMessage: chatState.appendToLastAssistantMessage, finalizeStreamingMessage: chatState.finalizeStreamingMessage, setIsStreaming: chatState.setIsStreaming, setIsLoading: chatState.setIsLoading },
      { onComplete: (event: CompleteEvent) => {
          const metadata = event.metadata as ProductionMetadata | undefined;
          if (!metadata) return;
          if (metadata.doGateResult) { setLastDoGateResult(metadata.doGateResult); if (metadata.doGateResult.clarification) setClarificationOptions(metadata.doGateResult.clarification); }
          if (metadata.modeSwitch) setMode(metadata.modeSwitch.to);
        },
      }
    );

    await sendStreamingMessage('production', messageText, messages, { entity_slug: entitySlug, mode, session_id: sessionId }, callbacks, { token: token ?? undefined, signal: abortRef.current.signal });
  }, [isLoading, addUserMessage, setInputValue, chatState, messages, entitySlug, mode, sessionId, token]);

  useEffect(() => { if (!initialized) { setInitialized(true); sendMessage('__init__'); } }, [initialized, sendMessage]);

  const handleSend = useCallback(() => { sendMessage(inputValue); }, [sendMessage, inputValue]);
  const handleQuickAction = useCallback((value: string) => { sendMessage(value); }, [sendMessage]);
  const handleModeChange = useCallback((newMode: ProductionMode) => { setMode(newMode); }, []);
  const handleClarificationSelect = useCallback((option: ClarificationOption) => { setClarificationOptions(null); sendMessage(`I meant ${option.label} (${option.entitySlug})`); }, [sendMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'j': e.preventDefault(); handleModeChange(mode === 'journal' ? 'default' : 'journal'); break;
          case 'b': e.preventDefault(); handleModeChange(mode === 'brainstorm' ? 'default' : 'brainstorm'); break;
          case '/': e.preventDefault(); handleModeChange(mode === 'search' ? 'default' : 'search'); break;
          case '\\': e.preventDefault(); setSidebarCollapsed(prev => !prev); break;
        }
      }
      if (e.key === 'Escape' && mode !== 'default') handleModeChange('default');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleModeChange]);

  return (
    <ProductionLayout mode={mode} onModeChange={handleModeChange} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(prev => !prev)} sessionDuration={sessionDuration}>
      <ProductionChat messages={messages} inputValue={inputValue} onInputChange={setInputValue} onSend={handleSend} isLoading={isLoading} isStreaming={isStreaming} mode={mode} onQuickAction={handleQuickAction} messagesEndRef={messagesEndRef} lastDoGateResult={lastDoGateResult} clarificationOptions={clarificationOptions} onClarificationSelect={handleClarificationSelect} />
    </ProductionLayout>
  );
}
