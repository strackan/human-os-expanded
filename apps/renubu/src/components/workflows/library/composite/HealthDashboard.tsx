import React from 'react';
import { MetricDisplay } from '../atomic/MetricDisplay';
import { DataCard } from '../atomic/DataCard';
import { AlertBox } from '../atomic/AlertBox';
import {
  HeartIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

export interface HealthDashboardProps {
  customerName: string;
  overallHealth: number; // 0-100
  metrics: {
    usageGrowth: number; // Percentage
    featureAdoption: number; // Percentage 0-100
    userAdoption: {
      active: number;
      total: number;
    };
    supportTickets: {
      current: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    };
    sentimentScore?: number; // 0-100
    engagementTrend: 'up' | 'down' | 'stable';
  };
  riskFactors: {
    churnRiskScore: number; // 0-100 (higher = more risk)
    budgetPressure?: 'high' | 'medium' | 'low' | 'none';
    competitiveThreat?: 'active_evaluation' | 'shopping' | 'loyal';
    contractDaysRemaining: number;
  };
  usage?: {
    lastLoginDays: number;
    activeFeatures: number;
    totalFeatures: number;
  };
  compact?: boolean;
}

/**
 * HealthDashboard - Composite Component
 *
 * Comprehensive customer health overview.
 * Combines: MetricDisplay, DataCard, AlertBox
 *
 * Used in: Status Assessment, Health Monitoring, Risk Analysis
 *
 * @example
 * <HealthDashboard
 *   customerName="Acme Corp"
 *   overallHealth={72}
 *   metrics={{
 *     usageGrowth: 15,
 *     featureAdoption: 68,
 *     userAdoption: { active: 85, total: 100 },
 *     supportTickets: { current: 3, trend: 'decreasing' },
 *     sentimentScore: 78,
 *     engagementTrend: 'up'
 *   }}
 *   riskFactors={{
 *     churnRiskScore: 25,
 *     budgetPressure: 'low',
 *     competitiveThreat: 'loyal',
 *     contractDaysRemaining: 45
 *   }}
 * />
 */
export const HealthDashboard = React.memo(function HealthDashboard({
  customerName,
  overallHealth,
  metrics,
  riskFactors,
  usage,
  compact = false
}: HealthDashboardProps) {
  // Determine health status and color
  const getHealthStatus = () => {
    if (overallHealth >= 80) return { status: 'Excellent', color: 'green' as const, icon: '🎉' };
    if (overallHealth >= 60) return { status: 'Good', color: 'green' as const, icon: '✓' };
    if (overallHealth >= 40) return { status: 'Fair', color: 'yellow' as const, icon: '⚠️' };
    if (overallHealth >= 20) return { status: 'Poor', color: 'red' as const, icon: '⚠️' };
    return { status: 'Critical', color: 'red' as const, icon: '🚨' };
  };

  const healthStatus = getHealthStatus();

  // Determine churn risk level
  const getChurnRiskLevel = () => {
    if (riskFactors.churnRiskScore >= 70) return { level: 'High Risk', color: 'red' as const };
    if (riskFactors.churnRiskScore >= 50) return { level: 'Medium Risk', color: 'yellow' as const };
    if (riskFactors.churnRiskScore >= 30) return { level: 'Low Risk', color: 'yellow' as const };
    return { level: 'Minimal Risk', color: 'green' as const };
  };

  const churnRisk = getChurnRiskLevel();

  // Calculate user adoption percentage
  const userAdoptionPercent = Math.round(
    (metrics.userAdoption.active / metrics.userAdoption.total) * 100
  );

  // Determine if urgent action needed
  const isUrgent = () => {
    return (
      overallHealth < 40 ||
      riskFactors.churnRiskScore > 70 ||
      riskFactors.contractDaysRemaining < 30 ||
      metrics.engagementTrend === 'down'
    );
  };

  // Format risk factors for DataCard
  const formatRiskFactors = () => {
    const data: Record<string, any> = {
      'Churn Risk': `${riskFactors.churnRiskScore}/100 (${churnRisk.level})`,
      'Days Until Renewal': riskFactors.contractDaysRemaining
    };

    if (riskFactors.budgetPressure) {
      data['Budget Pressure'] = riskFactors.budgetPressure;
    }

    if (riskFactors.competitiveThreat) {
      data['Competitive Threat'] = riskFactors.competitiveThreat.replace('_', ' ');
    }

    return data;
  };

  if (compact) {
    // Compact view for sidebar/summary
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Health Score</h3>
          <span className="text-2xl">{healthStatus.icon}</span>
        </div>

        <MetricDisplay
          label="Overall Health"
          value={overallHealth}
          format="number"
          color={healthStatus.color}
          icon={<HeartIcon className="w-5 h-5" />}
          size="md"
        />

        <div className="grid grid-cols-2 gap-2">
          <MetricDisplay
            label="Churn Risk"
            value={riskFactors.churnRiskScore}
            format="number"
            color={churnRisk.color}
            size="sm"
          />
          <MetricDisplay
            label="Days to Renewal"
            value={riskFactors.contractDaysRemaining}
            format="number"
            color={riskFactors.contractDaysRemaining < 30 ? 'red' : 'gray'}
            size="sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Customer Health Dashboard
          </h2>
          <p className="text-gray-600">
            Health overview for <span className="font-semibold">{customerName}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-4xl mb-1">{healthStatus.icon}</div>
          <div className="text-sm font-semibold text-gray-700">{healthStatus.status}</div>
        </div>
      </div>

      {/* Urgent Action Alert */}
      {isUrgent() && (
        <AlertBox
          type="warning"
          title="Attention Required"
          message="This customer shows concerning health indicators. Immediate action recommended to prevent churn."
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        />
      )}

      {/* Overall Health */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
        <MetricDisplay
          label="Overall Health Score"
          value={overallHealth}
          format="number"
          color={healthStatus.color}
          icon={<HeartIcon className="w-6 h-6" />}
          trend={metrics.engagementTrend}
          size="lg"
        />
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Key Health Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricDisplay
            label="Usage Growth (30d)"
            value={metrics.usageGrowth}
            format="percent"
            color={metrics.usageGrowth > 10 ? 'green' : metrics.usageGrowth > 0 ? 'blue' : 'red'}
            trend={metrics.usageGrowth > 0 ? 'up' : metrics.usageGrowth < 0 ? 'down' : 'stable'}
            trendValue={`${metrics.usageGrowth > 0 ? '+' : ''}${metrics.usageGrowth}%`}
            icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
          />

          <MetricDisplay
            label="Feature Adoption"
            value={metrics.featureAdoption}
            format="percent"
            color={metrics.featureAdoption > 70 ? 'green' : metrics.featureAdoption > 50 ? 'blue' : 'yellow'}
            icon={<CpuChipIcon className="w-5 h-5" />}
          />

          <MetricDisplay
            label="User Adoption"
            value={userAdoptionPercent}
            format="percent"
            color={userAdoptionPercent > 80 ? 'green' : userAdoptionPercent > 60 ? 'blue' : 'yellow'}
            icon={<UserGroupIcon className="w-5 h-5" />}
          />

          <MetricDisplay
            label="Support Tickets"
            value={metrics.supportTickets.current}
            format="number"
            color={
              metrics.supportTickets.trend === 'decreasing'
                ? 'green'
                : metrics.supportTickets.trend === 'increasing'
                ? 'red'
                : 'gray'
            }
            trend={
              metrics.supportTickets.trend === 'decreasing'
                ? 'down'
                : metrics.supportTickets.trend === 'increasing'
                ? 'up'
                : 'stable'
            }
          />

          {metrics.sentimentScore !== undefined && (
            <MetricDisplay
              label="Sentiment Score"
              value={metrics.sentimentScore}
              format="number"
              color={
                metrics.sentimentScore > 70
                  ? 'green'
                  : metrics.sentimentScore > 50
                  ? 'blue'
                  : 'yellow'
              }
            />
          )}

          <MetricDisplay
            label="Contract Days Left"
            value={riskFactors.contractDaysRemaining}
            format="number"
            color={
              riskFactors.contractDaysRemaining < 30
                ? 'red'
                : riskFactors.contractDaysRemaining < 60
                ? 'yellow'
                : 'gray'
            }
            icon={<ClockIcon className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Risk Factors & Usage Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataCard
          title="Risk Factors"
          data={formatRiskFactors()}
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          variant={riskFactors.churnRiskScore > 70 ? 'highlighted' : 'default'}
          formatters={{
            'Budget Pressure': (val) => {
              if (val === 'high') return '🔴 High';
              if (val === 'medium') return '🟡 Medium';
              if (val === 'low') return '🟢 Low';
              return '✓ None';
            },
            'Competitive Threat': (val) => {
              if (val === 'active evaluation') return '🔴 Active Evaluation';
              if (val === 'shopping') return '🟡 Shopping';
              return '✓ Loyal';
            },
            'Days Until Renewal': (val) => {
              const days = parseInt(val);
              if (days < 30) return `${val} days (⚠️ Urgent)`;
              if (days < 60) return `${val} days`;
              return `${val} days`;
            }
          }}
        />

        {usage && (
          <DataCard
            title="Usage Details"
            data={{
              'Last Login': `${usage.lastLoginDays} days ago`,
              'Active Features': `${usage.activeFeatures} of ${usage.totalFeatures}`,
              'Feature Coverage': `${Math.round((usage.activeFeatures / usage.totalFeatures) * 100)}%`,
              'User Adoption': `${metrics.userAdoption.active} of ${metrics.userAdoption.total} users`
            }}
            icon={<CpuChipIcon className="w-5 h-5" />}
            variant="compact"
            formatters={{
              'Last Login': (val) => {
                const days = parseInt(val);
                if (days > 30) return `${val} (⚠️ Inactive)`;
                if (days > 7) return `${val}`;
                return `${val} (✓ Active)`;
              }
            }}
          />
        )}
      </div>

      {/* Health Interpretation */}
      <AlertBox
        type="info"
        title="Health Score Calculation"
        message={`The overall health score (${overallHealth}/100) is calculated from usage growth, feature adoption, user adoption, support trends, and sentiment. A score above 60 indicates a healthy, engaged customer. Scores below 40 require immediate attention.`}
      />
    </div>
  );
});

HealthDashboard.displayName = 'HealthDashboard';

export default HealthDashboard;
