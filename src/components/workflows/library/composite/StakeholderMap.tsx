import React from 'react';
import { DataCard } from '../atomic/DataCard';
import { MetricDisplay } from '../atomic/MetricDisplay';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';

export interface Stakeholder {
  name: string;
  title: string;
  role: 'champion' | 'decision_maker' | 'influencer' | 'user' | 'blocker';
  influence: number; // 1-10
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: 'high' | 'medium' | 'low';
  email?: string;
  department?: string;
  notes?: string;
}

export interface StakeholderMapProps {
  stakeholders: Stakeholder[];
  customerName: string;
  relationshipStrength: number; // 1-10
  compact?: boolean;
  onStakeholderClick?: (stakeholder: Stakeholder) => void;
}

/**
 * StakeholderMap - Composite Component
 *
 * Visualizes customer stakeholders and relationships.
 * Combines: DataCard, MetricDisplay
 *
 * Used in: Discovery, Relationship Mapping, Negotiation Planning
 *
 * @example
 * <StakeholderMap
 *   stakeholders={[
 *     {
 *       name: 'Sarah Johnson',
 *       title: 'VP of Operations',
 *       role: 'champion',
 *       influence: 9,
 *       sentiment: 'positive',
 *       engagement: 'high'
 *     }
 *   ]}
 *   customerName="Acme Corp"
 *   relationshipStrength={8}
 *   onStakeholderClick={(s) => console.log(s)}
 * />
 */
