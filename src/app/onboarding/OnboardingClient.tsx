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
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              onToken(data.content);
            } else if (data.type === 'complete') {
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

        const streamingMsgId = `assistant-${Date.now()}`;
        let streamedText = '';

        // Add placeholder for streaming message
        setMessages((prev) => [...prev, { role: 'assistant', content: '', id: streamingMsgId }]);

        await consumeSSE(
          res,
          (token) => {
            streamedText += token;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMsgId ? { ...msg, content: streamedText } : msg
              )
            );
          },
          (data) => {
            setIsTyping(false);
            if (data.shouldTransition) {
              setPhase('options');
            }
          }
        );
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
      </div>
    </div>
  );
}
