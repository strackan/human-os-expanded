'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingChat, { type ChatMessage } from '@/components/onboarding/OnboardingChat';
import OnboardingOptionCards from '@/components/onboarding/OnboardingOptionCards';
import { useAuth } from '@/components/auth/AuthProvider';

type OnboardingPhase = 'loading' | 'chat' | 'options' | 'completed';

export default function OnboardingClient() {
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase] = useState<OnboardingPhase>('loading');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initCalled = useRef(false);
  const debugRef = useRef({ sseEvents: 0, lastEvent: 'none', rawChunks: 0 });
  const [debugTick, setDebugTick] = useState(0);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  // =========================================================================
  // SSE helper
  // =========================================================================
  const consumeSSE = useCallback(
    async (
      response: Response,
      onToken: (content: string) => void,
      onComplete: (data: { phase: number; shouldTransition: boolean }) => void
    ) => {
      debugRef.current = { sseEvents: 0, lastEvent: 'starting', rawChunks: 0 };
      setDebugTick((t) => t + 1);

      const reader = response.body?.getReader();
      if (!reader) {
        debugRef.current.lastEvent = 'NO_READER';
        setDebugTick((t) => t + 1);
        setIsTyping(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let gotComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        debugRef.current.rawChunks++;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            debugRef.current.sseEvents++;
            debugRef.current.lastEvent = data.type;
            setDebugTick((t) => t + 1);

            if (data.type === 'token') {
              onToken(data.content);
            } else if (data.type === 'complete') {
              gotComplete = true;
              onComplete(data);
            } else if (data.type === 'error') {
              setError(data.message);
              setIsTyping(false);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      debugRef.current.lastEvent = gotComplete ? 'DONE' : 'ENDED_NO_COMPLETE';
      setDebugTick((t) => t + 1);

      if (!gotComplete) {
        setIsTyping(false);
      }
    },
    []
  );

  // =========================================================================
  // Initialize session
  // =========================================================================
  useEffect(() => {
    if (!user || initCalled.current) return;
    initCalled.current = true;

    (async () => {
      try {
        // Check for existing session
        const sessionRes = await fetch('/api/onboarding/session');
        const sessionData = await sessionRes.json();

        if (sessionData.hasCompleted) {
          router.replace('/dashboard');
          return;
        }

        let session = sessionData.session;

        // Create session if none exists
        if (!session) {
          const createRes = await fetch('/api/onboarding/session', { method: 'POST' });
          const createData = await createRes.json();
          session = createData.session;
        }

        if (!session?.id) {
          setError('Failed to create onboarding session');
          return;
        }

        setSessionId(session.id);

        // Restore existing conversation (skip system trigger messages)
        if (session.conversation_log?.length > 0) {
          const restored: ChatMessage[] = session.conversation_log
            .filter((entry: { role: string; content: string }) =>
              !(entry.role === 'user' && entry.content.startsWith('[System:'))
            )
            .map((entry: { role: string; content: string }, i: number) => ({
              role: entry.role as 'user' | 'assistant',
              content: entry.content,
              id: `restored-${i}`,
            }));
          setMessages(restored);

          // If already transitioned to options phase
          if (session.current_phase >= 3) {
            setPhase('options');
            return;
          }

          setPhase('chat');
          return;
        }

        // Fresh session — trigger sculptor's opening
        setPhase('chat');
        setIsTyping(true);

        const streamingMsgId = `assistant-${Date.now()}`;
        let streamedText = '';

        setMessages([]);

        const initRes = await fetch('/api/onboarding/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id }),
        });

        if (!initRes.ok) {
          setError('Failed to start conversation');
          setIsTyping(false);
          return;
        }

        await consumeSSE(
          initRes,
          (token) => {
            streamedText += token;
            setMessages([{ role: 'assistant', content: streamedText, id: streamingMsgId }]);
          },
          () => {
            setIsTyping(false);
          }
        );
      } catch (err) {
        console.error('[OnboardingClient] init error:', err);
        setError('Something went wrong. Please refresh.');
      }
    })();
  }, [user, router, consumeSSE]);

  // =========================================================================
  // Send message
  // =========================================================================
  const handleSendMessage = useCallback(
    async (message: string) => {
      console.log('[handleSendMessage] called, sessionId:', sessionId, 'isTyping:', isTyping);
      if (!sessionId || isTyping) return;

      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [...prev, { role: 'user', content: message, id: userMsgId }]);
      setIsTyping(true);
      setError(null);

      try {
        const res = await fetch('/api/onboarding/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId }),
        });

        if (!res.ok) {
          setError('Failed to send message. Please try again.');
          setIsTyping(false);
          return;
        }

        const data = await res.json();
        const fullContent: string = data.content || '';

        debugRef.current = { sseEvents: 0, lastEvent: 'json', rawChunks: 0 };
        setDebugTick((t) => t + 1);

        if (!fullContent) {
          setIsTyping(false);
          return;
        }

        // Fake-stream the response with local typing animation
        const assistantMsgId = `assistant-${Date.now()}`;
        setMessages((prev) => [...prev, { role: 'assistant', content: '', id: assistantMsgId }]);

        const chunks = fullContent.match(/.{1,8}/g) || [fullContent];
        let revealed = '';

        for (let i = 0; i < chunks.length; i++) {
          revealed += chunks[i];
          const snapshot = revealed;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: snapshot } : msg
            )
          );
          // Small delay between chunks for typing effect
          if (i < chunks.length - 1) {
            await new Promise((r) => setTimeout(r, 30));
          }
        }

        setIsTyping(false);
        if (data.shouldTransition) {
          setPhase('options');
        }
      } catch (err) {
        console.error('[OnboardingClient] message error:', err);
        setError('Failed to send message. Please try again.');
        setIsTyping(false);
      }
    },
    [sessionId, isTyping, consumeSSE]
  );

  // =========================================================================
  // Option selection
  // =========================================================================
  const handleOptionSelect = useCallback(
    async (option: 'A' | 'B' | 'C' | 'D') => {
      if (!sessionId) return;
      setSelectedOption(option);

      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, optionSelected: option }),
        });
      } catch (err) {
        console.error('[OnboardingClient] complete error:', err);
      }

      setPhase('completed');
    },
    [sessionId]
  );

  // =========================================================================
  // Reset — delete session and reload fresh
  // =========================================================================
  const handleReset = useCallback(async () => {
    try {
      await fetch('/api/onboarding/reset', { method: 'POST' });
    } catch (err) {
      console.error('[OnboardingClient] reset error:', err);
    }
    window.location.reload();
  }, []);

  // =========================================================================
  // Skip
  // =========================================================================
  const handleSkip = useCallback(async () => {
    if (!sessionId) {
      router.replace('/dashboard');
      return;
    }

    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, skip: true }),
      });
    } catch (err) {
      console.error('[OnboardingClient] skip error:', err);
    }

    router.replace('/dashboard');
  }, [sessionId, router]);

  // =========================================================================
  // Render
  // =========================================================================
  if (phase === 'loading') {
    return (
      <div id="onboarding-loading">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div id="onboarding-page">
      <OnboardingHeader userName={userName} onSkip={handleSkip} onReset={handleReset} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '42rem', margin: '0 auto', width: '100%' }}>
        {/* Chat area */}
        <div style={{ flex: 1 }}>
          <OnboardingChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            disabled={phase === 'options' || phase === 'completed'}
          />
        </div>

        {/* Option cards */}
        {phase === 'options' && (
          <OnboardingOptionCards
            onSelect={handleOptionSelect}
            disabled={!!selectedOption}
          />
        )}

        {/* Completed stub */}
        {phase === 'completed' && selectedOption && (
          <div className="completed-section">
            <p>
              {selectedOption === 'D'
                ? "You got it — let's dive in."
                : "Great choice! We'll set that up for you on the dashboard."}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="error-section">
            <p>{error}</p>
            <button onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Debug strip — remove after fixing */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a2e', color: '#0f0', fontFamily: 'monospace', fontSize: '11px', padding: '4px 8px', zIndex: 9999, display: 'flex', gap: '16px' }}>
          <span>phase={phase}</span>
          <span>sid={sessionId ? sessionId.slice(0, 8) : 'null'}</span>
          <span>typing={String(isTyping)}</span>
          <span>msgs={messages.length}</span>
          <span>sse={debugRef.current.sseEvents}</span>
          <span>chunks={debugRef.current.rawChunks}</span>
          <span>last={debugRef.current.lastEvent}</span>
          <span>err={error || 'none'}</span>
          <span style={{ display: 'none' }}>{debugTick}</span>
        </div>
      </div>
    </div>
  );
}
