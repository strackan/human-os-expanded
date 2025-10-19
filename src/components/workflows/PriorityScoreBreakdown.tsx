/**
 * Priority Score Breakdown Component
 *
 * Shows detailed breakdown of workflow priority score calculation.
 * Displays contributing factors with explanations.
 *
 * Features:
 * - Base score
 * - ARR multiplier
 * - Account plan multiplier
 * - Urgency bonus
 * - Workload penalty
 * - Expandable "Explain this score" section
 * - Links to configuration docs
 *
 * Phase: Account Plan & Workflow Automation UI - Task 5
 */

'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { AccountPlanType } from './AccountPlanSelector';
import { WorkflowType } from './WorkflowQueueDashboard';

// =====================================================
// Types
// =====================================================

export interface ScoreFactors {
  baseScore: number;
  arrMultiplier: number;
  accountPlanMultiplier: number;
  urgencyBonus: number;
  workloadPenalty: number;
  experienceMultiplier?: number;
  totalScore: number;
}

export interface ScoreContext {
  arr: number;
  accountPlan: AccountPlanType;
  workflowType: WorkflowType;
  urgencyLevel: 'high' | 'medium' | 'low';
  renewalStage?: string;
  daysUntilRenewal?: number;
  csmWorkloadCount?: number;
  csmExperienceLevel?: 'expert' | 'senior' | 'mid' | 'junior';
}

