'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ARIScoreCard } from '@/components/ari/ARIScoreCard';
import { ARICompetitorTable } from '@/components/ari/ARICompetitorTable';
import type { ARIScoreSnapshot } from '@/lib/mcp/types/ari.types';

export default function ARIDashboardPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<ARIScoreSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/ari/portfolio');
      if (res.ok) {
        const { scores } = await res.json();
        setPortfolio(scores || []);
      }
    } catch {
      // silently degrade
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Compute biggest movers
  const movers = portfolio
    .filter((s) => s.score_delta !== null && s.score_delta !== undefined)
    .sort((a, b) => Math.abs(b.score_delta!) - Math.abs(a.score_delta!))
    .slice(0, 5);

  const avgScore = portfolio.length > 0
    ? portfolio.reduce((sum, s) => sum + s.overall_score, 0) / portfolio.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">AI Visibility Dashboard</h1>
              <p className="text-gray-500">
                Track how AI models recommend your accounts across ChatGPT, Claude, Perplexity, and Gemini
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Tracked Entities
                </p>
                <p className="text-3xl font-bold font-fraunces text-gray-900">
                  {portfolio.length}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Average ARI Score
                </p>
                <p className="text-3xl font-bold font-fraunces text-gray-900">
                  {avgScore.toFixed(1)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                  Biggest Movers
                </p>
                <p className="text-3xl font-bold font-fraunces text-gray-900">
                  {movers.length}
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Portfolio Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Scores</h2>
                  {portfolio.length > 0 ? (
                    <ARICompetitorTable snapshots={portfolio} />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p className="mb-2">No ARI scores yet</p>
                      <p className="text-sm">
                        Map customers to ARI entities from their detail pages to start tracking
                      </p>
                    </div>
                  )}
                </div>

                {/* Biggest Movers */}
                {movers.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Biggest Movers</h2>
                    <div className="space-y-3">
                      {movers.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {m.ari_entity_name}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">{m.entity_type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-fraunces text-gray-600">
                              {m.overall_score.toFixed(1)}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                m.score_delta! > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {m.score_delta! > 0 ? '+' : ''}
                              {m.score_delta!.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Vendor Score */}
              <div className="space-y-6">
                {portfolio.length > 0 && (
                  <ARIScoreCard
                    score={portfolio[0]}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
