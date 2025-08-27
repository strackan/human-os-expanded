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

// API endpoints
export const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  CUSTOMER_BY_ID: (id: string) => `/api/customers/${id}`,
  CUSTOMER_BY_KEY: (key: string) => `/api/customers/${key}`,
  AUTH: {
    SIGNIN: '/api/auth/signin',
    SIGNOUT: '/api/auth/signout',
    STATUS: '/api/auth/status',
  },
} as const;

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
