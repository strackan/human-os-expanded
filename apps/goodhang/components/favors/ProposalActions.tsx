'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { FavorProposalWithProposer, FavorWithDetails } from '@/lib/types/database';

interface ProposalActionsProps {
  favor: FavorWithDetails;
  currentUserId: string;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onCounter: (description: string) => Promise<void>;
}

/**
 * ProposalActions - Shows current proposal with action buttons
 * Like Fiverr's order summary where both parties agree on terms
 */
export function ProposalActions({
  favor,
  currentUserId,
  onAccept,
  onDecline,
  onCounter,
}: ProposalActionsProps) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterDescription, setCounterDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentProposal = favor.current_proposal as FavorProposalWithProposer | undefined;
  const isMyTurn = currentProposal?.awaiting_response_from === currentUserId;
  const isMyProposal = currentProposal?.proposer_id === currentUserId;

  // Determine the other party
  const otherParty = favor.requester_id === currentUserId
    ? favor.recipient
    : favor.requester;

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await onAccept();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await onDecline();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCounter = async () => {
    if (!counterDescription.trim()) return;
    setIsSubmitting(true);
    try {
      await onCounter(counterDescription.trim());
      setCounterDescription('');
      setShowCounterForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // No pending proposal
  if (!currentProposal || currentProposal.status !== 'pending') {
    return null;
  }

  return (
    <div className="border-2 border-neon-cyan/30 bg-neon-cyan/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-lg font-bold text-neon-cyan">
          {isMyTurn ? 'Your Turn to Respond' : 'Waiting for Response'}
        </h3>
        <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-mono text-xs rounded">
          Pending
        </span>
      </div>

      {/* Current Proposal Summary */}
      <div className="bg-background/50 border border-foreground-dim/20 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center overflow-hidden">
            {currentProposal.proposer?.avatar_url ? (
              <Image
                src={currentProposal.proposer.avatar_url}
                alt={currentProposal.proposer.name || 'User'}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-neon-purple font-mono text-xs">
                {currentProposal.proposer?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <span className="font-mono text-sm text-foreground">
            {isMyProposal ? 'You proposed:' : `${currentProposal.proposer?.name || 'They'} proposed:`}
          </span>
        </div>

        <p className="font-mono text-foreground whitespace-pre-wrap pl-10">
          &ldquo;{currentProposal.description}&rdquo;
        </p>
      </div>

      {/* Action Buttons - Only show if it's my turn */}
      {isMyTurn ? (
        <div className="space-y-4">
          {!showCounterForm ? (
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-green-500/20 border-2 border-green-500 text-green-400 font-mono text-sm hover:bg-green-500 hover:text-background transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Accept Terms'}
              </button>
              <button
                onClick={() => setShowCounterForm(true)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan hover:text-background transition-all disabled:opacity-50"
              >
                Counter Propose
              </button>
              <button
                onClick={handleDecline}
                disabled={isSubmitting}
                className="py-3 px-6 bg-red-500/20 border-2 border-red-500/50 text-red-400 font-mono text-sm hover:border-red-500 transition-all disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block font-mono text-sm text-foreground-dim">
                Your counter-proposal:
              </label>
              <textarea
                value={counterDescription}
                onChange={(e) => setCounterDescription(e.target.value)}
                placeholder="Describe what you can offer instead..."
                rows={4}
                className="w-full px-4 py-3 bg-background border-2 border-neon-cyan/30 text-foreground font-mono text-sm placeholder-foreground-dim/50 focus:border-neon-cyan focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCounter}
                  disabled={isSubmitting || !counterDescription.trim()}
                  className="flex-1 py-3 bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan hover:text-background transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Counter-Proposal'}
                </button>
                <button
                  onClick={() => {
                    setShowCounterForm(false);
                    setCounterDescription('');
                  }}
                  disabled={isSubmitting}
                  className="py-3 px-6 border-2 border-foreground-dim/30 text-foreground-dim font-mono text-sm hover:border-foreground-dim transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="font-mono text-sm text-foreground-dim">
            Waiting for {otherParty?.name || 'the other party'} to respond...
          </p>
          <p className="font-mono text-xs text-foreground-dim/50 mt-2">
            They can accept your terms, decline, or make a counter-proposal
          </p>
        </div>
      )}
    </div>
  );
}
