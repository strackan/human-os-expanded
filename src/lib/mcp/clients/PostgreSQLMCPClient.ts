/**
 * PostgreSQL MCP Client
 *
 * Provides MCP interface for advanced PostgreSQL queries.
 * Enables AI to execute complex SQL analytics queries.
 */

// @ts-expect-error
import { Pool, PoolClient, QueryResult } from 'pg';
import type {
  MCPServer,
  MCPQueryResponse,
  MCPError,
  PostgreSQLMCP,
} from '../types/mcp.types';

/**
 * PostgreSQL MCP Client
 */
export class PostgreSQLMCPClient {
  private pool: Pool;
  private server: MCPServer = 'postgresql' as MCPServer;

  constructor(connectionString?: string) {
    const connString =
      connectionString || process.env.MCP_POSTGRES_CONNECTION_STRING;

    if (!connString) {
      throw new Error('PostgreSQL connection string is required');
    }

    this.pool = new Pool({
      connectionString: connString,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Execute a SQL query
   */
  async query(params: PostgreSQLMCP.QueryParams): Promise<MCPQueryResponse<PostgreSQLMCP.QueryResult>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();

      // Validate SQL for safety (basic checks)
      if (!this.isReadOnlyQuery(params.sql)) {
        return {
          success: false,
          error: {
            code: 'WRITE_OPERATION_DENIED',
            message: 'Only read-only queries are allowed through MCP',
            server: this.server,
            timestamp: new Date().toISOString(),
            details: { sql: params.sql },
          },
          metadata: {
            duration: Date.now() - startTime,
            requestId,
          },
        };
      }

      const result: QueryResult = await client.query(params.sql, params.params || []);

      const queryResult: PostgreSQLMCP.QueryResult = {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        fields: result.fields.map((field: any) => ({
          name: field.name,
          dataTypeID: field.dataTypeID,
        })),
      };

      return {
        success: true,
        data: queryResult,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute multiple queries in a transaction (read-only)
   */
  async transaction(queries: PostgreSQLMCP.QueryParams[]): Promise<MCPQueryResponse<PostgreSQLMCP.QueryResult[]>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();

      // Validate all queries are read-only
      for (const query of queries) {
        if (!this.isReadOnlyQuery(query.sql)) {
          return {
            success: false,
            error: {
              code: 'WRITE_OPERATION_DENIED',
              message: 'Only read-only queries are allowed in transactions',
              server: this.server,
              timestamp: new Date().toISOString(),
              details: { sql: query.sql },
            },
            metadata: {
              duration: Date.now() - startTime,
              requestId,
            },
          };
        }
      }

      await client.query('BEGIN');

      const results: PostgreSQLMCP.QueryResult[] = [];
      for (const query of queries) {
        const result: QueryResult = await client.query(query.sql, query.params || []);
        results.push({
          rows: result.rows,
          rowCount: result.rowCount || 0,
          fields: result.fields.map((field: any) => ({
            name: field.name,
            dataTypeID: field.dataTypeID,
          })),
        });
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: results,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      return this.createErrorResponse(error as Error, requestId, startTime);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get analytics query suggestions based on context
   */
  getSuggestedQueries(context: 'renewals' | 'customers' | 'health' | 'revenue'): string[] {
    const queries: Record<string, string[]> = {
      renewals: [
        `SELECT
          COUNT(*) as total_renewals,
          SUM(CASE WHEN renewal_status = 'at-risk' THEN 1 ELSE 0 END) as at_risk_count,
          AVG(health_score) as avg_health_score
        FROM customers
        WHERE renewal_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'`,

        `SELECT
          DATE_TRUNC('month', renewal_date) as month,
          COUNT(*) as renewal_count,
          SUM(arr) as total_arr
        FROM customers
        WHERE renewal_date >= NOW()
        GROUP BY DATE_TRUNC('month', renewal_date)
        ORDER BY month`,
      ],
      customers: [
        `SELECT
          risk_level,
          COUNT(*) as count,
          AVG(health_score) as avg_health,
          AVG(arr) as avg_arr
        FROM customers
        GROUP BY risk_level
        ORDER BY avg_arr DESC`,

        `SELECT
          name,
          health_score,
          renewal_date,
          arr,
          EXTRACT(DAY FROM (renewal_date - NOW())) as days_until_renewal
        FROM customers
        WHERE renewal_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        ORDER BY renewal_date ASC`,
      ],
      health: [
        `SELECT
          health_score_bucket,
          COUNT(*) as customer_count,
          SUM(arr) as total_arr
        FROM (
          SELECT
            CASE
              WHEN health_score >= 80 THEN 'Healthy (80-100)'
              WHEN health_score >= 60 THEN 'Medium (60-79)'
              WHEN health_score >= 40 THEN 'At Risk (40-59)'
              ELSE 'Critical (0-39)'
            END as health_score_bucket,
            arr
          FROM customers
        ) as bucketed
        GROUP BY health_score_bucket
        ORDER BY MIN(CASE health_score_bucket
          WHEN 'Healthy (80-100)' THEN 4
          WHEN 'Medium (60-79)' THEN 3
          WHEN 'At Risk (40-59)' THEN 2
          ELSE 1
        END) DESC`,
      ],
      revenue: [
        `SELECT
          DATE_TRUNC('quarter', renewal_date) as quarter,
          SUM(arr) as total_arr,
          COUNT(*) as renewal_count,
          AVG(arr) as avg_arr_per_customer
        FROM customers
        WHERE renewal_date >= NOW() - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('quarter', renewal_date)
        ORDER BY quarter DESC`,
      ],
    };

    return queries[context] || [];
  }

  /**
   * Execute a generic action
   */
  async execute(action: string, parameters: any): Promise<MCPQueryResponse> {
    switch (action) {
      case 'query':
        return this.query(parameters);
      case 'transaction':
        return this.transaction(parameters);
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
        name: 'mcp_postgresql_query',
        description: 'Execute read-only SQL queries for advanced analytics on customer, renewal, and revenue data',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            sql: {
              type: 'string' as const,
              description: 'SQL query to execute (read-only)',
            },
            params: {
              type: 'array' as const,
              description: 'Query parameters for parameterized queries',
              items: {
                type: 'string' as const,
              },
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'mcp_postgresql_analytics',
        description: 'Get pre-built analytics queries for common renewal metrics',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            context: {
              type: 'string' as const,
              description: 'Analytics context',
              enum: ['renewals', 'customers', 'health', 'revenue'],
            },
          },
          required: ['context'],
        },
      },
    ];
  }

  /**
   * Check if query is read-only
   */
  private isReadOnlyQuery(sql: string): boolean {
    const normalizedSql = sql.trim().toUpperCase();

    // Allow SELECT, WITH (for CTEs), and EXPLAIN
    const readOnlyKeywords = ['SELECT', 'WITH', 'EXPLAIN'];
    const writeKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'TRUNCATE', 'GRANT', 'REVOKE', 'EXECUTE', 'CALL',
    ];

    // Check if it starts with a read-only keyword
    const startsWithReadOnly = readOnlyKeywords.some((keyword) =>
      normalizedSql.startsWith(keyword)
    );

    // Check if it contains any write keywords
    const containsWrite = writeKeywords.some((keyword) =>
      normalizedSql.includes(keyword)
    );

    return startsWithReadOnly && !containsWrite;
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: Error,
    requestId: string,
    startTime: number
  ): MCPQueryResponse {
    const mcpError: MCPError = {
      code: 'QUERY_ERROR',
      message: error.message || 'Database query failed',
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
      const result = await this.query({ sql: 'SELECT 1 as health_check' });
      return {
        healthy: result.success,
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
      };
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
