/**
 * Maps workflow_type to user-facing categories with visual styling.
 */

export type WorkflowCategory = 'data-based' | 'opportunity-based' | 'risk-based';

export interface CategoryConfig {
  category: WorkflowCategory;
  label: string;
  shortLabel: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  /** Solid accent color for card top borders */
  accentColor: string;
  /** Tag styling for dark hero card background */
  heroTagBg: string;
  heroTagText: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  renewal: {
    category: 'data-based',
    label: 'Date-Based',
    shortLabel: 'DATE',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    accentColor: 'border-t-blue-500',
    heroTagBg: 'bg-blue-500/20',
    heroTagText: 'text-blue-300',
  },
  strategic: {
    category: 'data-based',
    label: 'Date-Based',
    shortLabel: 'DATE',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    accentColor: 'border-t-blue-500',
    heroTagBg: 'bg-blue-500/20',
    heroTagText: 'text-blue-300',
  },
  opportunity: {
    category: 'opportunity-based',
    label: 'Opportunity-Based',
    shortLabel: 'OPPORTUNITY',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    accentColor: 'border-t-emerald-500',
    heroTagBg: 'bg-emerald-500/20',
    heroTagText: 'text-emerald-300',
  },
  risk: {
    category: 'risk-based',
    label: 'Risk-Based',
    shortLabel: 'RISK',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    accentColor: 'border-t-red-500',
    heroTagBg: 'bg-red-500/20',
    heroTagText: 'text-red-300',
  },
};

const DEFAULT_CATEGORY: CategoryConfig = {
  category: 'data-based',
  label: 'Date-Based',
  shortLabel: 'DATE',
  bgColor: 'bg-blue-50',
  textColor: 'text-blue-700',
  borderColor: 'border-blue-200',
  accentColor: 'border-t-blue-500',
  heroTagBg: 'bg-blue-500/20',
  heroTagText: 'text-blue-300',
};

export function classifyWorkflow(workflowType: string): WorkflowCategory {
  return (CATEGORY_MAP[workflowType] ?? DEFAULT_CATEGORY).category;
}

export function getCategoryConfig(workflowType: string): CategoryConfig {
  return CATEGORY_MAP[workflowType] ?? DEFAULT_CATEGORY;
}
