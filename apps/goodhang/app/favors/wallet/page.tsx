'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TokenWallet, TokenCollection, TokenCard } from '@/components/favors';
import type { FavorTokenWithOwner, FavorTokenWithHistory } from '@/lib/types/database';

type TabType = 'wallet' | 'collection';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabType>('wallet');
  const [walletTokens, setWalletTokens] = useState<FavorTokenWithOwner[]>([]);
  const [collectionTokens, setCollectionTokens] = useState<FavorTokenWithOwner[]>([]);
  const [selectedToken, setSelectedToken] = useState<FavorTokenWithHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const [walletRes, collectionRes] = await Promise.all([
          fetch('/api/favors/tokens/wallet'),
          fetch('/api/favors/tokens/collection'),
        ]);

        if (walletRes.ok) {
          const data = await walletRes.json();
          setWalletTokens(data.tokens || []);
        }

        if (collectionRes.ok) {
          const data = await collectionRes.json();
          setCollectionTokens(data.tokens || []);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokens();
  }, []);

  const handleTokenClick = async (token: FavorTokenWithOwner) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/favors/tokens/${token.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching token details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedToken(null);
  };

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
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/favors"
            className="text-foreground-dim hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
          <div>
            <h1 className="font-mono text-3xl text-neon-gold font-bold">
              Token Vault
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-background-lighter border border-neon-gold/30 p-6">
            <div className="font-mono text-sm text-foreground-dim mb-1">Available</div>
            <div className="font-mono text-3xl text-neon-gold font-bold">
              {walletTokens.length}
            </div>
          </div>
          <div className="bg-background-lighter border border-neon-cyan/30 p-6">
            <div className="font-mono text-sm text-foreground-dim mb-1">Earned</div>
            <div className="font-mono text-3xl text-neon-cyan font-bold">
              {collectionTokens.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-foreground-dim/30 mb-6">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-3 font-mono text-sm relative ${
              activeTab === 'wallet'
                ? 'text-neon-gold'
                : 'text-foreground-dim hover:text-foreground'
            }`}
          >
            Wallet ({walletTokens.length})
            {activeTab === 'wallet' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-gold" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-3 font-mono text-sm relative ${
              activeTab === 'collection'
                ? 'text-neon-cyan'
                : 'text-foreground-dim hover:text-foreground'
            }`}
          >
            Collection ({collectionTokens.length})
            {activeTab === 'collection' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'wallet' && (
          <div>
            <p className="font-mono text-sm text-foreground-dim mb-6">
              These tokens are available to spend on favor requests.
            </p>
            <TokenWallet
              tokens={walletTokens}
              onTokenSelect={handleTokenClick}
              emptyMessage="No tokens in wallet. Earn tokens by completing favors!"
            />
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <p className="font-mono text-sm text-foreground-dim mb-6">
              Tokens you&apos;ve earned by helping others. Each tells a story.
            </p>
            <TokenCollection
              tokens={collectionTokens}
              onTokenClick={handleTokenClick}
            />
          </div>
        )}

        {/* Token Details Modal */}
        {selectedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeDetails}
            />
            <div className="relative bg-background border-2 border-neon-gold/50 max-w-md w-full p-6">
              {isLoadingDetails ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-foreground-dim/20 rounded" />
                  <div className="h-4 bg-foreground-dim/20 rounded w-3/4" />
                </div>
              ) : (
                <>
                  {/* Close button */}
                  <button
                    onClick={closeDetails}
                    className="absolute top-4 right-4 text-foreground-dim hover:text-foreground"
                  >
                    ✕
                  </button>

                  {/* Token display */}
                  <div className="flex flex-col items-center mb-6">
                    <TokenCard token={selectedToken} size="lg" />
                  </div>

                  {/* Token info */}
                  <div className="space-y-4">
                    <div>
                      <div className="font-mono text-xs text-foreground-dim mb-1">Minted</div>
                      <div className="font-mono text-sm text-foreground">
                        {new Date(selectedToken.minted_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-xs text-foreground-dim mb-1">Origin</div>
                      <div className="font-mono text-sm text-foreground capitalize">
                        {selectedToken.mint_source.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Favor history */}
                    {selectedToken.favors && selectedToken.favors.length > 0 && (
                      <div>
                        <div className="font-mono text-xs text-foreground-dim mb-2">
                          Favor History ({selectedToken.favors.length})
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedToken.favors.map((favor) => (
                            <div
                              key={favor.id}
                              className="bg-background-lighter p-3 rounded text-sm"
                            >
                              <div className="font-mono text-foreground-dim">
                                {favor.requester?.name} → {favor.recipient?.name}
                              </div>
                              <div className="font-mono text-xs text-foreground-dim/50 mt-1">
                                {favor.description?.slice(0, 50)}
                                {favor.description && favor.description.length > 50 ? '...' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
