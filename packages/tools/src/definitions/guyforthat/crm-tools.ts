/**
 * GuyForThat CRM Tools
 *
 * AI tools for CRM operations: opportunities, pipelines, and deal tracking.
 * Supports dual-key scoping: owner_id (personal CRM) or tenant_id (team CRM).
 * Platform: guyforthat
 */

import { z } from 'zod';
import { defineTool } from '../../registry.js';

// =============================================================================
// PIPELINE STAGE TOOLS
// =============================================================================

export const getPipelineStages = defineTool({
  name: 'crm_get_pipeline_stages',
  description:
    'Get all pipeline stages for the current user/tenant. Returns customizable deal stages with probabilities.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    includeTemplates: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include default template stages (for setup)'),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true });

    if (!input.includeTemplates) {
      // Filter to user's stages only (RLS will handle this, but be explicit)
      query = query.not('owner_id', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, stages: [] };
    }

    return {
      success: true,
      stages: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/pipeline-stages' },
});

export const initializePipeline = defineTool({
  name: 'crm_initialize_pipeline',
  description:
    'Initialize default pipeline stages for the current user. Call this when setting up CRM for a new user.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({}),

  handler: async (ctx) => {
    const { data, error } = await ctx.supabase.rpc('crm.initialize_pipeline', {
      p_owner_id: ctx.userId,
      p_tenant_id: null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      stages: data || [],
      message: 'Pipeline stages initialized successfully',
    };
  },

  rest: { method: 'POST', path: '/crm/pipeline/initialize' },
});

// =============================================================================
// OPPORTUNITY TOOLS
// =============================================================================

export const createOpportunity = defineTool({
  name: 'crm_create_opportunity',
  description:
    'Create a new opportunity (deal) in the CRM. Links to contacts via entity_id or gft_contact_id.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    name: z.string().describe('Deal name (e.g., "Acme Corp - Enterprise License")'),
    gftContactId: z.string().optional().describe('GFT contact ID for the primary contact'),
    entityId: z.string().optional().describe('Global entity ID for the contact'),
    companyEntityId: z.string().optional().describe('Global entity ID for the company'),
    gftCompanyId: z.string().optional().describe('GFT company ID'),
    stageId: z.string().optional().describe('Pipeline stage ID'),
    expectedValue: z.number().optional().describe('Expected deal value'),
    currency: z.string().optional().default('USD').describe('Currency code'),
    expectedCloseDate: z.string().optional().describe('Expected close date (ISO format)'),
    probability: z.number().optional().describe('Win probability override (0-100)'),
    source: z
      .enum([
        'linkedin',
        'referral',
        'inbound',
        'cold_outreach',
        'event',
        'website',
        'partner',
        'other',
      ])
      .optional()
      .describe('How the opportunity originated'),
    description: z.string().optional().describe('Deal description and context'),
    nextStep: z.string().optional().describe('Next action to take'),
    nextStepDate: z.string().optional().describe('When to do the next step (ISO format)'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('opportunities')
      .insert({
        owner_id: ctx.userId,
        name: input.name,
        entity_id: input.entityId,
        gft_contact_id: input.gftContactId,
        company_entity_id: input.companyEntityId,
        gft_company_id: input.gftCompanyId,
        stage_id: input.stageId,
        expected_value: input.expectedValue,
        currency: input.currency || 'USD',
        expected_close_date: input.expectedCloseDate,
        probability: input.probability,
        source: input.source,
        description: input.description,
        next_step: input.nextStep,
        next_step_date: input.nextStepDate,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      opportunity: data,
      message: `Created opportunity: ${input.name}`,
    };
  },

  rest: { method: 'POST', path: '/crm/opportunities' },
});

export const updateOpportunity = defineTool({
  name: 'crm_update_opportunity',
  description:
    'Update an existing opportunity. Use this to move deals through pipeline stages, update values, or mark as won/lost.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    opportunityId: z.string().describe('Opportunity ID to update'),
    name: z.string().optional().describe('New deal name'),
    stageId: z.string().optional().describe('New pipeline stage ID'),
    expectedValue: z.number().optional().describe('Updated deal value'),
    expectedCloseDate: z.string().optional().describe('Updated close date (ISO format)'),
    probability: z.number().optional().describe('Win probability override (0-100)'),
    source: z
      .enum([
        'linkedin',
        'referral',
        'inbound',
        'cold_outreach',
        'event',
        'website',
        'partner',
        'other',
      ])
      .optional(),
    description: z.string().optional(),
    nextStep: z.string().optional(),
    nextStepDate: z.string().optional(),
    markAsWon: z.boolean().optional().describe('Mark deal as won'),
    markAsLost: z.boolean().optional().describe('Mark deal as lost'),
    lostReason: z.string().optional().describe('Reason for losing the deal'),
  }),

  handler: async (ctx, input) => {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.stageId !== undefined) updates.stage_id = input.stageId;
    if (input.expectedValue !== undefined) updates.expected_value = input.expectedValue;
    if (input.expectedCloseDate !== undefined) updates.expected_close_date = input.expectedCloseDate;
    if (input.probability !== undefined) updates.probability = input.probability;
    if (input.source !== undefined) updates.source = input.source;
    if (input.description !== undefined) updates.description = input.description;
    if (input.nextStep !== undefined) updates.next_step = input.nextStep;
    if (input.nextStepDate !== undefined) updates.next_step_date = input.nextStepDate;
    if (input.lostReason !== undefined) updates.lost_reason = input.lostReason;

    // Handle won/lost status
    if (input.markAsWon) {
      updates.won_at = new Date().toISOString();
      updates.closed_at = new Date().toISOString();
    }
    if (input.markAsLost) {
      updates.lost_at = new Date().toISOString();
      updates.closed_at = new Date().toISOString();
    }

    const { data, error } = await ctx.supabase
      .from('opportunities')
      .update(updates)
      .eq('id', input.opportunityId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      opportunity: data,
      message: `Updated opportunity: ${data.name}`,
    };
  },

  rest: { method: 'PATCH', path: '/crm/opportunities/:opportunityId' },
});

