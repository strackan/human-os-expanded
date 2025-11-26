import React from 'react';
import { ScenarioCard } from '../atomic/ScenarioCard';
import { DataCard } from '../atomic/DataCard';
import { AlertBox } from '../atomic/AlertBox';
import { MetricDisplay } from '../atomic/MetricDisplay';
import {
  SparklesIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

export interface PricingRecommendationProps {
  recommendation: {
    targetPrice: number;
    increasePercent: number;
    increaseAmount: number;
    confidence: number;
    scenarios: Array<{
      scenario: 'Conservative' | 'Recommended' | 'Aggressive';
      targetPrice: number;
      increasePercent: number;
      increaseAmount: number;
      probability: number;
      pros: string[];
      cons: string[];
    }>;
    factors: {
      stickinessScore: number;
      valueIndex: number;
      marketAdjustment: number;
      riskMultiplier: number;
      trendAdjustment: number;
      baseIncrease?: number;
    };
    dataQuality: {
      usage: 'complete' | 'partial' | 'placeholder';
      financial: 'complete' | 'partial' | 'placeholder';
      risk: 'complete' | 'partial' | 'placeholder';
      competitive: 'complete' | 'partial' | 'placeholder';
    };
  };
  currentARR: number;
  customerName: string;
  selectedScenario?: 'Conservative' | 'Recommended' | 'Aggressive';
  onSelectScenario?: (scenario: 'Conservative' | 'Recommended' | 'Aggressive') => void;
  showFactors?: boolean;
  showDataQuality?: boolean;
}

/**
 * PricingRecommendation - Composite Component
 *
 * Displays complete pricing recommendation with scenarios, confidence, and factors.
 * Combines: ScenarioCard, DataCard, AlertBox, MetricDisplay
 *
 * This is the PRIMARY UI for the core value proposition of Renubu.
 *
 * @example
 * <PricingRecommendation
 *   recommendation={pricingData}
 *   currentARR={112000}
 *   customerName="Acme Corp"
 *   selectedScenario={selectedScenario}
 *   onSelectScenario={(scenario) => setSelectedScenario(scenario)}
 *   showFactors
 *   showDataQuality
 * />
 */
export const PricingRecommendation = React.memo(function PricingRecommendation({
  recommendation,
  currentARR,
  customerName,
  selectedScenario,
  onSelectScenario,
  showFactors = true,
  showDataQuality = true
}: PricingRecommendationProps) {
  const { confidence, scenarios, factors, dataQuality } = recommendation;

  // Determine confidence level and color
  const getConfidenceLevel = () => {
    if (confidence >= 90) return { level: 'Very High', color: 'green' as const };
    if (confidence >= 70) return { level: 'High', color: 'green' as const };
    if (confidence >= 50) return { level: 'Medium', color: 'yellow' as const };
    if (confidence >= 30) return { level: 'Low', color: 'yellow' as const };
    return { level: 'Very Low', color: 'red' as const };
  };

  const confidenceLevel = getConfidenceLevel();

  // Check if data quality is concerning
  const hasDataQualityIssues = () => {
    return (
      Object.values(dataQuality).filter((q) => q === 'placeholder').length >= 2
    );
  };

  // Format factors for display
  const formatFactors = () => {
    return {
      'Stickiness Score': `${factors.stickinessScore}/100`,
      'Value Leverage': `${(factors.valueIndex * 100).toFixed(0)}%`,
      'Market Position': `${factors.marketAdjustment > 0 ? '+' : ''}${factors.marketAdjustment}%`,
      'Risk Multiplier': `${factors.riskMultiplier.toFixed(2)}x`,
      'Trend Adjustment': `${factors.trendAdjustment > 0 ? '+' : ''}${factors.trendAdjustment}%`
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pricing Recommendation
          </h2>
          <p className="text-gray-600">
            Data-driven pricing analysis for <span className="font-semibold">{customerName}</span>
          </p>
        </div>

        {/* Confidence Score */}
        <MetricDisplay
          label="Recommendation Confidence"
          value={confidence}
          format="number"
          color={confidenceLevel.color}
          icon={<SparklesIcon className="w-5 h-5" />}
          size="sm"
        />
      </div>

      {/* Data Quality Warning */}
      {showDataQuality && hasDataQualityIssues() && (
        <AlertBox
          type="warning"
          title="Limited Data Available"
          message="This recommendation is based on incomplete data. Consider gathering more customer information to improve accuracy. Review the data quality indicators below."
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        />
      )}

      {/* Recommended Scenario Highlight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recommended Pricing</h3>
            <p className="text-sm text-gray-600">Optimal balance of revenue and risk</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricDisplay
            label="Current ARR"
            value={currentARR}
            format="currency"
            color="gray"
            size="md"
          />
          <MetricDisplay
            label="Target ARR"
            value={recommendation.targetPrice}
            format="currency"
            color="blue"
            trend="up"
            trendValue={`+${recommendation.increasePercent.toFixed(1)}%`}
            size="md"
          />
          <MetricDisplay
            label="Revenue Increase"
            value={recommendation.increaseAmount}
            format="currency"
            color="green"
            trend="up"
            size="md"
          />
        </div>
      </div>

      {/* Pricing Scenarios */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Pricing Scenarios
          {onSelectScenario && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Click to select)
            </span>
          )}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.scenario}
              title={scenario.scenario}
              price={scenario.targetPrice}
              increasePercent={scenario.increasePercent}
              probability={scenario.probability}
              pros={scenario.pros}
              cons={scenario.cons}
              recommended={scenario.scenario === 'Recommended'}
              selected={selectedScenario === scenario.scenario}
              onSelect={
                onSelectScenario
                  ? () => onSelectScenario(scenario.scenario)
                  : undefined
              }
              format="currency"
            />
          ))}
        </div>
      </div>

      {/* Pricing Factors Breakdown */}
      {showFactors && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DataCard
            title="Pricing Factors"
            data={formatFactors()}
            icon={<ChartBarIcon className="w-5 h-5" />}
            variant="default"
            formatters={{
              'Stickiness Score': (val) => {
                const score = parseInt(val);
                if (score >= 80) return `${val} (Very Sticky ✓)`;
                if (score >= 60) return `${val} (Moderate)`;
                return `${val} (Low)`;
              },
              'Risk Multiplier': (val) => {
                const mult = parseFloat(val);
                if (mult > 1.0) return `${val} (Low Risk ✓)`;
                if (mult < 0.75) return `${val} (High Risk ⚠️)`;
                return `${val} (Normal)`;
              }
            }}
          />

          {showDataQuality && (
            <DataCard
              title="Data Quality"
              data={{
                'Usage Data': dataQuality.usage,
                'Financial Data': dataQuality.financial,
                'Risk Data': dataQuality.risk,
                'Competitive Data': dataQuality.competitive
              }}
              icon={<ShieldCheckIcon className="w-5 h-5" />}
              variant="compact"
              formatters={{
                'Usage Data': (val) => formatDataQuality(val),
                'Financial Data': (val) => formatDataQuality(val),
                'Risk Data': (val) => formatDataQuality(val),
                'Competitive Data': (val) => formatDataQuality(val)
              }}
            />
          )}
        </div>
      )}

      {/* Algorithm Explanation */}
      <AlertBox
        type="info"
        title="How This Recommendation Was Calculated"
        message={`This pricing recommendation analyzes 5 key factors: customer stickiness (${factors.stickinessScore}/100), value delivered (${(factors.valueIndex * 100).toFixed(0)}%), market position (${factors.marketAdjustment > 0 ? '+' : ''}${factors.marketAdjustment}%), risk assessment (${factors.riskMultiplier.toFixed(2)}x), and recent trends (${factors.trendAdjustment > 0 ? '+' : ''}${factors.trendAdjustment}%). The algorithm balances maximizing revenue with minimizing churn risk.`}
      />
    </div>
  );
});

// Helper function to format data quality indicators
function formatDataQuality(quality: string): string {
  switch (quality) {
    case 'complete':
      return '✓ Complete';
    case 'partial':
      return '⚠ Partial';
    case 'placeholder':
      return '✗ Missing';
    default:
      return quality;
  }
}

PricingRecommendation.displayName = 'PricingRecommendation';

export default PricingRecommendation;
