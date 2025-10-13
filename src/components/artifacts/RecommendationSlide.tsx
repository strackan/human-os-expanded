'use client';

import React from 'react';
import { CheckCircle, TrendingUp, AlertTriangle, Target, ChevronRight } from 'lucide-react';

interface Reason {
  icon: 'check' | 'trending' | 'alert' | 'target';
  text: string;
  highlight?: boolean;
}

interface RecommendationSlideProps {
  recommendationType?: string;
  reasons?: Reason[];
  confidenceScore?: number;
  onProceed?: () => void;
  onGoBack?: () => void;
}

export default function RecommendationSlide({
  recommendationType = 'Strategic Account Plan',
  reasons = [
    {
      icon: 'alert',
      text: 'High churn risk detected (customer evaluating competitors)',
      highlight: true
    },
    {
      icon: 'trending',
      text: 'Significant expansion opportunity identified ($1.7M initiative)',
      highlight: false
    },
    {
      icon: 'check',
      text: 'Executive engagement needed to rebuild trust',
      highlight: false
    },
    {
      icon: 'target',
      text: 'Complex renewal situation requires strategic planning',
      highlight: false
    },
    {
      icon: 'alert',
      text: 'Unresolved technical issues impacting relationship',
      highlight: false
    }
  ],
  confidenceScore = 92,
  onProceed,
  onGoBack
}: RecommendationSlideProps) {

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'check':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'target':
        return <Target className="w-5 h-5 text-purple-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Hero Section */}
      <div className="px-8 py-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            AI Recommendation
          </div>

          <h1 className="text-3xl font-bold mb-3">
            We Recommend: {recommendationType}
          </h1>

          <p className="text-purple-100 text-lg">
            Based on the information you've provided, a strategic approach will give you the best chance of success.
          </p>

          {/* Confidence Score */}
          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
            <span className="text-sm font-medium text-purple-100">Confidence</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{confidenceScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reasons Section */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Here's why:</h2>

          <div className="space-y-4">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  reason.highlight
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(reason.icon)}
                </div>
                <p className={`text-sm leading-relaxed ${
                  reason.highlight ? 'text-gray-900 font-medium' : 'text-gray-700'
                }`}>
                  {reason.text}
                </p>
              </div>
            ))}
          </div>

          {/* What's Next */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              We'll guide you through creating a comprehensive strategic account plan with clear action items,
              timelines, and success metrics. You'll be able to review and modify the plan before finalizing.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Back to Questions
          </button>
        )}

        <div className="flex-1"></div>

        {onProceed && (
          <button
            onClick={onProceed}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            Proceed to Create Plan
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
