/**
 * Account Plan Selector Component
 *
 * Allows CSMs to select an account plan for a customer.
 * Four plan types: invest, expand, manage, monitor
 *
 * Features:
 * - Clean, minimal card-based design
 * - Hover states with detailed descriptions
 * - Selection state management
 * - Callback on selection change
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export type AccountPlanType = 'invest' | 'expand' | 'manage' | 'monitor';

export interface AccountPlan {
  type: AccountPlanType;
  name: string;
  description: string;
  details: string[];
  recommended?: boolean;
}

export interface AccountPlanSelectorProps {
  selectedPlan?: AccountPlanType;
  onSelectPlan?: (plan: AccountPlanType) => void;
  recommendedPlan?: AccountPlanType;
  disabled?: boolean;
  className?: string;
}

// =====================================================
// Account Plan Definitions
// =====================================================

const ACCOUNT_PLANS: AccountPlan[] = [
  {
    type: 'invest',
    name: 'Invest',
    description: 'Long-term strategic growth - dedicate significant CSM time',
    details: [
      'High-touch engagement with frequent check-ins',
      'Strategic planning and business reviews',
      'Executive relationship building',
      'Custom success initiatives and expansion opportunities'
    ]
  },
  {
    type: 'expand',
    name: 'Expand',
    description: 'Short-term revenue opportunity - focus on upsell/expansion',
    details: [
      'Active engagement focused on growth opportunities',
      'Regular touchpoints to identify expansion needs',
      'Proactive product adoption and feature education',
      'Quick response to business changes and opportunities'
    ]
  },
  {
    type: 'manage',
    name: 'Manage',
    description: 'Standard touch - high-threshold events only',
    details: [
      'Scheduled quarterly business reviews',
      'Response to critical events and support escalations',
      'Renewal management and basic health monitoring',
      'Balanced approach for stable, satisfied customers'
    ]
  },
  {
    type: 'monitor',
    name: 'Monitor',
    description: 'At-risk defensive attention - frequent health checks',
    details: [
      'Close monitoring of engagement and usage metrics',
      'Proactive outreach on warning signs',
      'Risk mitigation and retention strategies',
      'Frequent health checks and intervention when needed'
    ]
  }
];

// =====================================================
// AccountPlanSelector Component
// =====================================================

export const AccountPlanSelector: React.FC<AccountPlanSelectorProps> = ({
  selectedPlan,
  onSelectPlan,
  recommendedPlan,
  disabled = false,
  className = ''
}) => {
  const [selected, setSelected] = useState<AccountPlanType | undefined>(selectedPlan);
  const [hoveredPlan, setHoveredPlan] = useState<AccountPlanType | undefined>(undefined);

  // Update internal state when prop changes
  useEffect(() => {
    setSelected(selectedPlan);
  }, [selectedPlan]);

  const handleSelectPlan = (planType: AccountPlanType) => {
    if (disabled) return;

    setSelected(planType);
    onSelectPlan?.(planType);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Account Plan
        </h3>
        <p className="text-sm text-gray-600">
          Choose the appropriate engagement level for this customer based on their strategic value,
          growth potential, and current health status.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACCOUNT_PLANS.map((plan) => {
          const isSelected = selected === plan.type;
          const isRecommended = recommendedPlan === plan.type;
          const isHovered = hoveredPlan === plan.type;

          return (
            <button
              key={plan.type}
              onClick={() => handleSelectPlan(plan.type)}
              onMouseEnter={() => setHoveredPlan(plan.type)}
              onMouseLeave={() => setHoveredPlan(undefined)}
              disabled={disabled}
              className={`
                relative p-5 rounded-lg border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : isHovered
                  ? 'border-gray-300 bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Recommended Badge */}
              {isRecommended && !isSelected && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                    Recommended
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h4 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                {plan.name}
              </h4>

              {/* Plan Description */}
              <p className={`text-sm mb-3 ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                {plan.description}
              </p>

              {/* Divider */}
              <div className={`h-px mb-3 ${isSelected ? 'bg-blue-200' : 'bg-gray-200'}`} />

              {/* Plan Details (shown on hover or when selected) */}
              <div
                className={`
                  space-y-2 transition-all duration-200
                  ${isHovered || isSelected ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}
                `}
              >
                <p className={`text-xs font-medium uppercase tracking-wide ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                  What this means:
                </p>
                <ul className="space-y-1.5">
                  {plan.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <span className={`mr-2 text-xs ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                        •
                      </span>
                      <span className={`text-xs leading-relaxed ${isSelected ? 'text-blue-800' : 'text-gray-600'}`}>
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Placeholder when not hovered (to maintain card height) */}
              {!isHovered && !isSelected && (
                <div className="h-6 flex items-center justify-center">
                  <span className="text-xs text-gray-400 italic">
                    Hover to see details
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Plan Summary */}
      {selected && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                <Check className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Selected: {ACCOUNT_PLANS.find(p => p.type === selected)?.name} Plan
              </h4>
              <p className="text-sm text-blue-800">
                {ACCOUNT_PLANS.find(p => p.type === selected)?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!selected && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 italic">
            Select a plan to continue. You can change this later if needed.
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountPlanSelector;
