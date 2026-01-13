// Global constants for the application

// URL Patterns
export const URL_PATTERNS = {
  VIEW_CUSTOMER: (customerId: string) => `/customers/view/${customerId}`,
  CUSTOMER_LIST: '/customers',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  SIGNIN: '/signin',
} as const;

// Customer-related constants
export const CUSTOMER_CONSTANTS = {
  DEFAULT_RISK_LEVEL: 'Medium',
  DEFAULT_RISK_COLOR: 'yellow',
} as const;

// API endpoints (now centralized in api-routes.ts)
// Re-export for backward compatibility
export { API_ROUTES } from './constants/api-routes';
export { API_ROUTES as API_ENDPOINTS } from './constants/api-routes';

// Chat workflow constants
export const CHAT_CONSTANTS = {
  DEFAULT_PLACEHOLDER: 'Type your message...',
  DEFAULT_BOT_INTRO: 'Hello! How can I help you today?',
} as const;

// UI constants
export const UI_CONSTANTS = {
  MIN_PANEL_WIDTH: 320,
  DEFAULT_PANEL_WIDTH: 600,
  TRANSITION_DURATION: 200,
} as const;

// Terminology constants (customer-facing labels)
export const TERMINOLOGY = {
  WORKFLOW_SINGULAR: 'Play',
  WORKFLOW_PLURAL: 'Plays',
  WORKFLOW_SINGULAR_LOWER: 'play',
  WORKFLOW_PLURAL_LOWER: 'plays',
  TASK_MODE: 'Task Mode',
  TASK_MODE_LOWER: 'task mode',
} as const;

// Helper function to get time-based greeting
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}
