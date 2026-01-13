'use client';

/**
 * Check-In Session Page
 *
 * Conducts lightweight 5-10 minute check-in conversations with returning candidates
 * Updates their intelligence file and maintains relationship warmth
 *
 * Release 1.6: Return Visit System - Phase 2
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckInSlide } from '@/components/talent/CheckInSlide';
import type { IntelligenceFile, InterviewMessage } from '@/types/talent';

interface CandidateData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  intelligenceFile: IntelligenceFile;
}

export default function CheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load candidate data on mount
  useEffect(() => {
    if (!candidateId) {
      setError('No candidate ID provided');
      setIsLoading(false);
      return;
    }

    loadCandidateData(candidateId);
  }, [candidateId]);

  async function loadCandidateData(id: string) {
    try {
      // Check sessionStorage for returning candidate data first
      const returningData = sessionStorage.getItem('returning_candidate');
      if (returningData) {
        // Fetch full candidate details from API
        const response = await fetch(`/api/candidates/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load candidate data');
        }

        const data = await response.json();
        setCandidate(data.candidate);
      } else {
        throw new Error('No returning candidate session found');
      }
    } catch (err) {
      console.error('Error loading candidate:', err);
      setError(err instanceof Error ? err.message : 'Failed to load candidate');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckInComplete(
    transcript: InterviewMessage[],
    updates: Record<string, unknown>
  ) {
    if (!candidate) return;

    try {
      // Save check-in session
      const response = await fetch('/api/candidates/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          transcript,
          updates,
          sessionType: 'check_in',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save check-in');
      }

      await response.json();

      // Show success and redirect
      alert('Check-in completed! Your intelligence file has been updated.');

      // Clear session storage
      sessionStorage.removeItem('returning_candidate');

      // Redirect to thank you page or dashboard
      router.push('/join/thank-you?type=check-in');
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in. Please try again.');
    }
  }

  function handleCancel() {
    if (confirm('Are you sure you want to cancel this check-in?')) {
      sessionStorage.removeItem('returning_candidate');
      router.push('/join/returning');
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Session</h2>
          <p className="text-gray-600 mb-6">{error || 'Candidate data not found'}</p>
          <button
            onClick={() => router.push('/join/returning')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Email Lookup
          </button>
        </div>
      </div>
    );
  }

  // Main check-in UI
  return (
    <CheckInSlide
      candidateId={candidate.id}
      candidateName={`${candidate.firstName} ${candidate.lastName}`}
      candidateEmail={candidate.email}
      intelligenceFile={candidate.intelligenceFile}
      onComplete={handleCheckInComplete}
      onCancel={handleCancel}
    />
  );
}
