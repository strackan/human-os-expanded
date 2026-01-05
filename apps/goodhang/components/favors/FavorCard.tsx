'use client';

import Link from 'next/link';
import { TokenCard } from './TokenCard';
import type { FavorWithParties, FavorStatus } from '@/lib/types/database';

interface FavorCardProps {
  favor: FavorWithParties;
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onWithdraw?: () => void;
  onMarkComplete?: () => void;
  onConfirm?: () => void;
  onRequestRevision?: () => void;
  isLoading?: boolean;
  /** Show simplified card that links to detail page */
  compact?: boolean;
}

const STATUS_LABELS: Record<FavorStatus, { label: string; color: string }> = {
  asked: { label: 'Pending', color: 'text-neon-cyan border-neon-cyan' },
  negotiating: { label: 'Negotiating', color: 'text-neon-purple border-neon-purple' },
  accepted: { label: 'In Progress', color: 'text-neon-magenta border-neon-magenta' },
  pending_confirmation: { label: 'Awaiting Confirmation', color: 'text-neon-gold border-neon-gold' },
  completed: { label: 'Completed', color: 'text-green-400 border-green-400' },
  declined: { label: 'Declined', color: 'text-red-400 border-red-400' },
  withdrawn: { label: 'Withdrawn', color: 'text-foreground-dim border-foreground-dim' },
  disputed: { label: 'Disputed', color: 'text-orange-400 border-orange-400' },
};

export function FavorCard({
  favor,
  currentUserId,
  onAccept,
  onDecline,
  onWithdraw,
  onMarkComplete,
  onConfirm,
  onRequestRevision,
  isLoading = false,
  compact = false,
}: FavorCardProps) {
  const isRequester = favor.requester_id === currentUserId;
  const isRecipient = favor.recipient_id === currentUserId;
  const otherParty = isRequester ? favor.recipient : favor.requester;
  const statusInfo = STATUS_LABELS[favor.status];

  // Format timestamp
  const createdAt = new Date(favor.created_at);
  const timeAgo = getTimeAgo(createdAt);

  // Determine if this is a negotiation in progress
  const isNegotiating = favor.status === 'asked' || favor.status === 'negotiating';

  return (
    <div className="border-2 border-foreground-dim/30 hover:border-neon-cyan/50 bg-background-lighter p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Token Preview */}
          {favor.token && (
            <TokenCard token={favor.token} size="sm" showName={false} />
          )}

          <div>
            <div className="font-mono text-sm text-foreground-dim">
              {isRequester ? 'Request to' : 'Request from'}
            </div>
            <div className="font-mono text-lg text-neon-cyan font-bold">
              {otherParty?.name || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 border ${statusInfo.color} font-mono text-xs uppercase`}>
          {statusInfo.label}
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="font-mono text-sm text-foreground mb-2">The favor:</div>
        <div className="font-mono text-foreground-dim bg-background p-3 rounded">
          {favor.description}
        </div>
      </div>

      {/* Completion Note (if exists) */}
      {favor.completion_note && (
        <div className="mb-4">
          <div className="font-mono text-sm text-foreground mb-2">Completion note:</div>
          <div className="font-mono text-foreground-dim bg-background p-3 rounded border-l-2 border-neon-gold">
            {favor.completion_note}
          </div>
        </div>
      )}

      {/* Revision Request (if exists) */}
      {favor.revision_request && (
        <div className="mb-4">
          <div className="font-mono text-sm text-foreground mb-2">Revision requested:</div>
          <div className="font-mono text-foreground-dim bg-background p-3 rounded border-l-2 border-neon-magenta">
            {favor.revision_request}
          </div>
        </div>
      )}

      {/* Token Name */}
      {favor.token && (
        <div className="mb-4 font-mono text-xs text-foreground-dim">
          Token: <span className="text-neon-gold">{favor.token.name}</span>
        </div>
      )}

      {/* Timestamp */}
      <div className="mb-4 font-mono text-xs text-foreground-dim/50">
        {timeAgo}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-foreground-dim/20">
        {/* Negotiation Link - Primary action for asked/negotiating states */}
        {isNegotiating && (
          <Link
            href={`/favors/${favor.id}`}
            className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan/30 transition-colors"
          >
            {favor.status === 'negotiating' ? 'View Negotiation' : 'Respond'}
          </Link>
        )}

        {/* Compact mode: just show the link */}
        {!compact && (
          <>
            {/* Recipient actions for non-negotiating states */}
            {isRecipient && favor.status === 'accepted' && (
              <button
                onClick={onMarkComplete}
                disabled={isLoading}
                className="px-4 py-2 bg-neon-gold/20 border border-neon-gold text-neon-gold font-mono text-sm hover:bg-neon-gold/30 transition-colors disabled:opacity-50"
              >
                Mark Complete
              </button>
            )}

            {/* Requester actions */}
            {isRequester && favor.status === 'pending_confirmation' && (
              <>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500/20 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                >
                  Confirm Complete
                </button>
                <button
                  onClick={onRequestRevision}
                  disabled={isLoading}
                  className="px-4 py-2 bg-neon-magenta/20 border border-neon-magenta text-neon-magenta font-mono text-sm hover:bg-neon-magenta/30 transition-colors disabled:opacity-50"
                >
                  Request Revision
                </button>
              </>
            )}

            {/* Legacy actions - keeping for backward compatibility but prefer negotiation flow */}
            {!isNegotiating && isRecipient && favor.status === 'asked' && onAccept && (
              <>
                <button
                  onClick={onAccept}
                  disabled={isLoading}
                  className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan/30 transition-colors disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={onDecline}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-400 font-mono text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}

            {isRequester && isNegotiating && onWithdraw && (
              <button
                onClick={onWithdraw}
                disabled={isLoading}
                className="px-4 py-2 bg-foreground-dim/20 border border-foreground-dim text-foreground-dim font-mono text-sm hover:bg-foreground-dim/30 transition-colors disabled:opacity-50"
              >
                Withdraw
              </button>
            )}
          </>
        )}

        {/* View Details link for completed/terminal states */}
        {!isNegotiating && (
          <Link
            href={`/favors/${favor.id}`}
            className="px-4 py-2 border border-foreground-dim/50 text-foreground-dim font-mono text-sm hover:border-foreground-dim hover:text-foreground transition-colors"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
