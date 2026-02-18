/**
 * Maps workflow_type to user-facing categories with visual styling.
 */

export type WorkflowCategory = 'data-based' | 'opportunity-based' | 'risk-based';

export interface CategoryConfig {
  category: WorkflowCategory;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  renewal: {
    category: 'data-based',
    label: 'Data-Based',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  strategic: {
    category: 'data-based',
    label: 'Data-Based',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  opportunity: {
    category: 'opportunity-based',
    label: 'Opportunity-Based',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  risk: {
    category: 'risk-based',
    label: 'Risk-Based',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
};

const DEFAULT_CATEGORY: CategoryConfig = {
  category: 'data-based',
  label: 'Data-Based',
  bgColor: 'bg-blue-50',
  textColor: 'text-blue-700',
  borderColor: 'border-blue-200',
};

export function classifyWorkflow(workflowType: string): WorkflowCategory {
  return (CATEGORY_MAP[workflowType] ?? DEFAULT_CATEGORY).category;
}

export function getCategoryConfig(workflowType: string): CategoryConfig {
  return CATEGORY_MAP[workflowType] ?? DEFAULT_CATEGORY;
}
