/**
 * Persona Card Artifact
 *
 * D&D-style character card showing personality matrix and traits.
 */

import { motion } from 'framer-motion';
import type { ArtifactProps, PersonaCardArtifactData } from './types';

const DIMENSION_LABELS: Record<string, { label: string; low: string; high: string }> = {
  self_deprecation: {
    label: 'Self-Deprecation',
    low: 'Serious',
    high: 'Self-Roasting',
  },
  directness: {
    label: 'Directness',
    low: 'Diplomatic',
    high: 'Blunt',
  },
  warmth: {
    label: 'Warmth',
    low: 'Reserved',
    high: 'Warm',
  },
  intellectual_signaling: {
    label: 'Intellectual Signaling',
    low: 'Humble',
    high: 'Analytical',
  },
  comfort_with_sincerity: {
    label: 'Sincerity Comfort',
    low: 'Guarded',
    high: 'Genuine',
  },
  absurdism_tolerance: {
    label: 'Absurdism',
    low: 'Serious',
    high: 'Playful',
  },
  format_awareness: {
    label: 'Meta-Awareness',
    low: 'Natural',
    high: 'Meta',
  },
  vulnerability_as_tool: {
    label: 'Vulnerability',
    low: 'Private',
    high: 'Open',
  },
};

function DimensionBar({
  dimension,
  value,
}: {
  dimension: string;
  value: number;
}) {
  const config = DIMENSION_LABELS[dimension] || {
    label: dimension,
    low: 'Low',
    high: 'High',
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{config.low}</span>
        <span className="text-gray-300 font-medium">{config.label}</span>
        <span className="text-gray-500">{config.high}</span>
      </div>
      <div className="h-2 bg-gh-dark-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </div>
      <div className="flex justify-end mt-0.5">
        <span className="text-xs text-gray-400">{value}/10</span>
      </div>
    </div>
  );
}

export function PersonaCardArtifact({
  artifact,
  data,
  isEditing: _isEditing,
  onDataChange: _onDataChange,
}: ArtifactProps<PersonaCardArtifactData>) {
  const { name, title, personality, dndClass, dndAlignment, traits, summary } =
    data;

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-md mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-gh-dark-800 to-gh-dark-700 rounded-xl p-6 mb-4 border border-gh-dark-600">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{name || 'Unknown'}</h2>
              {title && <p className="text-sm text-gray-400">{title}</p>}
            </div>
          </div>

          {/* D&D Style Class/Alignment */}
          {(dndClass || dndAlignment) && (
            <div className="flex gap-3 mb-4">
              {dndClass && (
                <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  {dndClass}
                </div>
              )}
              {dndAlignment && (
                <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                  {dndAlignment}
                </div>
              )}
            </div>
          )}

          {/* Traits */}
          {traits && traits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {traits.map((trait, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gh-dark-600 text-gray-300 rounded text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Personality Matrix */}
        <div className="bg-gh-dark-800 rounded-xl p-6 border border-gh-dark-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🎭</span>
            Personality Matrix
          </h3>

          {personality &&
            Object.entries(personality).map(([key, value]) => (
              <DimensionBar key={key} dimension={key} value={value as number} />
            ))}
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-gh-dark-800 rounded-xl p-6 mt-4 border border-gh-dark-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">📝</span>
              Summary
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Status indicator */}
        <div className="mt-4 flex justify-center">
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              artifact.status === 'draft'
                ? 'bg-amber-500/20 text-amber-400'
                : artifact.status === 'confirmed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {artifact.status === 'draft'
              ? 'Draft - Review & Confirm'
              : artifact.status === 'confirmed'
              ? 'Confirmed'
              : 'Saved'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PersonaCardArtifact;
