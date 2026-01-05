'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FavorInbox, FavorOutbox } from '@/components/favors';
import type { FavorWithParties } from '@/lib/types/database';

type TabType = 'inbox' | 'outbox';

export default function FavorsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [incomingFavors, setIncomingFavors] = useState<FavorWithParties[]>([]);
  const [outgoingFavors, setOutgoingFavors] = useState<FavorWithParties[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [incomingRes, outgoingRes, walletRes] = await Promise.all([
        fetch('/api/favors/incoming'),
        fetch('/api/favors/outgoing'),
        fetch('/api/favors/tokens/wallet'),
      ]);

      if (incomingRes.ok) {
        const data = await incomingRes.json();
        setIncomingFavors(data.favors || []);
      }

      if (outgoingRes.ok) {
        const data = await outgoingRes.json();
        setOutgoingFavors(data.favors || []);
        // Get current user ID from the first favor
        if (data.favors?.[0]?.requester_id) {
          setCurrentUserId(data.favors[0].requester_id);
        }
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        setTokenCount(data.count || 0);
        // Also try to get user ID from wallet if not set
        if (!currentUserId && data.tokens?.[0]?.current_owner_id) {
          setCurrentUserId(data.tokens[0].current_owner_id);
        }
      }
    } catch (error) {
      console.error('Error fetching favors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action handlers
  const handleAccept = async (favorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/favors/${favorId}/accept`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error accepting favor:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (favorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/favors/${favorId}/decline`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error declining favor:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (favorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/favors/${favorId}/withdraw`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error withdrawing favor:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async (favorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/favors/${favorId}/complete`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error marking complete:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async (favorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/favors/${favorId}/confirm`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error confirming favor:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (favorId: string, note: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/favors/${favorId}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision_note: note }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error requesting revision:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Count pending items for badges
  const pendingIncoming = incomingFavors.filter((f) => f.status === 'asked').length;
  const pendingConfirmation = outgoingFavors.filter((f) => f.status === 'pending_confirmation').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-foreground-dim/20 rounded w-48" />
            <div className="h-64 bg-foreground-dim/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-mono text-3xl text-neon-cyan font-bold mb-2">
              Favor Tokens
            </h1>
            <p className="font-mono text-foreground-dim text-sm">
              The reciprocity economy
            </p>
          </div>

          <Link
            href="/favors/wallet"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neon-gold/20 border border-neon-gold text-neon-gold font-mono text-sm hover:bg-neon-gold/30 transition-colors"
          >
            <span className="text-lg">🪙</span>
            <span>{tokenCount} {tokenCount === 1 ? 'Token' : 'Tokens'}</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-foreground-dim/30 mb-6">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-6 py-3 font-mono text-sm relative ${
              activeTab === 'inbox'
                ? 'text-neon-cyan'
                : 'text-foreground-dim hover:text-foreground'
            }`}
          >
            Incoming
            {pendingIncoming > 0 && (
              <span className="absolute -top-1 -right-1 bg-neon-cyan text-background text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingIncoming}
              </span>
            )}
            {activeTab === 'inbox' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-6 py-3 font-mono text-sm relative ${
              activeTab === 'outbox'
                ? 'text-neon-magenta'
                : 'text-foreground-dim hover:text-foreground'
            }`}
          >
            Outgoing
            {pendingConfirmation > 0 && (
              <span className="absolute -top-1 -right-1 bg-neon-gold text-background text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingConfirmation}
              </span>
            )}
            {activeTab === 'outbox' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-magenta" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'inbox' && currentUserId && (
          <FavorInbox
            favors={incomingFavors}
            currentUserId={currentUserId}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onMarkComplete={handleMarkComplete}
            isLoading={actionLoading}
          />
        )}

        {activeTab === 'outbox' && currentUserId && (
          <FavorOutbox
            favors={outgoingFavors}
            currentUserId={currentUserId}
            onWithdraw={handleWithdraw}
            onConfirm={handleConfirm}
            onRequestRevision={handleRequestRevision}
            isLoading={actionLoading}
          />
        )}

        {!currentUserId && (
          <div className="text-center py-12">
            <div className="font-mono text-foreground-dim">
              Loading user information...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