export const getOpportunity = defineTool({
  name: 'crm_get_opportunity',
  description:
    'Get a single opportunity with full details including stage, activities, and line items.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    opportunityId: z.string().describe('Opportunity ID'),
    includeActivities: z.boolean().optional().default(true).describe('Include activity history'),
    includeLineItems: z.boolean().optional().default(true).describe('Include products/line items'),
  }),

  handler: async (ctx, input) => {
    // Get opportunity with stage
    const { data: opportunity, error } = await ctx.supabase
      .from('opportunities')
      .select('*, pipeline_stages(*)')
      .eq('id', input.opportunityId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let activities = [];
    let lineItems = [];

    if (input.includeActivities) {
      const { data } = await ctx.supabase
        .from('opportunity_activities')
        .select('*')
        .eq('opportunity_id', input.opportunityId)
        .order('occurred_at', { ascending: false });
      activities = data || [];
    }

    if (input.includeLineItems) {
      const { data } = await ctx.supabase
        .from('opportunity_line_items')
        .select('*, products(*)')
        .eq('opportunity_id', input.opportunityId);
      lineItems = data || [];
    }

    return {
      success: true,
      opportunity,
      activities,
      lineItems,
    };
  },

  rest: { method: 'GET', path: '/crm/opportunities/:opportunityId' },
});

