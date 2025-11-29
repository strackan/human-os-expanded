/**
 * RecommendationCard Component
 *
 * Displays a single recommendation with:
 * - Title, description, and rationale
 * - Data points (evidence with sources)
 * - Dynamic action buttons based on suggestedActions
 * - Snooze eligibility checking
 */

import React, { useState } from 'react';
import type { Recommendation } from '../recommendation-types';
import type { ActionId } from '../action-types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction: (actionId: ActionId) => void;
  onSnooze: () => void;
  onSkip: () => void;
  disabled?: boolean;
  showSnoozeStatus?: boolean;
}

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  'FEATURE_ADOPTION': '💡',
  'EXECUTIVE_ENGAGEMENT': '🤝',
  'PRICING_STRATEGY': '💰',
  'PROCEDURAL': '📋'
};

// Action button configs
const ACTION_CONFIGS: Record<ActionId, { label: string; icon: string; variant: string }> = {
  'send_email': { label: 'Send Email', icon: '📧', variant: 'primary' },
  'schedule_meeting': { label: 'Schedule Meeting', icon: '📅', variant: 'primary' },
  'review_data': { label: 'Review Data', icon: '📊', variant: 'secondary' },
  'update_crm': { label: 'Update CRM', icon: '💼', variant: 'secondary' },
  'get_transcript': { label: 'Get Transcript', icon: '📝', variant: 'secondary' },
  'create_workflow': { label: 'Create Workflow', icon: '🔄', variant: 'secondary' },
  'skip': { label: 'Skip', icon: '⏭️', variant: 'ghost' },
  'snooze': { label: 'Snooze 1 Week', icon: '💤', variant: 'ghost' }
};

// Priority/Impact badges
const IMPACT_COLORS: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-700',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-red-100 text-red-800'
};

const URGENCY_COLORS: Record<string, string> = {
  'low': 'bg-blue-100 text-blue-700',
  'medium': 'bg-orange-100 text-orange-800',
  'high': 'bg-red-100 text-red-800'
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAction,
  onSnooze,
  onSkip,
  disabled = false,
  showSnoozeStatus = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const categoryIcon = CATEGORY_ICONS[recommendation.category] || '📌';

  // Filter and render action buttons
  const renderActionButtons = () => {
    return recommendation.suggestedActions.map((actionId) => {
      const config = ACTION_CONFIGS[actionId];
      if (!config) return null;

      // Handle special cases
      if (actionId === 'skip') {
        return (
          <button
            key={actionId}
            onClick={onSkip}
            disabled={disabled}
            className="action-btn action-btn-ghost"
            aria-label="Skip this recommendation"
          >
            {config.icon} {config.label}
          </button>
        );
      }

      if (actionId === 'snooze') {
        return (
          <button
            key={actionId}
            onClick={onSnooze}
            disabled={disabled}
            className="action-btn action-btn-ghost"
            aria-label="Snooze for 1 week"
          >
            {config.icon} {config.label}
          </button>
        );
      }

      // Regular action buttons
      return (
        <button
          key={actionId}
          onClick={() => onAction(actionId)}
          disabled={disabled}
          className={`action-btn action-btn-${config.variant}`}
          aria-label={config.label}
        >
          {config.icon} {config.label}
        </button>
      );
    });
  };

  return (
    <div className="recommendation-card">
      {/* Header */}
      <div className="recommendation-card-header">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" aria-label={recommendation.category}>
                {categoryIcon}
              </span>
              <h3 className="recommendation-title">
                {recommendation.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${IMPACT_COLORS[recommendation.impact]}`}>
                Impact: {recommendation.impact}
              </span>
              <span className={`badge ${URGENCY_COLORS[recommendation.urgency]}`}>
                Urgency: {recommendation.urgency}
              </span>
              <span className="badge bg-gray-100 text-gray-600">
                Priority: {recommendation.priorityScore}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="expand-button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="recommendation-card-content">
          {/* Description */}
          <p className="recommendation-description">
            {recommendation.description}
          </p>

          {/* Rationale */}
          <div className="recommendation-section">
            <h4 className="recommendation-section-title">
              WHY THIS MATTERS:
            </h4>
            <p className="recommendation-rationale">
              {recommendation.rationale}
            </p>
          </div>

          {/* Data Points */}
          {recommendation.dataPoints.length > 0 && (
            <div className="recommendation-section">
              <h4 className="recommendation-section-title">
                SUPPORTING DATA:
              </h4>
              <ul className="data-points-list">
                {recommendation.dataPoints.map((dataPoint, idx) => (
                  <li key={idx} className="data-point">
                    <div className="data-point-header">
                      <span className="data-point-label">{dataPoint.label}:</span>
                      <span className="data-point-value">{dataPoint.value}</span>
                    </div>
                    <p className="data-point-context">{dataPoint.context}</p>
                    {dataPoint.source && (
                      <span className="data-point-source">
                        Source: {dataPoint.source}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Snooze Status (if applicable) */}
          {showSnoozeStatus && recommendation.status === 'snoozed' && recommendation.snoozedUntil && (
            <div className="snooze-status">
              <span className="snooze-icon">💤</span>
              Snoozed until {new Date(recommendation.snoozedUntil).toLocaleDateString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="recommendation-actions">
            {renderActionButtons()}
          </div>
        </div>
      )}

      {/* CSS Styles (inline for demo - move to CSS file in production) */}
      <style jsx>{`
        .recommendation-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .recommendation-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .recommendation-card-header {
          padding: 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .recommendation-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .expand-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          font-size: 12px;
        }

        .expand-button:hover {
          color: #111827;
        }

        .recommendation-card-content {
          padding: 16px;
        }

        .recommendation-description {
          color: #374151;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .recommendation-section {
          margin-bottom: 16px;
        }

        .recommendation-section-title {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .recommendation-rationale {
          color: #374151;
          line-height: 1.5;
        }

        .data-points-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .data-point {
          padding: 12px;
          background: #f9fafb;
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .data-point-header {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
        }

        .data-point-label {
          font-weight: 600;
          color: #111827;
        }

        .data-point-value {
          font-weight: 700;
          color: #3b82f6;
        }

        .data-point-context {
          color: #6b7280;
          font-size: 14px;
          margin: 4px 0;
        }

        .data-point-source {
          font-size: 12px;
          color: #9ca3af;
          font-family: monospace;
        }

        .snooze-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 4px;
          color: #92400e;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .snooze-icon {
          font-size: 20px;
        }

        .recommendation-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .action-btn-primary:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
        }

        .action-btn-secondary {
          background: white;
          color: #3b82f6;
          border-color: #3b82f6;
        }

        .action-btn-secondary:hover:not(:disabled) {
          background: #eff6ff;
        }

        .action-btn-ghost {
          background: white;
          color: #6b7280;
          border-color: #d1d5db;
        }

        .action-btn-ghost:hover:not(:disabled) {
          background: #f9fafb;
          color: #111827;
        }
      `}</style>
    </div>
  );
};

export default RecommendationCard;
