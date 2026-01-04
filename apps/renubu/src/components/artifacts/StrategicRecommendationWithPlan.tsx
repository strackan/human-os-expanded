'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, CheckSquare, CheckCircle, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface Reason {
  icon: 'check' | 'trending' | 'alert' | 'target';
  text: string;
  highlight?: boolean;
}

interface WorkflowStep {
  day: number;
  title: string;
  description: string;
  actions: string[];
}

interface StrategicRecommendationWithPlanProps {
  customerName: string;
  strategyType: 'expand' | 'invest' | 'protect';
  renewalDate?: string;
  currentARR?: string;
  healthScore?: number;
  growthPotential?: number;
  riskLevel?: number;
  reasons?: Reason[];
  workflowSteps?: WorkflowStep[];
  onModify?: () => void;
  onAgree?: () => void;
  onComeBack?: () => void;
}

const strategyInfo = {
  expand: {
    color: 'border-green-200',
    bgColor: 'bg-green-50/30',
    textColor: 'text-green-700',
    title: 'Expand',
    description: 'Growth-focused strategy to increase ARR and adoption'
  },
  invest: {
    color: 'border-blue-200',
    bgColor: 'bg-blue-50/30',
    textColor: 'text-blue-700',
    title: 'Invest',
    description: 'Partnership development for long-term strategic value'
  },
  protect: {
    color: 'border-red-200',
    bgColor: 'bg-red-50/30',
    textColor: 'text-red-700',
    title: 'Protect',
    description: 'Retention & recovery to prevent churn'
  }
};

export default function StrategicRecommendationWithPlan({
  customerName,
  strategyType,
  renewalDate,
  currentARR,
  healthScore,
  growthPotential,
  riskLevel,
  reasons = [],
  workflowSteps = [],
  onModify,
  onAgree,
  onComeBack
}: StrategicRecommendationWithPlanProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'factors' | 'timeline'>('overview');
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  const strategy = strategyInfo[strategyType];

  const toggleStep = (index: number) => {
    setExpandedSteps(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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
      {/* Strategy Header */}
      <div className={`px-8 py-4 border-b border-l-4 ${strategy.color} ${strategy.bgColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-gray-900">Recommendation:</h2>
              <span className={`text-base font-semibold ${strategy.textColor}`}>{strategy.title}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{strategy.description}</p>
            <p className="text-sm text-gray-700 mt-1.5">{customerName}</p>
          </div>
        </div>
      </div>

      {/* Account Summary - Compact */}
      <div className="px-8 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-6 text-xs">
          {renewalDate && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Renewal:</span>
              <span className="font-medium text-gray-900">{renewalDate}</span>
            </div>
          )}
          {currentARR && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">ARR:</span>
              <span className="font-medium text-gray-900">{currentARR}</span>
            </div>
          )}
          {healthScore !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Health:</span>
              <span className="font-medium text-gray-900">{healthScore}%</span>
            </div>
          )}
          {growthPotential !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Growth:</span>
              <span className="font-medium text-gray-900">{growthPotential}%</span>
            </div>
          )}
          {riskLevel !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Risk:</span>
              <span className="font-medium text-gray-900">{riskLevel}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 pt-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`pb-3 pt-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'factors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Key Factors
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 pt-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'overview' && (
          <div className="max-w-3xl space-y-6">
            {/* Strategy Recommendation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Strategic Approach</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {strategy.description}
              </p>
            </div>

            {/* Why This Strategy */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Why This Strategy?</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {strategyType === 'expand' &&
                  "This account shows strong indicators for expansion - solid product adoption, growth trajectory, and untapped potential. By proactively engaging now, we can capture additional value while strengthening the partnership."
                }
                {strategyType === 'invest' &&
                  "This account represents a strategic partnership opportunity. By investing in deeper relationships and co-innovation, we can create mutual value and position for long-term growth."
                }
                {strategyType === 'protect' &&
                  "This account shows risk indicators that require immediate attention. A protect strategy focuses on stabilizing the relationship, addressing concerns, and rebuilding trust to secure the renewal."
                }
              </p>
            </div>

            {/* Top Priorities */}
            {reasons.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Priorities</h3>
                <div className="space-y-2">
                  {reasons.slice(0, 3).map((reason, index) => (
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
                      <p className="text-sm text-gray-700">{reason.text}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  See "Key Factors" tab for complete analysis
                </p>
              </div>
            )}

            {/* Expected Outcomes */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Expected Outcomes</h3>
              <ul className="space-y-2">
                {strategyType === 'expand' && (
                  <>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Increased ARR through upsell or seat expansion</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Deeper product adoption across departments</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Strengthened executive relationships</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Multi-year renewal with improved terms</span>
                    </li>
                  </>
                )}
                {strategyType === 'invest' && (
                  <>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Executive-level strategic partnership</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Co-innovation opportunities and product feedback</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Reference customer and advocacy opportunities</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Long-term multi-year commitment</span>
                    </li>
                  </>
                )}
                {strategyType === 'protect' && (
                  <>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Stabilized relationship and improved health score</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Resolution of critical issues and concerns</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Secured renewal commitment</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Rebuilt trust and foundation for future growth</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Timeline Preview */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Execution Timeline</h3>
              <p className="text-sm text-gray-600 mb-3">
                {workflowSteps.length > 0 ? (
                  <>
                    {workflowSteps.length}-phase plan spanning {workflowSteps[workflowSteps.length - 1]?.day || 180} days
                  </>
                ) : (
                  '180-day strategic execution plan'
                )}
              </p>
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View detailed timeline →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Analysis Summary</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Based on our assessment of account health, usage patterns, customer feedback, and market dynamics,
                we've identified the following key factors that inform this strategic recommendation.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Critical Factors</h3>
              <div className="space-y-2">
                {reasons.filter(r => r.highlight).map((reason, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg border-2 bg-orange-50/50 border-orange-200"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(reason.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {reason.text}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">High priority - requires immediate attention</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {reasons.filter(r => !r.highlight).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Supporting Factors</h3>
                <div className="space-y-2">
                  {reasons.filter(r => !r.highlight).map((reason, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 border-gray-100"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(reason.icon)}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {reason.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sources */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-3">Analysis Based On</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Account assessment inputs</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Usage analytics</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Customer health metrics</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Market benchmarking</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-2">
            {workflowSteps.map((step, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => toggleStep(index)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-medium flex-shrink-0">
                      Day {step.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                      {!expandedSteps.includes(index) && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{step.description}</p>
                      )}
                    </div>
                  </div>
                  {expandedSteps.includes(index) ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {expandedSteps.includes(index) && (
                  <div className="px-3 pb-3 pt-2 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-700 mb-2 leading-relaxed">{step.description}</p>
                    <div className="bg-white rounded p-2 border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-gray-400" />
                        Action Items
                      </p>
                      <ul className="space-y-1.5">
                        {step.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="mt-0.5 w-3.5 h-3.5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {(onModify || onAgree || onComeBack) && (
        <div className="px-8 py-4 border-t border-gray-100 bg-white flex gap-3 flex-shrink-0">
          {onModify && (
            <button
              onClick={onModify}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
            >
              Modify
            </button>
          )}

          {onComeBack && (
            <button
              onClick={onComeBack}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
            >
              Save for Later
            </button>
          )}

          <div className="flex-1"></div>

          {onAgree && (
            <button
              onClick={onAgree}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
