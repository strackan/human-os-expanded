'use client';

import React from 'react';

/**
 * Report data structure
 */
export interface ReportData {
  customer: string;
  healthScore?: string;
  riskScore?: string;
  keyRisks?: string[];
  opportunities?: string[];
  [key: string]: any;
}

/**
 * ReportArtifact Props
 */
interface ReportArtifactProps {
  data: ReportData;
}

/**
 * ReportArtifact Component
 *
 * Displays analytical reports with risks and opportunities.
 * Used for health checks and risk assessments.
 */
export function ReportArtifact({ data }: ReportArtifactProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b">
        <h4 className="text-lg font-bold text-gray-900">{data.customer}</h4>
        <p className="text-sm text-gray-500">Health Analysis Report</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        {data.healthScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Health Score
            </label>
            <p className="mt-1 text-2xl font-bold text-blue-600">{data.healthScore}</p>
          </div>
        )}

        {data.riskScore && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <label className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Risk Score
            </label>
            <p className="mt-1 text-2xl font-bold text-orange-600">{data.riskScore}</p>
          </div>
        )}
      </div>

      {/* Key Risks */}
      {data.keyRisks && data.keyRisks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-red-900 mb-3 block flex items-center">
            <span className="mr-2">⚠️</span>
            Key Risks
          </label>
          <ul className="space-y-2">
            {data.keyRisks.map((risk, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="text-red-600 mr-2">•</span>
                <span className="text-red-800">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opportunities */}
      {data.opportunities && data.opportunities.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <label className="text-sm font-semibold text-green-900 mb-3 block flex items-center">
            <span className="mr-2">💡</span>
            Opportunities
          </label>
          <ul className="space-y-2">
            {data.opportunities.map((opportunity, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-green-800">{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Fields */}
      {Object.keys(data)
        .filter(key => !['customer', 'healthScore', 'riskScore', 'keyRisks', 'opportunities'].includes(key))
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
