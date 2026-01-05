'use client';

import { FavorCard } from './FavorCard';
import type { FavorWithParties } from '@/lib/types/database';

interface FavorOutboxProps {
  favors: FavorWithParties[];
  currentUserId: string;
  onWithdraw: (favorId: string) => Promise<void>;
  onConfirm: (favorId: string) => Promise<void>;
  onRequestRevision: (favorId: string, note: string) => Promise<void>;
  isLoading?: boolean;
}

export function FavorOutbox({
  favors,
  currentUserId,
  onWithdraw,
  onConfirm,
  onRequestRevision,
  isLoading = false,
}: FavorOutboxProps) {
  // Group favors by status
  const pendingFavors = favors.filter((f) => f.status === 'asked');
  const activeFavors = favors.filter((f) => ['accepted', 'negotiating'].includes(f.status));
  const awaitingConfirmation = favors.filter((f) => f.status === 'pending_confirmation');
  const completedFavors = favors.filter((f) => ['completed', 'declined', 'withdrawn', 'disputed'].includes(f.status));

  if (favors.length === 0) {
    return (
      <div className="border-2 border-dashed border-foreground-dim/30 rounded-lg p-8 text-center">
        <div className="font-mono text-lg text-foreground-dim mb-2">
          No outgoing favor requests
        </div>
        <div className="font-mono text-sm text-foreground-dim/50">
          Request favors from other members using your tokens
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Awaiting Response */}
      {pendingFavors.length > 0 && (
        <div>
          <h3 className="font-mono text-lg text-neon-cyan mb-4">
            Awaiting Response ({pendingFavors.length})
          </h3>
          <div className="space-y-4">
            {pendingFavors.map((favor) => (
              <FavorCard
                key={favor.id}
                favor={favor}
                currentUserId={currentUserId}
                onWithdraw={() => onWithdraw(favor.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      {activeFavors.length > 0 && (
        <div>
          <h3 className="font-mono text-lg text-neon-magenta mb-4">
            In Progress ({activeFavors.length})
          </h3>
          <div className="space-y-4">
            {activeFavors.map((favor) => (
              <FavorCard
                key={favor.id}
                favor={favor}
                currentUserId={currentUserId}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Needs Confirmation */}
      {awaitingConfirmation.length > 0 && (
        <div>
          <h3 className="font-mono text-lg text-neon-gold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-neon-gold rounded-full animate-pulse" />
            Needs Your Confirmation ({awaitingConfirmation.length})
          </h3>
          <div className="space-y-4">
            {awaitingConfirmation.map((favor) => (
              <FavorCard
                key={favor.id}
                favor={favor}
                currentUserId={currentUserId}
                onConfirm={() => onConfirm(favor.id)}
                onRequestRevision={() => {
                  const note = prompt('What revision do you need?');
                  if (note) onRequestRevision(favor.id, note);
                }}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {completedFavors.length > 0 && (
        <div>
          <h3 className="font-mono text-lg text-foreground-dim mb-4">
            History ({completedFavors.length})
          </h3>
          <div className="space-y-4 opacity-70">
            {completedFavors.map((favor) => (
              <FavorCard
                key={favor.id}
                favor={favor}
                currentUserId={currentUserId}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
