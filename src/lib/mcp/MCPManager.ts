/**
 * MCP Manager
 *
 * Central coordinator for all MCP server clients.
 * Manages client initialization, tool execution, and health monitoring.
 */

import { SupabaseMCPClient } from './clients/SupabaseMCPClient';
import { PostgreSQLMCPClient } from './clients/PostgreSQLMCPClient';
import { MemoryMCPClient } from './clients/MemoryMCPClient';
import { SequentialThinkingMCPClient } from './clients/SequentialThinkingMCPClient';
import { HumanOSClient } from './clients/HumanOSClient';
import { MCPServerStatus } from './types/mcp.types';
import type {
  MCPServer,
  MCPQueryRequest,
  MCPQueryResponse,
  MCPManagerConfig,
  MCPClientConfig,
  MCPHealthCheck,
  MCPToolCall,
  MCPToolResult,
  MCPMetrics,
  MCPTool,
} from './types/mcp.types';

/**
 * MCP Manager Class
 */
export class MCPManager {
  private supabaseClient?: SupabaseMCPClient;
  private postgresqlClient?: PostgreSQLMCPClient;
  private memoryClient?: MemoryMCPClient;
  private sequentialThinkingClient?: SequentialThinkingMCPClient;
  private humanOSClient?: HumanOSClient;

  private config: MCPManagerConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private metrics: Map<MCPServer, MCPMetrics> = new Map();

  constructor(config?: Partial<MCPManagerConfig>) {
    this.config = {
      clients: config?.clients || [],
      defaultTimeout: config?.defaultTimeout || 10000,
      enableHealthChecks: config?.enableHealthChecks ?? true,
      healthCheckInterval: config?.healthCheckInterval || 60000, // 1 minute
      logLevel: config?.logLevel || 'info',
    };
  }

  /**
   * Initialize all configured MCP clients
   */
  async initialize(): Promise<void> {
    this.log('info', 'Initializing MCP Manager');

    const clientConfigs = this.config.clients;

    for (const clientConfig of clientConfigs) {
      if (!clientConfig.enabled) {
        this.log('info', `Skipping disabled client: ${clientConfig.server}`);
        continue;
      }

      try {
        await this.initializeClient(clientConfig);
        this.log('info', `Initialized client: ${clientConfig.server}`);

        // Initialize metrics
        this.metrics.set(clientConfig.server, {
          server: clientConfig.server,
          requestCount: 0,
          successCount: 0,
          errorCount: 0,
          averageLatency: 0,
          lastRequest: new Date().toISOString(),
        });
      } catch (error) {
        this.log('error', `Failed to initialize ${clientConfig.server}:`, error);
      }
    }

    // Start health checks if enabled
    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    this.log('info', 'MCP Manager initialized successfully');
  }

  /**
   * Initialize a specific MCP client
   */
  private async initializeClient(config: MCPClientConfig): Promise<void> {
    switch (config.server) {
      case 'supabase':
        this.supabaseClient = new SupabaseMCPClient();
        break;

      case 'postgresql':
        this.postgresqlClient = new PostgreSQLMCPClient();
        break;

      case 'memory':
        this.memoryClient = new MemoryMCPClient(true); // Enable persistence
        break;

      case 'sequential_thinking':
        this.sequentialThinkingClient = new SequentialThinkingMCPClient();
        break;

      case 'human_os':
        this.humanOSClient = new HumanOSClient();
        break;

      default:
        throw new Error(`Unknown MCP server: ${config.server}`);
    }
  }

