/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Defines types for MCP server interactions, tool definitions,
 * and response formats.
 */

/**
 * MCP Server Names
 */
export enum MCPServer {
  SUPABASE = 'supabase',
  POSTGRESQL = 'postgresql',
  MEMORY = 'memory',
  EMAIL = 'email',
  SLACK = 'slack',
  CALENDAR = 'calendar',
  GITHUB = 'github',
  LINEAR = 'linear',
  STRIPE = 'stripe',
  TWILIO = 'twilio',
  PLAYWRIGHT = 'playwright',
  OCR = 'ocr',
}

/**
 * MCP Server Status
 */
export enum MCPServerStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline',
}

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  server: MCPServer;
  parameters: {
    type: 'object';
    properties: Record<string, MCPParameter>;
    required?: string[];
  };
}

/**
 * MCP Parameter Definition
 */
export interface MCPParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
  items?: MCPParameter;
  properties?: Record<string, MCPParameter>;
}

/**
 * MCP Query Request
 */
export interface MCPQueryRequest {
  server: MCPServer;
  action: string;
  parameters?: Record<string, any>;
  metadata?: {
    userId?: string;
    companyId?: string;
    workflowId?: string;
    threadId?: string;
  };
}

/**
 * MCP Query Response
 */
export interface MCPQueryResponse<T = any> {
  success: boolean;
  data?: T;
  error?: MCPError;
  metadata?: {
    duration: number;
    tokensUsed?: number;
    requestId: string;
  };
}

/**
 * MCP Error
 */
export interface MCPError {
  code: string;
  message: string;
  details?: Record<string, any>;
  server: MCPServer;
  timestamp: string;
}

/**
 * MCP Client Configuration
 */
export interface MCPClientConfig {
  server: MCPServer;
  endpoint?: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enabled: boolean;
}

/**
 * MCP Health Check Response
 */
export interface MCPHealthCheck {
  server: MCPServer;
  status: MCPServerStatus;
  latency?: number;
  lastCheck: string;
  error?: string;
}

/**
 * Supabase MCP Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SupabaseMCP {
  export interface QueryParams {
    table: string;
    select?: string;
    filter?: Record<string, any>;
    order?: {
      column: string;
      ascending?: boolean;
    };
    limit?: number;
    offset?: number;
  }

  export interface InsertParams {
    table: string;
    data: Record<string, any> | Record<string, any>[];
  }

  export interface UpdateParams {
    table: string;
    data: Record<string, any>;
    filter: Record<string, any>;
  }

  export interface DeleteParams {
    table: string;
    filter: Record<string, any>;
  }

  export interface RPCParams {
    function: string;
    params?: Record<string, any>;
  }
}

/**
 * PostgreSQL MCP Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PostgreSQLMCP {
  export interface QueryParams {
    sql: string;
    params?: any[];
  }

  export interface QueryResult {
    rows: Record<string, any>[];
    rowCount: number;
    fields: Array<{
      name: string;
      dataTypeID: number;
    }>;
  }
}

/**
 * Memory MCP Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MemoryMCP {
  export interface StoreParams {
    key: string;
    value: any;
    metadata?: {
      context?: string;
      tags?: string[];
      expiresAt?: string;
    };
  }

  export interface RetrieveParams {
    key?: string;
    query?: string;
    context?: string;
    tags?: string[];
    limit?: number;
  }

  export interface MemoryEntry {
    key: string;
    value: any;
    metadata: {
      createdAt: string;
      updatedAt: string;
      accessCount: number;
      context?: string;
      tags?: string[];
    };
  }

  export interface DeleteParams {
    key?: string;
    context?: string;
    tags?: string[];
  }
}

/**
 * Email MCP Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace EmailMCP {
  export interface DraftParams {
    context: {
      customerName: string;
      renewalDate: string;
      contractDetails?: any;
    };
    template?: string;
  }

  export interface SendParams {
    to: string | string[];
    from: string;
    subject: string;
    body: string;
    html?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
  }

  export interface EmailStatus {
    id: string;
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
    timestamp: string;
  }
}

/**
 * Slack MCP Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SlackMCP {
  export interface PostMessageParams {
    channel: string;
    text: string;
    blocks?: any[];
    attachments?: any[];
    threadTs?: string;
  }

  export interface AlertParams {
    type: 'renewal_risk' | 'health_score_drop' | 'contract_expiring' | 'payment_failed';
    customer: {
      id: string;
      name: string;
    };
    details: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }
}

/**
 * Calendar MCP Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CalendarMCP {
  export interface FindAvailabilityParams {
    duration: number; // minutes
    participants: string[];
    startDate?: string;
    endDate?: string;
    workingHours?: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
  }

  export interface CreateMeetingParams {
    summary: string;
    description?: string;
    start: string; // ISO 8601
    end: string; // ISO 8601
    attendees: string[];
    location?: string;
    reminders?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  }

  export interface Meeting {
    id: string;
    summary: string;
    start: string;
    end: string;
    attendees: Array<{
      email: string;
      status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
    }>;
    htmlLink: string;
  }
}

/**
 * Tool Call (from LLM)
 */
export interface MCPToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Tool Result (to LLM)
 */
export interface MCPToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string; // JSON string or text
}

/**
 * MCP Manager Configuration
 */
export interface MCPManagerConfig {
  clients: MCPClientConfig[];
  defaultTimeout?: number;
  enableHealthChecks?: boolean;
  healthCheckInterval?: number; // milliseconds
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * MCP Metrics
 */
export interface MCPMetrics {
  server: MCPServer;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageLatency: number;
  lastRequest: string;
}