export const searchOpportunities = defineTool({
  name: 'crm_search_opportunities',
  description:
    'Search and filter opportunities. Find deals by stage, value, close date, or status.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    query: z.string().optional().describe('Search by name or description'),
    stageId: z.string().optional().describe('Filter by pipeline stage'),
    isOpen: z.boolean().optional().describe('Only open opportunities (not closed)'),
    isWon: z.boolean().optional().describe('Only won opportunities'),
    isLost: z.boolean().optional().describe('Only lost opportunities'),
    minValue: z.number().optional().describe('Minimum expected value'),
    maxValue: z.number().optional().describe('Maximum expected value'),
    closingBefore: z.string().optional().describe('Expected to close before date (ISO format)'),
    closingAfter: z.string().optional().describe('Expected to close after date (ISO format)'),
    contactId: z.string().optional().describe('Filter by GFT contact ID'),
    companyId: z.string().optional().describe('Filter by GFT company ID'),
    limit: z.number().optional().default(50).describe('Max results'),
    orderBy: z
      .enum(['created_at', 'expected_close_date', 'expected_value', 'updated_at'])
      .optional()
      .default('created_at'),
    ascending: z.boolean().optional().default(false),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('opportunities')
      .select('*, pipeline_stages(name, position, color)')
      .limit(input.limit || 50);

    // Search
    if (input.query) {
      query = query.or(`name.ilike.%${input.query}%,description.ilike.%${input.query}%`);
    }

    // Filters
    if (input.stageId) {
      query = query.eq('stage_id', input.stageId);
    }
    if (input.isOpen === true) {
      query = query.is('closed_at', null);
    }
    if (input.isWon === true) {
      query = query.not('won_at', 'is', null);
    }
    if (input.isLost === true) {
      query = query.not('lost_at', 'is', null);
    }
    if (input.minValue !== undefined) {
      query = query.gte('expected_value', input.minValue);
    }
    if (input.maxValue !== undefined) {
      query = query.lte('expected_value', input.maxValue);
    }
    if (input.closingBefore) {
      query = query.lte('expected_close_date', input.closingBefore);
    }
    if (input.closingAfter) {
      query = query.gte('expected_close_date', input.closingAfter);
    }
    if (input.contactId) {
      query = query.eq('gft_contact_id', input.contactId);
    }
    if (input.companyId) {
      query = query.eq('gft_company_id', input.companyId);
    }

    // Order
    query = query.order(input.orderBy || 'created_at', {
      ascending: input.ascending ?? false,
    });

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, opportunities: [] };
    }

    return {
      success: true,
      opportunities: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/opportunities' },
});

export const getContactOpportunities = defineTool({
  name: 'crm_get_contact_opportunities',
  description:
    'Get all opportunities associated with a contact. Finds deals via both direct link and entity resolution.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    gftContactId: z.string().optional().describe('GFT contact ID'),
    entityId: z.string().optional().describe('Global entity ID'),
  }),

  handler: async (ctx, input) => {
    if (!input.gftContactId && !input.entityId) {
      return {
        success: false,
        error: 'Either gftContactId or entityId is required',
        opportunities: [],
      };
    }

    const { data, error } = await ctx.supabase.rpc('crm.get_contact_opportunities', {
      p_gft_contact_id: input.gftContactId || null,
      p_entity_id: input.entityId || null,
    });

    if (error) {
      return { success: false, error: error.message, opportunities: [] };
    }

    return {
      success: true,
      opportunities: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/contacts/:contactId/opportunities' },
});

export const getPipelineSummary = defineTool({
  name: 'crm_get_pipeline_summary',
  description:
    'Get pipeline summary with opportunity counts and values per stage. Useful for dashboard views.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({}),

  handler: async (ctx) => {
    const { data, error } = await ctx.supabase.rpc('crm.get_pipeline_summary', {
      p_owner_id: ctx.userId,
      p_tenant_id: null,
    });

    if (error) {
      return { success: false, error: error.message, summary: [] };
    }

    // Calculate totals
    const summary = data || [];
    const totals = summary.reduce(
      (acc: { totalOpportunities: number; totalValue: number; weightedValue: number }, stage: { opportunity_count: number; total_value: number; weighted_value: number }) => ({
        totalOpportunities: acc.totalOpportunities + (stage.opportunity_count || 0),
        totalValue: acc.totalValue + (parseFloat(String(stage.total_value)) || 0),
        weightedValue: acc.weightedValue + (parseFloat(String(stage.weighted_value)) || 0),
      }),
      { totalOpportunities: 0, totalValue: 0, weightedValue: 0 }
    );

    return {
      success: true,
      stages: summary,
      totals,
    };
  },

  rest: { method: 'GET', path: '/crm/pipeline/summary' },
});

