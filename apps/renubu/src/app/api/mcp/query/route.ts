/**
 * MCP Query API Route
 *
 * Handles generic MCP server queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeMCPManager } from '@/lib/mcp/MCPManager';
import { getMCPClientConfigs, isMCPEnabled } from '@/lib/mcp/config/mcp-registry';
import type { MCPQueryRequest } from '@/lib/mcp/types/mcp.types';

/**
 * POST /api/mcp/query
 * Execute a query on an MCP server
 */
export async function POST(request: NextRequest) {
  try {
    // Check if MCP is enabled
    if (!isMCPEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MCP_DISABLED',
            message: 'MCP is not enabled. Set MCP_ENABLED=true in environment variables.',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body: MCPQueryRequest = await request.json();

    // Validate request
    if (!body.server || !body.action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: server and action',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Initialize MCP Manager
    const mcpManager = await initializeMCPManager({
      clients: getMCPClientConfigs(),
    });

    // Execute query
    const result = await mcpManager.query(body);

    // Return result
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('MCP query error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
