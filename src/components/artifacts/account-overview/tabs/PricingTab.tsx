import React from 'react';
import { BarChart3, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { PricingTabProps } from '../types';
import { getOpportunityColor, getMetricColor, getPricingOpportunityLabel } from '../utils/config';
import { MetricCard } from '../components/MetricCard';

/**
 * PricingTab - Standalone component for displaying pricing and value metrics
 *
 * Can be used independently or within the AccountOverview tab container.
 * Displays ARR, seats, market position, usage metrics, and pricing opportunities.
 */
export function PricingTab({ pricingInfo, customerName, onReview }: PricingTabProps) {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Current Pricing Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current ARR</p>
          <p className="text-2xl font-bold text-gray-900">{pricingInfo.currentARR}</p>
          {pricingInfo.lastYearARR && (
            <p className="text-xs text-gray-500">Previous: {pricingInfo.lastYearARR}</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Seats</p>
          <p className="text-2xl font-bold text-gray-900">{pricingInfo.seats}</p>
          {pricingInfo.pricePerSeat && (
            <p className="text-xs text-gray-500">{pricingInfo.pricePerSeat} per seat</p>
          )}
        </div>
      </div>

      {/* Value Comparison */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          Value vs. Market Position
        </h3>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {pricingInfo.marketPercentile !== undefined && (
            <MetricCard
              label="Market Percentile"
              value={`${pricingInfo.marketPercentile}th`}
              description="vs similar customers"
              icon={DollarSign}
              valueColor={getMetricColor(pricingInfo.marketPercentile, 40, 60)}
            />
          )}

          {pricingInfo.usageScore !== undefined && (
            <MetricCard
              label="Usage Score"
              value={`${pricingInfo.usageScore}%`}
              description="platform utilization"
              icon={Activity}
              valueColor={getMetricColor(pricingInfo.usageScore, 60, 80)}
            />
          )}

          {pricingInfo.adoptionRate !== undefined && (
            <MetricCard
              label="Adoption Rate"
              value={`${pricingInfo.adoptionRate}%`}
              description="feature adoption"
              icon={TrendingUp}
              valueColor={getMetricColor(pricingInfo.adoptionRate, 50, 75)}
            />
          )}
        </div>

        {/* Pricing Opportunity Indicator */}
        {pricingInfo.pricingOpportunity && pricingInfo.pricingOpportunity !== 'none' && (
          <div className={`p-4 rounded-lg border ${getOpportunityColor(pricingInfo.pricingOpportunity)}`}>
            <div className="flex items-start gap-3">
              <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                pricingInfo.pricingOpportunity === 'high' ? 'text-green-600' :
                pricingInfo.pricingOpportunity === 'medium' ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {getPricingOpportunityLabel(pricingInfo.pricingOpportunity).label}
                </p>
                <p className="text-sm opacity-90">
                  {getPricingOpportunityLabel(pricingInfo.pricingOpportunity).description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add-Ons & Features */}
      {pricingInfo.addOns && pricingInfo.addOns.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Add-Ons & Features</p>
          <div className="flex flex-wrap gap-2">
            {pricingInfo.addOns.map((addOn, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
              >
                {addOn}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Discounts */}
      {pricingInfo.discounts && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active Discounts</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900 font-medium">{pricingInfo.discounts}</p>
          </div>
        </div>
      )}
    </div>
  );
}
