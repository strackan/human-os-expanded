'use client';

import React, { useState } from 'react';
import { FileText, TrendingUp, DollarSign, ChevronRight, Calendar, Users, Activity, BarChart3, AlertTriangle, Eye, MousePointer, Star } from 'lucide-react';

interface ContractInfo {
  licenseCount: number;
  pricePerSeat: number;
  annualSpend: number;
  renewalDate: string;
  renewalDays: number;
  term: string;
  autoRenew: boolean;
}

interface UsageInfo {
  activeUsers: number;
  licenseCapacity: number;
  utilizationPercent: number;
  yoyGrowth: number;
  lastMonthGrowth: number;
  peakUsage?: number;
  adoptionRate: number;
}

interface MarketInfo {
  currentPrice: number;
  marketAverage: number;
  percentile: number;
  priceGap: number;
  similarCustomerRange: string;
  opportunityValue: string;
}

interface BrandMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  sparkData?: number[];
}

interface BrandInfo {
  healthScore: number;
  reportingPeriod?: string;
  impressions: BrandMetric;
  profileViews: BrandMetric;
  applyClicks: BrandMetric;
  newRatings: BrandMetric;
}

interface ExpansionOverviewArtifactProps {
  customerName: string;
  contractInfo: ContractInfo;
  usageInfo: UsageInfo;
  marketInfo: MarketInfo;
  brandInfo?: BrandInfo;
  onContinue?: () => void;
  onBack?: () => void;
}

