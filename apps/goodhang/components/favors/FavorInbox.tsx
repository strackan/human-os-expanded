'use client';

import { FavorCard } from './FavorCard';
import type { FavorWithParties } from '@/lib/types/database';

interface FavorInboxProps {
  favors: FavorWithParties[];
  currentUserId: string;
  onAccept: (favorId: string) => Promise<void>;
  onDecline: (favorId: string) => Promise<void>;
  onMarkComplete: (favorId: string) => Promise<void>;
  isLoading?: boolean;
}

export function FavorInbox({
  favors,
  currentUserId,
  onAccept,
  onDecline,
  onMarkComplete,
  isLoading = false,
}: FavorInboxProps) {
  // Group favors by status for better organization
  const pendingFavors = favors.filter((f) => f.status === 'asked');
  const activeFavors = favors.filter((f) => ['accepted', 'negotiating'].includes(f.status));
  const awaitingConfirmation = favors.filter((f) => f.status === 'pending_confirmation');
  const completedFavors = favors.filter((f) => ['completed', 'declined', 'withdrawn', 'disputed'].includes(f.status));

  if (favors.length === 0) {
    return (
      <div className="border-2 border-dashed border-foreground-dim/30 rounded-lg p-8 text-center">
        <div className="font-mono text-lg text-foreground-dim mb-2">
          No incoming favor requests
        </div>
        <div className="font-mono text-sm text-foreground-dim/50">
          When someone asks for your help, it will appear here
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Requests */}
      {pendingFavors.length > 0 && (
        <div>
          <h3 className="font-mono text-lg text-neon-cyan mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse" />
            Pending Requests ({pendingFavors.length})
          </h3>
          <div className="space-y-4">
            {pendingFavors.map((favor) => (
              <FavorCard
                key={favor.id}
                favor={favor}
                currentUserId={currentUserId}
                onAccept={() => onAccept(favor.id)}
                onDecline={() => onDecline(favor.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Favors */}
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
                onMarkComplete={() => onMarkComplete(favor.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Awaiting Confirmation */}
      {awaitingConfirmation.length > 0 && (
        <div>
          <h3 className="font-mono text-lg text-neon-gold mb-4">
            Awaiting Confirmation ({awaitingConfirmation.length})
          </h3>
          <div className="space-y-4">
            {awaitingConfirmation.map((favor) => (
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

      {/* Completed/History */}
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
