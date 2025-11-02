'use client';

import React, { useState } from 'react';
import { Mic, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface AccountAssessmentArtifactProps {
  title?: string;
  subtitle?: string;
  customerName?: string;
  onSubmit?: (answers: {
    opportunityScore: number;
    opportunityReason: string;
    riskScore: number;
    riskReason: string;
    yearOverview: string;
  }) => void;
  onBack?: () => void;
}

export default function AccountAssessmentArtifact({
  title = 'Initial Account Assessment',
  subtitle = 'Share your insights to help create the best strategic plan',
  customerName,
  onSubmit,
  onBack
}: AccountAssessmentArtifactProps) {
  const { showToast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [opportunityScore, setOpportunityScore] = useState<number>(5);
  const [opportunityReason, setOpportunityReason] = useState('');
  const [riskScore, setRiskScore] = useState<number>(5);
  const [riskReason, setRiskReason] = useState('');
  const [yearOverview, setYearOverview] = useState('');

  const totalQuestions = 3;

  const handleMicClick = () => {
    showToast({
      message: 'Voice transcription coming soon!',
      type: 'info',
      icon: 'none',
      duration: 2000
    });
  };

  const handleSubmit = () => {
    onSubmit?.({
      opportunityScore,
      opportunityReason: opportunityReason.trim(),
      riskScore,
      riskReason: riskReason.trim(),
      yearOverview: yearOverview.trim()
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {customerName && (
          <p className="text-sm text-gray-600 mt-1">
            {subtitle} for {customerName}
          </p>
        )}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8 max-w-2xl">
          {/* Question 1: Opportunity Score */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                What&apos;s the opportunity score (1-10)?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Score Slider */}
            <div className="space-y-2 pl-9">
              <input
                type="range"
                min="1"
                max="10"
                value={opportunityScore}
                onChange={(e) => setOpportunityScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low (1)</span>
                <span className="text-lg font-bold text-purple-700">{opportunityScore}</span>
                <span>High (10)</span>
              </div>
            </div>

            {/* Why? */}
            <div className="pl-9">
              <label className="text-xs text-gray-600 mb-1 block">Why?</label>
              <textarea
                value={opportunityReason}
                onChange={(e) => setOpportunityReason(e.target.value)}
                placeholder="Explain your opportunity score..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={3}
              />
            </div>
          </div>

          {/* Question 2: Risk Score */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                What&apos;s the risk score (0-10)?
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Score Slider */}
            <div className="space-y-2 pl-9">
              <input
                type="range"
                min="0"
                max="10"
                value={riskScore}
                onChange={(e) => setRiskScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>None (0)</span>
                <span className="text-lg font-bold text-red-700">{riskScore}</span>
                <span>High (10)</span>
              </div>
            </div>

            {/* Why? */}
            <div className="pl-9">
              <label className="text-xs text-gray-600 mb-1 block">Why?</label>
              <textarea
                value={riskReason}
                onChange={(e) => setRiskReason(e.target.value)}
                placeholder="Explain your risk score..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={3}
              />
            </div>
          </div>

          {/* Question 3: Year Overview */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </span>
              <label className="flex-1 text-sm font-medium text-gray-900">
                Overview of the past year in your own words
              </label>
              <button
                onClick={handleMicClick}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Use voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="pl-9">
              <textarea
                value={yearOverview}
                onChange={(e) => setYearOverview(e.target.value)}
                placeholder="Share your perspective on how things have gone with this account over the past year..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none text-gray-900 placeholder:text-gray-400"
                rows={6}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
