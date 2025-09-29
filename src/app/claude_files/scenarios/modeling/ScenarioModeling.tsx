'use client';

import React, { useState } from 'react';
import { SparklesIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import '@/styles/progress-indicators.css';

interface ActionType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  inputType: 'percentage' | 'currency' | 'number';
}

const AVAILABLE_ACTIONS: ActionType[] = [
  {
    id: 'price_increase',
    name: 'Price Increase',
    description: 'Increase prices across selected segments',
    icon: CurrencyDollarIcon,
    inputType: 'percentage'
  },
  {
    id: 'nrr_improvement',
    name: 'NRR Improvement',
    description: 'Actions to improve Net Revenue Retention',
    icon: ChartBarIcon,
    inputType: 'percentage'
  },
  {
    id: 'satisfaction_boost',
    name: 'Satisfaction Improvement',
    description: 'Initiatives to increase customer satisfaction',
    icon: SparklesIcon,
    inputType: 'number'
  }
];

interface AnalysisResults {
  revenue: {
    current: number;
    projected: number;
    percentageIncrease: number;
  };
  churn: {
    current: number;
    projected: number;
    confidence: number;
  };
  nps: {
    current: number;
    projected: number;
    confidence: number;
  };
  recommendations: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
}

const ScenarioModeling = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionValue, setActionValue] = useState<string>('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setAnalysisResults({
        revenue: {
          current: 1000000,
          projected: 1150000,
          percentageIncrease: 15
        },
        churn: {
          current: 5,
          projected: 6.2,
          confidence: 85
        },
        nps: {
          current: 45,
          projected: 42,
          confidence: 75
        },
        recommendations: [
          {
            title: 'Segment-Specific Approach',
            description: 'Enterprise customers show higher price tolerance. Consider a tiered increase.',
            confidence: 90
          },
          {
            title: 'Timing Recommendation',
            description: 'Historical data suggests Q2 implementations have lowest churn impact.',
            confidence: 85
          }
        ]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const selectedActionDetails = AVAILABLE_ACTIONS.find(action => action.id === selectedAction);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Scenario Modeling</h1>
            
            {/* Action Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">1. Select Action</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AVAILABLE_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setSelectedAction(action.id)}
                    className={`p-4 rounded-lg border ${
                      selectedAction === action.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-center">
                      <action.icon className="h-6 w-6 text-blue-500 mr-3" />
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{action.name}</h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Configuration */}
            {selectedAction && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">2. Configure Action</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedActionDetails?.name} Value
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={selectedActionDetails?.inputType === 'percentage' ? '10' : '100'}
                      />
                      {selectedActionDetails?.inputType === 'percentage' && (
                        <span className="ml-2 text-gray-700">%</span>
                      )}
                      {selectedActionDetails?.inputType === 'currency' && (
                        <span className="ml-2 text-gray-700">$</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Segments
                    </label>
                    <div className="space-y-2">
                      {['Enterprise', 'Mid-Market', 'SMB'].map((segment) => (
                        <label key={segment} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSegments.includes(segment)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSegments([...selectedSegments, segment]);
                              } else {
                                setSelectedSegments(selectedSegments.filter(s => s !== segment));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">{segment}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Impact Analysis */}
            {selectedAction && actionValue && selectedSegments.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">3. Impact Analysis</h2>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Analyze Impact
                      </>
                    )}
                  </button>
                </div>

                {analysisResults && (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-500">Revenue Impact</h3>
                          <span className="text-green-600 text-sm">+{analysisResults.revenue.percentageIncrease}%</span>
                        </div>
                        <div className="mt-2 flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            ${(analysisResults.revenue.projected / 1000000).toFixed(1)}M
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            from ${(analysisResults.revenue.current / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-500">Projected Churn</h3>
                          <span className="text-yellow-600 text-sm">
                            {analysisResults.churn.confidence}% confidence
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {analysisResults.churn.projected}%
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            from {analysisResults.churn.current}%
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-500">NPS Impact</h3>
                          <span className="text-yellow-600 text-sm">
                            {analysisResults.nps.confidence}% confidence
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline">
                          <p className="text-2xl font-semibold text-gray-900">
                            {analysisResults.nps.projected}
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            from {analysisResults.nps.current}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">AI Recommendations</h3>
                      <div className="space-y-4">
                        {analysisResults.recommendations.map((rec, index: number) => (
                          <div key={index} className="flex items-start">
                            <SparklesIcon className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                            <div>
                              <h4 className="font-medium text-blue-900">{rec.title}</h4>
                              <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                              <div className="mt-1 flex items-center">
                                <div className="progress-bar-track bg-blue-200">
                                  <div
                                    className="progress-bar-fill bg-blue-600 progress-bar"
                                    style={{ width: `${rec.confidence}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm text-blue-600">{rec.confidence}% confidence</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioModeling; 