'use client';

import type { AssessmentDimensions } from '@/lib/assessment/types';

interface DimensionBreakdownProps {
  dimensions: AssessmentDimensions;
}

export function DimensionBreakdown({ dimensions }: DimensionBreakdownProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 text-white">14 Dimension Breakdown</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(dimensions).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-white font-semibold">{value}/100</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 transition-all duration-300"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
