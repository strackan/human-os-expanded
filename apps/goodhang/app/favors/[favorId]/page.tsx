'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TokenCard } from '@/components/favors/TokenCard';
import { NegotiationThread } from '@/components/favors/NegotiationThread';
import { ProposalActions } from '@/components/favors/ProposalActions';
import type { FavorWithDetails } from '@/lib/types/database';

/**
 * Get status display info
 */
function getStatusInfo(status: string): { label: string; className: string; description: string } {
  switch (status) {
    case 'asked':
      return {
        label: 'Pending',
        className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
        description: 'Waiting for recipient to respond',
      };
    case 'negotiating':
      return {
        label: 'Negotiating',
        className: 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan',
        description: 'Both parties are discussing terms',
      };
    case 'accepted':
      return {
        label: 'Accepted',
        className: 'bg-green-500/20 border-green-500/50 text-green-400',
        description: 'Terms agreed - favor in progress',
      };
    case 'pending_confirmation':
      return {
        label: 'Pending Confirmation',
        className: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
        description: 'Recipient marked complete - awaiting confirmation',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-green-500/20 border-green-500/50 text-green-400',
        description: 'Favor completed and token transferred',
      };
    case 'declined':
      return {
        label: 'Declined',
        className: 'bg-red-500/20 border-red-500/50 text-red-400',
        description: 'Request was declined',
      };
    case 'withdrawn':
      return {
        label: 'Withdrawn',
        className: 'bg-gray-500/20 border-gray-500/50 text-gray-400',
        description: 'Request was withdrawn by requester',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-500/20 border-gray-500/50 text-gray-400',
        description: '',
      };
  }
}

export default function FavorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const favorId = params.favorId as string;

  const supabase = useMemo(() => createClient(), []);

  const [favor, setFavor] = useState<FavorWithDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadFavor = useCallback(async () => {
    try {
      const response = await fetch(`/api/favors/${favorId}/details`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load favor');
      }
      const data = await response.json();
      setFavor(data.favor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favor');
    }
  }, [favorId]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);
      await loadFavor();
      setLoading(false);
    }
    init();
  }, [supabase, router, loadFavor]);

  const handleAccept = async () => {
    setActionError(null);
    try {
      const response = await fetch(`/api/favors/${favorId}/accept-proposal`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept proposal');
      }
      await loadFavor();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to accept');
    }
  };

  const handleDecline = async () => {
    setActionError(null);
    try {
      const response = await fetch(`/api/favors/${favorId}/decline-proposal`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to decline proposal');
      }
      await loadFavor();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to decline');
    }
  };

  const handleCounter = async (description: string) => {
    setActionError(null);
    try {
      const response = await fetch(`/api/favors/${favorId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit counter-proposal');
      }
      await loadFavor();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to counter');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-foreground-dim">Loading...</div>
      </div>
    );
  }

  if (error || !favor || !currentUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-red-400 mb-4">{error || 'Favor not found'}</p>
          <Link href="/favors" className="font-mono text-neon-cyan hover:underline">
            ← Back to Favors
          </Link>
        </div>
      </div>
    );
  }

  const isRequester = favor.requester_id === currentUserId;
  const otherParty = isRequester ? favor.recipient : favor.requester;
  const statusInfo = getStatusInfo(favor.status);
  const isNegotiating = favor.status === 'asked' || favor.status === 'negotiating';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/favors"
          className="inline-block font-mono text-sm text-foreground-dim hover:text-neon-cyan mb-6"
        >
          ← Back to Favors
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-mono text-2xl font-bold text-foreground mb-2">
              Favor {isRequester ? 'to' : 'from'} {otherParty?.name || 'Unknown'}
            </h1>
            <p className="font-mono text-sm text-foreground-dim">
              {statusInfo.description}
            </p>
          </div>
          <span className={`px-4 py-2 border rounded font-mono text-sm ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Token being offered */}
        {favor.token && (
          <div className="border-2 border-neon-gold/30 bg-neon-gold/5 p-6 mb-6">
            <h3 className="font-mono text-sm text-foreground-dim uppercase tracking-wider mb-4">
              Token Being Offered
            </h3>
            <div className="flex items-center gap-4">
              <TokenCard token={favor.token} size="md" showName showOwner={false} />
              <div>
                <p className="font-mono text-sm text-foreground-dim">
                  This token will transfer to {isRequester ? otherParty?.name : 'you'} upon completion.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Error */}
        {actionError && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 mb-6">
            <p className="font-mono text-sm text-red-400">{actionError}</p>
          </div>
        )}

        {/* Current Proposal Actions (if negotiating) */}
        {isNegotiating && (
          <div className="mb-8">
            <ProposalActions
              favor={favor}
              currentUserId={currentUserId}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCounter={handleCounter}
            />
          </div>
        )}

        {/* Agreed Terms (if accepted or later) */}
        {!isNegotiating && favor.status !== 'declined' && favor.status !== 'withdrawn' && (
          <div className="border-2 border-green-500/30 bg-green-500/5 p-6 mb-8">
            <h3 className="font-mono text-sm text-green-400 uppercase tracking-wider mb-3">
              Agreed Terms
            </h3>
            <p className="font-mono text-foreground whitespace-pre-wrap">
              &ldquo;{favor.description}&rdquo;
            </p>
          </div>
        )}

        {/* Negotiation Thread */}
        {favor.proposals && favor.proposals.length > 0 && (
          <div className="mb-8">
            <NegotiationThread
              proposals={favor.proposals}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Withdraw/Cancel Actions */}
        {isNegotiating && isRequester && (
          <div className="border-t border-foreground-dim/20 pt-6 mt-8">
            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to withdraw this favor request?')) return;
                try {
                  const response = await fetch(`/api/favors/${favorId}/withdraw`, {
                    method: 'POST',
                  });
                  if (response.ok) {
                    router.push('/favors');
                  }
                } catch {
                  // Ignore
                }
              }}
              className="font-mono text-sm text-red-400/70 hover:text-red-400"
            >
              Withdraw Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
