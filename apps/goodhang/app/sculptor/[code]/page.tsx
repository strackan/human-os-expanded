'use client';

/**
 * Sculptor Session Page
 *
 * Auto-validates access code from URL and displays the appropriate view:
 * - Active session: Shows SculptorChat
 * - Completed session: Shows CompletedSessionLoop
 * - Invalid code: Shows error message
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import SculptorChat from '@/components/sculptor/SculptorChat';
import CompletedSessionLoop from '@/components/sculptor/CompletedSessionLoop';

interface SessionInfo {
  id: string;
  access_code: string;
  entity_name: string | null;
  status: 'active' | 'revoked' | 'completed';
  template: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
  } | null;
}

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
}

type PageState = 'loading' | 'active' | 'completed' | 'invalid' | 'error';

export default function SculptorSessionPage() {
  const params = useParams();
  const code = params.code as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [conversationHistory, setConversationHistory] = useState<StoredMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    validateSession();
  }, [code]);

  const validateSession = async () => {
    try {
      const response = await fetch('/api/sculptor/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPageState('invalid');
        setErrorMessage(data.error || 'Invalid access code');
        return;
      }

      setSession(data.session);

      // Fetch conversation history
      const historyResponse = await fetch(`/api/sculptor/sessions/${data.session.id}/messages`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.conversation_history?.length > 0) {
          setConversationHistory(historyData.conversation_history);
        }
      }

      if (data.session.status === 'completed') {
        setPageState('completed');
      } else if (data.session.status === 'revoked') {
        setPageState('invalid');
        setErrorMessage('This session has been revoked');
      } else {
        setPageState('active');
      }
    } catch (err) {
      console.error('Error validating session:', err);
      setPageState('error');
      setErrorMessage('Failed to connect. Please try again.');
    }
  };

  const handleSessionComplete = () => {
    setPageState('completed');
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Preparing your session...</p>
        </div>
      </div>
    );
  }

  // Invalid or error state
  if (pageState === 'invalid' || pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {pageState === 'invalid' ? 'Invalid Session' : 'Connection Error'}
          </h1>
          <p className="text-slate-400 mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Completed state
  if (pageState === 'completed') {
    return (
      <div className="min-h-screen">
        <CompletedSessionLoop entityName={session?.entity_name || 'You'} />
      </div>
    );
  }

  // Active session
  return (
    <div className="min-h-screen flex flex-col">
      <SculptorChat
        sessionId={session!.id}
        entityName={session?.entity_name ?? undefined}
        templateName={session?.template?.name ?? 'The Sculptor'}
        initialMessages={conversationHistory}
        onSessionComplete={handleSessionComplete}
      />
    </div>
  );
}
