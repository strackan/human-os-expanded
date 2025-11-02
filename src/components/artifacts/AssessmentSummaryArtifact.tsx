'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface AssessmentSummaryArtifactProps {
  customerName: string;
  assessmentData: {
    opportunityScore?: number;
    opportunityReason?: string;
    riskScore?: number;
    riskReason?: string;
    yearOverview?: string;
  };
}

export default function AssessmentSummaryArtifact({
  customerName,
  assessmentData
}: AssessmentSummaryArtifactProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Assessment Summary for {customerName}
          </h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Review your responses below
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Opportunity Score */}
        {assessmentData.opportunityScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Opportunity Score</h3>
              <span className="text-2xl font-bold text-purple-600">
                {assessmentData.opportunityScore}/10
              </span>
            </div>
            {assessmentData.opportunityReason && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 italic">
                  &quot;{assessmentData.opportunityReason}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Risk Score */}
        {assessmentData.riskScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Risk Score</h3>
              <span className="text-2xl font-bold text-red-600">
                {assessmentData.riskScore}/10
              </span>
            </div>
            {assessmentData.riskReason && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 italic">
                  &quot;{assessmentData.riskReason}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Year Overview */}
        {assessmentData.yearOverview && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Year Overview</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700 italic">
                &quot;{assessmentData.yearOverview}&quot;
              </p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">i</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Interview Record
              </h4>
              <p className="text-sm text-blue-800">
                This assessment will be saved to the official record and used to inform the strategic recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
