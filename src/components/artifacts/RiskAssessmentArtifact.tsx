'use client';

import React from 'react';
import {
  AlertTriangle, Shield, TrendingDown, TrendingUp, Users, DollarSign,
  Activity, Clock, ChevronRight, AlertCircle, CheckCircle, MinusCircle
} from 'lucide-react';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type TrendDirection = 'improving' | 'stable' | 'declining';

interface RiskFactor {
  id: string;
  category: 'relationship' | 'usage' | 'competitive' | 'financial' | 'operational';
  name: string;
  level: RiskLevel;
  trend: TrendDirection;
  description: string;
  indicators: string[];
  mitigations?: string[];
}

interface RiskAssessmentArtifactProps {
  customerName: string;
  overallRiskScore?: number; // 0-100 (lower is better)
  riskFactors?: RiskFactor[];
  lastAssessmentDate?: string;
  onContinue?: () => void;
  onBack?: () => void;
}

// Default risk factors for demo
const DEFAULT_RISK_FACTORS: RiskFactor[] = [
  {
    id: '1',
    category: 'relationship',
    name: 'Champion Risk',
    level: 'low',
    trend: 'stable',
    description: 'Primary champion Sarah Johnson remains engaged and supportive.',
    indicators: [
      'Regular QBR attendance (4/4 last year)',
      'Active product advocate on LinkedIn',
      'Referred 2 peer companies',
    ],
    mitigations: [
      'Continue nurturing relationship with regular touchpoints',
      'Build relationship with new VP of HR as backup champion',
    ],
  },
  {
    id: '2',
    category: 'competitive',
    name: 'Competitive Threat',
    level: 'medium',
    trend: 'stable',
    description: 'New VP of HR previously used competitor product at Stripe.',
    indicators: [
      'Jennifer Walsh joined from competitor-using company',
      'No active RFP or evaluation signals detected',
      'Industry peers also evaluating alternatives',
    ],
    mitigations: [
      'Schedule product demo focused on differentiators',
      'Share competitive comparison materials proactively',
      'Accelerate value delivery on requested integrations',
    ],
  },
  {
    id: '3',
    category: 'usage',
    name: 'Usage Decline',
    level: 'low',
    trend: 'improving',
    description: 'Usage metrics are strong and growing year-over-year.',
    indicators: [
      '+28% YoY active user growth',
      '110% license utilization (positive signal)',
      'Feature adoption rate above benchmark',
    ],
  },
  {
    id: '4',
    category: 'financial',
    name: 'Budget Constraints',
    level: 'low',
    trend: 'improving',
    description: 'Recent Series C funding removes budget concerns.',
    indicators: [
      '$45M Series C closed 2 weeks ago',
      'Expansion to London planned for Q2',
      'No signals of budget cuts or freezes',
    ],
  },
  {
    id: '5',
    category: 'operational',
    name: 'Integration Dependency',
    level: 'medium',
    trend: 'stable',
    description: 'Customer requesting Greenhouse API integration not yet available.',
    indicators: [
      'Feature request submitted 1 month ago',
      'Workaround in place but not ideal',
      'Integration on roadmap for Q2',
    ],
    mitigations: [
      'Provide timeline update on integration development',
      'Offer beta access when available',
      'Ensure current workaround is well-supported',
    ],
  },
];

