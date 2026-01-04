export interface Stage {
  id: number;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface Customer {
  id: number;
  name: string;
  arr: string;
  renewalDate: string;
  daysUntil: number;
  exec: string;
  health: string;
  healthColor: string;
  stages: Stage[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Re-export MCP types
export * from './mcp';
export * from './customer';
export * from './email';
export * from './wake-triggers';
export * from './talent'; 