  /**
   * Execute a query on a specific MCP server
   */
  async query(request: MCPQueryRequest): Promise<MCPQueryResponse> {
    const startTime = Date.now();

    try {
      const client = this.getClient(request.server);
      if (!client) {
        return {
          success: false,
          error: {
            code: 'CLIENT_NOT_INITIALIZED',
            message: `MCP client for ${request.server} is not initialized`,
            server: request.server,
            timestamp: new Date().toISOString(),
          },
        };
      }

      this.log('debug', `Executing query on ${request.server}:`, request);

      const response = await client.execute(request.action, request.parameters);

      // Update metrics
      this.updateMetrics(request.server, true, Date.now() - startTime);

      return response;
    } catch (error) {
      this.log('error', `Query failed on ${request.server}:`, error);

      // Update metrics
      this.updateMetrics(request.server, false, Date.now() - startTime);

      return {
        success: false,
        error: {
          code: 'QUERY_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          server: request.server,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Execute a tool call from the LLM
   */
  async executeTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    try {
      const { name, arguments: argsString } = toolCall.function;
      const args = JSON.parse(argsString);

      // Parse server and action from tool name
      // Format: mcp_{server}_{action}
      const parts = name.split('_');
      if (parts.length < 3 || parts[0] !== 'mcp') {
        throw new Error(`Invalid tool name format: ${name}`);
      }

      const server = parts[1] as MCPServer;
      const action = parts.slice(2).join('_');

      // Execute query
      const response = await this.query({
        server,
        action,
        parameters: args,
      });

      // Return result
      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        content: JSON.stringify(response),
      };
    } catch (error) {
      this.log('error', 'Tool execution failed:', error);

      return {
        tool_call_id: toolCall.id,
        role: 'tool',
        content: JSON.stringify({
          success: false,
          error: {
            code: 'TOOL_EXECUTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        }),
      };
    }
  }

  /**
   * Get all tool definitions for LLM
   */
  getToolDefinitions(): MCPTool[] {
    const tools: any[] = [];

    if (this.supabaseClient) {
      tools.push(...this.supabaseClient.getToolDefinitions());
    }
    if (this.postgresqlClient) {
      tools.push(...this.postgresqlClient.getToolDefinitions());
    }
    if (this.memoryClient) {
      tools.push(...this.memoryClient.getToolDefinitions());
    }
    if (this.sequentialThinkingClient) {
      tools.push(...this.sequentialThinkingClient.getToolDefinitions());
    }
    if (this.humanOSClient) {
      tools.push(...this.humanOSClient.getToolDefinitions());
    }

    return tools as MCPTool[];
  }

  /**
   * Get health status of all clients
   */
  async getHealthStatus(): Promise<MCPHealthCheck[]> {
    const healthChecks: MCPHealthCheck[] = [];

    for (const [server, client] of this.getActiveClients()) {
      try {
        const health = await client.healthCheck();
        healthChecks.push({
          server,
          status: health.healthy
            ? MCPServerStatus.HEALTHY
            : MCPServerStatus.UNHEALTHY,
          latency: health.latency,
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        healthChecks.push({
          server,
          status: MCPServerStatus.OFFLINE,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Health check failed',
        });
      }
    }

    return healthChecks;
  }

  /**
   * Get metrics for all clients
   */
  getMetrics(): MCPMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics for a specific server
   */
  getServerMetrics(server: MCPServer): MCPMetrics | undefined {
    return this.metrics.get(server);
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthStatus = await this.getHealthStatus();
        this.log('debug', 'Health check results:', healthStatus);

        // Log unhealthy clients
        const unhealthy = healthStatus.filter(
          (h) => h.status !== MCPServerStatus.HEALTHY
        );
        if (unhealthy.length > 0) {
          this.log('warn', 'Unhealthy MCP clients:', unhealthy);
        }
      } catch (error) {
        this.log('error', 'Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get a specific client
   */
  private getClient(
    server: MCPServer
  ): SupabaseMCPClient | PostgreSQLMCPClient | MemoryMCPClient | SequentialThinkingMCPClient | HumanOSClient | undefined {
    switch (server) {
      case 'supabase':
        return this.supabaseClient;
      case 'postgresql':
        return this.postgresqlClient;
      case 'memory':
        return this.memoryClient;
      case 'sequential_thinking':
        return this.sequentialThinkingClient;
      case 'human_os':
        return this.humanOSClient;
      default:
        return undefined;
    }
  }

  /**
   * Get Human-OS client directly (typed accessor)
   */
  getHumanOSClient(): HumanOSClient | undefined {
    return this.humanOSClient;
  }

  /**
   * Get all active clients
   */
  private getActiveClients(): Array<
    [MCPServer, SupabaseMCPClient | PostgreSQLMCPClient | MemoryMCPClient | SequentialThinkingMCPClient | HumanOSClient]
  > {
    const clients: Array<
      [MCPServer, SupabaseMCPClient | PostgreSQLMCPClient | MemoryMCPClient | SequentialThinkingMCPClient | HumanOSClient]
    > = [];

    if (this.supabaseClient) {
      clients.push(['supabase' as MCPServer, this.supabaseClient]);
    }
    if (this.postgresqlClient) {
      clients.push(['postgresql' as MCPServer, this.postgresqlClient]);
    }
    if (this.memoryClient) {
      clients.push(['memory' as MCPServer, this.memoryClient]);
    }
    if (this.sequentialThinkingClient) {
      clients.push(['sequential_thinking' as MCPServer, this.sequentialThinkingClient]);
    }
    if (this.humanOSClient) {
      clients.push(['human_os' as MCPServer, this.humanOSClient]);
    }

    return clients;
  }

  /**
   * Update metrics for a server
   */
  private updateMetrics(
    server: MCPServer,
    success: boolean,
    latency: number
  ): void {
    const metrics = this.metrics.get(server);
    if (!metrics) return;

    metrics.requestCount++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }

    // Update average latency
    metrics.averageLatency =
      (metrics.averageLatency * (metrics.requestCount - 1) + latency) /
      metrics.requestCount;

    metrics.lastRequest = new Date().toISOString();

    this.metrics.set(server, metrics);
  }

  /**
   * Logging utility
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel || 'info'];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[MCP Manager ${level.toUpperCase()}] ${timestamp}:`;

      switch (level) {
        case 'error':
          console.error(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        default:
          console.log(prefix, message, ...args);
      }
    }
  }

  /**
   * Cleanup and close all connections
   */
  async close(): Promise<void> {
    this.log('info', 'Closing MCP Manager');

    this.stopHealthChecks();

    if (this.postgresqlClient) {
      await this.postgresqlClient.close();
    }

    this.log('info', 'MCP Manager closed');
  }
}

/**
 * Singleton instance
 */
let mcpManager: MCPManager | null = null;

/**
 * Get or create MCP Manager instance
 */
export function getMCPManager(config?: Partial<MCPManagerConfig>): MCPManager {
  if (!mcpManager) {
    mcpManager = new MCPManager(config);
  }
  return mcpManager;
}

/**
 * Initialize MCP Manager
 */
export async function initializeMCPManager(
  config?: Partial<MCPManagerConfig>
): Promise<MCPManager> {
  const manager = getMCPManager(config);
  await manager.initialize();
  return manager;
}
