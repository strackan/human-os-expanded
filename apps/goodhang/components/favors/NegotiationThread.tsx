'use client';

import Image from 'next/image';
import type { FavorProposalWithProposer } from '@/lib/types/database';

interface NegotiationThreadProps {
  proposals: FavorProposalWithProposer[];
  currentUserId: string;
}

/**
 * Format relative time for proposals
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get status badge styling
 */
function getStatusBadge(status: string): { text: string; className: string } {
  switch (status) {
    case 'pending':
      return { text: 'Awaiting Response', className: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' };
    case 'accepted':
      return { text: 'Accepted', className: 'bg-green-500/20 border-green-500/50 text-green-400' };
    case 'declined':
      return { text: 'Declined', className: 'bg-red-500/20 border-red-500/50 text-red-400' };
    case 'superseded':
      return { text: 'Superseded', className: 'bg-gray-500/20 border-gray-500/50 text-gray-400' };
    default:
      return { text: status, className: 'bg-gray-500/20 border-gray-500/50 text-gray-400' };
  }
}

/**
 * NegotiationThread - Displays the back-and-forth proposals in a conversation-like format
 */
export function NegotiationThread({ proposals, currentUserId }: NegotiationThreadProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center text-foreground-dim font-mono text-sm py-8">
        No proposals yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-foreground-dim uppercase tracking-wider mb-4">
        Negotiation History
      </h3>

      <div className="space-y-3">
        {proposals.map((proposal, index) => {
          const isFromMe = proposal.proposer_id === currentUserId;
          const isLatest = index === proposals.length - 1;
          const statusBadge = getStatusBadge(proposal.status);

          return (
            <div
              key={proposal.id}
              className={`
                relative border-2 p-4 transition-all
                ${isLatest && proposal.status === 'pending'
                  ? 'border-neon-cyan/50 bg-neon-cyan/5'
                  : 'border-foreground-dim/20 bg-background-lighter/50'
                }
                ${proposal.status === 'superseded' ? 'opacity-60' : ''}
              `}
            >
              {/* Proposal number indicator */}
              <div className="absolute -left-3 top-4 w-6 h-6 bg-background border-2 border-neon-purple/50 rounded-full flex items-center justify-center">
                <span className="font-mono text-xs text-neon-purple">{index + 1}</span>
              </div>

              {/* Header: Proposer + Time + Status */}
              <div className="flex items-center justify-between mb-3 ml-4">
                <div className="flex items-center gap-2">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center overflow-hidden">
                    {proposal.proposer?.avatar_url ? (
                      <Image
                        src={proposal.proposer.avatar_url}
                        alt={proposal.proposer.name || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-neon-purple font-mono text-xs">
                        {proposal.proposer?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {isFromMe ? 'You' : proposal.proposer?.name || 'Unknown'}
                    </span>
                    <span className="font-mono text-xs text-foreground-dim ml-2">
                      {index === 0 ? 'proposed' : 'counter-proposed'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border rounded font-mono text-xs ${statusBadge.className}`}>
                    {statusBadge.text}
                  </span>
                  <span className="font-mono text-xs text-foreground-dim">
                    {formatTimeAgo(proposal.created_at)}
                  </span>
                </div>
              </div>

              {/* Proposal content */}
              <div className="ml-4 p-3 bg-background/50 border border-foreground-dim/10 rounded">
                <p className="font-mono text-sm text-foreground whitespace-pre-wrap">
                  &ldquo;{proposal.description}&rdquo;
                </p>
              </div>

              {/* Responded indicator */}
              {proposal.responded_at && proposal.status !== 'pending' && (
                <div className="ml-4 mt-2 font-mono text-xs text-foreground-dim">
                  Responded {formatTimeAgo(proposal.responded_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline connector line */}
      <style jsx>{`
        .space-y-3 > div:not(:last-child)::after {
          content: '';
          position: absolute;
          left: -0.25rem;
          bottom: -0.75rem;
          width: 2px;
          height: 0.75rem;
          background: rgba(119, 0, 204, 0.3);
        }
      `}</style>
    </div>
  );
}
