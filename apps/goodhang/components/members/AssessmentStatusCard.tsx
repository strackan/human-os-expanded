'use client';

import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AssessmentStatusCard() {
  const { data, isLoading } = useSWR('/api/assessment/status', fetcher);

  if (isLoading) {
    return (
      <div className="border-2 border-neon-purple/30 bg-background-lighter p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  // Not started
  if (data?.status === 'not_started') {
    return (
      <Link
        href="/assessment/start"
        className="block border-2 border-neon-purple/30 hover:border-neon-purple bg-background-lighter p-6 transition-all duration-300 hover:scale-105"
      >
        <h3 className="text-xl font-bold font-mono neon-purple mb-2">
          CS Assessment
        </h3>
        <p className="text-foreground-dim font-mono text-sm">
          Take our comprehensive skills assessment and join the talent bench
        </p>
      </Link>
    );
  }

  // In progress
  if (data?.status === 'in_progress') {
    return (
      <Link
        href="/assessment/interview"
        className="block border-2 border-neon-cyan/30 hover:border-neon-cyan bg-background-lighter p-6 transition-all duration-300 hover:scale-105"
      >
        <h3 className="text-xl font-bold font-mono neon-cyan mb-2">
          Resume Assessment
        </h3>
        <div className="mb-3">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${data.progress}%` }}
            />
          </div>
        </div>
        <p className="text-foreground-dim font-mono text-sm">
          Continue where you left off ({data.progress}% complete)
        </p>
      </Link>
    );
  }

  // Completed
  if (data?.status === 'completed') {
    return (
      <Link
        href={`/assessment/results/${data.session_id}`}
        className="block border-2 border-neon-magenta/30 hover:border-neon-magenta bg-background-lighter p-6 transition-all duration-300 hover:scale-105"
      >
        <h3 className="text-xl font-bold font-mono neon-magenta mb-2">
          View Your Results
        </h3>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-2xl font-bold text-white">{data.overall_score}/100</span>
          <span className="text-gray-300">{data.archetype}</span>
        </div>
        <p className="text-foreground-dim font-mono text-sm">
          Review scores, edit answers, or publish your profile
        </p>
      </Link>
    );
  }

  return null;
}
