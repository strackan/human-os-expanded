/**
 * Alias Service
 *
 * Natural language command patterns for the "user vocabulary as API" system.
 * Manages CRUD operations for aliases and execution logging.
 */

import type { ServiceContext, ServiceResult } from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export type ExecutionMode = 'tactical' | 'strategic';

export interface AliasAction {
  tool: string;
  params: Record<string, unknown>;
  output?: string;
  condition?: string;
}

export interface Alias {
  id: string;
  pattern: string;
  description: string;
  layer: string;
  context: string[];
  mode: ExecutionMode | null;
  tools_required: string[];
  actions: AliasAction[];
  priority: number;
  enabled: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AliasInput {
  pattern: string;
  description: string;
  tools_required: string[];
  actions: AliasAction[];
  mode?: ExecutionMode;
  context?: string[];
  priority?: number;
}

export interface AliasUpdateInput {
  description?: string;
  tools_required?: string[];
  actions?: AliasAction[];
  mode?: ExecutionMode;
  context?: string[];
  priority?: number;
  enabled?: boolean;
}

export interface AliasResult {
  success: boolean;
  alias?: Alias;
  error?: string;
}

export interface AliasListResult {
  success: boolean;
  aliases: Alias[];
  error?: string;
}

export interface AliasSummary {
  id: string;
  pattern: string;
  description: string;
  mode: ExecutionMode | null;
  usage_count: number;
}

// =============================================================================
// ALIAS SERVICE
// =============================================================================

export class AliasService {
  private static readonly SCHEMA = 'human_os';
  private static readonly TABLE = 'aliases';

  /**
   * Create a new alias
   */
  static async create(ctx: ServiceContext, input: AliasInput): Promise<AliasResult> {
    const { data, error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .insert({
        pattern: input.pattern,
        description: input.description,
        layer: ctx.layer,
        tools_required: input.tools_required,
        actions: input.actions,
        mode: input.mode || null,
        context: input.context || [],
        priority: input.priority || 100,
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, alias: data };
  }

  /**
   * Get an alias by ID
   */
  static async getById(ctx: ServiceContext, aliasId: string): Promise<AliasResult> {
    const { data, error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .select('*')
      .eq('id', aliasId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Alias not found' };
    }

    return { success: true, alias: data };
  }

  /**
   * Get an alias by pattern
   */
  static async getByPattern(ctx: ServiceContext, pattern: string): Promise<AliasResult> {
    const { data, error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .select('*')
      .eq('pattern', pattern)
      .or(`layer.eq.public,layer.eq.${ctx.layer}`)
      .single();

    if (error || !data) {
      return { success: false, error: 'Alias not found' };
    }

    return { success: true, alias: data };
  }

  /**
   * Update an alias
   */
  static async update(
    ctx: ServiceContext,
    aliasId: string,
    updates: AliasUpdateInput
  ): Promise<AliasResult> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.tools_required !== undefined) updateData.tools_required = updates.tools_required;
    if (updates.actions !== undefined) updateData.actions = updates.actions;
    if (updates.mode !== undefined) updateData.mode = updates.mode;
    if (updates.context !== undefined) updateData.context = updates.context;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

    const { data, error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .update(updateData)
      .eq('id', aliasId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, alias: data };
  }

  /**
   * Delete an alias
   */
  static async delete(ctx: ServiceContext, aliasId: string): Promise<ServiceResult<void>> {
    const { error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .delete()
      .eq('id', aliasId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Disable an alias (soft delete)
   */
  static async disable(ctx: ServiceContext, aliasId: string): Promise<AliasResult> {
    return this.update(ctx, aliasId, { enabled: false });
  }

  /**
   * Enable a disabled alias
   */
  static async enable(ctx: ServiceContext, aliasId: string): Promise<AliasResult> {
    return this.update(ctx, aliasId, { enabled: true });
  }

  /**
   * List all aliases for a layer
   */
  static async list(
    ctx: ServiceContext,
    options: {
      includeDisabled?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AliasListResult> {
    const { includeDisabled = false, limit = 100, offset = 0 } = options;

    let query = ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .select('*')
      .or(`layer.eq.public,layer.eq.${ctx.layer}`)
      .order('usage_count', { ascending: false })
      .order('priority', { ascending: true })
      .range(offset, offset + limit - 1);

    if (!includeDisabled) {
      query = query.eq('enabled', true);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, aliases: [], error: error.message };
    }

    return { success: true, aliases: data || [] };
  }

  /**
   * Get alias summaries (lighter weight for listings)
   */
  static async listSummaries(
    ctx: ServiceContext,
    includeDescriptions = true
  ): Promise<ServiceResult<AliasSummary[]>> {
    const { data, error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .select('id, pattern, description, mode, usage_count')
      .or(`layer.eq.public,layer.eq.${ctx.layer}`)
      .eq('enabled', true)
      .order('usage_count', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const summaries = (data || []).map((a) => ({
      id: a.id,
      pattern: a.pattern,
      description: includeDescriptions ? a.description : '',
      mode: a.mode,
      usage_count: a.usage_count,
    }));

    return { success: true, data: summaries };
  }

  /**
   * Search aliases by pattern or description
   */
  static async search(
    ctx: ServiceContext,
    query: string,
    limit = 10
  ): Promise<AliasListResult> {
    const { data, error } = await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .select('*')
      .or(`layer.eq.public,layer.eq.${ctx.layer}`)
      .eq('enabled', true)
      .or(`pattern.ilike.%${query}%,description.ilike.%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, aliases: [], error: error.message };
    }

    return { success: true, aliases: data || [] };
  }

  /**
   * Increment usage count for an alias
   */
  static async recordUsage(ctx: ServiceContext, aliasId: string): Promise<void> {
    await ctx.supabase
      .schema(this.SCHEMA)
      .from(this.TABLE)
      .update({
        usage_count: ctx.supabase.rpc('increment', { row_id: aliasId }),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', aliasId);
  }

  /**
   * Find matching alias for a request (delegates to database function)
   */
  static async findMatch(
    ctx: ServiceContext,
    request: string,
    contextModes: string[] = []
  ): Promise<ServiceResult<{ alias: Alias; matchType: string } | null>> {
    const { data, error } = await ctx.supabase.rpc('find_alias', {
      p_request: request,
      p_layer: ctx.layer,
      p_context: contextModes,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, data: null };
    }

    const match = data[0];
    return {
      success: true,
      data: {
        alias: {
          id: match.id,
          pattern: match.pattern,
          description: match.description,
          layer: ctx.layer,
          context: [],
          mode: match.mode,
          tools_required: match.tools_required,
          actions: match.actions,
          priority: 0,
          enabled: true,
          usage_count: 0,
          last_used_at: null,
          created_at: '',
          updated_at: '',
        },
        matchType: match.match_type,
      },
    };
  }
}