export default function RiskAssessmentArtifact({
  customerName,
  overallRiskScore = 25,
  riskFactors = DEFAULT_RISK_FACTORS,
  lastAssessmentDate = new Date().toLocaleDateString(),
  onContinue,
  onBack
}: RiskAssessmentArtifactProps) {

  const getRiskLevelConfig = (level: RiskLevel) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', label: 'Critical', icon: AlertCircle };
      case 'high': return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', label: 'High', icon: AlertTriangle };
      case 'medium': return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', label: 'Medium', icon: MinusCircle };
      case 'low': return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', label: 'Low', icon: CheckCircle };
    }
  };

  const getTrendConfig = (trend: TrendDirection) => {
    switch (trend) {
      case 'improving': return { icon: TrendingUp, color: 'text-green-600', label: 'Improving' };
      case 'stable': return { icon: Activity, color: 'text-gray-500', label: 'Stable' };
      case 'declining': return { icon: TrendingDown, color: 'text-red-600', label: 'Declining' };
    }
  };

  const getCategoryConfig = (category: RiskFactor['category']) => {
    switch (category) {
      case 'relationship': return { icon: Users, color: 'text-purple-600', label: 'Relationship' };
      case 'usage': return { icon: Activity, color: 'text-blue-600', label: 'Usage' };
      case 'competitive': return { icon: Shield, color: 'text-orange-600', label: 'Competitive' };
      case 'financial': return { icon: DollarSign, color: 'text-green-600', label: 'Financial' };
      case 'operational': return { icon: Clock, color: 'text-gray-600', label: 'Operational' };
    }
  };

  const getOverallRiskLabel = (score: number) => {
    if (score <= 20) return { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50' };
    if (score <= 40) return { label: 'Moderate Risk', color: 'text-amber-600', bg: 'bg-amber-50' };
    if (score <= 60) return { label: 'Elevated Risk', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const overallRiskConfig = getOverallRiskLabel(overallRiskScore);

  // Count risks by level
  const riskCounts = {
    critical: riskFactors.filter(r => r.level === 'critical').length,
    high: riskFactors.filter(r => r.level === 'high').length,
    medium: riskFactors.filter(r => r.level === 'medium').length,
    low: riskFactors.filter(r => r.level === 'low').length,
  };

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header with Overall Risk Score */}
      <div className={`px-6 py-5 border-b border-gray-100 ${overallRiskConfig.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              Risk Assessment
            </h2>
            <p className="text-sm text-gray-600 mt-1">Renewal risk factors for {customerName}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${overallRiskConfig.bg} border ${
              overallRiskScore <= 20 ? 'border-green-200' :
              overallRiskScore <= 40 ? 'border-amber-200' :
              overallRiskScore <= 60 ? 'border-orange-200' : 'border-red-200'
            }`}>
              <span className={`text-lg font-bold ${overallRiskConfig.color}`}>{overallRiskScore}</span>
              <span className={`text-sm font-medium ${overallRiskConfig.color}`}>{overallRiskConfig.label}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Last updated: {lastAssessmentDate}</p>
          </div>
        </div>
      </div>

      {/* Risk Summary Bar */}
      <div className="grid grid-cols-4 gap-px bg-gray-200 border-b border-gray-200">
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Critical</p>
          <p className={`text-lg font-bold ${riskCounts.critical > 0 ? 'text-red-600' : 'text-gray-300'}`}>
            {riskCounts.critical}
          </p>
        </div>
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">High</p>
          <p className={`text-lg font-bold ${riskCounts.high > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
            {riskCounts.high}
          </p>
        </div>
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Medium</p>
          <p className={`text-lg font-bold ${riskCounts.medium > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
            {riskCounts.medium}
          </p>
        </div>
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Low</p>
          <p className={`text-lg font-bold ${riskCounts.low > 0 ? 'text-green-600' : 'text-gray-300'}`}>
            {riskCounts.low}
          </p>
        </div>
      </div>

      {/* Risk Factors List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Assessment Summary (moved to top per user feedback) */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Assessment Summary</p>
              <p className="text-sm text-gray-600 mt-1">
                {overallRiskScore <= 30
                  ? 'This account presents low renewal risk. Focus on expansion opportunities while maintaining strong champion relationships.'
                  : overallRiskScore <= 50
                  ? 'Moderate risk factors identified. Address competitive and operational concerns proactively during renewal discussions.'
                  : 'Elevated risk requires immediate attention. Prioritize relationship building and value demonstration before renewal.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {riskFactors.map((risk) => {
            const levelConfig = getRiskLevelConfig(risk.level);
            const trendConfig = getTrendConfig(risk.trend);
            const categoryConfig = getCategoryConfig(risk.category);
            const LevelIcon = levelConfig.icon;
            const TrendIcon = trendConfig.icon;
            const CategoryIcon = categoryConfig.icon;

            return (
              <div
                key={risk.id}
                className={`border-2 rounded-xl overflow-hidden ${levelConfig.border} ${levelConfig.bg}`}
              >
                {/* Risk Header */}
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${levelConfig.text}`}>
                        <LevelIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{risk.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-white/60 ${categoryConfig.color}`}>
                            <CategoryIcon className="w-3 h-3" />
                            {categoryConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${levelConfig.bg} ${levelConfig.text} border ${levelConfig.border}`}>
                        {levelConfig.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs ${trendConfig.color}`}>
                        <TrendIcon className="w-3 h-3" />
                        {trendConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indicators */}
                <div className="px-4 py-3 bg-white/50 border-t border-gray-200/50">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Risk Indicators
                  </p>
                  <ul className="space-y-1">
                    {risk.indicators.map((indicator, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className={risk.level === 'low' ? 'text-green-500' : 'text-amber-500'}>•</span>
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mitigations (if any) */}
                {risk.mitigations && risk.mitigations.length > 0 && (
                  <div className="px-4 py-3 bg-blue-50/50 border-t border-blue-100">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Recommended Actions
                    </p>
                    <ul className="space-y-1">
                      {risk.mitigations.map((mitigation, i) => (
                        <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-500">→</span>
                          <span>{mitigation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      {(onBack || onContinue) && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-3 bg-gray-50">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
            >
              Back
            </button>
          ) : <div />}

          {onContinue && (
            <button
              onClick={onContinue}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
