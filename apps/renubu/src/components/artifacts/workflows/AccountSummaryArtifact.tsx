/**
 * AccountSummaryArtifact
 *
 * Displays a compact account summary for the greeting slide right panel.
 * Shows key metrics, relationship status, and upcoming priorities at a glance.
 * Designed to work with INTEL data from the INTELService.
 */

'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
} from 'lucide-react';
import {
  ArtifactContainer,
  ArtifactHeader,
  ArtifactSection,
  ArtifactMetric,
  ArtifactAlert,
  ArtifactList,
} from '@/components/artifacts/primitives';

export interface AccountSummaryContact {
  name: string;
  role: string;
  relationship: 'strong' | 'moderate' | 'weak';
  isPrimary?: boolean;
}

export interface AccountSummaryMetric {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface AccountSummaryArtifactProps {
  /** Artifact ID for debugging */
  artifactId?: string;
  /** Customer name */
  customerName: string;
  /** Industry */
  industry?: string;
  /** Account tier */
  tier?: string;
  /** Key metrics */
  metrics?: AccountSummaryMetric[];
  /** Renewal date */
  renewalDate?: string;
  /** Days until renewal */
  daysToRenewal?: number;
  /** Key contacts */
  contacts?: AccountSummaryContact[];
  /** Upcoming priorities */
  priorities?: string[];
  /** Risk factors */
  risks?: string[];
  /** Opportunities */
  opportunities?: string[];
  /** Account status */
  status?: 'healthy' | 'at-risk' | 'critical' | 'unknown';
  /** CSM notes/summary */
  csmNotes?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Click handler */
  onClick?: () => void;
}

const STATUS_CONFIG = {
  healthy: {
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Healthy',
  },
  'at-risk': {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'At Risk',
  },
  critical: {
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Critical',
  },
  unknown: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Minus className="w-4 h-4" />,
    label: 'Unknown',
  },
};

const RELATIONSHIP_COLORS = {
  strong: 'text-green-600',
  moderate: 'text-amber-600',
  weak: 'text-red-600',
};

export function AccountSummaryArtifact({
  artifactId = 'account-summary',
  customerName,
  industry,
  tier,
  metrics = [],
  renewalDate,
  daysToRenewal,
  contacts = [],
  priorities = [],
  risks = [],
  opportunities = [],
  status = 'unknown',
  csmNotes,
  isLoading = false,
  error,
  onClick,
}: AccountSummaryArtifactProps) {
  const statusConfig = STATUS_CONFIG[status];

  // Default metrics if none provided
  const displayMetrics = metrics.length > 0 ? metrics : [
    { label: 'Health', value: '--', suffix: '%' },
    { label: 'Risk', value: '--', suffix: '%' },
    { label: 'ARR', value: '--', prefix: '$' },
  ];

  const containerContent = (
    <ArtifactContainer
      artifactId={artifactId}
      variant="summary"
      isLoading={isLoading}
      error={error}
      className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{customerName}</h3>
            <div className="flex items-center gap-2 mt-1">
              {industry && (
                <span className="text-sm text-gray-500">{industry}</span>
              )}
              {tier && (
                <>
                  {industry && <span className="text-gray-300">|</span>}
                  <span className="text-sm text-gray-500 capitalize">{tier}</span>
                </>
              )}
            </div>
          </div>
          {/* Status Badge */}
          <div className={`px-2.5 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {displayMetrics.slice(0, 3).map((metric, index) => (
            <ArtifactMetric
              key={index}
              label={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              trend={metric.trend}
              trendValue={metric.trendValue}
              size="sm"
              className="bg-gray-50 rounded-lg p-2.5 text-center"
            />
          ))}
        </div>

        {/* Renewal Info */}
        {(renewalDate || daysToRenewal !== undefined) && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                {daysToRenewal !== undefined ? (
                  <>Renewal in {daysToRenewal} days</>
                ) : (
                  <>Renewal: {renewalDate}</>
                )}
              </p>
              {renewalDate && daysToRenewal !== undefined && (
                <p className="text-xs text-blue-600">{renewalDate}</p>
              )}
            </div>
          </div>
        )}

        {/* Key Contacts */}
        {contacts.length > 0 && (
          <ArtifactSection
            title="Key Contacts"
            titleSize="sm"
            variant="transparent"
            padding="none"
          >
            <div className="space-y-2">
              {contacts.slice(0, 3).map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                        {contact.isPrimary && (
                          <span className="ml-1.5 text-xs text-blue-600">(Primary)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium capitalize ${RELATIONSHIP_COLORS[contact.relationship]}`}>
                    {contact.relationship}
                  </span>
                </div>
              ))}
            </div>
          </ArtifactSection>
        )}

        {/* Priorities / Upcoming */}
        {priorities.length > 0 && (
          <ArtifactSection
            title="Upcoming"
            titleSize="sm"
            variant="transparent"
            padding="none"
          >
            <ArtifactList
              variant="icon"
              spacing="tight"
              items={priorities.slice(0, 3).map((priority, index) => ({
                key: `priority-${index}`,
                icon: <Clock className="w-3.5 h-3.5 text-gray-400" />,
                content: <span className="text-sm text-gray-700">{priority}</span>,
              }))}
            />
          </ArtifactSection>
        )}

        {/* Risks */}
        {risks.length > 0 && (
          <ArtifactAlert severity="warning" title="Risk Factors">
            <ul className="space-y-1">
              {risks.slice(0, 2).map((risk, index) => (
                <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">-</span>
                  {risk}
                </li>
              ))}
            </ul>
          </ArtifactAlert>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <ArtifactAlert severity="success" title="Opportunities">
            <ul className="space-y-1">
              {opportunities.slice(0, 2).map((opp, index) => (
                <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                  <Target className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  {opp}
                </li>
              ))}
            </ul>
          </ArtifactAlert>
        )}

        {/* CSM Notes */}
        {csmNotes && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 italic">{csmNotes}</p>
          </div>
        )}
      </div>
    </ArtifactContainer>
  );

  // Wrap with onClick handler if provided
  if (onClick) {
    return <div onClick={onClick}>{containerContent}</div>;
  }

  return containerContent;
}

AccountSummaryArtifact.displayName = 'AccountSummaryArtifact';
export default AccountSummaryArtifact;
