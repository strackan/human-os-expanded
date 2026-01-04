'use client';

import type { AIOrchestrationScores } from '@/lib/assessment/types';

interface AIOrchestrationCardProps {
  scores: AIOrchestrationScores;
}

export function AIOrchestrationCard({ scores }: AIOrchestrationCardProps) {
  const overallScore = Math.round(
    Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length
  );

  return (
    <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        AI Orchestration Mastery
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Overall Score */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Overall AI Orchestration</h3>
          <div className="text-6xl font-bold text-white">{overallScore}</div>
        </div>

        {/* Breakdown */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Breakdown</h3>
          <div className="space-y-2">
            <ScoreLine label="Technical Foundation" score={scores.technical_foundation} />
            <ScoreLine label="Practical Use" score={scores.practical_use} />
            <ScoreLine label="Conceptual Understanding" score={scores.conceptual_understanding} />
            <ScoreLine label="Systems Thinking" score={scores.systems_thinking} />
            <ScoreLine label="Judgment" score={scores.judgment} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreLine({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300 text-sm">{label}</span>
      <span className="text-white font-semibold">{score}</span>
    </div>
  );
}
