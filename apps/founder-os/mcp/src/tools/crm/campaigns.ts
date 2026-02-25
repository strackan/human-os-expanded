/**
 * CRM Campaign Tools
 *
 * Provides:
 * - create_campaign: Create outbound campaign
 * - update_campaign: Update campaign status/details
 * - get_campaign: Get campaign with stats
 * - list_campaigns: List all campaigns
 * - add_to_campaign: Add contacts to campaign
 * - update_campaign_member: Update member status
 * - get_campaign_members: List campaign members
 * - get_outreach_queue: Get members needing outreach
 * - log_outreach: Log outreach activity
 * - convert_lead: Convert campaign member to opportunity
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../../lib/context.js';

const CRM_SCHEMA = 'crm';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const campaignTools: Tool[] = [
  {
    name: 'create_campaign',
    description: `Create a new outbound campaign to organize lead outreach.

Example: "Create a Q1 Enterprise outbound campaign with goal of 20 discovery calls"`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name (e.g., "Q1 Enterprise Outreach")' },
        description: { type: 'string', description: 'Campaign description and goals' },
        campaign_type: {
          type: 'string',
          enum: ['outbound', 'nurture', 'event', 're_engagement'],
          default: 'outbound',
        },
        goal_type: {
          type: 'string',
          enum: ['discovery_calls', 'responses', 'meetings', 'demos', 'conversions'],
          description: 'What success looks like',
        },
        goal_target: { type: 'number', description: 'Target number to achieve' },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_campaign',
    description: 'Update campaign status or details. Use to activate, pause, or complete a campaign.',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        name: { type: 'string' },
        description: { type: 'string' },
        status: {
          type: 'string',
          enum: ['draft', 'active', 'paused', 'completed'],
        },
        goal_target: { type: 'number' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_campaign',
    description: 'Get campaign details with stats (member counts, response rate, conversion rate).',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'list_campaigns',
    description: 'List all campaigns, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'active', 'paused', 'completed'],
          description: 'Filter by status',
        },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'add_to_campaign',
    description: `Add contacts to a campaign. Provide a list of contact IDs.

Example: "Add John and Sarah to the Enterprise campaign"`,
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        contact_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'GFT contact IDs to add',
        },
      },
      required: ['campaign_id', 'contact_ids'],
    },
  },
  {
    name: 'update_campaign_member',
    description: `Update a campaign member's status as they progress through outreach.

Statuses: pending → contacted → responded → interested → converted (or: not_interested, opted_out, bounced)`,
    inputSchema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Campaign member ID' },
        status: {
          type: 'string',
          enum: ['pending', 'contacted', 'responded', 'interested', 'converted', 'not_interested', 'opted_out', 'bounced'],
        },
        notes: { type: 'string', description: 'Update notes' },
      },
      required: ['member_id', 'status'],
    },
  },
  {
    name: 'get_campaign_members',
    description: 'Get members of a campaign with optional status filter.',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        status: {
          type: 'string',
          enum: ['pending', 'contacted', 'responded', 'interested', 'converted', 'not_interested', 'opted_out', 'bounced'],
        },
        limit: { type: 'number', description: 'Max results (default 50)' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_outreach_queue',
    description: `Get campaign members needing outreach, prioritized. Returns pending members first, then those needing follow-up.

Call this to get your next batch of people to contact.`,
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        limit: { type: 'number', description: 'How many to get (default 10)' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'log_outreach',
    description: 'Log an outreach activity (connection request, message, email, call) for a campaign member.',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        member_id: { type: 'string', description: 'Campaign member ID' },
        activity_type: {
          type: 'string',
          enum: ['linkedin_connect', 'linkedin_message', 'email', 'call', 'voicemail', 'other'],
        },
        message_content: { type: 'string', description: 'What was sent' },
        outcome: {
          type: 'string',
          enum: ['sent', 'delivered', 'opened', 'replied', 'accepted', 'declined', 'bounced', 'no_answer'],
        },
      },
      required: ['campaign_id', 'member_id', 'activity_type'],
    },
  },
  {
    name: 'convert_lead',
    description: `Convert a responding campaign member into a CRM opportunity (deal).

Creates the opportunity and marks the member as converted.`,
    inputSchema: {
      type: 'object',
      properties: {
        member_id: { type: 'string', description: 'Campaign member ID' },
        opportunity_name: { type: 'string', description: 'Name for the new deal' },
        expected_value: { type: 'number', description: 'Expected deal value' },
      },
      required: ['member_id', 'opportunity_name'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleCampaignTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'create_campaign':
      return createCampaign(ctx, args as unknown as CreateCampaignParams);

    case 'update_campaign':
      return updateCampaign(ctx, args as unknown as UpdateCampaignParams);

    case 'get_campaign':
      return getCampaign(ctx, args.campaign_id as string);

    case 'list_campaigns':
      return listCampaigns(ctx, args.status as string | undefined, (args.limit as number) || 20);

    case 'add_to_campaign':
      return addToCampaign(ctx, args.campaign_id as string, args.contact_ids as string[]);

    case 'update_campaign_member':
      return updateCampaignMember(ctx, args as unknown as UpdateMemberParams);

    case 'get_campaign_members':
      return getCampaignMembers(ctx, args as unknown as GetMembersParams);

    case 'get_outreach_queue':
      return getOutreachQueue(ctx, args.campaign_id as string, (args.limit as number) || 10);

    case 'log_outreach':
      return logOutreach(ctx, args as unknown as LogOutreachParams);

    case 'convert_lead':
      return convertLead(ctx, args as unknown as ConvertLeadParams);

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface CreateCampaignParams {
  name: string;
  description?: string;
  campaign_type?: string;
  goal_type?: string;
  goal_target?: number;
  start_date?: string;
  end_date?: string;
}

interface UpdateCampaignParams {
  campaign_id: string;
  name?: string;
  description?: string;
  status?: string;
  goal_target?: number;
}

interface UpdateMemberParams {
  member_id: string;
  status: string;
  notes?: string;
}

interface GetMembersParams {
  campaign_id: string;
  status?: string;
  limit?: number;
}

interface LogOutreachParams {
  campaign_id: string;
  member_id: string;
  activity_type: string;
  message_content?: string;
  outcome?: string;
}

interface ConvertLeadParams {
  member_id: string;
  opportunity_name: string;
  expected_value?: number;
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function createCampaign(ctx: ToolContext, params: CreateCampaignParams) {
  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaigns')
    .insert({
      owner_id: ctx.userUUID,
      name: params.name,
      description: params.description,
      campaign_type: params.campaign_type || 'outbound',
      status: 'draft',
      goal_type: params.goal_type,
      goal_target: params.goal_target,
      start_date: params.start_date,
      end_date: params.end_date,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    campaign: data,
    message: `Created campaign "${params.name}"${params.goal_target ? ` with goal of ${params.goal_target} ${params.goal_type || 'conversions'}` : ''}`,
  };
}

async function updateCampaign(ctx: ToolContext, params: UpdateCampaignParams) {
  const updates: Record<string, unknown> = {};

  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.status !== undefined) updates.status = params.status;
  if (params.goal_target !== undefined) updates.goal_target = params.goal_target;

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaigns')
    .update(updates)
    .eq('id', params.campaign_id)
    .eq('owner_id', ctx.userUUID)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    campaign: data,
    message: `Updated campaign "${data.name}"${params.status ? ` (now ${params.status})` : ''}`,
  };
}

async function getCampaign(ctx: ToolContext, campaignId: string) {
  const { data: campaign, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('owner_id', ctx.userUUID)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Get stats
  const { data: stats } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .rpc('get_campaign_stats', {
      p_campaign_id: campaignId,
    });

  const statsData = stats?.[0] || null;

  return {
    success: true,
    campaign,
    stats: statsData,
    summary: statsData
      ? `${statsData.total_members} members: ${statsData.converted} converted (${statsData.conversion_rate}%), ${statsData.responded + statsData.interested} responded (${statsData.response_rate}%)`
      : null,
  };
}

async function listCampaigns(ctx: ToolContext, status?: string, limit: number = 20) {
  let query = ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaigns')
    .select('*')
    .eq('owner_id', ctx.userUUID)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message, campaigns: [] };
  }

  return {
    success: true,
    count: data?.length || 0,
    campaigns: data || [],
  };
}

async function addToCampaign(ctx: ToolContext, campaignId: string, contactIds: string[]) {
  if (!contactIds || contactIds.length === 0) {
    return { success: false, error: 'No contact IDs provided' };
  }

  const toInsert = contactIds.map((id) => ({
    campaign_id: campaignId,
    gft_contact_id: id,
    status: 'pending',
  }));

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaign_members')
    .upsert(toInsert, {
      onConflict: 'campaign_id,gft_contact_id',
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    added: data?.length || 0,
    message: `Added ${data?.length || 0} contacts to campaign`,
  };
}

async function updateCampaignMember(ctx: ToolContext, params: UpdateMemberParams) {
  const updates: Record<string, unknown> = {
    status: params.status,
  };

  // Set timestamps based on status
  const now = new Date().toISOString();
  if (['contacted', 'responded', 'interested'].includes(params.status)) {
    updates.last_contacted_at = now;
  }
  if (['responded', 'interested'].includes(params.status)) {
    updates.responded_at = now;
  }
  if (params.status === 'converted') {
    updates.converted_at = now;
  }
  if (params.notes) {
    updates.notes = params.notes;
  }

  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaign_members')
    .update(updates)
    .eq('id', params.member_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    member: data,
    message: `Updated member status to: ${params.status}`,
  };
}

async function getCampaignMembers(ctx: ToolContext, params: GetMembersParams) {
  let query = ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaign_members')
    .select('*')
    .eq('campaign_id', params.campaign_id)
    .order('added_at', { ascending: true })
    .limit(params.limit || 50);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message, members: [] };
  }

  return {
    success: true,
    count: data?.length || 0,
    members: data || [],
  };
}

async function getOutreachQueue(ctx: ToolContext, campaignId: string, limit: number) {
  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .rpc('get_members_to_contact', {
      p_campaign_id: campaignId,
      p_limit: limit,
    });

  if (error) {
    return { success: false, error: error.message, queue: [] };
  }

  return {
    success: true,
    count: data?.length || 0,
    queue: data || [],
    message: `${data?.length || 0} contacts ready for outreach`,
  };
}

async function logOutreach(ctx: ToolContext, params: LogOutreachParams) {
  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaign_activities')
    .insert({
      campaign_id: params.campaign_id,
      member_id: params.member_id,
      activity_type: params.activity_type,
      message_content: params.message_content,
      outcome: params.outcome || 'sent',
      performed_by: ctx.userUUID,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Update member status if still pending
  await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .from('campaign_members')
    .update({
      status: 'contacted',
      last_contacted_at: new Date().toISOString(),
    })
    .eq('id', params.member_id)
    .eq('status', 'pending');

  return {
    success: true,
    activity: data,
    message: `Logged ${params.activity_type}`,
  };
}

async function convertLead(ctx: ToolContext, params: ConvertLeadParams) {
  const { data, error } = await ctx
    .getClient()
    .schema(CRM_SCHEMA)
    .rpc('convert_member_to_opportunity', {
      p_member_id: params.member_id,
      p_opportunity_name: params.opportunity_name,
      p_expected_value: params.expected_value || null,
      p_stage_id: null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    opportunity_id: data,
    message: `Converted to opportunity: ${params.opportunity_name}`,
  };
}
