/**
 * MCP Tools API Route
 *
 * Returns available MCP tool definitions for LLM
 */

import { NextResponse } from 'next/server';
import { initializeMCPManager } from '@/lib/mcp/MCPManager';
import { getMCPClientConfigs, isMCPEnabled } from '@/lib/mcp/config/mcp-registry';

/**
 * GET /api/mcp/tools
 * Get all available MCP tool definitions
 */
export async function GET() {
  try {
    // Check if MCP is enabled
    if (!isMCPEnabled()) {
      return NextResponse.json(
        {
          enabled: false,
          tools: [],
        },
        { status: 200 }
      );
    }

    // Initialize MCP Manager
    const mcpManager = await initializeMCPManager({
      clients: getMCPClientConfigs(),
    });

    // Get tool definitions
    const tools = mcpManager.getToolDefinitions();

    return NextResponse.json(
      {
        enabled: true,
        count: tools.length,
        tools,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to get MCP tools:', error);

    return NextResponse.json(
      {
        enabled: true,
        error: error instanceof Error ? error.message : 'Failed to get tools',
        tools: [],
      },
      { status: 500 }
    );
  }
}
