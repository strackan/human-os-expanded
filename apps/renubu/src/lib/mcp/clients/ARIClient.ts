/**
 * ARI MCP Client
 *
 * Wraps ARI's FastAPI REST API as an MCP client.
 * Follows HumanOSClient pattern with graceful degradation.
 *
 * ARI (AI Recommendability Index) scores how well entities
 * are recommended by AI models (ChatGPT, Claude, Perplexity, Gemini).
 */

import type { MCPServer, MCPQueryResponse, MCPError } from '../types/mcp.types';
import type {
  ARIScore,
  ARIEntity,
  ARIComparisonResult,
  ARIAnalysis,
} from '../types/ari.types';

export class ARIClient {
  private server: MCPServer = 'ari' as MCPServer;
  private enabled: boolean;
  private apiUrl: string;
  private timeout: number;

  constructor() {
    this.enabled = process.env.MCP_ENABLE_ARI === 'true';
    this.apiUrl = process.env.ARI_API_URL || 'http://localhost:4250';
    this.timeout = 120000; // 120s — ARI scans run all providers synchronously

    if (this.enabled && !this.apiUrl) {
      console.warn(
        '[ARIClient] MCP_ENABLE_ARI is true but ARI_API_URL is missing'
      );
    }
  }

  /**
   * Check if ARI integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled && !!this.apiUrl;
  }

  // ============================================================================
  // SCAN & SCORE TOOLS
  // ============================================================================

  /**
   * Run a full ARI scan for an entity (synchronous — can take 30-60s)
   */
  async runScan(
    entityName: string,
    entityType: string = 'auto',
    listSize: number = 1
  ): Promise<ARIScore | null> {
    if (!this.isEnabled()) return null;

    const response = await this.callARI(
      `/entity-test/${encodeURIComponent(entityName)}?entity_type=${entityType}&list_size=${listSize}`
    );

    if (!response.success || !response.data) return null;
    return response.data as ARIScore;
  }

  /**
   * Get entity by name
   */
  async getEntity(name: string): Promise<ARIEntity | null> {
    if (!this.isEnabled()) return null;

    const response = await this.callARI(
      `/entities/by-name/${encodeURIComponent(name)}`
    );

    if (!response.success || !response.data) return null;
    return response.data as ARIEntity;
  }

  /**
   * List all ARI entities
   */
  async listEntities(): Promise<ARIEntity[]> {
    if (!this.isEnabled()) return [];

    const response = await this.callARI('/entities');

    if (!response.success || !response.data) return [];
    return (response.data as { entities?: ARIEntity[] }).entities || (response.data as ARIEntity[]);
  }

  /**
   * Create a new ARI entity
   */
  async createEntity(entity: {
    name: string;
    type: string;
    category?: string;
    aliases?: string[];
  }): Promise<ARIEntity | null> {
    if (!this.isEnabled()) return null;

    const response = await this.callARI('/entities', 'POST', entity);

    if (!response.success || !response.data) return null;
    return response.data as ARIEntity;
  }

  /**
   * Compare two entities
   */
  async compare(
    entityA: string,
    entityB: string
  ): Promise<ARIComparisonResult | null> {
    if (!this.isEnabled()) return null;

    const response = await this.callARI(
      `/scores/compare?entity_a=${encodeURIComponent(entityA)}&entity_b=${encodeURIComponent(entityB)}`
    );

    if (!response.success || !response.data) return null;
    return response.data as ARIComparisonResult;
  }

  /**
   * Claude analysis of scan results
   */
  async analyzeResults(results: ARIScore): Promise<ARIAnalysis | null> {
    if (!this.isEnabled()) return null;

    const response = await this.callARI('/analyze-results', 'POST', results);

    if (!response.success || !response.data) return null;
    return response.data as ARIAnalysis;
  }

  // ============================================================================
  // CORE EXECUTION
  // ============================================================================

