/**
 * Account Plan Indicator Component
 *
 * Displays a subtle account plan indicator for a customer.
 * Shows on customer profile, workflow header, and dashboard.
 *
 * Design: Clean, minimal - NO colorful badges yet
 * Shows plan type with hover tooltip for details
 *
 * Phase: Account Plan & Workflow Automation UI - Task 3
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AccountPlanType } from './AccountPlanSelector';

// =====================================================
// Types
// =====================================================

export interface AccountPlanIndicatorProps {
  plan: AccountPlanType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

// =====================================================
// Plan Descriptions
// =====================================================

const PLAN_INFO: Record<AccountPlanType, { name: string; description: string; shortDesc: string }> = {
  invest: {
    name: 'Invest',
    description: 'Long-term strategic growth - dedicate significant CSM time',
    shortDesc: 'High-touch strategic engagement'
  },
  expand: {
    name: 'Expand',
    description: 'Short-term revenue opportunity - focus on upsell/expansion',
    shortDesc: 'Active growth-focused engagement'
  },
  manage: {
    name: 'Manage',
    description: 'Standard touch - high-threshold events only',
    shortDesc: 'Standard scheduled engagement'
  },
  monitor: {
    name: 'Monitor',
    description: 'At-risk defensive attention - frequent health checks',
    shortDesc: 'Close monitoring and intervention'
  }
};

// =====================================================
// AccountPlanIndicator Component
// =====================================================

export const AccountPlanIndicator: React.FC<AccountPlanIndicatorProps> = ({
  plan,
  size = 'medium',
  showLabel = true,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const planInfo = PLAN_INFO[plan];

  // Size configurations
  const sizeConfig = {
    small: {
      icon: 'text-xs',
      label: 'text-xs',
      padding: 'px-2 py-0.5',
      iconOnly: 'w-5 h-5'
    },
    medium: {
      icon: 'text-sm',
      label: 'text-sm',
      padding: 'px-3 py-1',
      iconOnly: 'w-6 h-6'
    },
    large: {
      icon: 'text-base',
      label: 'text-base',
      padding: 'px-4 py-1.5',
      iconOnly: 'w-8 h-8'
    }
  };

  const config = sizeConfig[size];

  // Calculate tooltip position based on viewport
  useEffect(() => {
    if (showTooltip && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Show tooltip above if not enough space below
      if (spaceBelow < 120 && spaceAbove > 120) {
        setTooltipPosition('top');
      } else {
        setTooltipPosition('bottom');
      }
    }
  }, [showTooltip]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Main Indicator */}
      <div
        className={`
          inline-flex items-center space-x-1.5
          ${showLabel ? config.padding : `${config.iconOnly} justify-center`}
          bg-gray-100 text-gray-700 rounded-md
          border border-gray-200
          transition-all duration-150
          ${showTooltip ? 'bg-gray-200 border-gray-300' : ''}
        `}
      >
        {/* Icon */}
        <span className={`font-medium ${config.icon}`}>
          {plan === 'invest' && '⭐'}
          {plan === 'expand' && '📈'}
          {plan === 'manage' && '🔄'}
          {plan === 'monitor' && '👁️'}
        </span>

        {/* Label */}
        {showLabel && (
          <span className={`font-medium ${config.label}`}>
            {planInfo.name}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`
            absolute left-1/2 -translate-x-1/2 z-50
            w-64 p-3 bg-gray-900 text-white rounded-lg shadow-lg
            transition-opacity duration-150
            ${tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
        >
          {/* Arrow */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45
              ${tooltipPosition === 'top' ? 'bottom-[-4px]' : 'top-[-4px]'}
            `}
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">
                {plan === 'invest' && '⭐'}
                {plan === 'expand' && '📈'}
                {plan === 'manage' && '🔄'}
                {plan === 'monitor' && '👁️'}
              </span>
              <span className="font-semibold text-sm">{planInfo.name} Plan</span>
            </div>
            <p className="text-xs text-gray-200 mb-2">
              {planInfo.description}
            </p>
            <div className="text-xs text-gray-300 pt-2 border-t border-gray-700">
              {planInfo.shortDesc}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Inline Text Variant (for use in sentences)
// =====================================================

export const AccountPlanBadge: React.FC<{ plan: AccountPlanType }> = ({ plan }) => {
  const planInfo = PLAN_INFO[plan];

  return (
    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
      <span>
        {plan === 'invest' && '⭐'}
        {plan === 'expand' && '📈'}
        {plan === 'manage' && '🔄'}
        {plan === 'monitor' && '👁️'}
      </span>
      <span>{planInfo.name}</span>
    </span>
  );
};

export default AccountPlanIndicator;
