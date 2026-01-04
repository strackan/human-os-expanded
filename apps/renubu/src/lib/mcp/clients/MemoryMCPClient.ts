/**
 * Memory MCP Client
 *
 * Provides persistent conversation memory for AI workflows.
 * Stores context, customer history, and conversation state across sessions.
 */

import type {
  MCPServer,
  MCPQueryResponse,
  MCPError,
  MemoryMCP,
} from '../types/mcp.types';

/**
 * Memory storage interface
 */
interface MemoryStorage {
  [key: string]: MemoryMCP.MemoryEntry;
}

/**
 * Memory MCP Client
 */
export class MemoryMCPClient {
  private storage: MemoryStorage = {};
  private server: MCPServer = 'memory' as MCPServer;
  private persistToDatabase: boolean;

  constructor(persistToDatabase: boolean = false) {
    this.persistToDatabase = persistToDatabase;
    if (this.persistToDatabase) {
      this.loadFromDatabase();
    }
  }

  /**
   * Store a memory entry
   */
  async store(params: MemoryMCP.StoreParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const now = new Date().toISOString();
      const existingEntry = this.storage[params.key];

      const entry: MemoryMCP.MemoryEntry = {
        key: params.key,
        value: params.value,
        metadata: {
          createdAt: existingEntry?.metadata.createdAt || now,
          updatedAt: now,
          accessCount: existingEntry?.metadata.accessCount || 0,
          context: params.metadata?.context,
          tags: params.metadata?.tags || [],
        },
      };

      this.storage[params.key] = entry;

      if (this.persistToDatabase) {
        await this.saveToDatabase(entry);
      }

      return {
        success: true,
        data: entry,
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
   * Retrieve memory entries
   */
  async retrieve(params: MemoryMCP.RetrieveParams): Promise<MCPQueryResponse<MemoryMCP.MemoryEntry[]>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      let results: MemoryMCP.MemoryEntry[] = [];

      // Retrieve by key
      if (params.key) {
        const entry = this.storage[params.key];
        if (entry) {
          entry.metadata.accessCount++;
          entry.metadata.updatedAt = new Date().toISOString();
          results = [entry];
        }
      }
      // Search by query, context, or tags
      else {
        results = Object.values(this.storage).filter((entry) => {
          // Filter by context
          if (params.context && entry.metadata.context !== params.context) {
            return false;
          }

          // Filter by tags
          if (params.tags && params.tags.length > 0) {
            const hasMatchingTag = params.tags.some((tag) =>
              entry.metadata.tags?.includes(tag)
            );
            if (!hasMatchingTag) {
              return false;
            }
          }

          // Filter by query (simple text search)
          if (params.query) {
            const searchText = JSON.stringify(entry.value).toLowerCase();
            const queryLower = params.query.toLowerCase();
            if (!searchText.includes(queryLower)) {
              return false;
            }
          }

          return true;
        });

        // Update access count for matched entries
        results.forEach((entry) => {
          entry.metadata.accessCount++;
          entry.metadata.updatedAt = new Date().toISOString();
        });

        // Sort by most recently updated
        results.sort(
          (a, b) =>
            new Date(b.metadata.updatedAt).getTime() -
            new Date(a.metadata.updatedAt).getTime()
        );

        // Apply limit
        if (params.limit) {
          results = results.slice(0, params.limit);
        }
      }

      return {
        success: true,
        data: results,
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
   * Delete memory entries
   */
  async delete(params: MemoryMCP.DeleteParams): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      let deletedCount = 0;

      // Delete by key
      if (params.key) {
        if (this.storage[params.key]) {
          delete this.storage[params.key];
          deletedCount = 1;
        }
      }
      // Delete by context or tags
      else {
        const keysToDelete: string[] = [];

        Object.entries(this.storage).forEach(([key, entry]) => {
          let shouldDelete = false;

          // Match by context
          if (params.context && entry.metadata.context === params.context) {
            shouldDelete = true;
          }

          // Match by tags
          if (params.tags && params.tags.length > 0) {
            const hasMatchingTag = params.tags.some((tag) =>
              entry.metadata.tags?.includes(tag)
            );
            if (hasMatchingTag) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            keysToDelete.push(key);
          }
        });

        keysToDelete.forEach((key) => {
          delete this.storage[key];
        });

        deletedCount = keysToDelete.length;
      }

      if (this.persistToDatabase) {
        await this.persistChanges();
      }

      return {
        success: true,
        data: { deletedCount },
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
   * Clear all memory (use with caution)
   */
  async clear(context?: string): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      if (context) {
        // Clear only memories with specific context
        const keysToDelete = Object.keys(this.storage).filter(
          (key) => this.storage[key].metadata.context === context
        );
        keysToDelete.forEach((key) => delete this.storage[key]);
      } else {
        // Clear all memories
        this.storage = {};
      }

      if (this.persistToDatabase) {
        await this.persistChanges();
      }

      return {
        success: true,
        data: { cleared: true },
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
   * Get memory statistics
   */
  async getStats(): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const entries = Object.values(this.storage);

      const stats = {
        totalEntries: entries.length,
        totalSize: JSON.stringify(this.storage).length,
        byContext: {} as Record<string, number>,
        byTag: {} as Record<string, number>,
        mostAccessed: entries
          .sort((a, b) => b.metadata.accessCount - a.metadata.accessCount)
          .slice(0, 5)
          .map((e) => ({
            key: e.key,
            accessCount: e.metadata.accessCount,
          })),
        oldestEntry: entries.reduce(
          (oldest, e) =>
            new Date(e.metadata.createdAt) < new Date(oldest.metadata.createdAt)
              ? e
              : oldest,
          entries[0]
        )?.metadata.createdAt,
        newestEntry: entries.reduce(
          (newest, e) =>
            new Date(e.metadata.createdAt) > new Date(newest.metadata.createdAt)
              ? e
              : newest,
          entries[0]
        )?.metadata.createdAt,
      };

      // Count by context
      entries.forEach((entry) => {
        const context = entry.metadata.context || 'none';
        stats.byContext[context] = (stats.byContext[context] || 0) + 1;
      });

      // Count by tag
      entries.forEach((entry) => {
        entry.metadata.tags?.forEach((tag) => {
          stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
        });
      });

      return {
        success: true,
        data: stats,
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
      case 'store':
        return this.store(parameters);
      case 'retrieve':
        return this.retrieve(parameters);
      case 'delete':
        return this.delete(parameters);
      case 'clear':
        return this.clear(parameters.context);
      case 'stats':
        return this.getStats();
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
        name: 'mcp_memory_store',
        description: 'Store information in persistent memory for later retrieval',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            key: {
              type: 'string' as const,
              description: 'Unique identifier for this memory',
            },
            value: {
              type: 'object' as const,
              description: 'Data to store',
            },
            metadata: {
              type: 'object' as const,
              description: 'Optional metadata (context, tags)',
              properties: {
                context: {
                  type: 'string' as const,
                  description: 'Context category (e.g., "customer", "renewal", "contract")',
                },
                tags: {
                  type: 'array' as const,
                  description: 'Tags for categorization',
                  items: {
                    type: 'string' as const,
                  },
                },
              },
            },
          },
          required: ['key', 'value'],
        },
      },
      {
        name: 'mcp_memory_retrieve',
        description: 'Retrieve stored memories by key, context, tags, or query',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            key: {
              type: 'string' as const,
              description: 'Specific memory key to retrieve',
            },
            query: {
              type: 'string' as const,
              description: 'Search query to find memories',
            },
            context: {
              type: 'string' as const,
              description: 'Filter by context',
            },
            tags: {
              type: 'array' as const,
              description: 'Filter by tags',
              items: {
                type: 'string' as const,
              },
            },
            limit: {
              type: 'number' as const,
              description: 'Maximum number of results',
            },
          },
        },
      },
      {
        name: 'mcp_memory_delete',
        description: 'Delete memories by key, context, or tags',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            key: {
              type: 'string' as const,
              description: 'Specific memory key to delete',
            },
            context: {
              type: 'string' as const,
              description: 'Delete all memories with this context',
            },
            tags: {
              type: 'array' as const,
              description: 'Delete memories matching these tags',
              items: {
                type: 'string' as const,
              },
            },
          },
        },
      },
    ];
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
      code: 'MEMORY_ERROR',
      message: error.message || 'Memory operation failed',
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
   * Load memory from database (placeholder)
   */
  private async loadFromDatabase(): Promise<void> {
    // TODO: Implement database loading
    // Could use Supabase to persist memory entries
  }

  /**
   * Save memory entry to database (placeholder)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async saveToDatabase(entry: MemoryMCP.MemoryEntry): Promise<void> {
    // TODO: Implement database saving
    // Could use Supabase 'mcp_memory' table
  }

  /**
   * Persist all changes to database (placeholder)
   */
  private async persistChanges(): Promise<void> {
    // TODO: Implement batch persistence
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const startTime = Date.now();
    try {
      // Simple test: store and retrieve
      const testKey = '__health_check__';
      await this.store({ key: testKey, value: { test: true } });
      const retrieved = await this.retrieve({ key: testKey });
      await this.delete({ key: testKey });

      return {
        healthy: retrieved.success,
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
      };
    }
  }
}
