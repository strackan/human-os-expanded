'use client';

import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { SparklesIcon, ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, DocumentTextIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ActionType {
  id: string;
  name: string;
  description: string;
  icon: any;
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

interface SimulationResult {
  mean: number;
  percentiles: {
    p10: number;
    p50: number;
    p90: number;
  };
  confidence: number;
}

interface AnalysisReport {
  revenue: SimulationResult;
  churn: SimulationResult;
  nps: SimulationResult;
  risks: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    confidence: number;
  }>;
  netImpact: {
    summary: string;
    roi: number;
    paybackPeriod: number;
    recommendation: 'proceed' | 'proceed-with-caution' | 'do-not-proceed';
    reasoning: string;
  };
}

const ScenarioModeling = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionValue, setActionValue] = useState<string>('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  const runSimulation = () => {
    setIsAnalyzing(true);
    setShowReport(false);
    
    // Simulate Monte Carlo analysis
    setTimeout(() => {
      const results: AnalysisReport = {
        revenue: {
          mean: 1150000,
          percentiles: {
            p10: 1080000,
            p50: 1150000,
            p90: 1220000
          },
          confidence: 85
        },
        churn: {
          mean: 6.2,
          percentiles: {
            p10: 5.1,
            p50: 6.2,
            p90: 7.4
          },
          confidence: 82
        },
        nps: {
          mean: 42,
          percentiles: {
            p10: 38,
            p50: 42,
            p90: 45
          },
          confidence: 75
        },
        risks: [
          {
            severity: 'high',
            description: 'Enterprise segment shows 15% price sensitivity above 8% increase',
            mitigation: 'Consider tiered pricing approach or extended payment terms'
          },
          {
            severity: 'medium',
            description: 'Potential NPS impact in Mid-Market segment',
            mitigation: 'Bundle additional features or services to increase perceived value'
          },
          {
            severity: 'low',
            description: 'Timing coincides with competitor price adjustments',
            mitigation: 'Emphasize unique value propositions in communication'
          }
        ],
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
          },
          {
            title: 'Value Communication',
            description: 'Highlight platform improvements and ROI metrics in announcement.',
            confidence: 88
          }
        ],
        netImpact: {
          summary: 'The proposed changes show a positive net impact with strong revenue potential despite moderate risks',
          roi: 2.8,
          paybackPeriod: 4.5,
          recommendation: 'proceed-with-caution',
          reasoning: 'While the revenue uplift is significant ($1.15M mean projection), the elevated churn risk in the Enterprise segment requires careful implementation. The positive ROI and manageable payback period support proceeding, but with a measured, segment-specific approach.'
        }
      };
      
      setAnalysisResults(results);
      setIsAnalyzing(false);
      setShowReport(true);
    }, 2000);
  };

  const selectedActionDetails = AVAILABLE_ACTIONS.find(action => action.id === selectedAction);

  const renderReport = () => {
    if (!analysisResults || !analysisResults.netImpact) return null;

    return (
      <div className="space-y-8">
        {/* Net Impact Analysis - New Section at the top */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Net Impact Analysis</h3>
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center mb-4">
              <div className={`
                rounded-full p-2 mr-3
                ${analysisResults.netImpact.recommendation === 'proceed' ? 'bg-green-100 text-green-600' :
                  analysisResults.netImpact.recommendation === 'proceed-with-caution' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'}
              `}>
                {analysisResults.netImpact.recommendation === 'proceed' ? (
                  <ArrowTrendingUpIcon className="h-6 w-6" />
                ) : analysisResults.netImpact.recommendation === 'proceed-with-caution' ? (
                  <ExclamationTriangleIcon className="h-6 w-6" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6" />
                )}
              </div>
              <h4 className="text-lg font-medium text-gray-800">
                {analysisResults.netImpact.recommendation === 'proceed' ? 'Proceed with Implementation' :
                 analysisResults.netImpact.recommendation === 'proceed-with-caution' ? 'Proceed with Caution' :
                 'Do Not Proceed'}
              </h4>
            </div>
            
            <p className="text-gray-600 mb-4">{analysisResults.netImpact.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Expected ROI</span>
                <div className="text-xl font-semibold text-gray-900">{analysisResults.netImpact.roi}x</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-500">Payback Period</span>
                <div className="text-xl font-semibold text-gray-900">{analysisResults.netImpact.paybackPeriod} months</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-2">Detailed Reasoning</h5>
              <p className="text-gray-600">{analysisResults.netImpact.reasoning}</p>
            </div>
          </div>
        </div>

        {/* Existing Simulation Results section */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Simulation Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Impact */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Revenue Impact</h4>
                <span className="text-green-600 text-sm">{analysisResults.revenue.confidence}% confidence</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Expected</span>
                  <span className="font-semibold">${(analysisResults.revenue.mean / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Range (80%)</span>
                  <span className="text-sm">
                    ${(analysisResults.revenue.percentiles.p10 / 1000000).toFixed(1)}M - 
                    ${(analysisResults.revenue.percentiles.p90 / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
            </div>

            {/* Churn Impact */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Churn Impact</h4>
                <span className="text-yellow-600 text-sm">{analysisResults.churn.confidence}% confidence</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Expected</span>
                  <span className="font-semibold">{analysisResults.churn.mean}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Range (80%)</span>
                  <span className="text-sm">
                    {analysisResults.churn.percentiles.p10}% - 
                    {analysisResults.churn.percentiles.p90}%
                  </span>
                </div>
              </div>
            </div>

            {/* NPS Impact */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">NPS Impact</h4>
                <span className="text-yellow-600 text-sm">{analysisResults.nps.confidence}% confidence</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Expected</span>
                  <span className="font-semibold">{analysisResults.nps.mean}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Range (80%)</span>
                  <span className="text-sm">
                    {analysisResults.nps.percentiles.p10} - 
                    {analysisResults.nps.percentiles.p90}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Risk Analysis</h3>
          <div className="space-y-4">
            {analysisResults.risks.map((risk, index) => (
              <div key={index} className="bg-white rounded-lg border p-4">
                <div className="flex items-start">
                  <div className={`
                    rounded-full p-2 mr-3
                    ${risk.severity === 'high' ? 'bg-red-100 text-red-600' :
                      risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'}
                  `}>
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">{risk.description}</h4>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Mitigation: </span>
                      {risk.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Strategic Recommendations</h3>
          <div className="space-y-4">
            {analysisResults.recommendations.map((rec, index) => (
              <div key={index} className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start">
                  <SparklesIcon className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900">{rec.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                    <div className="mt-2 flex items-center">
                      <div className="h-1.5 w-24 bg-blue-200 rounded-full">
                        <div
                          className="h-1.5 bg-blue-600 rounded-full"
                          style={{ width: `${rec.confidence}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-blue-600">{rec.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Scenario Modeling</h1>
            
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`flex items-center ${selectedAction ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${selectedAction ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                      1
                    </div>
                    <span className="ml-2 font-medium">Select Action</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`flex items-center ${actionValue ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${actionValue ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                      2
                    </div>
                    <span className="ml-2 font-medium">Configure Value</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`flex items-center ${selectedSegments.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${selectedSegments.length > 0 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                      3
                    </div>
                    <span className="ml-2 font-medium">Select Segments</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`flex items-center ${showReport ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${showReport ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                      4
                    </div>
                    <span className="ml-2 font-medium">Generate Report</span>
                  </div>
                </div>
              </div>
            </div>

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
                        placeholder="Enter value"
                      />
                      {selectedActionDetails?.inputType === 'percentage' && (
                        <span className="ml-2 text-gray-700">%</span>
                      )}
                      {selectedActionDetails?.inputType === 'currency' && (
                        <span className="ml-2 text-gray-700">$</span>
                      )}
                    </div>
                  </div>

                  {actionValue && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        3. Target Segments
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
                  )}
                </div>
              </div>
            )}

            {/* Generate Report Button */}
            {selectedAction && actionValue && selectedSegments.length > 0 && !showReport && (
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-900">4. Ready to Generate Report</h2>
                    <p className="text-sm text-blue-700 mt-1">
                      Run Monte Carlo simulation to analyze potential outcomes and risks
                    </p>
                  </div>
                  <button
                    onClick={runSimulation}
                    disabled={isAnalyzing}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Running Simulation...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Report */}
            {showReport && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-8">Analysis Report</h2>
                  {renderReport()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioModeling; 