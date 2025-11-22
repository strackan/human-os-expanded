/**
 * MCP Connections Configuration
 *
 * Manages connection strings and credentials for MCP servers.
 */

/**
 * Supabase Connection
 */
export function getSupabaseConnection() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * PostgreSQL Connection
 */
export function getPostgreSQLConnection() {
  // Use Supabase connection string or separate PostgreSQL connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectId = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  return {
    connectionString:
      process.env.MCP_POSTGRES_CONNECTION_STRING ||
      (projectId
        ? `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectId}.supabase.co:5432/postgres`
        : ''),
  };
}

/**
 * Memory Storage Configuration
 */
export function getMemoryStorageConfig() {
  return {
    type: process.env.MCP_MEMORY_STORAGE_TYPE || 'in-memory', // 'in-memory' or 'database'
    supabaseTable: process.env.MCP_MEMORY_TABLE || 'mcp_memory',
    ttl: parseInt(process.env.MCP_MEMORY_TTL || '86400'), // 24 hours default
  };
}

/**
 * Email Configuration (for future Phase 2)
 */
export function getEmailConnection() {
  return {
    provider: process.env.MCP_EMAIL_PROVIDER || 'mailgun', // 'mailgun', 'sendgrid', 'ses'
    apiKey: process.env.MCP_EMAIL_API_KEY || '',
    domain: process.env.MCP_EMAIL_DOMAIN || '',
    from: process.env.MCP_EMAIL_FROM || '',
  };
}

/**
 * Slack Configuration (for future Phase 2)
 */
export function getSlackConnection() {
  return {
    botToken: process.env.MCP_SLACK_BOT_TOKEN || '',
    appToken: process.env.MCP_SLACK_APP_TOKEN || '',
    signingSecret: process.env.MCP_SLACK_SIGNING_SECRET || '',
  };
}

/**
 * Google Calendar Configuration (for future Phase 2)
 */
export function getCalendarConnection() {
  return {
    clientId: process.env.MCP_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.MCP_GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.MCP_GOOGLE_REDIRECT_URI || '',
  };
}

/**
 * Validate required environment variables
 */
export function validateMCPEnvironment(): {
  valid: boolean;
  missing: string[];
} {
  const required: string[] = [];
  const missing: string[] = [];

  // Phase 1 required vars
  if (process.env.MCP_ENABLE_SUPABASE === 'true') {
    required.push('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (process.env.MCP_ENABLE_POSTGRESQL === 'true') {
    required.push('MCP_POSTGRES_CONNECTION_STRING');
  }

  // Check for missing variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get connection health check status
 */
export async function checkConnectionHealth() {
  const supabase = getSupabaseConnection();
  const postgresql = getPostgreSQLConnection();

  return {
    supabase: {
      configured: !!(supabase.url && supabase.anonKey),
      url: supabase.url,
    },
    postgresql: {
      configured: !!postgresql.connectionString,
      masked: postgresql.connectionString
        ? postgresql.connectionString.replace(/:[^:]+@/, ':****@')
        : 'Not configured',
    },
    memory: {
      configured: true,
      type: getMemoryStorageConfig().type,
    },
  };
}
