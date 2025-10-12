/**
 * UI Text Configuration (i18n-style globals)
 *
 * Centralized configuration for all UI text strings across the application.
 * Eventually this can be extended to support multiple languages, themes, or contexts.
 *
 * Usage:
 * ```tsx
 * import { uiText } from '@/config/uiText';
 *
 * <h2>{uiText.dashboard.priorityTasks.title}</h2>
 * ```
 */

export const uiText = {
  dashboard: {
    priorityTasks: {
      title: "Before You Leave",
      subtitle: "tasks",
      emptyState: "No priority tasks at this time",
    },
    // Add more dashboard sections here
    metrics: {
      arr: "ARR",
      renewalRate: "Renewal Rate",
      avgDealSize: "Avg Deal Size",
    }
  },
  // Add more top-level sections as needed
  workflow: {
    // Future: workflow text strings
  },
  artifacts: {
    // Future: artifact text strings
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    loading: "Loading...",
  }
};

// Type for accessing UI text - provides autocomplete
export type UIText = typeof uiText;

// Helper function to get nested text values safely
export function getUIText(path: string, defaultValue: string = ""): string {
  const keys = path.split('.');
  let value: any = uiText;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return typeof value === 'string' ? value : defaultValue;
}

export default uiText;