// Mini sparkline chart component
function MiniSparkline({ data, trend }: { data: number[]; trend?: 'up' | 'down' | 'flat' }) {
  const max = Math.max(...data);
  const normalized = data.map(d => (d / max) * 100);
  const color = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <div className="flex items-end gap-0.5 h-8">
      {normalized.map((height, i) => (
        <div
          key={i}
          className="w-1.5 rounded-t transition-all"
          style={{
            height: `${Math.max(height, 10)}%`,
            backgroundColor: color,
            opacity: 0.3 + (i / normalized.length) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

// Health score circular display
function HealthScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-500">Score</span>
      </div>
    </div>
  );
}

// Default brand info for demo
const DEFAULT_BRAND_INFO: BrandInfo = {
  healthScore: 78,
  reportingPeriod: 'Last 90 Days',
  impressions: { label: 'Impressions', value: '24.5K', trend: 'up', trendValue: '+12%', sparkData: [30, 45, 35, 50, 42, 55, 60, 52, 65, 70, 68, 75] },
  profileViews: { label: 'Profile Views', value: '3,842', trend: 'up', trendValue: '+8%', sparkData: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45, 42, 48] },
  applyClicks: { label: 'Apply Clicks', value: '847', trend: 'flat', trendValue: '+2%', sparkData: [15, 18, 16, 20, 19, 18, 22, 21, 20, 23, 22, 24] },
  newRatings: { label: 'New Ratings', value: '156', trend: 'up', trendValue: '+23%', sparkData: [8, 12, 10, 15, 14, 18, 16, 22, 20, 25, 28, 32] },
};

export default function ExpansionOverviewArtifact({
  customerName,
  contractInfo,
  usageInfo,
  marketInfo,
  brandInfo = DEFAULT_BRAND_INFO,
  onContinue,
  onBack
}: ExpansionOverviewArtifactProps) {
  const [activeTab, setActiveTab] = useState<'brand' | 'contract' | 'usage' | 'market'>('brand');

  const getCapacityStatus = () => {
    const overCapacity = usageInfo.activeUsers > usageInfo.licenseCapacity;
    const percentOver = ((usageInfo.activeUsers - usageInfo.licenseCapacity) / usageInfo.licenseCapacity * 100).toFixed(0);

    return {
      isOver: overCapacity,
      message: overCapacity
        ? `${percentOver}% over licensed capacity`
        : `${usageInfo.utilizationPercent}% of capacity`,
      color: overCapacity ? 'text-red-600' : 'text-green-600'
    };
  };

  const capacityStatus = getCapacityStatus();

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-100">
        <h2 className="text-base font-medium text-gray-900">Expansion Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Current state for {customerName}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        <button
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'brand'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Star className="w-4 h-4" />
          Brand Performance
        </button>
        <button
          onClick={() => setActiveTab('contract')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'contract'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Contract
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'usage'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Usage & Growth
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'market'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Market Position
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'brand' && (
          <div className="max-w-3xl space-y-6">
            {/* Health Score + Summary */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
              <HealthScoreCircle score={brandInfo.healthScore} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Brand Health Score</h3>
                <p className="text-sm text-gray-600">
                  {brandInfo.healthScore >= 70
                    ? 'Strong brand presence with healthy engagement metrics.'
                    : brandInfo.healthScore >= 50
                    ? 'Moderate brand health with room for improvement.'
                    : 'Brand needs attention - engagement metrics are below target.'}
                </p>
                {brandInfo.reportingPeriod && (
                  <p className="text-xs text-gray-400 mt-2">{brandInfo.reportingPeriod}</p>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Impressions */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {brandInfo.impressions.label}
                    </span>
                  </div>
                  {brandInfo.impressions.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{brandInfo.impressions.value}</div>
                    {brandInfo.impressions.trendValue && (
                      <div className="text-xs font-medium text-green-600 mt-0.5">{brandInfo.impressions.trendValue} vs last period</div>
                    )}
                  </div>
                  {brandInfo.impressions.sparkData && (
                    <MiniSparkline data={brandInfo.impressions.sparkData} trend={brandInfo.impressions.trend} />
                  )}
                </div>
              </div>

              {/* Profile Views */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {brandInfo.profileViews.label}
                    </span>
                  </div>
                  {brandInfo.profileViews.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{brandInfo.profileViews.value}</div>
                    {brandInfo.profileViews.trendValue && (
                      <div className="text-xs font-medium text-green-600 mt-0.5">{brandInfo.profileViews.trendValue} vs last period</div>
                    )}
                  </div>
                  {brandInfo.profileViews.sparkData && (
                    <MiniSparkline data={brandInfo.profileViews.sparkData} trend={brandInfo.profileViews.trend} />
                  )}
                </div>
              </div>

              {/* Apply Clicks */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <MousePointer className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {brandInfo.applyClicks.label}
                    </span>
                  </div>
                  {brandInfo.applyClicks.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                  {brandInfo.applyClicks.trend === 'flat' && <Activity className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{brandInfo.applyClicks.value}</div>
                    {brandInfo.applyClicks.trendValue && (
                      <div className={`text-xs font-medium mt-0.5 ${brandInfo.applyClicks.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>
                        {brandInfo.applyClicks.trendValue} vs last period
                      </div>
                    )}
                  </div>
                  {brandInfo.applyClicks.sparkData && (
                    <MiniSparkline data={brandInfo.applyClicks.sparkData} trend={brandInfo.applyClicks.trend} />
                  )}
                </div>
              </div>

              {/* New Ratings */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Star className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {brandInfo.newRatings.label}
                    </span>
                  </div>
                  {brandInfo.newRatings.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{brandInfo.newRatings.value}</div>
                    {brandInfo.newRatings.trendValue && (
                      <div className="text-xs font-medium text-green-600 mt-0.5">{brandInfo.newRatings.trendValue} vs last period</div>
                    )}
                  </div>
                  {brandInfo.newRatings.sparkData && (
                    <MiniSparkline data={brandInfo.newRatings.sparkData} trend={brandInfo.newRatings.trend} />
                  )}
                </div>
              </div>
            </div>

            {/* Brand Insight */}
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Brand Growth Opportunity</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Strong engagement trends indicate potential for premium positioning and expanded visibility packages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="max-w-3xl space-y-6">
            {/* Current Contract Snapshot */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">License Count</p>
                <p className="text-2xl font-bold text-gray-900">{contractInfo.licenseCount} seats</p>
                <p className="text-xs text-gray-500">${contractInfo.pricePerSeat}/seat/month</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Annual Spend</p>
                <p className="text-2xl font-bold text-gray-900">${contractInfo.annualSpend.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Current commitment</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Renewal Date</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  {new Date(contractInfo.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500">{contractInfo.renewalDays} days away</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contract Term</p>
                <p className="text-sm font-medium text-gray-900">{contractInfo.term}</p>
                <p className="text-xs text-gray-500">{contractInfo.autoRenew ? 'Auto-renews' : 'Manual renewal'}</p>
              </div>
            </div>

            {/* Contract Status */}
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Single-Year Agreement</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {contractInfo.autoRenew
                        ? 'Auto-renewal enabled but can be renegotiated 60 days before renewal'
                        : 'No auto-renewal - active negotiation required'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expansion Opportunity Note */}
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Proactive Window:</span> With {contractInfo.renewalDays} days until renewal,
                  this is the optimal time to discuss capacity planning and multi-year commitments.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="max-w-3xl space-y-6">
            {/* Active Users vs Capacity */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{usageInfo.activeUsers}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Capacity</p>
                  <p className="text-3xl font-bold text-gray-400">{usageInfo.licenseCapacity}</p>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${capacityStatus.isOver ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(usageInfo.utilizationPercent, 100)}%` }}
                  />
                </div>
                {capacityStatus.isOver && (
                  <div
                    className="absolute top-0 left-full h-3 bg-red-600 rounded-r-full"
                    style={{ width: `${(usageInfo.utilizationPercent - 100) / 100 * 100}%`, maxWidth: '50%' }}
                  />
                )}
              </div>

              <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${capacityStatus.color}`}>
                {capacityStatus.isOver && <AlertTriangle className="w-4 h-4" />}
                <span>{capacityStatus.message}</span>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">YoY Growth</span>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-green-600">+{usageInfo.yoyGrowth}%</div>
                <div className="text-xs text-gray-500">Annual trajectory</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Last Month</span>
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-blue-600">+{usageInfo.lastMonthGrowth}%</div>
                <div className="text-xs text-gray-500">Recent momentum</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Adoption</span>
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{usageInfo.adoptionRate}%</div>
                <div className="text-xs text-gray-500">Feature usage</div>
              </div>
            </div>

            {/* Peak Usage Note */}
            {usageInfo.peakUsage && (
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Peak Usage Insight</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Peak usage hit {usageInfo.peakUsage} users in Q4, indicating potential for even more growth
                        with proper capacity planning.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Growth Interpretation */}
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Growth Analysis</p>
                <p className="text-sm text-gray-700">
                  With {usageInfo.yoyGrowth}% year-over-year growth and {usageInfo.adoptionRate}% adoption rate,
                  this customer is experiencing healthy, sustainable expansion. The current capacity constraint
                  presents an immediate opportunity for license expansion.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="max-w-3xl space-y-6">
            {/* Price Comparison */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Current Price</p>
                <p className="text-3xl font-bold text-gray-900">${marketInfo.currentPrice}</p>
                <p className="text-xs text-gray-500">per seat/month</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Market Average</p>
                <p className="text-3xl font-bold text-blue-600">${marketInfo.marketAverage}</p>
                <p className="text-xs text-gray-500">similar customers</p>
              </div>
            </div>

            {/* Price Gap Callout */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 mb-1">
                    {marketInfo.priceGap}% Below Market Average
                  </p>
                  <p className="text-sm text-gray-700">
                    Current pricing is significantly below market rates for comparable customers.
                    This represents an opportunity to align pricing with delivered value.
                  </p>
                </div>
              </div>
            </div>

            {/* Market Position Metrics */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                Market Positioning
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Price Percentile</span>
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600">{marketInfo.percentile}th</div>
                  <div className="text-xs text-gray-500">vs similar accounts</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">Typical Range</span>
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-base font-bold text-gray-900">{marketInfo.similarCustomerRange}</div>
                  <div className="text-xs text-gray-500">peer pricing</div>
                </div>
              </div>
            </div>

            {/* Opportunity Value */}
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 mb-1">
                      Revenue Opportunity: {marketInfo.opportunityValue}
                    </p>
                    <p className="text-sm text-gray-700">
                      By aligning pricing with market rates and expanding capacity to meet current usage,
                      there is potential for significant ARR increase with this renewal.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Context */}
            <div className="pt-4 border-t border-gray-200">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Market Context</p>
                <p className="text-sm text-gray-700">
                  Based on analysis of similar customers in the same industry vertical and size range,
                  this account&apos;s current pricing represents a legacy rate that no longer reflects the
                  value being delivered or market standards.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

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
    </div>
  );
}
