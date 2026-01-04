/**
 * MCP Registry
 *
 * Central registry of all MCP servers and their configurations.
 */

import type { MCPClientConfig, MCPServer } from '../types/mcp.types';

/**
 * Get MCP client configurations
 */
export function getMCPClientConfigs(): MCPClientConfig[] {
  return [
    {
      server: 'supabase' as MCPServer,
      enabled: process.env.MCP_ENABLE_SUPABASE === 'true',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    {
      server: 'postgresql' as MCPServer,
      enabled: process.env.MCP_ENABLE_POSTGRESQL === 'true',
      timeout: 15000,
      retryAttempts: 2,
      retryDelay: 1000,
    },
    {
      server: 'memory' as MCPServer,
      enabled: process.env.MCP_ENABLE_MEMORY === 'true',
      timeout: 5000,
      retryAttempts: 1,
      retryDelay: 500,
    },
    {
      server: 'sequential_thinking' as MCPServer,
      enabled: process.env.MCP_ENABLE_SEQUENTIAL_THINKING === 'true',
      timeout: 30000, // Longer timeout for thinking
      retryAttempts: 1,
      retryDelay: 1000,
    },
  ];
}

/**
 * Check if a specific MCP server is enabled
 */
export function isMCPServerEnabled(server: MCPServer): boolean {
  const configs = getMCPClientConfigs();
  const config = configs.find((c) => c.server === server);
  return config?.enabled ?? false;
}

/**
 * Get configuration for a specific MCP server
 */
export function getMCPServerConfig(
  server: MCPServer
): MCPClientConfig | undefined {
  const configs = getMCPClientConfigs();
  return configs.find((c) => c.server === server);
}

/**
 * Get all enabled MCP servers
 */
export function getEnabledMCPServers(): MCPServer[] {
  const configs = getMCPClientConfigs();
  return configs.filter((c) => c.enabled).map((c) => c.server);
}

/**
 * MCP Feature Flags
 */
export const MCP_FEATURES = {
  // Phase 1: Foundation
  supabase_mcp: process.env.MCP_ENABLE_SUPABASE === 'true',
  postgresql_mcp: process.env.MCP_ENABLE_POSTGRESQL === 'true',
  memory_mcp: process.env.MCP_ENABLE_MEMORY === 'true',
  sequential_thinking_mcp: process.env.MCP_ENABLE_SEQUENTIAL_THINKING === 'true',

  // Phase 2: Communication (future)
  email_mcp: process.env.MCP_ENABLE_EMAIL === 'true',
  slack_mcp: process.env.MCP_ENABLE_SLACK === 'true',
  calendar_mcp: process.env.MCP_ENABLE_CALENDAR === 'true',

  // Phase 3: Integrations (future)
  github_mcp: process.env.MCP_ENABLE_GITHUB === 'true',
  linear_mcp: process.env.MCP_ENABLE_LINEAR === 'true',
  stripe_mcp: process.env.MCP_ENABLE_STRIPE === 'true',
  twilio_mcp: process.env.MCP_ENABLE_TWILIO === 'true',

  // Phase 4: Documents (future)
  playwright_mcp: process.env.MCP_ENABLE_PLAYWRIGHT === 'true',
  ocr_mcp: process.env.MCP_ENABLE_OCR === 'true',
} as const;

/**
 * Check if MCP is globally enabled
 */
export function isMCPEnabled(): boolean {
  return process.env.MCP_ENABLED === 'true';
}

/**
 * Get MCP logging level
 */
export function getMCPLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  const level = process.env.MCP_LOG_LEVEL?.toLowerCase();
  if (
    level === 'debug' ||
    level === 'info' ||
    level === 'warn' ||
    level === 'error'
  ) {
    return level;
  }
  return 'info';
}
