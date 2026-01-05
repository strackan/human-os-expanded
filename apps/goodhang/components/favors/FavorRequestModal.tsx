'use client';

import { useState } from 'react';
import { TokenCard } from './TokenCard';
import type { FavorTokenWithOwner, Profile } from '@/lib/types/database';

interface FavorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: FavorTokenWithOwner[];
  recipient: Profile;
  onSubmit: (tokenId: string, description: string) => Promise<void>;
}

export function FavorRequestModal({
  isOpen,
  onClose,
  tokens,
  recipient,
  onSubmit,
}: FavorRequestModalProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTokenId || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(selectedTokenId, description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border-2 border-neon-cyan/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-neon-cyan/30 p-4 flex items-center justify-between">
          <h2 className="font-mono text-xl text-neon-cyan font-bold">
            Request a Favor
          </h2>
          <button
            onClick={onClose}
            className="text-foreground-dim hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipient */}
          <div>
            <label className="block font-mono text-sm text-foreground-dim mb-2">
              Requesting from
            </label>
            <div className="font-mono text-lg text-neon-magenta font-bold">
              {recipient.name}
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block font-mono text-sm text-foreground-dim mb-3">
              Select a token to offer
            </label>

            {tokens.length === 0 ? (
              <div className="border-2 border-dashed border-foreground-dim/30 p-6 text-center">
                <div className="font-mono text-sm text-foreground-dim">
                  No tokens available
                </div>
                <div className="font-mono text-xs text-foreground-dim/50 mt-1">
                  Earn tokens by completing favors
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    onClick={() => setSelectedTokenId(token.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedTokenId === token.id
                        ? 'bg-neon-gold/20 border-2 border-neon-gold'
                        : 'bg-background-lighter border-2 border-transparent hover:border-foreground-dim/30'
                    }`}
                  >
                    <TokenCard token={token} size="sm" showName={false} />
                  </div>
                ))}
              </div>
            )}

            {selectedToken && (
              <div className="mt-3 font-mono text-sm text-neon-gold">
                Selected: {selectedToken.name}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-sm text-foreground-dim mb-2">
              Describe the favor
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you need help with?"
              rows={4}
              className="w-full bg-background-lighter border border-foreground-dim/30 p-3 font-mono text-sm text-foreground placeholder:text-foreground-dim/50 focus:border-neon-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="font-mono text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-foreground-dim text-foreground-dim font-mono text-sm hover:bg-foreground-dim/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTokenId || !description.trim() || isSubmitting}
              className="flex-1 px-4 py-3 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-mono text-sm hover:bg-neon-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
