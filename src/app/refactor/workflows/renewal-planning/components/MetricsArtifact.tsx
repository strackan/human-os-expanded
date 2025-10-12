'use client';

import React from 'react';

/**
 * Metrics data structure
 */
export interface MetricsData {
  customer: string;
  arr?: string;
  healthScore?: string;
  usage?: string;
  engagement?: string;
  growth?: string;
  [key: string]: any;
}

/**
 * MetricsArtifact Props
 */
interface MetricsArtifactProps {
  data: MetricsData;
}

/**
 * MetricsArtifact Component
 *
 * Displays customer metrics in a dashboard-style layout.
 * Used for QBR and analytics workflows.
 */
export function MetricsArtifact({ data }: MetricsArtifactProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b">
        <h4 className="text-lg font-bold text-gray-900">{data.customer}</h4>
        <p className="text-sm text-gray-500">Performance Metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* ARR */}
        {data.arr && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Annual Recurring Revenue
            </label>
            <p className="mt-1 text-2xl font-bold text-green-600">{data.arr}</p>
          </div>
        )}

        {/* Health Score */}
        {data.healthScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Health Score
            </label>
            <p className="mt-1 text-2xl font-bold text-blue-600">{data.healthScore}</p>
          </div>
        )}
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-4">
        {data.usage && (
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Usage Metrics
            </label>
            <p className="text-gray-600 text-sm">{data.usage}</p>
          </div>
        )}

        {data.engagement && (
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Engagement
            </label>
            <p className="text-gray-600 text-sm">{data.engagement}</p>
          </div>
        )}

        {data.growth && (
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Growth Trends
            </label>
            <p className="text-gray-600 text-sm">{data.growth}</p>
          </div>
        )}
      </div>

      {/* Additional Fields */}
      {Object.keys(data)
        .filter(key => !['customer', 'arr', 'healthScore', 'usage', 'engagement', 'growth'].includes(key))
        .map(key => (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <p className="text-gray-600 text-sm">{String(data[key])}</p>
          </div>
        ))}
    </div>
  );
}