export interface PriorityScoreBreakdownProps {
  score: number;
  factors?: ScoreFactors;
  context?: ScoreContext;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

// =====================================================
// Helper Functions
// =====================================================

const getPlanMultiplierLabel = (plan: AccountPlanType): string => {
  switch (plan) {
    case 'invest': return '1.5x for invest plan';
    case 'expand': return '1.3x for expand plan';
    case 'manage': return '1.0x for manage plan';
    case 'monitor': return '0.8x for monitor plan';
  }
};

const getUrgencyLabel = (level: 'high' | 'medium' | 'low'): string => {
  switch (level) {
    case 'high': return 'High urgency';
    case 'medium': return 'Medium urgency';
    case 'low': return 'Low urgency';
  }
};

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

// =====================================================
// PriorityScoreBreakdown Component
// =====================================================

export const PriorityScoreBreakdown: React.FC<PriorityScoreBreakdownProps> = ({
  score,
  factors,
  context,
  size = 'medium',
  showLabel = true,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      tooltip: 'w-80'
    },
    medium: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      tooltip: 'w-96'
    },
    large: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      tooltip: 'w-[28rem]'
    }
  };

  const config = sizeConfig[size];

  // Determine score color
  const getScoreColor = () => {
    if (score >= 200) return 'bg-red-50 text-red-700 border-red-200';
    if (score >= 100) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Badge */}
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowExplanation(!showExplanation)}
        className={`
          inline-flex items-center space-x-1.5
          ${config.badge} ${getScoreColor()}
          border rounded-md font-medium
          transition-all duration-150
          hover:shadow-sm
        `}
      >
        <span>{score} pts</span>
        {showLabel && <span className="text-xs opacity-75">priority</span>}
        <HelpCircle className={config.icon} />
      </button>

      {/* Tooltip (on hover) */}
      {showTooltip && factors && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50
            ${config.tooltip} p-4 bg-gray-900 text-white rounded-lg shadow-lg
          `}
        >
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-gray-900 rotate-45" />

          {/* Content */}
          <div className="relative space-y-2 text-sm">
            <div className="font-semibold mb-3 text-white">Priority Score Breakdown</div>

            {/* Base Score */}
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-300">Base Score</span>
              <span className="font-medium text-white">{factors.baseScore}</span>
            </div>

            {/* ARR Multiplier */}
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-300">
                ARR Multiplier
                {context?.arr && (
                  <span className="text-xs ml-1">({formatCurrency(context.arr)})</span>
                )}
              </span>
              <span className="font-medium text-white">{factors.arrMultiplier}x</span>
            </div>

            {/* Account Plan Multiplier */}
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-300">
                Account Plan
                {context?.accountPlan && (
                  <span className="text-xs ml-1">({context.accountPlan})</span>
                )}
              </span>
              <span className="font-medium text-white">{factors.accountPlanMultiplier}x</span>
            </div>

            {/* Urgency Bonus */}
            {factors.urgencyBonus > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-300">Urgency Bonus</span>
                <span className="font-medium text-green-400">+{factors.urgencyBonus}</span>
              </div>
            )}

            {/* Workload Penalty */}
            {factors.workloadPenalty < 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-300">
                  Workload Penalty
                  {context?.csmWorkloadCount !== undefined && (
                    <span className="text-xs ml-1">({context.csmWorkloadCount} active)</span>
                  )}
                </span>
                <span className="font-medium text-red-400">{factors.workloadPenalty}</span>
              </div>
            )}

            {/* Experience Multiplier (optional) */}
            {factors.experienceMultiplier && factors.experienceMultiplier !== 1 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-300">
                  Experience
                  {context?.csmExperienceLevel && (
                    <span className="text-xs ml-1">({context.csmExperienceLevel})</span>
                  )}
                </span>
                <span className="font-medium text-white">{factors.experienceMultiplier}x</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-700 my-2" />

            {/* Total */}
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-white">Total Score</span>
              <span className="font-bold text-lg text-white">{factors.totalScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Explanation Panel (on click) */}
      {showExplanation && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[32rem] bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">How is this score calculated?</h4>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Formula */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-900 mb-2">Priority Formula:</div>
              <code className="text-xs text-blue-800 font-mono">
                ((Base + Bonus) × ARR × Plan × Experience) + Workload
              </code>
            </div>

            {/* Factor Explanations */}
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-1">Base Score</h5>
                <p className="text-xs text-gray-600">
                  Starting priority value determined by workflow type. Strategic and renewal workflows
                  typically have higher base scores than opportunities or routine health checks.
                </p>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-1">ARR Multiplier</h5>
                <p className="text-xs text-gray-600">
                  Larger customers get higher priority. Accounts above $150k ARR receive a 2.0x multiplier,
                  $100k-$150k get 1.5x, and below $100k get 1.0x.
                </p>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-1">Account Plan Multiplier</h5>
                <p className="text-xs text-gray-600">
                  Your engagement strategy affects priority. Invest (1.5x) and Expand (1.3x) plans get
                  boosted priority, while Monitor (0.8x) plans are de-prioritized for routine workflows.
                </p>
              </div>

              {context && (
                <>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-1">Urgency Bonus</h5>
                    <p className="text-xs text-gray-600">
                      Additional points for time-sensitive situations like approaching renewal deadlines
                      or critical risk events.
                      {context.daysUntilRenewal !== undefined && (
                        <span className="block mt-1 text-blue-600 font-medium">
                          {context.daysUntilRenewal} days until renewal
                        </span>
                      )}
                    </p>
                  </div>

                  {context.csmWorkloadCount !== undefined && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-1">Workload Penalty</h5>
                      <p className="text-xs text-gray-600">
                        Slight reduction when CSM has many active workflows to prevent overwhelming your queue.
                        <span className="block mt-1 text-gray-500">
                          Currently: {context.csmWorkloadCount} active workflows
                        </span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Configuration Link */}
            <div className="pt-3 border-t border-gray-200">
              <a
                href="/docs/workflow-prioritization"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Learn more about workflow prioritization</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Simple Badge Variant (no tooltip)
// =====================================================

export const PriorityScoreBadge: React.FC<{ score: number; size?: 'small' | 'medium' | 'large' }> = ({
  score,
  size = 'medium'
}) => {
  const sizeConfig = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2 py-1 text-sm',
    large: 'px-3 py-1.5 text-base'
  };

  const getScoreColor = () => {
    if (score >= 200) return 'bg-red-50 text-red-700 border-red-200';
    if (score >= 100) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <span className={`inline-flex items-center ${sizeConfig[size]} ${getScoreColor()} border rounded font-medium`}>
      {score} pts
    </span>
  );
};

export default PriorityScoreBreakdown;
