'use client';

import type { ARIScoreSnapshot } from '@/lib/mcp/types/ari.types';

interface ARICompetitorTableProps {
  snapshots: ARIScoreSnapshot[];
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getDeltaArrow(delta: number | null): string {
  if (delta === null || delta === undefined) return '';
  if (delta > 0) return '\u2191';
  if (delta < 0) return '\u2193';
  return '\u2192';
}

function getDeltaColor(delta: number | null): string {
  if (delta === null || delta === undefined) return 'text-gray-400';
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-400';
}

export function ARICompetitorTable({ snapshots }: ARICompetitorTableProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No ARI scores available
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => b.overall_score - a.overall_score);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">
              Entity
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">
              ARI Score
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">
              Mention Rate
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((snapshot, i) => (
            <tr
              key={snapshot.id}
              className={`${i > 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50 transition-colors`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {snapshot.ari_entity_name}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    {snapshot.entity_type}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`text-sm font-bold font-fraunces ${getScoreColor(snapshot.overall_score)}`}>
                  {snapshot.overall_score.toFixed(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm text-gray-600 font-fraunces">
                  {snapshot.mention_rate.toFixed(0)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {snapshot.score_delta !== null && snapshot.score_delta !== undefined ? (
                  <span className={`text-sm font-semibold ${getDeltaColor(snapshot.score_delta)}`}>
                    {getDeltaArrow(snapshot.score_delta)}{' '}
                    {Math.abs(snapshot.score_delta).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
