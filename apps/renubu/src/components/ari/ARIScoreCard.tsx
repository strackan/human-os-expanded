'use client';

import { useState } from 'react';
import type { ARIScoreSnapshot } from '@/lib/mcp/types/ari.types';
import { ARITrendSparkline } from './ARITrendSparkline';

interface ARIScoreCardProps {
  score: ARIScoreSnapshot | null;
  history?: ARIScoreSnapshot[];
  onRunScan?: () => void;
  scanning?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreRingColor(score: number): string {
  if (score >= 70) return '#2BA86A';
  if (score >= 40) return '#D4A843';
  return '#D94F4F';
}

function getDeltaDisplay(delta: number | null): { text: string; color: string } | null {
  if (delta === null || delta === undefined) return null;
  if (delta > 0) return { text: `+${delta.toFixed(1)}`, color: 'text-green-600' };
  if (delta < 0) return { text: delta.toFixed(1), color: 'text-red-600' };
  return { text: '0.0', color: 'text-gray-400' };
}

export function ARIScoreCard({ score, history, onRunScan, scanning }: ARIScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!score) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            AI Visibility
          </h3>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm mb-4">No ARI score yet</p>
          {onRunScan && (
            <button
              onClick={onRunScan}
              disabled={scanning}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {scanning ? 'Scanning...' : 'Run First Scan'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const delta = getDeltaDisplay(score.score_delta);
  const ringColor = getScoreRingColor(score.overall_score);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score.overall_score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          AI Visibility
        </h3>
        {onRunScan && (
          <button
            onClick={onRunScan}
            disabled={scanning}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Re-scan'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle
              cx="44" cy="44" r="36"
              fill="none" stroke="#f0f0f0" strokeWidth="6"
            />
            <circle
              cx="44" cy="44" r="36"
              fill="none" stroke={ringColor} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 44 44)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-2xl font-bold leading-none font-fraunces ${getScoreColor(score.overall_score)}`}
            >
              {score.overall_score.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">ARI</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Mention Rate</span>
            <span className="text-sm font-semibold font-fraunces">
              {score.mention_rate.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Mentions</span>
            <span className="text-sm font-semibold font-fraunces">
              {score.mentions_count}/{score.total_prompts}
            </span>
          </div>
          {delta && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Change</span>
              <span className={`text-sm font-semibold font-fraunces ${delta.color}`}>
                {delta.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {history && history.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <ARITrendSparkline history={history} />
        </div>
      )}

      {/* Provider breakdown (expandable) */}
      {score.provider_scores && Object.keys(score.provider_scores).length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? 'Hide' : 'Show'} provider breakdown
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {Object.entries(score.provider_scores).map(([provider, data]) => {
                const ps = data as { mentioned_count?: number; total_questions?: number };
                const rate = ps.total_questions
                  ? ((ps.mentioned_count || 0) / ps.total_questions) * 100
                  : 0;
                return (
                  <div key={provider} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 capitalize">{provider}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${rate}%`,
                          backgroundColor: getScoreRingColor(rate),
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {rate.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Last scan */}
      <div className="mt-3 text-[10px] text-gray-400">
        Last scan: {new Date(score.scan_completed_at).toLocaleDateString()}
      </div>
    </div>
  );
}
