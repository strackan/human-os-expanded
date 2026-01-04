'use client';

/**
 * Return Visit Page
 *
 * Email lookup for returning candidates - Release 1.6 feature
 * Allows candidates to continue their conversation after initial interview
 *
 * Release 1.6: Return Visit System - Longitudinal Intelligence
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CandidateLookupResponse {
  success: boolean;
  found: boolean;
  candidate?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    companyId: string;
    intelligenceFile: Record<string, unknown>;
    checkInCount: number;
    lastCheckIn: string | null;
    relationshipStrength: 'cold' | 'warm' | 'hot';
  };
  sessions?: Record<string, unknown>[];
  sessionCount?: number;
  message?: string;
  error?: string;
}

export default function ReturningPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);

    try {
      // Call the candidate lookup API
      const response = await fetch('/api/candidates/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data: CandidateLookupResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to look up candidate');
        setIsSearching(false);
        return;
      }

      if (!data.found) {
        // New candidate - redirect to initial application
        setError('No previous sessions found. Redirecting to application...');
        setTimeout(() => {
          router.push('/join');
        }, 1500);
        return;
      }

      // Candidate found! Redirect to session with their intelligence file
      if (data.candidate) {
        const { id, checkInCount, relationshipStrength } = data.candidate;

        // Determine session type based on history
        const sessionType = checkInCount && checkInCount > 0 ? 'check_in' : 'initial';

        // Store candidate context in sessionStorage for the interview
        sessionStorage.setItem('returning_candidate', JSON.stringify({
          candidateId: id,
          email: data.candidate.email,
          firstName: data.candidate.firstName,
          lastName: data.candidate.lastName,
          sessionCount: checkInCount,
          relationshipStrength,
          isReturning: true,
        }));

        // Redirect to check-in session
        router.push(`/join/check-in?candidateId=${id}&sessionType=${sessionType}`);
      }
    } catch (err) {
      console.error('Candidate lookup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome Back!
          </h1>
          <p className="text-lg text-gray-600">
            Enter your email to continue where you left off
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jane@example.com"
                disabled={isSearching}
              />
            </div>

            {error && (
              <div className={`border rounded-md p-4 ${
                error.includes('Redirecting')
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-medium ${
                  error.includes('Redirecting')
                    ? 'text-blue-800'
                    : 'text-red-800'
                }`}>
                  {error}
                </p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800 font-medium">
                ✅ Release 1.6 - Return Visit System Active
              </p>
              <p className="text-xs text-green-600 mt-1">
                Longitudinal intelligence: We&apos;ll remember your previous conversations and
                reference specific details when you return.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSearching ? 'Looking up...' : 'Continue Interview'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New here?{' '}
              <a href="/join" className="text-blue-600 hover:text-blue-700 font-medium">
                Start your application
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">What is Return Visit?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Intelligence file synthesizes all your sessions</li>
            <li>✓ Check-in conversations (5-10 min lighter format)</li>
            <li>✓ System remembers: &ldquo;Hey Jane! How are Lucy and Marcus?&rdquo;</li>
            <li>✓ Tracks relationship evolution (cold/warm/hot)</li>
            <li>✓ &ldquo;It actually remembered me. No one does that.&rdquo;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
