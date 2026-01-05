/**
 * LightningResults Component
 *
 * Displays Lightning Round assessment results.
 * Shows final score, accuracy, percentile, and difficulty achieved.
 * Includes CTA to continue to Absurdist Questions.
 */

'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';

interface LightningResultsProps {
  score: number;
  accuracy: number; // Percentage (0-100)
  percentile: number; // Percentile rank (0-100)
  difficultyAchieved: string;
  questionsAnswered: number;
  totalQuestions: number;
}

function LightningResultsComponent({
  score,
  accuracy,
  percentile,
  difficultyAchieved,
  questionsAnswered,
  totalQuestions,
}: LightningResultsProps) {
  const router = useRouter();

  // Determine score color based on percentile
  const getScoreColor = () => {
    if (percentile >= 90) return 'text-green-400';
    if (percentile >= 75) return 'text-blue-400';
    if (percentile >= 50) return 'text-yellow-400';
    return 'text-gray-400';
  };

  // Get achievement message based on performance
  const getAchievementMessage = () => {
    if (percentile >= 95) return 'Exceptional Performance!';
    if (percentile >= 90) return 'Outstanding Work!';
    if (percentile >= 75) return 'Great Job!';
    if (percentile >= 50) return 'Nice Work!';
    return 'Good Effort!';
  };

  // Percentile visualization
  const PercentileBar = () => {
    return (
      <div className="relative w-full h-8 bg-gray-800 rounded-lg overflow-hidden">
        {/* Progress bar */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-1000 ease-out"
          style={{ width: `${percentile}%` }}
        />

        {/* Percentile markers */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold">
          <span className="relative z-10 text-white/80">0%</span>
          <span className="relative z-10 text-white/80">50%</span>
          <span className="relative z-10 text-white/80">100%</span>
        </div>

        {/* Current percentile indicator */}
        <div
          className="absolute inset-y-0 flex items-center transition-all duration-1000 ease-out"
          style={{ left: `${percentile}%` }}
        >
          <div className="w-1 h-full bg-white shadow-lg" />
        </div>
      </div>
    );
  };

  const handleContinue = () => {
    // Navigate to absurdist questions
    router.push('/assessment/absurdist');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Lightning Round Complete!
            </h1>
            <p className="text-gray-400 text-lg">{getAchievementMessage()}</p>
          </div>

          {/* Main Score Display */}
          <div className="text-center mb-8 p-6 bg-black/30 rounded-lg border border-purple-500/20">
            <div className="text-sm text-gray-400 mb-2">Your Score</div>
            <div className={`text-6xl md:text-7xl font-bold ${getScoreColor()} mb-2`}>
              {score.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">
              {questionsAnswered} / {totalQuestions} questions answered
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Accuracy */}
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20 text-center">
              <div className="text-gray-400 text-sm mb-2">Accuracy</div>
              <div className="text-3xl font-bold text-white mb-1">
                {accuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">correct answers</div>
            </div>

            {/* Percentile */}
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20 text-center">
              <div className="text-gray-400 text-sm mb-2">Percentile</div>
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {percentile.toFixed(0)}th
              </div>
              <div className="text-xs text-gray-500">of all test takers</div>
            </div>

            {/* Difficulty */}
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20 text-center">
              <div className="text-gray-400 text-sm mb-2">Difficulty</div>
              <div className="text-3xl font-bold text-blue-400 mb-1 capitalize">
                {difficultyAchieved}
              </div>
              <div className="text-xs text-gray-500">level achieved</div>
            </div>
          </div>

          {/* Percentile Visualization */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Your Performance</span>
              <span className="text-sm text-purple-400 font-semibold">
                Top {100 - percentile}%
              </span>
            </div>
            <PercentileBar />
          </div>

          {/* Performance Insights */}
          <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">Performance Insights</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {accuracy >= 80 && (
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Excellent accuracy - you know your stuff!</span>
                </li>
              )}
              {percentile >= 75 && (
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>You&apos;re in the top quartile of test takers</span>
                </li>
              )}
              {difficultyAchieved === 'advanced' || difficultyAchieved === 'insane' ? (
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>You tackled advanced-level questions with confidence</span>
                </li>
              ) : null}
              {questionsAnswered === totalQuestions && (
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>You answered every question - great commitment!</span>
                </li>
              )}
              {accuracy < 50 && (
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Take your time in future rounds - accuracy matters more than speed</span>
                </li>
              )}
            </ul>
          </div>

          {/* Continue CTA */}
          <div className="text-center">
            <button
              onClick={handleContinue}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 text-lg"
            >
              Continue to Absurdist Questions →
            </button>
            <p className="text-gray-500 text-sm mt-4">
              Next up: Creative questions to round out your profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const LightningResults = memo(LightningResultsComponent);

LightningResults.displayName = 'LightningResults';
