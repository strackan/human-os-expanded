/**
 * CRM Opportunity Tools
 *
 * Provides:
 * - create_opportunity: Create a new deal
 * - update_opportunity: Update deal details, move stage
 * - get_opportunity: Get deal with activities
 * - search_opportunities: Find deals by criteria
 * - get_pipeline: Pipeline summary view
 * - get_open_deals: Quick view of open deals
 * - get_deals_closing_soon: Deals closing in next 30 days
 * - win_deal / lose_deal: Quick status changes
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';

const CRM_SCHEMA = 'crm';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const opportunityTools: Tool[] = [
  {
    name: 'create_opportunity',
    description: `Create a new CRM opportunity (deal). Links to contacts via contact_id or entity_id.

Example: "Create a deal for Acme Corp - Enterprise License worth $50k"`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Deal name (e.g., "Acme Corp - Enterprise License")' },
        contact_id: { type: 'string', description: 'GFT contact ID (optional)' },
        entity_id: { type: 'string', description: 'Global entity ID (optional)' },
        company_id: { type: 'string', description: 'GFT company ID (optional)' },
        expected_value: { type: 'number', description: 'Expected deal value' },
        expected_close_date: { type: 'string', description: 'Expected close date (YYYY-MM-DD)' },
        source: {
          type: 'string',
          enum: ['linkedin', 'referral', 'inbound', 'cold_outreach', 'event', 'website', 'partner', 'other'],
          description: 'How the opportunity originated',
        },
        description: { type: 'string', description: 'Deal notes/context' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_opportunity',
    description: `Update an opportunity. Use to move deals through stages, update values, or add notes.

For stage changes, use stage_id. To mark as won/lost, use win_deal or lose_deal tools instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        opportunity_id: { type: 'string', description: 'Opportunity ID' },
        name: { type: 'string', description: 'New name' },
        stage_id: { type: 'string', description: 'New pipeline stage ID' },
        expected_value: { type: 'number', description: 'Updated value' },
        expected_close_date: { type: 'string', description: 'Updated close date (YYYY-MM-DD)' },
        next_step: { type: 'string', description: 'Next action to take' },
        next_step_date: { type: 'string', description: 'When to do next step (YYYY-MM-DD)' },
        description: { type: 'string', description: 'Updated notes' },
      },
      required: ['opportunity_id'],
    },
  },
  {
    name: 'get_opportunity',
    description: 'Get full details of a single opportunity including stage, recent activities, and line items.',
    inputSchema: {
      type: 'object',
      properties: {
        opportunity_id: { type: 'string', description: 'Opportunity ID' },
      },
      required: ['opportunity_id'],
    },
  },
  {
    name: 'search_opportunities',
    description: `Search and filter opportunities. Find deals by stage, value range, close date, or status.

Examples:
- "Show me all open deals" (is_open: true)
- "Deals over $10k" (min_value: 10000)
- "What's closing this month" (closing_before: end of month)`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search by name or description' },
        stage_id: { type: 'string', description: 'Filter by pipeline stage' },
        is_open: { type: 'boolean', description: 'Only open (not closed) opportunities' },
        is_won: { type: 'boolean', description: 'Only won opportunities' },
        is_lost: { type: 'boolean', description: 'Only lost opportunities' },
        min_value: { type: 'number', description: 'Minimum expected value' },
        max_value: { type: 'number', description: 'Maximum expected value' },
        closing_before: { type: 'string', description: 'Close date before (YYYY-MM-DD)' },
        closing_after: { type: 'string', description: 'Close date after (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Max results (default 50)' },
      },
      required: [],
    },
  },
  {
    name: 'get_pipeline',
    description: `Get pipeline summary with opportunity counts and values per stage.

Returns total value, weighted value (probability-adjusted), and count for each stage.
Great for "how's the pipeline looking" questions.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_open_deals',
    description: 'Quick view of all open (not closed) deals, ordered by expected close date.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'get_deals_closing_soon',
    description: 'Get deals expected to close in the next N days. Default is 30 days.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Days from now (default 30)' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'win_deal',
    description: 'Mark a deal as won. Sets closed_at and won_at timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        opportunity_id: { type: 'string', description: 'Opportunity ID' },
      },
      required: ['opportunity_id'],
    },
  },
  {
    name: 'lose_deal',
    description: 'Mark a deal as lost with a reason.',
    inputSchema: {
      type: 'object',
      properties: {
        opportunity_id: { type: 'string', description: 'Opportunity ID' },
        reason: { type: 'string', description: 'Why the deal was lost' },
      },
      required: ['opportunity_id'],
    },
  },
  {
    name: 'add_deal_activity',
    description: 'Log an activity (call, email, meeting) on a deal.',
    inputSchema: {
      type: 'object',
      properties: {
        opportunity_id: { type: 'string', description: 'Opportunity ID' },
        activity_type: {
          type: 'string',
          enum: ['call', 'email', 'meeting', 'note', 'linkedin_message', 'demo', 'proposal_sent', 'contract_sent', 'follow_up', 'other'],
          description: 'Type of activity',
        },
        notes: { type: 'string', description: 'Activity notes' },
        outcome: { type: 'string', description: 'Outcome (completed, no_answer, rescheduled, etc.)' },
      },
      required: ['opportunity_id', 'activity_type'],
    },
  },
  {
    name: 'init_pipeline',
    description: 'Initialize default pipeline stages for the user. Call this once when setting up CRM.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleOpportunityTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'create_opportunity':
      return createOpportunity(ctx, args as CreateOpportunityParams);

    case 'update_opportunity':
      return updateOpportunity(ctx, args as UpdateOpportunityParams);

    case 'get_opportunity':
      return getOpportunity(ctx, args.opportunity_id as string);

    case 'search_opportunities':
      return searchOpportunities(ctx, args as SearchOpportunitiesParams);

    case 'get_pipeline':
      return getPipelineSummary(ctx);

    case 'get_open_deals':
      return getOpenDeals(ctx, (args.limit as number) || 20);

    case 'get_deals_closing_soon':
      return getDealsClosingSoon(ctx, (args.days as number) || 30, (args.limit as number) || 20);

    case 'win_deal':
      return winDeal(ctx, args.opportunity_id as string);

    case 'lose_deal':
      return loseDeal(ctx, args.opportunity_id as string, args.reason as string);

    case 'add_deal_activity':
      return addDealActivity(ctx, args as AddActivityParams);

    case 'init_pipeline':
      return initPipeline(ctx);

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface CreateOpportunityParams {
  name: string;
  contact_id?: string;
  entity_id?: string;
  company_id?: string;
  expected_value?: number;
  expected_close_date?: string;
  source?: string;
  description?: string;
}

interface UpdateOpportunityParams {
  opportunity_id: string;
  name?: string;
  stage_id?: string;
  expected_value?: number;
  expected_close_date?: string;
  next_step?: string;
  next_step_date?: string;
  description?: string;
}

interface SearchOpportunitiesParams {
  query?: string;
  stage_id?: string;
  is_open?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  min_value?: number;
  max_value?: number;
  closing_before?: string;
  closing_after?: string;
  limit?: number;
}

interface AddActivityParams {
  opportunity_id: string;
  activity_type: string;
  notes?: string;
  outcome?: string;
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function createOpportunity(ctx: ToolContext, params: CreateOpportunityParams) {
  // Get default stage (Lead) if user has pipeline initialized
  const { data: stages } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('pipeline_stages')
    .select('id')
    .eq('owner_id', ctx.userUUID)
    .eq('name', 'Lead')
    .single();

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .insert({
      owner_id: ctx.userUUID,
      name: params.name,
      gft_contact_id: params.contact_id,
      entity_id: params.entity_id,
      gft_company_id: params.company_id,
      expected_value: params.expected_value,
      expected_close_date: params.expected_close_date,
      source: params.source,
      description: params.description,
      stage_id: stages?.id || null,
    })
    .select('*, pipeline_stages(name)')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    opportunity: data,
    message: `Created deal "${params.name}"${params.expected_value ? ` worth $${params.expected_value.toLocaleString()}` : ''}`,
  };
}

async function updateOpportunity(ctx: ToolContext, params: UpdateOpportunityParams) {
  const updates: Record<string, unknown> = {};

  if (params.name !== undefined) updates.name = params.name;
  if (params.stage_id !== undefined) updates.stage_id = params.stage_id;
  if (params.expected_value !== undefined) updates.expected_value = params.expected_value;
  if (params.expected_close_date !== undefined) updates.expected_close_date = params.expected_close_date;
  if (params.next_step !== undefined) updates.next_step = params.next_step;
  if (params.next_step_date !== undefined) updates.next_step_date = params.next_step_date;
  if (params.description !== undefined) updates.description = params.description;

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .update(updates)
    .eq('id', params.opportunity_id)
    .eq('owner_id', ctx.userUUID)
    .select('*, pipeline_stages(name)')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    opportunity: data,
    message: `Updated deal "${data.name}"`,
  };
}

async function getOpportunity(ctx: ToolContext, opportunityId: string) {
  const { data: opportunity, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .select('*, pipeline_stages(*)')
    .eq('id', opportunityId)
    .eq('owner_id', ctx.userUUID)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Get recent activities
  const { data: activities } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunity_activities')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('occurred_at', { ascending: false })
    .limit(10);

  // Get line items
  const { data: lineItems } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunity_line_items')
    .select('*, products(*)')
    .eq('opportunity_id', opportunityId);

  return {
    success: true,
    opportunity,
    activities: activities || [],
    line_items: lineItems || [],
  };
}

async function searchOpportunities(ctx: ToolContext, params: SearchOpportunitiesParams) {
  let query = ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .select('*, pipeline_stages(name, position, color)')
    .eq('owner_id', ctx.userUUID)
    .order('created_at', { ascending: false })
    .limit(params.limit || 50);

  if (params.query) {
    query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
  }
  if (params.stage_id) {
    query = query.eq('stage_id', params.stage_id);
  }
  if (params.is_open === true) {
    query = query.is('closed_at', null);
  }
  if (params.is_won === true) {
    query = query.not('won_at', 'is', null);
  }
  if (params.is_lost === true) {
    query = query.not('lost_at', 'is', null);
  }
  if (params.min_value !== undefined) {
    query = query.gte('expected_value', params.min_value);
  }
  if (params.max_value !== undefined) {
    query = query.lte('expected_value', params.max_value);
  }
  if (params.closing_before) {
    query = query.lte('expected_close_date', params.closing_before);
  }
  if (params.closing_after) {
    query = query.gte('expected_close_date', params.closing_after);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message, opportunities: [] };
  }

  const totalValue = (data || []).reduce((sum, o) => sum + (o.expected_value || 0), 0);

  return {
    success: true,
    count: data?.length || 0,
    total_value: totalValue,
    opportunities: data || [],
  };
}

async function getPipelineSummary(ctx: ToolContext) {
  const { data, error } = await ctx
    .getClient()
    .rpc('crm.get_pipeline_summary', {
      p_owner_id: ctx.userUUID,
      p_tenant_id: null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const stages = data || [];
  const totals = stages.reduce(
    (acc: { count: number; value: number; weighted: number }, s: { opportunity_count: number; total_value: string; weighted_value: string }) => ({
      count: acc.count + (s.opportunity_count || 0),
      value: acc.value + parseFloat(s.total_value || '0'),
      weighted: acc.weighted + parseFloat(s.weighted_value || '0'),
    }),
    { count: 0, value: 0, weighted: 0 }
  );

  return {
    success: true,
    stages,
    totals: {
      total_opportunities: totals.count,
      total_value: totals.value,
      weighted_value: totals.weighted,
    },
    summary: `Pipeline: ${totals.count} deals worth $${totals.value.toLocaleString()} (weighted: $${totals.weighted.toLocaleString()})`,
  };
}

async function getOpenDeals(ctx: ToolContext, limit: number) {
  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .select('*, pipeline_stages(name, position)')
    .eq('owner_id', ctx.userUUID)
    .is('closed_at', null)
    .order('expected_close_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message, deals: [] };
  }

  const totalValue = (data || []).reduce((sum, o) => sum + (o.expected_value || 0), 0);

  return {
    success: true,
    count: data?.length || 0,
    total_value: totalValue,
    deals: data || [],
  };
}

async function getDealsClosingSoon(ctx: ToolContext, days: number, limit: number) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .select('*, pipeline_stages(name)')
    .eq('owner_id', ctx.userUUID)
    .is('closed_at', null)
    .lte('expected_close_date', futureDateStr)
    .order('expected_close_date', { ascending: true })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message, deals: [] };
  }

  const totalValue = (data || []).reduce((sum, o) => sum + (o.expected_value || 0), 0);

  return {
    success: true,
    days_window: days,
    count: data?.length || 0,
    total_value: totalValue,
    deals: data || [],
    message: `${data?.length || 0} deals closing in the next ${days} days worth $${totalValue.toLocaleString()}`,
  };
}

async function winDeal(ctx: ToolContext, opportunityId: string) {
  const now = new Date().toISOString();

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .update({
      won_at: now,
      closed_at: now,
    })
    .eq('id', opportunityId)
    .eq('owner_id', ctx.userUUID)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    opportunity: data,
    message: `Deal "${data.name}" marked as WON!${data.expected_value ? ` ($${data.expected_value.toLocaleString()})` : ''}`,
  };
}

async function loseDeal(ctx: ToolContext, opportunityId: string, reason?: string) {
  const now = new Date().toISOString();

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunities')
    .update({
      lost_at: now,
      closed_at: now,
      lost_reason: reason,
    })
    .eq('id', opportunityId)
    .eq('owner_id', ctx.userUUID)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    opportunity: data,
    message: `Deal "${data.name}" marked as lost.${reason ? ` Reason: ${reason}` : ''}`,
  };
}

async function addDealActivity(ctx: ToolContext, params: AddActivityParams) {
  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('opportunity_activities')
    .insert({
      opportunity_id: params.opportunity_id,
      activity_type: params.activity_type,
      notes: params.notes,
      outcome: params.outcome,
      created_by: ctx.userUUID,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    activity: data,
    message: `Logged ${params.activity_type} activity`,
  };
}

async function initPipeline(ctx: ToolContext) {
  const { data, error } = await ctx
    .getClient()
    .rpc('crm.initialize_pipeline', {
      p_owner_id: ctx.userUUID,
      p_tenant_id: null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    stages: data || [],
    message: 'Pipeline stages initialized',
  };
}
