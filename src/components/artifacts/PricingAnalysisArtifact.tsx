"use client";

import React from 'react';
import { TrendingUp, AlertTriangle, DollarSign, BarChart3, Users, Activity, CheckCircle } from 'lucide-react';

interface PricingAnalysisProps {
  data?: {
    customerName?: string;
    currentPrice?: number;
    currentARR?: number;
    pricePerUnit?: number;
    unitType?: string;
    comparativeAnalysis?: {
      averagePrice?: number;
      percentile?: number;
      similarCustomerCount?: number;
    };
    usageMetrics?: {
      currentUsage?: number;
      usageGrowth?: number;
      usageEfficiency?: number;
    };
    riskFactors?: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    opportunities?: Array<{
      title: string;
      description: string;
      potential: 'high' | 'medium' | 'low';
    }>;
    recommendation?: {
      priceIncrease?: number;
      newAnnualPrice?: number;
      reasons?: string[];
    };
  };
  isLoading?: boolean;
}

const PricingAnalysisArtifact = React.memo(function PricingAnalysisArtifact({ data = {}, isLoading = false }: PricingAnalysisProps) {

  // Validate numerical inputs to prevent display errors
  const validateNumber = (value: number | undefined, fallback: number): number => {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0) {
      return value;
    }
    return fallback;
  };

  const validatePercentage = (value: number | undefined, fallback: number): number => {
    const validated = validateNumber(value, fallback);
    return Math.min(Math.max(validated, 0), 100); // Clamp between 0-100
  };

  // Loading state component
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-40 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-40 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Validated default values
  const customerName = typeof data.customerName === 'string' && data.customerName.trim() ? data.customerName : 'Customer';
  const currentPrice = validateNumber(data.currentPrice, 84000);
  const currentARR = validateNumber(data.currentARR, 84000);
  const pricePerUnit = validateNumber(data.pricePerUnit, 350);
  const unitType = typeof data.unitType === 'string' && data.unitType.trim() ? data.unitType : 'seat/month';

  const comparativeAnalysis = {
    averagePrice: validateNumber(data.comparativeAnalysis?.averagePrice, 380),
    percentile: validatePercentage(data.comparativeAnalysis?.percentile, 35),
    similarCustomerCount: validateNumber(data.comparativeAnalysis?.similarCustomerCount, 47)
  };

  const usageMetrics = {
    currentUsage: validatePercentage(data.usageMetrics?.currentUsage, 87),
    usageGrowth: validatePercentage(data.usageMetrics?.usageGrowth, 23),
    usageEfficiency: validatePercentage(data.usageMetrics?.usageEfficiency, 92)
  };

  const riskFactors = data.riskFactors || [
    { title: 'Contract Complexity', description: 'Non-standard terms may complicate negotiations', impact: 'medium' as const },
    { title: 'Competitor Activity', description: 'Competitor offering aggressive pricing in segment', impact: 'high' as const },
    { title: 'Budget Constraints', description: 'Customer has mentioned budget limitations', impact: 'medium' as const }
  ];

  const opportunities = data.opportunities || [
    { title: 'Usage Growth', description: '23% increase in platform usage over last quarter', potential: 'high' as const },
    { title: 'Feature Adoption', description: 'Recently adopted 3 premium features', potential: 'high' as const },
    { title: 'Team Expansion', description: 'Customer hiring 50+ new employees', potential: 'medium' as const },
    { title: 'Contract Consolidation', description: 'Opportunity to consolidate multiple contracts', potential: 'medium' as const }
  ];

  const recommendation = {
    priceIncrease: validatePercentage(data.recommendation?.priceIncrease, 8),
    newAnnualPrice: validateNumber(data.recommendation?.newAnnualPrice, 90720),
    reasons: Array.isArray(data.recommendation?.reasons) && data.recommendation.reasons.length > 0
      ? data.recommendation.reasons.filter(reason => typeof reason === 'string' && reason.trim())
      : [
          'Usage metrics show 87% platform utilization, well above the 60% average',
          'Customer is currently at 35th percentile for pricing in their segment',
          'Recent adoption of premium features justifies value-based pricing adjustment',
          'Strong engagement scores (92%) indicate high perceived value',
          'Similar customers pay an average of $380 per seat vs current $350'
        ]
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
    }
  };

  const getPotentialColor = (potential: 'high' | 'medium' | 'low') => {
    switch (potential) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white h-full flex flex-col rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Pricing Analysis</h3>
              <p className="text-sm text-gray-600">{customerName} - Renewal Strategy</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Current ARR</div>
            <div className="text-2xl font-bold text-gray-900">${currentARR.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current Price</span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">${currentPrice.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Annual contract</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Price Percentile</span>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-amber-600">{comparativeAnalysis.percentile}th</div>
            <div className="text-xs text-gray-500">vs similar customers</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Price per {unitType}</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">${pricePerUnit}</div>
            <div className="text-xs text-gray-500">Market avg: ${comparativeAnalysis.averagePrice}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Usage Score</span>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-green-600">{usageMetrics.currentUsage}%</div>
            <div className="text-xs text-green-600">+{usageMetrics.usageGrowth}% QoQ</div>
          </div>
        </div>

        {/* Comparative Analysis Section */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Comparative Analysis
          </h4>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Your Price:</span>
                <span className="ml-2 font-semibold">${pricePerUnit}/{unitType}</span>
              </div>
              <div>
                <span className="text-gray-600">Market Average:</span>
                <span className="ml-2 font-semibold">${comparativeAnalysis.averagePrice}/{unitType}</span>
              </div>
              <div>
                <span className="text-gray-600">Sample Size:</span>
                <span className="ml-2 font-semibold">{comparativeAnalysis.similarCustomerCount} customers</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full opacity-50"></div>
                <div
                  className="absolute w-3 h-3 bg-blue-600 rounded-full -mt-0.5 shadow-lg"
                  style={{ left: `${comparativeAnalysis.percentile}%`, transform: 'translateX(-50%)' }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Lower pricing</span>
                <span>Higher pricing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Opportunities Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Risk Factors */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {riskFactors.map((risk, index) => (
                <div key={index} className={`p-3 rounded-lg ${getImpactColor(risk.impact)}`}>
                  <div className="font-medium text-sm">{risk.title}</div>
                  <div className="text-xs opacity-80 mt-1">{risk.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Expansion Opportunities
            </h4>
            <div className="space-y-2">
              {opportunities.map((opp, index) => (
                <div key={index} className={`p-3 rounded-lg ${getPotentialColor(opp.potential)}`}>
                  <div className="font-medium text-sm">{opp.title}</div>
                  <div className="text-xs opacity-80 mt-1">{opp.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendation Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Pricing Recommendation</h4>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Suggested Increase</div>
                <div className="text-3xl font-bold text-blue-600">+{recommendation.priceIncrease}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">New Annual Price</div>
                <div className="text-3xl font-bold text-green-600">${recommendation.newAnnualPrice.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Additional Revenue</div>
                <div className="text-3xl font-bold text-gray-900">+${(recommendation.newAnnualPrice - currentPrice).toLocaleString()}</div>
              </div>
            </div>

            <div className="mb-6">
              <h5 className="font-medium text-gray-900 mb-3">Supporting Rationale:</h5>
              <ul className="space-y-2">
                {recommendation.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});

export default PricingAnalysisArtifact;