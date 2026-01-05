'use client';

import { TokenCard } from './TokenCard';
import type { FavorTokenWithOwner } from '@/lib/types/database';

interface TokenWalletProps {
  tokens: FavorTokenWithOwner[];
  onTokenSelect?: (token: FavorTokenWithOwner) => void;
  selectedTokenId?: string;
  emptyMessage?: string;
}

export function TokenWallet({
  tokens,
  onTokenSelect,
  selectedTokenId,
  emptyMessage = 'No tokens in wallet',
}: TokenWalletProps) {
  if (tokens.length === 0) {
    return (
      <div className="border-2 border-dashed border-foreground-dim/30 rounded-lg p-8 text-center">
        <div className="text-foreground-dim font-mono text-sm">
          {emptyMessage}
        </div>
        <div className="text-foreground-dim/50 font-mono text-xs mt-2">
          Earn tokens by doing favors for others
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {tokens.map((token) => (
        <div
          key={token.id}
          className={`p-4 rounded-lg transition-all ${
            selectedTokenId === token.id
              ? 'bg-neon-gold/20 border-2 border-neon-gold'
              : 'bg-background-lighter hover:bg-background-lighter/80 border-2 border-transparent'
          }`}
        >
          <TokenCard
            token={token}
            size="md"
            onClick={onTokenSelect ? () => onTokenSelect(token) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
