import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth';
import {
  fetchAssessmentResults,
  isV3Results,
  type AssessmentResults,
} from '@/lib/tauri';

// Character class icons for V3 D&D display
const CLASS_ICONS: Record<string, string> = {
  Paladin: '⚔️',
  Wizard: '🧙',
  Bard: '🎭',
  Rogue: '🗡️',
  Ranger: '🏹',
  Sorcerer: '✨',
  Artificer: '⚙️',
  Barbarian: '💪',
  Cleric: '🙏',
  Druid: '🌿',
  Fighter: '🛡️',
  Monk: '👊',
  Warlock: '🔮',
};

// Attribute display config
const ATTRIBUTE_CONFIG = {
  INT: { label: 'Intelligence', color: 'text-blue-400' },
  WIS: { label: 'Wisdom', color: 'text-purple-400' },
  CHA: { label: 'Charisma', color: 'text-pink-400' },
  CON: { label: 'Constitution', color: 'text-green-400' },
  STR: { label: 'Strength', color: 'text-red-400' },
  DEX: { label: 'Dexterity', color: 'text-yellow-400' },
};

// V3 D&D Character Results Component
function V3Results({ results }: { results: AssessmentResults }) {
  const character = results.character_profile;
  const attributes = results.attributes;
  const signals = results.signals;
  const matching = results.matching;

  const characterClass = character?.class || 'Adventurer';
  const race = character?.race || 'Human';
  const alignment = character?.alignment || 'True Neutral';
  const tagline = character?.tagline;
  const classIcon = CLASS_ICONS[characterClass] || '⚔️';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Character Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl mb-4"
        >
          {classIcon}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white mb-2"
        >
          {race} {characterClass}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4"
        >
          <span className="px-3 py-1 bg-gh-purple-600/20 text-gh-purple-400 rounded-full text-sm">
            {alignment}
          </span>
          <span className="px-3 py-1 bg-gh-dark-800 rounded-full text-sm text-gray-400">
            Score: {results.overall_score}
          </span>
        </motion.div>
      </div>

      {/* Tagline */}
      {tagline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-gh-purple-600/20 to-gh-dark-800 rounded-2xl p-6 mb-8 text-center"
        >
          <p className="text-xl text-gray-200 italic">&ldquo;{tagline}&rdquo;</p>
        </motion.div>
      )}

      {/* Attributes */}
      {attributes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Attributes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(ATTRIBUTE_CONFIG).map(([key, config], index) => {
              const value =
                attributes[key as keyof typeof attributes] ?? 0;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-gh-dark-900 rounded-lg p-4"
                >
                  <div className={`text-sm mb-1 ${config.color}`}>
                    {key} - {config.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(value / 10) * 100}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gh-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-white font-bold text-lg">{value}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Signals */}
      {signals && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Your Signals</h2>
          <div className="grid grid-cols-2 gap-4">
            {signals.social_energy && (
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Social Energy</div>
                <div className="text-white">{signals.social_energy}</div>
              </div>
            )}
            {signals.relationship_style && (
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Relationship Style</div>
                <div className="text-white">{signals.relationship_style}</div>
              </div>
            )}
            {signals.enneagram_hint && (
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Enneagram Hint</div>
                <div className="text-white">{signals.enneagram_hint}</div>
              </div>
            )}
          </div>
          {signals.interest_vectors && signals.interest_vectors.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">Interest Vectors</div>
              <div className="flex flex-wrap gap-2">
                {signals.interest_vectors.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Matching */}
      {matching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Compatibility</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {matching.ideal_group_size && (
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Ideal Group Size</div>
                <div className="text-white">{matching.ideal_group_size}</div>
              </div>
            )}
            {matching.connection_style && (
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Connection Style</div>
                <div className="text-white">{matching.connection_style}</div>
              </div>
            )}
            {matching.energy_pattern && (
              <div className="bg-gh-dark-900 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Energy Pattern</div>
                <div className="text-white">{matching.energy_pattern}</div>
              </div>
            )}
          </div>

          {matching.good_match_with && matching.good_match_with.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">Good Match With</div>
              <div className="flex flex-wrap gap-2">
                {matching.good_match_with.map((match, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm"
                  >
                    {match}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matching.avoid_match_with && matching.avoid_match_with.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-2">May Clash With</div>
              <div className="flex flex-wrap gap-2">
                {matching.avoid_match_with.map((match, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm"
                  >
                    {match}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// V1 Work Assessment Results Component
function V1Results({ results }: { results: AssessmentResults }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-5xl font-bold text-white mb-4"
        >
          {results.archetype}
        </motion.h1>
        <div className="flex items-center justify-center gap-4 text-gray-400">
          {results.tier && (
            <span className="px-3 py-1 bg-gh-purple-600/20 text-gh-purple-400 rounded-full text-sm">
              {results.tier}
            </span>
          )}
          <span className="px-3 py-1 bg-gh-dark-800 rounded-full text-sm">
            Score: {results.overall_score}
          </span>
          {results.personality_profile?.mbti && (
            <span>{results.personality_profile.mbti}</span>
          )}
          {results.personality_profile?.enneagram && (
            <span>{results.personality_profile.enneagram}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {(results.public_summary || results.detailed_summary) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <p className="text-gray-300 text-lg leading-relaxed">
            {results.public_summary || results.detailed_summary}
          </p>
        </motion.div>
      )}

      {/* Dimensions */}
      {results.dimensions && Object.keys(results.dimensions).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Your Dimensions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(results.dimensions).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-gh-dark-900 rounded-lg p-4"
              >
                <div className="text-gray-400 text-sm capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value * 10}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      className="h-full bg-gh-purple-500 rounded-full"
                    />
                  </div>
                  <span className="text-white font-medium">{value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Badges */}
      {results.badges && results.badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Your Badges</h2>
          <div className="flex flex-wrap gap-2">
            {results.badges.map((badge) => (
              <span
                key={badge.id}
                className="px-3 py-1 bg-gh-purple-600/20 text-gh-purple-400 rounded-full text-sm"
                title={badge.description}
              >
                {badge.icon && <span className="mr-1">{badge.icon}</span>}
                {badge.name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Best Fit Roles */}
      {results.best_fit_roles && results.best_fit_roles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Best Fit Roles</h2>
          <div className="flex flex-wrap gap-2">
            {results.best_fit_roles.map((role, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
              >
                {role}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { sessionId, token, clearSession } = useAuthStore();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && token) {
      loadResults();
    } else if (sessionId && !token) {
      setLoading(false);
      setError('Session expired. Please sign in again.');
    }
  }, [sessionId, token]);

  const loadResults = async () => {
    if (!sessionId || !token) return;

    try {
      const data = await fetchAssessmentResults(sessionId, token);
      setResults(data);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gh-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your character...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadResults}
              className="px-4 py-2 bg-gh-purple-600 hover:bg-gh-purple-700 rounded-lg text-white"
            >
              Try Again
            </button>
            <button
              onClick={() => clearSession()}
              className="px-4 py-2 border border-gray-600 hover:bg-gray-800 rounded-lg text-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">No results found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Render V3 or V1 based on data format */}
        {isV3Results(results) ? (
          <V3Results results={results} />
        ) : (
          <V1Results results={results} />
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <button className="px-8 py-4 bg-gh-purple-600 hover:bg-gh-purple-700 text-white font-medium rounded-lg text-lg transition-colors">
            Enter the Network
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
