'use client';

/**
 * Enhanced Assessment Results Page (Phase 1)
 *
 * Displays comprehensive assessment results including:
 * - Personality Profile (MBTI + Enneagram)
 * - Badge Showcase
 * - Category Scores (Technical/Emotional/Creative)
 * - AI Orchestration Scores
 * - 14 Dimension Breakdown
 * - Best Fit Roles
 * - Public Summary
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AssessmentResults } from '@/lib/assessment/types';
import { ResultsHeader } from '@/components/assessment/results/ResultsHeader';
import { PersonalityProfileCard } from '@/components/assessment/results/PersonalityProfileCard';
import { BadgeShowcase } from '@/components/assessment/results/BadgeShowcase';
import { CategoryScoresSection } from '@/components/assessment/results/CategoryScoresSection';
import { AIOrchestrationCard } from '@/components/assessment/results/AIOrchestrationCard';
import { DimensionBreakdown } from '@/components/assessment/results/DimensionBreakdown';
import { BestFitRolesCard } from '@/components/assessment/results/BestFitRolesCard';
import { PublicSummaryCard } from '@/components/assessment/results/PublicSummaryCard';
import { ResultsActions } from '@/components/assessment/results/ResultsActions';

export default function AssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch(`/api/assessment/${sessionId}/results`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to load results');
        }

        const data = await response.json();
        setResults(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      loadResults();
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Error Loading Results</h2>
          <p className="text-gray-300 mb-6">{error || 'Results not found'}</p>
          <button
            onClick={() => router.push('/assessment/start')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Header */}
        <ResultsHeader
          archetype={results.archetype}
          overall_score={results.overall_score}
          tier={results.tier}
        />

        {/* Personality Profile */}
        {results.personality_profile && (
          <PersonalityProfileCard profile={results.personality_profile} />
        )}

        {/* Badge Showcase */}
        {results.badges && <BadgeShowcase badges={results.badges} />}

        {/* Category Scores (Big 3) */}
        {results.category_scores && (
          <CategoryScoresSection categoryScores={results.category_scores} />
        )}

        {/* AI Orchestration Deep Dive */}
        {results.ai_orchestration_scores && (
          <AIOrchestrationCard scores={results.ai_orchestration_scores} />
        )}

        {/* 14 Dimension Breakdown */}
        <DimensionBreakdown dimensions={results.dimensions} />

        {/* Best Fit Roles */}
        <BestFitRolesCard roles={results.best_fit_roles} />

        {/* Public Summary */}
        {results.public_summary && (
          <PublicSummaryCard summary={results.public_summary} />
        )}

        {/* Legacy Sections (for backward compatibility) */}
        {results.recommendation && (
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Recommendation</h2>
            <p className="text-gray-300 leading-relaxed">{results.recommendation}</p>
          </div>
        )}

        {/* Flags */}
        {(results.flags?.green_flags?.length > 0 || results.flags?.red_flags?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Green Flags */}
            {results.flags.green_flags.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-400 mb-4">Strengths</h3>
                <ul className="space-y-2">
                  {results.flags.green_flags.map((flag, idx) => (
                    <li key={idx} className="text-gray-300 text-sm">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {results.flags.red_flags.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Areas to Develop</h3>
                <ul className="space-y-2">
                  {results.flags.red_flags.map((flag, idx) => (
                    <li key={idx} className="text-gray-300 text-sm">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <ResultsActions
          sessionId={sessionId}
          isPublished={results.is_published || false}
        />
      </div>
    </div>
  );
}
