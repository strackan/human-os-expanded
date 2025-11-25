/**
 * Supabase MCP Client
 *
 * Provides MCP (Model Context Protocol) interface for Supabase database operations.
 * Enables AI to query, insert, update, and delete data via natural language.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  MCPServer,
  MCPQueryResponse,
  MCPError,
  SupabaseMCP,
} from '../types/mcp.types';

/**
 * Supabase MCP Client
 */
export class SupabaseMCPClient {
  private client: SupabaseClient;
  private server: MCPServer = 'supabase' as MCPServer;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and Key are required');
    }

    this.client = createClient(url, key);
  }

  /**
   * Query data from Supabase
   */
  async query(params: SupabaseMCP.QueryParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      let query: any = this.client.from(params.table);

      // Select columns
      if (params.select) {
        query = query.select(params.select);
      } else {
        query = query.select('*');
      }

      // Apply filters
      if (params.filter) {
        for (const [key, value] of Object.entries(params.filter)) {
          if (value === null) {
            query = query.is(key, null);
          } else if (typeof value === 'object' && value.operator) {
            // Support for advanced operators
            const { operator, value: filterValue } = value;
            switch (operator) {
              case 'eq':
                query = query.eq(key, filterValue);
                break;
              case 'neq':
                query = query.neq(key, filterValue);
                break;
              case 'gt':
                query = query.gt(key, filterValue);
                break;
              case 'gte':
                query = query.gte(key, filterValue);
                break;
              case 'lt':
                query = query.lt(key, filterValue);
                break;
              case 'lte':
                query = query.lte(key, filterValue);
                break;
              case 'like':
                query = query.like(key, filterValue);
                break;
              case 'ilike':
                query = query.ilike(key, filterValue);
                break;
              case 'in':
                query = query.in(key, filterValue);
                break;
              default:
                query = query.eq(key, filterValue);
            }
          } else {
            query = query.eq(key, value);
          }
        }
      }

      // Apply ordering
      if (params.order) {
        query = query.order(params.order.column, {
          ascending: params.order.ascending ?? true,
        });
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return this.createErrorResponse(error, requestId, startTime);
      }

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

  /**
   * Insert data into Supabase
   */
  async insert(params: SupabaseMCP.InsertParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const { data, error } = await this.client
        .from(params.table)
        .insert(params.data)
        .select();

      if (error) {
        return this.createErrorResponse(error, requestId, startTime);
      }

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

  /**
   * Update data in Supabase
   */
  async update(params: SupabaseMCP.UpdateParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      let query = this.client.from(params.table).update(params.data);

      // Apply filters
      for (const [key, value] of Object.entries(params.filter)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.select();

      if (error) {
        return this.createErrorResponse(error, requestId, startTime);
      }

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

  /**
   * Delete data from Supabase
   */
  async delete(params: SupabaseMCP.DeleteParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      let query = this.client.from(params.table).delete();

      // Apply filters
      for (const [key, value] of Object.entries(params.filter)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.select();

      if (error) {
        return this.createErrorResponse(error, requestId, startTime);
      }

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

  /**
   * Call Supabase RPC function
   */
  async rpc(params: SupabaseMCP.RPCParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const { data, error } = await this.client.rpc(
        params.function,
        params.params || {}
      );

      if (error) {
        return this.createErrorResponse(error, requestId, startTime);
      }

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

  /**
   * Execute a generic action
   */
  async execute(action: string, parameters: any): Promise<MCPQueryResponse> {
    switch (action) {
      case 'query':
      case 'select':
        return this.query(parameters);
      case 'insert':
        return this.insert(parameters);
      case 'update':
        return this.update(parameters);
      case 'delete':
        return this.delete(parameters);
      case 'rpc':
        return this.rpc(parameters);
      default:
        return {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${action}`,
            server: this.server,
            timestamp: new Date().toISOString(),
          },
        };
    }
  }

  /**
   * Get tool definitions for LLM
   */
  getToolDefinitions() {
    return [
      {
        name: 'mcp_supabase_query',
        description: 'Query data from Supabase database tables',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            table: {
              type: 'string' as const,
              description: 'The table name to query',
            },
            select: {
              type: 'string' as const,
              description: 'Columns to select (comma-separated)',
            },
            filter: {
              type: 'object' as const,
              description: 'Filter conditions (key-value pairs)',
            },
            order: {
              type: 'object' as const,
              description: 'Order by configuration',
            },
            limit: {
              type: 'number' as const,
              description: 'Maximum number of rows to return',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'mcp_supabase_insert',
        description: 'Insert data into Supabase database',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            table: {
              type: 'string' as const,
              description: 'The table name',
            },
            data: {
              type: 'object' as const,
              description: 'Data to insert',
            },
          },
          required: ['table', 'data'],
        },
      },
      {
        name: 'mcp_supabase_update',
        description: 'Update data in Supabase database',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            table: {
              type: 'string' as const,
              description: 'The table name',
            },
            data: {
              type: 'object' as const,
              description: 'Data to update',
            },
            filter: {
              type: 'object' as const,
              description: 'Filter to identify rows to update',
            },
          },
          required: ['table', 'data', 'filter'],
        },
      },
    ];
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: any,
    requestId: string,
    startTime: number
  ): MCPQueryResponse {
    const mcpError: MCPError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.details || {},
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

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${this.server}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const startTime = Date.now();
    try {
      // Simple query to check connection
      const { error } = await this.client.from('customers').select('count').limit(1);
      return {
        healthy: !error,
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
      };
    }
  }
}
