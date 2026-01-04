'use client';

/**
 * Interview Experience Page (Placeholder)
 *
 * Full conversational AI interview will be implemented in Sprint 2 (Phase 3)
 * - Real-time chat with Claude Sonnet 4.5
 * - Adaptive questioning across 11 dimensions
 * - Transcript storage
 *
 * Release 1.5: Talent Orchestration System - Sprint 2
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidate');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Interview Experience
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium">
            🚧 Under Construction - Sprint 2 (Weeks 3-4)
          </p>
        </div>

        <div className="text-left space-y-4 mb-8">
          <p className="text-gray-700">
            <strong>What's coming:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>20-minute conversational AI interview</li>
            <li>Adaptive questioning across 11 dimensions</li>
            <li>Real-time chat interface with Claude Sonnet 4.5</li>
            <li>Natural conversation flow (not a survey)</li>
            <li>Transcript storage and analysis</li>
          </ul>
        </div>

        {candidateId && (
          <p className="text-sm text-gray-500 mb-4">
            Candidate ID: <code className="bg-gray-100 px-2 py-1 rounded">{candidateId}</code>
          </p>
        )}

        <div className="flex gap-4 justify-center">
          <a
            href="/join"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            ← Back to Application
          </a>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Sprint 1 Phase 2 Complete: Landing page + form submission ✓<br />
          Sprint 2 Phase 3-4: Interview experience (48h remaining)
        </p>
      </div>
    </div>
  );
}
