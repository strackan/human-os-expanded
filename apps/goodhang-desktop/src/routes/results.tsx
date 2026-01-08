import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/stores/auth';
import { fetchAssessmentResults, type AssessmentResults } from '@/lib/tauri';

export default function ResultsPage() {
  const { sessionId, token, clearSession } = useAuthStore();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && token) {
      loadResults();
    } else if (sessionId && !token) {
      // Token expired or missing, redirect to login
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
        className="max-w-4xl mx-auto"
      >
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
            <span className="px-3 py-1 bg-gh-purple-600/20 text-gh-purple-400 rounded-full text-sm">
              {results.tier}
            </span>
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

        {/* Badges */}
        {results.badges && results.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gh-dark-800 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Badges
            </h2>
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
            <h2 className="text-xl font-semibold text-white mb-4">
              Best Fit Roles
            </h2>
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button className="px-8 py-4 bg-gh-purple-600 hover:bg-gh-purple-700 text-white font-medium rounded-lg text-lg transition-colors">
            Enter the Network
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
