/**
 * Schema Abstraction Layer
 *
 * Provides utilities for multi-tenant schema management.
 * Supports both isolated schemas (per-customer) and shared schema (RLS-based).
 *
 * Architecture:
 * - ISOLATED_SCHEMAS=true: Each company gets schema `company_abc123`
 * - ISOLATED_SCHEMAS=false: All companies share `public` schema with RLS
 *
 * Schema Naming Convention:
 * - Extract first segment of company ID (before first hyphen)
 * - Prefix with `company_`
 * - Example: company ID "abc123-xyz789" -> schema "company_abc123"
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Configuration
// =====================================================

/**
 * Check if isolated schema mode is enabled
 */
export const ISOLATED_SCHEMAS = process.env.NEXT_PUBLIC_ISOLATED_SCHEMAS === 'true';

/**
 * Default schema name when not in isolated mode
 */
export const DEFAULT_SCHEMA = 'public';

// =====================================================
// Schema Resolution
// =====================================================

/**
 * Get schema name for a given company
 *
 * @param companyId - Company identifier (optional)
 * @returns Schema name to use for queries
 *
 * @example
 * // Isolated mode
 * getSchemaName('abc123-xyz789') // -> 'company_abc123'
 * getSchemaName(null) // -> 'public'
 *
 * // Shared mode
 * getSchemaName('abc123-xyz789') // -> 'public'
 */
export function getSchemaName(companyId?: string | null): string {
  // If not in isolated mode or no company ID provided, use default schema
  if (!ISOLATED_SCHEMAS || !companyId) {
    return DEFAULT_SCHEMA;
  }

  // Extract first segment of company ID (before first hyphen)
  const schemaId = companyId.split('-')[0];

  // Validate schema ID (alphanumeric only for security)
  if (!/^[a-zA-Z0-9]+$/.test(schemaId)) {
    console.warn(`[Schema] Invalid company ID format: ${companyId}, using default schema`);
    return DEFAULT_SCHEMA;
  }

  return `company_${schemaId}`;
}

/**
 * Create a schema-aware Supabase client
 *
 * Wraps the Supabase client to automatically use the correct schema
 * based on company ID and environment configuration.
 *
 * @param baseClient - Base Supabase client
 * @param companyId - Company identifier (optional)
 * @returns Schema-aware client
 *
 * @example
 * const client = createSchemaAwareClient(supabase, 'abc123-xyz789');
 * // All queries use company_abc123 schema (if ISOLATED_SCHEMAS=true)
 * const { data } = await client.from('workflow_definitions').select('*');
 */
export function createSchemaAwareClient(
  baseClient: SupabaseClient,
  companyId?: string | null
) {
  const schemaName = getSchemaName(companyId);

  // If using default schema, return client as-is
  if (schemaName === DEFAULT_SCHEMA) {
    return baseClient;
  }

  // Return client with schema specified
  return baseClient.schema(schemaName);
}

// =====================================================
// Query Helpers
// =====================================================

/**
 * Add company filter to query (for shared schema mode)
 *
 * In shared schema mode, we need to filter by company_id.
 * In isolated schema mode, all data is already scoped to the schema.
 *
 * @param query - Supabase query builder
 * @param companyId - Company identifier (optional)
 * @param columnName - Column name for company ID (default: 'company_id')
 * @returns Query with company filter applied (if needed)
 *
 * @example
 * let query = client.from('workflow_definitions').select('*');
 * query = addCompanyFilter(query, companyId);
 */
export function addCompanyFilter<T>(
  query: any,
  companyId?: string | null,
  columnName: string = 'company_id'
): any {
  // In isolated schema mode, no filter needed (schema already scopes data)
  if (ISOLATED_SCHEMAS) {
    return query;
  }

  // In shared schema mode, add company filter if company ID provided
  if (companyId) {
    // Support both company-specific and global (null company_id) records
    return query.or(`${columnName}.is.null,${columnName}.eq.${companyId}`);
  }

  return query;
}

// =====================================================
// Schema Management Types
// =====================================================

/**
 * Schema information for a company
 */
export interface SchemaInfo {
  companyId: string;
  schemaName: string;
  mode: 'isolated' | 'shared';
  exists?: boolean;
}

/**
 * Get schema information for a company
 *
 * @param companyId - Company identifier
 * @returns Schema information object
 */
export function getSchemaInfo(companyId: string): SchemaInfo {
  const schemaName = getSchemaName(companyId);
  const mode = ISOLATED_SCHEMAS ? 'isolated' : 'shared';

  return {
    companyId,
    schemaName,
    mode
  };
}

// =====================================================
// Service Integration Pattern
// =====================================================

/**
 * Base class for schema-aware services
 *
 * Extend this class to create services that automatically
 * handle schema resolution based on company ID.
 *
 * @example
 * class MyService extends SchemaAwareService {
 *   async getData() {
 *     return this.client.from('my_table').select('*');
 *   }
 * }
 *
 * const service = new MyService('abc123-xyz789');
 * const data = await service.getData();
 */
export abstract class SchemaAwareService {
  protected client: SupabaseClient;
  protected companyId: string | null;
  protected schemaName: string;

  constructor(companyId?: string | null, baseClient?: SupabaseClient) {
    this.companyId = companyId || null;
    this.schemaName = getSchemaName(companyId);

    // Create schema-aware client
    if (baseClient) {
      this.client = createSchemaAwareClient(baseClient, companyId) as SupabaseClient;
    } else {
      // Import createClient dynamically to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('./client');
      this.client = createSchemaAwareClient(createClient(), companyId) as SupabaseClient;
    }
  }

  /**
   * Add company filter to query (helper method for subclasses)
   */
  protected addCompanyFilter<T>(query: any, columnName?: string): any {
    return addCompanyFilter(query, this.companyId, columnName);
  }

  /**
   * Get schema information for this service
   */
  public getSchemaInfo(): SchemaInfo | null {
    if (!this.companyId) return null;
    return getSchemaInfo(this.companyId);
  }
}

// =====================================================
// Logging & Debugging
// =====================================================

/**
 * Log schema resolution for debugging
 */
export function logSchemaResolution(companyId?: string | null, context?: string) {
  const schemaName = getSchemaName(companyId);
  const mode = ISOLATED_SCHEMAS ? 'ISOLATED' : 'SHARED';

  console.log(
    `[Schema${context ? ` ${context}` : ''}] Mode: ${mode}, Company: ${companyId || 'none'}, Schema: ${schemaName}`
  );
}