// =============================================================================
// ACTIVITY TOOLS
// =============================================================================

export const addOpportunityActivity = defineTool({
  name: 'crm_add_activity',
  description:
    'Add an activity (call, email, meeting, etc.) to an opportunity. Use this to track interactions.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    opportunityId: z.string().describe('Opportunity ID'),
    activityType: z
      .enum([
        'call',
        'email',
        'meeting',
        'note',
        'linkedin_message',
        'demo',
        'proposal_sent',
        'contract_sent',
        'follow_up',
        'other',
      ])
      .describe('Type of activity'),
    occurredAt: z.string().optional().describe('When the activity occurred (ISO format)'),
    notes: z.string().optional().describe('Activity notes'),
    outcome: z.string().optional().describe('Outcome (e.g., completed, no_answer, rescheduled)'),
    durationMinutes: z.number().optional().describe('Duration in minutes'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('opportunity_activities')
      .insert({
        opportunity_id: input.opportunityId,
        activity_type: input.activityType,
        occurred_at: input.occurredAt || new Date().toISOString(),
        notes: input.notes,
        outcome: input.outcome,
        duration_minutes: input.durationMinutes,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      activity: data,
      message: `Added ${input.activityType} activity`,
    };
  },

  rest: { method: 'POST', path: '/crm/opportunities/:opportunityId/activities' },
});

// =============================================================================
// PRODUCT TOOLS
// =============================================================================

export const createProduct = defineTool({
  name: 'crm_create_product',
  description:
    'Create a product or service in the CRM catalog. Products can be added to opportunities as line items.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    name: z.string().describe('Product name'),
    sku: z.string().optional().describe('Stock keeping unit / product code'),
    category: z.string().optional().describe('Product category'),
    description: z.string().optional().describe('Product description'),
    unitPrice: z.number().optional().describe('Default unit price'),
    isRecurring: z.boolean().optional().default(false).describe('Is this a recurring product?'),
    billingPeriod: z
      .enum(['monthly', 'quarterly', 'annually', 'one_time'])
      .optional()
      .describe('Billing period for recurring products'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('products')
      .insert({
        owner_id: ctx.userId,
        name: input.name,
        sku: input.sku,
        category: input.category,
        description: input.description,
        unit_price: input.unitPrice,
        is_recurring: input.isRecurring || false,
        billing_period: input.billingPeriod,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      product: data,
      message: `Created product: ${input.name}`,
    };
  },

  rest: { method: 'POST', path: '/crm/products' },
});

export const searchProducts = defineTool({
  name: 'crm_search_products',
  description: 'Search products in the CRM catalog.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    query: z.string().optional().describe('Search by name or SKU'),
    category: z.string().optional().describe('Filter by category'),
    activeOnly: z.boolean().optional().default(true).describe('Only show active products'),
    limit: z.number().optional().default(50),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      .limit(input.limit || 50);

    if (input.query) {
      query = query.or(`name.ilike.%${input.query}%,sku.ilike.%${input.query}%`);
    }
    if (input.category) {
      query = query.eq('category', input.category);
    }
    if (input.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, products: [] };
    }

    return {
      success: true,
      products: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/products' },
});

// =============================================================================
// LINE ITEM TOOLS
// =============================================================================

export const addLineItem = defineTool({
  name: 'crm_add_line_item',
  description: 'Add a product/service line item to an opportunity.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    opportunityId: z.string().describe('Opportunity ID'),
    productId: z.string().optional().describe('Product ID from catalog'),
    productName: z.string().optional().describe('Custom product name (if not from catalog)'),
    quantity: z.number().optional().default(1).describe('Quantity'),
    unitPrice: z.number().describe('Unit price'),
    discountPercent: z.number().optional().default(0).describe('Discount percentage (0-100)'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('opportunity_line_items')
      .insert({
        opportunity_id: input.opportunityId,
        product_id: input.productId,
        product_name: input.productName,
        quantity: input.quantity || 1,
        unit_price: input.unitPrice,
        discount_percent: input.discountPercent || 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      lineItem: data,
      message: `Added line item to opportunity`,
    };
  },

  rest: { method: 'POST', path: '/crm/opportunities/:opportunityId/line-items' },
});

// =============================================================================
// ACCOUNT CONTEXT TOOLS
// =============================================================================

export const upsertAccountContext = defineTool({
  name: 'crm_upsert_account_context',
  description:
    'Create or update account context (company intelligence). Stores tenant-specific intel about companies.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    companyEntityId: z.string().optional().describe('Global entity ID for the company'),
    gftCompanyId: z.string().optional().describe('GFT company ID'),
    accountType: z
      .enum(['prospect', 'customer', 'partner', 'competitor', 'other'])
      .optional()
      .describe('Account classification'),
    tier: z.enum(['enterprise', 'mid_market', 'smb', 'startup']).optional().describe('Account tier'),
    industryVertical: z.string().optional().describe('Specific industry vertical'),
    techStack: z.array(z.string()).optional().describe('Technologies they use'),
    budgetInfo: z.string().optional().describe('Budget information'),
    decisionProcess: z.string().optional().describe('How they make decisions'),
    fiscalYearEnd: z.string().optional().describe('Fiscal year end month'),
    relationshipOwner: z.string().optional().describe('User ID of relationship owner'),
    lastEngagementDate: z.string().optional().describe('Last engagement date (ISO format)'),
    notes: z.string().optional().describe('Additional notes'),
  }),

  handler: async (ctx, input) => {
    if (!input.companyEntityId && !input.gftCompanyId) {
      return {
        success: false,
        error: 'Either companyEntityId or gftCompanyId is required',
      };
    }

    const { data, error } = await ctx.supabase
      .from('account_context')
      .upsert(
        {
          owner_id: ctx.userId,
          company_entity_id: input.companyEntityId,
          gft_company_id: input.gftCompanyId,
          account_type: input.accountType,
          tier: input.tier,
          industry_vertical: input.industryVertical,
          tech_stack: input.techStack || [],
          budget_info: input.budgetInfo,
          decision_process: input.decisionProcess,
          fiscal_year_end: input.fiscalYearEnd,
          relationship_owner: input.relationshipOwner,
          last_engagement_date: input.lastEngagementDate,
          notes: input.notes,
        },
        {
          onConflict: input.companyEntityId
            ? 'owner_id,tenant_id,company_entity_id'
            : 'owner_id,tenant_id,gft_company_id',
        }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      accountContext: data,
      message: 'Account context saved',
    };
  },

  rest: { method: 'PUT', path: '/crm/account-context' },
});

export const getAccountContext = defineTool({
  name: 'crm_get_account_context',
  description: 'Get account context (company intelligence) for a company.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    companyEntityId: z.string().optional().describe('Global entity ID for the company'),
    gftCompanyId: z.string().optional().describe('GFT company ID'),
  }),

  handler: async (ctx, input) => {
    if (!input.companyEntityId && !input.gftCompanyId) {
      return {
        success: false,
        error: 'Either companyEntityId or gftCompanyId is required',
      };
    }

    let query = ctx.supabase.from('account_context').select('*');

    if (input.companyEntityId) {
      query = query.eq('company_entity_id', input.companyEntityId);
    }
    if (input.gftCompanyId) {
      query = query.eq('gft_company_id', input.gftCompanyId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      return { success: false, error: error.message };
    }

    return {
      success: true,
      accountContext: data || null,
    };
  },

  rest: { method: 'GET', path: '/crm/account-context' },
});