  /**
   * Execute a generic action (dispatches to typed methods)
   */
  async execute(action: string, parameters: Record<string, unknown>): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      let result: unknown;

      switch (action) {
        case 'run_scan':
          result = await this.runScan(
            parameters.entity_name as string,
            (parameters.entity_type as string) || 'auto',
            (parameters.list_size as number) || 1
          );
          break;

        case 'get_entity':
          result = await this.getEntity(parameters.name as string);
          break;

        case 'list_entities':
          result = await this.listEntities();
          break;

        case 'create_entity':
          result = await this.createEntity({
            name: parameters.name as string,
            type: parameters.type as string,
            category: parameters.category as string | undefined,
            aliases: parameters.aliases as string[] | undefined,
          });
          break;

        case 'compare':
          result = await this.compare(
            parameters.entity_a as string,
            parameters.entity_b as string
          );
          break;

        case 'analyze':
          result = await this.analyzeResults(parameters.results as ARIScore);
          break;

        default:
          throw new Error(`Unknown ARI action: ${action}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    }
  }

  /**
   * Get tool definitions for LLM
   */
  getToolDefinitions() {
    if (!this.isEnabled()) return [];

    return [
      {
        name: 'mcp_ari_run_scan',
        description: 'Run a full ARI (AI Recommendability Index) scan for an entity across all AI providers',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            entity_name: {
              type: 'string' as const,
              description: 'Name of the entity to scan (company or person)',
            },
            entity_type: {
              type: 'string' as const,
              description: 'Entity type: "company", "person", or "auto"',
              enum: ['company', 'person', 'auto'],
            },
            list_size: {
              type: 'number' as const,
              description: 'Number of entities to request in recommendations (1-10)',
            },
          },
          required: ['entity_name'],
        },
      },
      {
        name: 'mcp_ari_get_entity',
        description: 'Look up an ARI entity by name',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Entity name to look up',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'mcp_ari_list_entities',
        description: 'List all entities tracked in ARI',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {},
        },
      },
      {
        name: 'mcp_ari_create_entity',
        description: 'Create a new entity to track in ARI',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Entity name',
            },
            type: {
              type: 'string' as const,
              description: 'Entity type: "company" or "person"',
              enum: ['company', 'person'],
            },
            category: {
              type: 'string' as const,
              description: 'Category for the entity',
            },
          },
          required: ['name', 'type'],
        },
      },
      {
        name: 'mcp_ari_compare',
        description: 'Compare ARI scores between two entities',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            entity_a: {
              type: 'string' as const,
              description: 'First entity name',
            },
            entity_b: {
              type: 'string' as const,
              description: 'Second entity name',
            },
          },
          required: ['entity_a', 'entity_b'],
        },
      },
      {
        name: 'mcp_ari_analyze',
        description: 'Use Claude to analyze ARI scan results and provide strategic insights',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            results: {
              type: 'object' as const,
              description: 'ARI scan results object from a previous run_scan call',
            },
          },
          required: ['results'],
        },
      },
    ];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    if (!this.isEnabled()) {
      return { healthy: false };
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.apiUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        healthy: response.ok && data.status === 'healthy',
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
        latency: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Make an HTTP call to the ARI FastAPI backend
   */
  private async callARI(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown
  ): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const url = `${this.apiUrl}/api/v1${path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      };

      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`ARI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    }
  }

  private createErrorResponse(
    error: Error,
    requestId: string,
    startTime: number
  ): MCPQueryResponse {
    const mcpError: MCPError = {
      code: 'ARI_ERROR',
      message: error.message || 'ARI operation failed',
      details: { error: error.toString() },
      server: this.server,
      timestamp: new Date().toISOString(),
    };

    return {
      success: false,
      error: mcpError,
      metadata: {
        duration: Date.now() - startTime,
        requestId,
      },
    };
  }

  private generateRequestId(): string {
    return `ari-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
