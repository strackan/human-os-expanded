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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'target':
        return <Target className="w-4 h-4 text-gray-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header Section */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-medium text-gray-900">
            {recommendationType}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Confidence</span>
            <span className="text-sm font-medium text-gray-900">{confidenceScore}%</span>
          </div>
        </div>
      </div>

      {/* Reasons Section */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Key Factors</h2>

          <div className="space-y-2">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  reason.highlight
                    ? 'bg-orange-50/50 border-orange-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(reason.icon)}
                </div>
                <p className={`text-sm leading-relaxed ${
                  reason.highlight ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {reason.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        {onProceed && (
          <button
            onClick={onProceed}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
