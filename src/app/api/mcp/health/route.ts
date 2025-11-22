/**
 * MCP Health Check API Route
 *
 * Returns health status of all MCP servers
 */

import { NextResponse } from 'next/server';
import { initializeMCPManager } from '@/lib/mcp/MCPManager';
import { getMCPClientConfigs, isMCPEnabled } from '@/lib/mcp/config/mcp-registry';
import { checkConnectionHealth } from '@/lib/mcp/config/mcp-connections';

/**
 * GET /api/mcp/health
 * Get health status of all MCP servers
 */
export async function GET() {
  try {
    // Check if MCP is enabled
    if (!isMCPEnabled()) {
      return NextResponse.json(
        {
          enabled: false,
          message: 'MCP is not enabled',
        },
        { status: 200 }
      );
    }

    // Get connection configuration status
    const connectionHealth = await checkConnectionHealth();

    // Initialize MCP Manager
    const mcpManager = await initializeMCPManager({
      clients: getMCPClientConfigs(),
    });

    // Get health status of all clients
    const healthChecks = await mcpManager.getHealthStatus();

    // Get metrics
    const metrics = mcpManager.getMetrics();

    return NextResponse.json(
      {
        enabled: true,
        timestamp: new Date().toISOString(),
        connections: connectionHealth,
        servers: healthChecks,
        metrics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        enabled: true,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
