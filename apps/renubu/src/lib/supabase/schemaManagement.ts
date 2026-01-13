/**
 * Schema Management Utilities
 *
 * Programmatic utilities for managing company schemas.
 * Used by admin interfaces and automated provisioning.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getSchemaName, getSchemaInfo, ISOLATED_SCHEMAS } from './schema';

/**
 * Check if a schema exists
 */
export async function schemaExists(
  client: SupabaseClient,
  schemaName: string
): Promise<boolean> {
  const { data, error } = await client.rpc('exec_sql', {
    sql: `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata
        WHERE schema_name = '${schemaName}'
      );
    `,
  });

  if (error) {
    console.error('[SchemaManagement] Error checking schema:', error);
    return false;
  }

  return data?.[0]?.exists || false;
}

/**
 * Create a company schema programmatically
 */
export async function createCompanySchema(
  client: SupabaseClient,
  companyId: string
): Promise<{ success: boolean; schemaName?: string; error?: string }> {
  try {
    const schemaInfo = getSchemaInfo(companyId);

    // Check if already exists
    const exists = await schemaExists(client, schemaInfo.schemaName);
    if (exists) {
      return {
        success: false,
        error: `Schema ${schemaInfo.schemaName} already exists`,
      };
    }

    // Create schema with tables
    const createSql = `
      -- Create schema
      CREATE SCHEMA ${schemaInfo.schemaName};

      -- Grant permissions
      GRANT USAGE ON SCHEMA ${schemaInfo.schemaName} TO authenticated;
      GRANT USAGE ON SCHEMA ${schemaInfo.schemaName} TO service_role;

      -- Clone tables
      CREATE TABLE ${schemaInfo.schemaName}.workflow_definitions (LIKE public.workflow_definitions INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_executions (LIKE public.workflow_executions INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_steps (LIKE public.workflow_steps INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_actions (LIKE public.workflow_actions INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_artifacts (LIKE public.workflow_artifacts INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_chat_threads (LIKE public.workflow_chat_threads INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_chat_messages (LIKE public.workflow_chat_messages INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_llm_context (LIKE public.workflow_llm_context INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_llm_tool_calls (LIKE public.workflow_llm_tool_calls INCLUDING ALL);
      CREATE TABLE ${schemaInfo.schemaName}.workflow_chat_branches (LIKE public.workflow_chat_branches INCLUDING ALL);

      -- Grant permissions on tables
      GRANT ALL ON ALL TABLES IN SCHEMA ${schemaInfo.schemaName} TO authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA ${schemaInfo.schemaName} TO service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA ${schemaInfo.schemaName} TO authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA ${schemaInfo.schemaName} TO service_role;

      -- Set default privileges
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaInfo.schemaName} GRANT ALL ON TABLES TO authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaInfo.schemaName} GRANT ALL ON TABLES TO service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaInfo.schemaName} GRANT ALL ON SEQUENCES TO authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaInfo.schemaName} GRANT ALL ON SEQUENCES TO service_role;
    `;

    const { error } = await client.rpc('exec_sql', { sql: createSql });

    if (error) {
      return {
        success: false,
        error: `Failed to create schema: ${error.message}`,
      };
    }

    return {
      success: true,
      schemaName: schemaInfo.schemaName,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Get schema statistics
 */
export async function getSchemaStats(
  client: SupabaseClient,
  schemaName: string
): Promise<{
  success: boolean;
  stats?: {
    tableCount: number;
    totalSize: string;
    tables: Array<{ name: string; rowCount: number; size: string }>;
  };
  error?: string;
}> {
  try {
    // Get table information
    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT
          c.relname as table_name,
          c.reltuples::bigint as row_count,
          pg_size_pretty(pg_total_relation_size(c.oid)) as size
        FROM pg_class c
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = '${schemaName}'
          AND c.relkind = 'r'
        ORDER BY c.relname;
      `,
    });

    if (error) {
      return {
        success: false,
        error: `Failed to get schema stats: ${error.message}`,
      };
    }

    // Get total size
    const { data: sizeData, error: sizeError } = await client.rpc('exec_sql', {
      sql: `
        SELECT pg_size_pretty(sum(pg_total_relation_size(c.oid))::bigint) as total_size
        FROM pg_class c
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = '${schemaName}';
      `,
    });

    if (sizeError) {
      return {
        success: false,
        error: `Failed to get total size: ${sizeError.message}`,
      };
    }

    return {
      success: true,
      stats: {
        tableCount: data?.length || 0,
        totalSize: sizeData?.[0]?.total_size || '0 bytes',
        tables: data?.map((row: any) => ({
          name: row.table_name,
          rowCount: parseInt(row.row_count) || 0,
          size: row.size,
        })) || [],
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * List all company schemas
 */
export async function listCompanySchemas(
  client: SupabaseClient
): Promise<{
  success: boolean;
  schemas?: Array<{ name: string; size: string; companyId: string }>;
  error?: string;
}> {
  try {
    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT
          nspname as schema_name,
          pg_size_pretty(sum(pg_total_relation_size(c.oid))::bigint) as size
        FROM pg_class c
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE nspname LIKE 'company_%'
        GROUP BY nspname
        ORDER BY nspname;
      `,
    });

    if (error) {
      return {
        success: false,
        error: `Failed to list schemas: ${error.message}`,
      };
    }

    return {
      success: true,
      schemas: data?.map((row: any) => {
        // Extract company ID from schema name (company_abc123 -> abc123-...)
        const schemaId = row.schema_name.replace('company_', '');
        return {
          name: row.schema_name,
          size: row.size,
          companyId: schemaId, // Note: This is partial, full ID needs lookup
        };
      }) || [],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Drop a company schema (DANGEROUS!)
 */
export async function dropCompanySchema(
  client: SupabaseClient,
  companyId: string,
  confirm: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!confirm) {
    return {
      success: false,
      error: 'Confirmation required to drop schema',
    };
  }

  try {
    const schemaInfo = getSchemaInfo(companyId);

    const { error } = await client.rpc('exec_sql', {
      sql: `DROP SCHEMA IF EXISTS ${schemaInfo.schemaName} CASCADE;`,
    });

    if (error) {
      return {
        success: false,
        error: `Failed to drop schema: ${error.message}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Provision a new company with schema (if isolated mode)
 */
export async function provisionCompany(
  client: SupabaseClient,
  companyId: string
): Promise<{ success: boolean; schemaName?: string; error?: string }> {
  // Only create schema if in isolated mode
  if (!ISOLATED_SCHEMAS) {
    return {
      success: true,
      schemaName: 'public',
    };
  }

  // Create company schema
  const result = await createCompanySchema(client, companyId);

  if (!result.success) {
    return result;
  }

  // Copy stock workflow definitions
  try {
    const schemaInfo = getSchemaInfo(companyId);

    // Copy stock workflows to company schema
    const { error: copyError } = await client.rpc('exec_sql', {
      sql: `
        INSERT INTO ${schemaInfo.schemaName}.workflow_definitions
        SELECT * FROM public.workflow_definitions
        WHERE is_stock_workflow = true;
      `,
    });

    if (copyError) {
      console.warn('[SchemaManagement] Failed to copy stock workflows:', copyError);
      // Don't fail provisioning, just log warning
    }

    return {
      success: true,
      schemaName: schemaInfo.schemaName,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Schema created but failed to provision data: ${err.message}`,
    };
  }
}

/**
 * Health check for schema
 */
export async function checkSchemaHealth(
  client: SupabaseClient,
  companyId: string
): Promise<{
  success: boolean;
  healthy?: boolean;
  issues?: string[];
  error?: string;
}> {
  try {
    const schemaInfo = getSchemaInfo(companyId);
    const issues: string[] = [];

    // Check if schema exists
    const exists = await schemaExists(client, schemaInfo.schemaName);
    if (!exists && ISOLATED_SCHEMAS) {
      issues.push(`Schema ${schemaInfo.schemaName} does not exist`);
    }

    // Check if all required tables exist
    const requiredTables = [
      'workflow_definitions',
      'workflow_executions',
      'workflow_chat_threads',
      'workflow_chat_messages',
    ];

    for (const table of requiredTables) {
      const { data, error } = await client
        .schema(schemaInfo.schemaName)
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        issues.push(`Table ${table} is not accessible: ${error.message}`);
      }
    }

    return {
      success: true,
      healthy: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown error',
    };
  }
}
