'use client';

import React from 'react';
import {
  TrendingUp, DollarSign, ChevronRight, Users, Activity,
  AlertTriangle, Target, Zap, ArrowUpRight, Package, Sparkles
} from 'lucide-react';

interface ContractInfo {
  licenseCount: number;
  pricePerSeat: number;
  annualSpend: number;
  renewalDate: string;
  renewalDays: number;
}

interface UsageInfo {
  activeUsers: number;
  utilizationPercent: number;
  yoyGrowth: number;
}

interface MarketInfo {
  currentPrice: number;
  marketAverage: number;
  percentile: number;
  opportunityValue: string;
}

interface ExpansionOpportunity {
  id: string;
  type: 'seats' | 'tier' | 'feature' | 'multi-year';
  title: string;
  description: string;
  potentialValue: string;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

interface ExpansionOverviewArtifactProps {
  customerName: string;
  contractInfo: ContractInfo;
  usageInfo: UsageInfo;
  marketInfo: MarketInfo;
  opportunities?: ExpansionOpportunity[];
  onContinue?: () => void;
  onBack?: () => void;
}

// Default opportunities for demo
const DEFAULT_OPPORTUNITIES: ExpansionOpportunity[] = [
  {
    id: '1',
    type: 'tier',
    title: 'Enterprise Tier Upgrade',
    description: 'Customer has expressed interest in advanced features available in Enterprise tier, particularly API access and custom integrations.',
    potentialValue: '+$36,000 ARR',
    confidence: 'high',
    signals: [
      'Requested Greenhouse API integration',
      'Growing team needs advanced workflows',
      'Series C funding enables larger investment',
    ],
  },
  {
    id: '2',
    type: 'seats',
    title: 'Seat Expansion',
    description: 'Current usage exceeds licensed capacity. London office expansion creates additional seat requirements.',
    potentialValue: '+$18,000 ARR',
    confidence: 'high',
    signals: [
      '110% utilization (55 users / 50 seats)',
      'London office opening Q2 - 15+ new hires',
      'YoY growth trajectory of 28%',
    ],
  },
  {
    id: '3',
    type: 'feature',
    title: 'Premium Employer Branding',
    description: 'Strong brand health metrics indicate readiness for premium visibility packages.',
    potentialValue: '+$12,000 ARR',
    confidence: 'medium',
    signals: [
      '92 health score - above benchmark',
      'Active social advocacy from champions',
      'Expanding talent acquisition focus',
    ],
  },
  {
    id: '4',
    type: 'multi-year',
    title: 'Multi-Year Commitment',
    description: 'Strong relationship and growth trajectory make this an ideal candidate for multi-year agreement with volume discount.',
    potentialValue: 'Lock-in + 10% uplift',
    confidence: 'medium',
    signals: [
      '2 internal champions identified',
      'High satisfaction scores',
      'Strategic vendor consolidation initiative',
    ],
  },
];

export default function ExpansionOverviewArtifact({
  customerName,
  contractInfo,
  usageInfo,
  marketInfo,
  opportunities = DEFAULT_OPPORTUNITIES,
  onContinue,
  onBack
}: ExpansionOverviewArtifactProps) {
  const isOverCapacity = usageInfo.utilizationPercent > 100;

  const getOpportunityIcon = (type: ExpansionOpportunity['type']) => {
    switch (type) {
      case 'seats': return <Users className="w-5 h-5" />;
      case 'tier': return <ArrowUpRight className="w-5 h-5" />;
      case 'feature': return <Package className="w-5 h-5" />;
      case 'multi-year': return <Target className="w-5 h-5" />;
    }
  };

  const getConfidenceStyle = (confidence: ExpansionOpportunity['confidence']) => {
    switch (confidence) {
      case 'high': return { bg: 'bg-green-100', text: 'text-green-700', label: 'High Confidence' };
      case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium Confidence' };
      case 'low': return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Exploratory' };
    }
  };

  const getOpportunityColor = (type: ExpansionOpportunity['type']) => {
    switch (type) {
      case 'seats': return 'border-blue-200 bg-blue-50';
      case 'tier': return 'border-purple-200 bg-purple-50';
      case 'feature': return 'border-green-200 bg-green-50';
      case 'multi-year': return 'border-amber-200 bg-amber-50';
    }
  };

  // Calculate total potential
  const totalPotential = opportunities
    .filter(o => o.potentialValue.includes('$'))
    .reduce((sum, o) => {
      const match = o.potentialValue.match(/\$([0-9,]+)/);
      return sum + (match ? parseInt(match[1].replace(',', '')) : 0);
    }, 0);

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header with Summary Stats */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Expansion Opportunities
            </h2>
            <p className="text-sm text-gray-600 mt-1">Growth potential for {customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Potential</p>
            <p className="text-2xl font-bold text-green-600">+${totalPotential.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Annual Revenue</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-px bg-gray-200 border-b border-gray-200">
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Current ARR</p>
          <p className="text-lg font-bold text-gray-900">${contractInfo.annualSpend.toLocaleString()}</p>
        </div>
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Utilization</p>
          <p className={`text-lg font-bold ${isOverCapacity ? 'text-red-600' : 'text-green-600'}`}>
            {usageInfo.utilizationPercent}%
          </p>
        </div>
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">YoY Growth</p>
          <p className="text-lg font-bold text-blue-600">+{usageInfo.yoyGrowth}%</p>
        </div>
        <div className="bg-white px-4 py-3 text-center">
          <p className="text-xs text-gray-500">Price vs Market</p>
          <p className="text-lg font-bold text-amber-600">{marketInfo.percentile}th %ile</p>
        </div>
      </div>

      {/* Capacity Alert (if over) */}
      {isOverCapacity && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Capacity Exceeded</p>
            <p className="text-xs text-red-600">
              {usageInfo.activeUsers || Math.round(contractInfo.licenseCount * usageInfo.utilizationPercent / 100)} active users vs {contractInfo.licenseCount} licensed seats - immediate expansion recommended
            </p>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {opportunities.map((opportunity) => {
            const confidenceStyle = getConfidenceStyle(opportunity.confidence);

            return (
              <div
                key={opportunity.id}
                className={`border-2 rounded-xl overflow-hidden ${getOpportunityColor(opportunity.type)}`}
              >
                {/* Opportunity Header */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${
                    opportunity.type === 'seats' ? 'text-blue-600' :
                    opportunity.type === 'tier' ? 'text-purple-600' :
                    opportunity.type === 'feature' ? 'text-green-600' :
                    'text-amber-600'
                  }`}>
                    {getOpportunityIcon(opportunity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{opportunity.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-green-600">{opportunity.potentialValue}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confidenceStyle.bg} ${confidenceStyle.text}`}>
                          {confidenceStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signals */}
                <div className="px-4 py-3 bg-white/50 border-t border-gray-200/50">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Supporting Signals
                  </p>
                  <ul className="space-y-1">
                    {opportunity.signals.map((signal, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Context */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Market Pricing Context</p>
              <p className="text-sm text-gray-600 mt-1">
                Current pricing at ${marketInfo.currentPrice}/seat is {Math.round((marketInfo.marketAverage - marketInfo.currentPrice) / marketInfo.marketAverage * 100)}% below
                market average of ${marketInfo.marketAverage}/seat. Price alignment combined with expansion
                could significantly increase account value.
              </p>
            </div>
          </div>
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
