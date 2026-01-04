'use client';

import { TokenCard } from './TokenCard';
import type { FavorTokenWithOwner } from '@/lib/types/database';

interface TokenCollectionProps {
  tokens: FavorTokenWithOwner[];
  onTokenClick?: (token: FavorTokenWithOwner) => void;
  showCount?: boolean;
}

export function TokenCollection({
  tokens,
  onTokenClick,
  showCount = true,
}: TokenCollectionProps) {
  if (tokens.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-foreground-dim font-mono text-sm">
          No earned tokens yet
        </div>
        <div className="text-foreground-dim/50 font-mono text-xs mt-2">
          Complete favors to grow your collection
        </div>
      </div>
    );
  }

  return (
    <div>
      {showCount && (
        <div className="mb-4 font-mono text-sm text-foreground-dim">
          <span className="text-neon-gold font-bold">{tokens.length}</span>{' '}
          {tokens.length === 1 ? 'token' : 'tokens'} earned
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        {tokens.map((token) => (
          <div
            key={token.id}
            className="p-3 bg-background-lighter rounded-lg border border-neon-gold/20 hover:border-neon-gold/50 transition-colors"
          >
            <TokenCard
              token={token}
              size="sm"
              showOwner={false}
              onClick={onTokenClick ? () => onTokenClick(token) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