export const StakeholderMap = React.memo(function StakeholderMap({
  stakeholders,
  customerName,
  relationshipStrength,
  compact = false,
  onStakeholderClick
}: StakeholderMapProps) {
  // Group stakeholders by role
  const stakeholdersByRole = React.useMemo(() => {
    const groups: Record<string, Stakeholder[]> = {
      champion: [],
      decision_maker: [],
      influencer: [],
      user: [],
      blocker: []
    };

    stakeholders.forEach((s) => {
      groups[s.role].push(s);
    });

    return groups;
  }, [stakeholders]);

  // Calculate relationship metrics
  const metrics = React.useMemo(() => {
    const champions = stakeholders.filter((s) => s.role === 'champion').length;
    const blockers = stakeholders.filter((s) => s.role === 'blocker').length;
    const positiveSentiment = stakeholders.filter((s) => s.sentiment === 'positive').length;
    const negativeSentiment = stakeholders.filter((s) => s.sentiment === 'negative').length;
    const highEngagement = stakeholders.filter((s) => s.engagement === 'high').length;

    const avgInfluence =
      stakeholders.reduce((sum, s) => sum + s.influence, 0) / stakeholders.length;

    return {
      champions,
      blockers,
      positiveSentiment,
      negativeSentiment,
      highEngagement,
      avgInfluence: Math.round(avgInfluence * 10) / 10,
      sentimentRatio: Math.round((positiveSentiment / stakeholders.length) * 100)
    };
  }, [stakeholders]);

  // Get role display info
  const getRoleInfo = (role: string) => {
    const roleMap: Record<
      string,
      { label: string; color: string; icon: string; description: string }
    > = {
      champion: {
        label: 'Champions',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: '⭐',
        description: 'Internal advocates who promote your solution'
      },
      decision_maker: {
        label: 'Decision Makers',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        icon: '👑',
        description: 'Final authority on renewal decisions'
      },
      influencer: {
        label: 'Influencers',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: '💡',
        description: 'Key voices that shape opinions'
      },
      user: {
        label: 'Users',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: '👤',
        description: 'Day-to-day product users'
      },
      blocker: {
        label: 'Blockers',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: '⚠️',
        description: 'Potential obstacles to renewal'
      }
    };

    return roleMap[role] || roleMap.user;
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string): 'green' | 'yellow' | 'red' => {
    if (sentiment === 'positive') return 'green';
    if (sentiment === 'negative') return 'red';
    return 'yellow';
  };

  // Render stakeholder card
  const renderStakeholder = (stakeholder: Stakeholder) => {
    const roleInfo = getRoleInfo(stakeholder.role);

    return (
      <div
        key={stakeholder.email || stakeholder.name}
        className={`
          p-4 rounded-lg border-2 transition-all duration-200
          ${roleInfo.color}
          ${onStakeholderClick ? 'cursor-pointer hover:shadow-lg' : ''}
        `}
        onClick={() => onStakeholderClick?.(stakeholder)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{roleInfo.icon}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{stakeholder.name}</h4>
              <p className="text-xs text-gray-600">{stakeholder.title}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${
                  stakeholder.sentiment === 'positive'
                    ? 'bg-green-100 text-green-700'
                    : stakeholder.sentiment === 'negative'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }
              `}
            >
              {stakeholder.sentiment}
            </span>
            <span className="text-xs text-gray-500">
              Influence: {stakeholder.influence}/10
            </span>
          </div>
        </div>

        {stakeholder.department && (
          <p className="text-xs text-gray-600 mb-1">
            <BuildingOfficeIcon className="w-3 h-3 inline mr-1" />
            {stakeholder.department}
          </p>
        )}

        {stakeholder.notes && !compact && (
          <p className="text-xs text-gray-700 mt-2 italic">{stakeholder.notes}</p>
        )}

        <div className="mt-2 pt-2 border-t border-gray-200">
          <span
            className={`
              text-xs font-medium
              ${
                stakeholder.engagement === 'high'
                  ? 'text-green-600'
                  : stakeholder.engagement === 'low'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }
            `}
          >
            {stakeholder.engagement.charAt(0).toUpperCase() +
              stakeholder.engagement.slice(1)}{' '}
            Engagement
          </span>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Stakeholder Summary</h3>

        <div className="grid grid-cols-2 gap-2">
          <MetricDisplay
            label="Relationship"
            value={relationshipStrength}
            format="number"
            color={relationshipStrength >= 8 ? 'green' : relationshipStrength >= 6 ? 'blue' : 'yellow'}
            icon={<UserCircleIcon className="w-5 h-5" />}
            size="sm"
          />
          <MetricDisplay
            label="Champions"
            value={metrics.champions}
            format="number"
            color="green"
            icon={<ShieldCheckIcon className="w-5 h-5" />}
            size="sm"
          />
        </div>

        <DataCard
          title="Quick Stats"
          data={{
            'Total Stakeholders': stakeholders.length,
            'Positive Sentiment': `${metrics.sentimentRatio}%`,
            'Blockers': metrics.blockers
          }}
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Stakeholder Map</h2>
          <p className="text-gray-600">
            Relationship overview for <span className="font-semibold">{customerName}</span>
          </p>
        </div>

        <MetricDisplay
          label="Relationship Strength"
          value={relationshipStrength}
          format="number"
          color={
            relationshipStrength >= 8
              ? 'green'
              : relationshipStrength >= 6
              ? 'blue'
              : relationshipStrength >= 4
              ? 'yellow'
              : 'red'
          }
          icon={<UserCircleIcon className="w-5 h-5" />}
          size="md"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricDisplay
          label="Champions"
          value={metrics.champions}
          format="number"
          color={metrics.champions > 0 ? 'green' : 'red'}
          icon={<ShieldCheckIcon className="w-5 h-5" />}
        />
        <MetricDisplay
          label="Decision Makers"
          value={stakeholdersByRole.decision_maker.length}
          format="number"
          color="blue"
        />
        <MetricDisplay
          label="Positive Sentiment"
          value={metrics.sentimentRatio}
          format="percent"
          color={metrics.sentimentRatio >= 70 ? 'green' : metrics.sentimentRatio >= 50 ? 'yellow' : 'red'}
        />
        <MetricDisplay
          label="Blockers"
          value={metrics.blockers}
          format="number"
          color={metrics.blockers === 0 ? 'green' : 'red'}
          icon={<XCircleIcon className="w-5 h-5" />}
        />
      </div>

      {/* Stakeholders by Role */}
      <div className="space-y-6">
        {(['champion', 'decision_maker', 'influencer', 'blocker', 'user'] as const).map(
          (role) => {
            const roleStakeholders = stakeholdersByRole[role];
            if (roleStakeholders.length === 0) return null;

            const roleInfo = getRoleInfo(role);

            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{roleInfo.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {roleInfo.label} ({roleStakeholders.length})
                    </h3>
                    <p className="text-sm text-gray-600">{roleInfo.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roleStakeholders.map(renderStakeholder)}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Relationship Analysis */}
      <DataCard
        title="Relationship Analysis"
        data={{
          'Total Stakeholders': stakeholders.length,
          'Average Influence': `${metrics.avgInfluence}/10`,
          'Champions': metrics.champions,
          'Blockers': metrics.blockers,
          'Positive Sentiment': `${metrics.positiveSentiment}/${stakeholders.length}`,
          'High Engagement': `${metrics.highEngagement}/${stakeholders.length}`
        }}
        icon={<UserCircleIcon className="w-5 h-5" />}
        variant="highlighted"
        formatters={{
          Champions: (val) => {
            const count = parseInt(val);
            if (count === 0) return `${val} (⚠️ Need champions!)`;
            if (count >= 2) return `${val} (✓ Strong)`;
            return `${val} (⚠️ Build more)`;
          },
          Blockers: (val) => {
            const count = parseInt(val);
            if (count === 0) return `${val} (✓ None)`;
            if (count >= 2) return `${val} (🚨 High risk)`;
            return `${val} (⚠️ Address concerns)`;
          }
        }}
      />
    </div>
  );
});

StakeholderMap.displayName = 'StakeholderMap';

export default StakeholderMap;
