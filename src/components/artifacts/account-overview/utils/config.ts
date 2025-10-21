import { Briefcase, Building, Code } from 'lucide-react';
import { ContactType, ContactTypeConfig } from '../types';

/**
 * Get styling configuration for contact type
 */
export function getContactTypeConfig(type: ContactType): ContactTypeConfig {
  switch (type) {
    case 'executive':
      return {
        icon: Briefcase,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-900',
        iconColor: 'text-purple-600',
        label: 'Executive Stakeholder'
      };
    case 'champion':
      return {
        icon: Building,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        iconColor: 'text-blue-600',
        label: 'Champion'
      };
    case 'business':
      return {
        icon: Code,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900',
        iconColor: 'text-green-600',
        label: 'Business User'
      };
  }
}

/**
 * Get color classes for risk level
 */
export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'medium':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'low':
      return 'text-green-700 bg-green-50 border-green-200';
  }
}

/**
 * Get color classes for pricing opportunity level
 */
export function getOpportunityColor(level: 'high' | 'medium' | 'low' | 'none'): string {
  switch (level) {
    case 'high':
      return 'text-green-700 bg-green-50';
    case 'medium':
      return 'text-blue-700 bg-blue-50';
    case 'low':
      return 'text-gray-700 bg-gray-50';
    case 'none':
      return 'text-gray-500 bg-gray-50';
  }
}

/**
 * Get color class for metric value based on threshold
 */
export function getMetricColor(value: number, lowThreshold: number, highThreshold: number): string {
  if (value < lowThreshold) {
    return 'text-amber-600';
  } else if (value > highThreshold) {
    return 'text-green-600';
  }
  return 'text-gray-900';
}

/**
 * Get pricing opportunity label and description
 */
export function getPricingOpportunityLabel(level: 'high' | 'medium' | 'low'): { label: string; description: string } {
  switch (level) {
    case 'high':
      return {
        label: 'Strong Pricing Opportunity',
        description: 'High usage and adoption with below-market pricing suggests significant room for value-based increase.'
      };
    case 'medium':
      return {
        label: 'Moderate Pricing Opportunity',
        description: 'Solid value metrics indicate potential for pricing optimization in your strategic plan.'
      };
    case 'low':
      return {
        label: 'Limited Pricing Opportunity',
        description: 'Current pricing appears aligned with value delivery. Monitor for future opportunities.'
      };
  }
}
