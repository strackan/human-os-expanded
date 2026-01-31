/**
 * GuyForThat Campaign Tools
 *
 * AI tools for campaign management: outbound campaigns, member tracking, conversion.
 * Platform: guyforthat
 */

import { z } from 'zod';
import { defineTool } from '../../registry.js';

// =============================================================================
// CAMPAIGN CRUD
// =============================================================================

export const createCampaign = defineTool({
  name: 'crm_create_campaign',
  description:
    'Create a new outbound campaign to organize lead outreach. Campaigns group contacts for coordinated outreach efforts.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    name: z.string().describe('Campaign name (e.g., "Q1 Enterprise Outreach")'),
    description: z.string().optional().describe('Campaign description and goals'),
    campaignType: z
      .enum(['outbound', 'nurture', 'event', 're_engagement'])
      .optional()
      .default('outbound')
      .describe('Type of campaign'),
    goalType: z
      .enum(['discovery_calls', 'responses', 'meetings', 'demos', 'conversions'])
      .optional()
      .describe('What success looks like'),
    goalTarget: z.number().optional().describe('Target number to achieve'),
    startDate: z.string().optional().describe('Start date (ISO format)'),
    endDate: z.string().optional().describe('End date (ISO format)'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('campaigns')
      .insert({
        owner_id: ctx.userId,
        name: input.name,
        description: input.description,
        campaign_type: input.campaignType || 'outbound',
        status: 'draft',
        goal_type: input.goalType,
        goal_target: input.goalTarget,
        start_date: input.startDate,
        end_date: input.endDate,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      campaign: data,
      message: `Created campaign: ${input.name}`,
    };
  },

  rest: { method: 'POST', path: '/crm/campaigns' },
});

export const updateCampaign = defineTool({
  name: 'crm_update_campaign',
  description:
    'Update a campaign. Use this to change status (activate, pause, complete), update goals, or modify details.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    campaignId: z.string().describe('Campaign ID'),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    goalType: z
      .enum(['discovery_calls', 'responses', 'meetings', 'demos', 'conversions'])
      .optional(),
    goalTarget: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),

  handler: async (ctx, input) => {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.goalType !== undefined) updates.goal_type = input.goalType;
    if (input.goalTarget !== undefined) updates.goal_target = input.goalTarget;
    if (input.startDate !== undefined) updates.start_date = input.startDate;
    if (input.endDate !== undefined) updates.end_date = input.endDate;

    const { data, error } = await ctx.supabase
      .from('campaigns')
      .update(updates)
      .eq('id', input.campaignId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      campaign: data,
      message: `Updated campaign: ${data.name}`,
    };
  },

  rest: { method: 'PATCH', path: '/crm/campaigns/:campaignId' },
});

export const getCampaign = defineTool({
  name: 'crm_get_campaign',
  description: 'Get a campaign with its stats (member counts, conversion rates).',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    campaignId: z.string().describe('Campaign ID'),
  }),

  handler: async (ctx, input) => {
    // Get campaign
    const { data: campaign, error } = await ctx.supabase
      .from('campaigns')
      .select('*')
      .eq('id', input.campaignId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Get stats
    const { data: stats } = await ctx.supabase.rpc('crm.get_campaign_stats', {
      p_campaign_id: input.campaignId,
    });

    return {
      success: true,
      campaign,
      stats: stats?.[0] || null,
    };
  },

  rest: { method: 'GET', path: '/crm/campaigns/:campaignId' },
});

export const searchCampaigns = defineTool({
  name: 'crm_search_campaigns',
  description: 'Search and filter campaigns by status, type, or name.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    query: z.string().optional().describe('Search by name'),
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    campaignType: z.enum(['outbound', 'nurture', 'event', 're_engagement']).optional(),
    limit: z.number().optional().default(50),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(input.limit || 50);

    if (input.query) {
      query = query.ilike('name', `%${input.query}%`);
    }
    if (input.status) {
      query = query.eq('status', input.status);
    }
    if (input.campaignType) {
      query = query.eq('campaign_type', input.campaignType);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, campaigns: [] };
    }

    return {
      success: true,
      campaigns: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/campaigns' },
});

// =============================================================================
// CAMPAIGN MEMBERS
// =============================================================================

export const addCampaignMembers = defineTool({
  name: 'crm_add_campaign_members',
  description:
    'Add contacts to a campaign. Supports bulk addition. Contacts can be specified by GFT contact ID or entity ID.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    campaignId: z.string().describe('Campaign ID'),
    members: z
      .array(
        z.object({
          gftContactId: z.string().optional(),
          entityId: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .describe('Contacts to add (provide gftContactId or entityId for each)'),
  }),

  handler: async (ctx, input) => {
    const toInsert = input.members
      .filter((m) => m.gftContactId || m.entityId)
      .map((m) => ({
        campaign_id: input.campaignId,
        gft_contact_id: m.gftContactId || null,
        entity_id: m.entityId || null,
        notes: m.notes || null,
        status: 'pending',
      }));

    if (toInsert.length === 0) {
      return {
        success: false,
        error: 'No valid members to add. Each member needs gftContactId or entityId.',
      };
    }

    const { data, error } = await ctx.supabase
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
      members: data,
      message: `Added ${data?.length || 0} members to campaign`,
    };
  },

  rest: { method: 'POST', path: '/crm/campaigns/:campaignId/members' },
});

export const updateMemberStatus = defineTool({
  name: 'crm_update_member_status',
  description:
    'Update a campaign member status. Use this to track outreach progress (contacted, responded, interested, etc.).',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    memberId: z.string().describe('Campaign member ID'),
    status: z
      .enum([
        'pending',
        'contacted',
        'responded',
        'interested',
        'converted',
        'not_interested',
        'opted_out',
        'bounced',
      ])
      .describe('New status'),
    notes: z.string().optional().describe('Add/update notes'),
  }),

  handler: async (ctx, input) => {
    const updates: Record<string, unknown> = {
      status: input.status,
    };

    // Set timestamps based on status
    const now = new Date().toISOString();
    if (input.status === 'contacted' || input.status === 'responded') {
      updates.last_contacted_at = now;
    }
    if (input.status === 'responded' || input.status === 'interested') {
      updates.responded_at = now;
    }
    if (input.status === 'converted') {
      updates.converted_at = now;
    }
    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }

    // Set first_contacted_at if this is first contact
    const { data: member } = await ctx.supabase
      .from('campaign_members')
      .select('first_contacted_at')
      .eq('id', input.memberId)
      .single();

    if (!member?.first_contacted_at && ['contacted', 'responded', 'interested'].includes(input.status)) {
      updates.first_contacted_at = now;
    }

    const { data, error } = await ctx.supabase
      .from('campaign_members')
      .update(updates)
      .eq('id', input.memberId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      member: data,
      message: `Updated member status to: ${input.status}`,
    };
  },

  rest: { method: 'PATCH', path: '/crm/campaign-members/:memberId/status' },
});

export const getCampaignMembers = defineTool({
  name: 'crm_get_campaign_members',
  description: 'Get members of a campaign with optional status filter.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    campaignId: z.string().describe('Campaign ID'),
    status: z
      .enum([
        'pending',
        'contacted',
        'responded',
        'interested',
        'converted',
        'not_interested',
        'opted_out',
        'bounced',
      ])
      .optional()
      .describe('Filter by status'),
    limit: z.number().optional().default(100),
  }),

  handler: async (ctx, input) => {
    let query = ctx.supabase
      .from('campaign_members')
      .select('*')
      .eq('campaign_id', input.campaignId)
      .order('added_at', { ascending: true })
      .limit(input.limit || 100);

    if (input.status) {
      query = query.eq('status', input.status);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, members: [] };
    }

    return {
      success: true,
      members: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/campaigns/:campaignId/members' },
});

export const getMembersToContact = defineTool({
  name: 'crm_get_members_to_contact',
  description:
    'Get campaign members that need outreach. Returns pending members and those needing follow-up, prioritized.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    campaignId: z.string().describe('Campaign ID'),
    limit: z.number().optional().default(50),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.rpc('crm.get_members_to_contact', {
      p_campaign_id: input.campaignId,
      p_limit: input.limit || 50,
    });

    if (error) {
      return { success: false, error: error.message, members: [] };
    }

    return {
      success: true,
      members: data || [],
      count: data?.length || 0,
    };
  },

  rest: { method: 'GET', path: '/crm/campaigns/:campaignId/to-contact' },
});

export const removeCampaignMember = defineTool({
  name: 'crm_remove_campaign_member',
  description: 'Remove a contact from a campaign.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    memberId: z.string().describe('Campaign member ID to remove'),
  }),

  handler: async (ctx, input) => {
    const { error } = await ctx.supabase
      .from('campaign_members')
      .delete()
      .eq('id', input.memberId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Member removed from campaign',
    };
  },

  rest: { method: 'DELETE', path: '/crm/campaign-members/:memberId' },
});

// =============================================================================
// CAMPAIGN ACTIVITIES
// =============================================================================

export const logCampaignActivity = defineTool({
  name: 'crm_log_campaign_activity',
  description:
    'Log an outreach activity for a campaign member (connection request, message, email, call).',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    campaignId: z.string().describe('Campaign ID'),
    memberId: z.string().describe('Campaign member ID'),
    activityType: z
      .enum(['linkedin_connect', 'linkedin_message', 'email', 'call', 'voicemail', 'other'])
      .describe('Type of outreach'),
    messageContent: z.string().optional().describe('What was sent'),
    outcome: z
      .enum(['sent', 'delivered', 'opened', 'replied', 'accepted', 'declined', 'bounced', 'no_answer'])
      .optional()
      .describe('Outcome of the activity'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase
      .from('campaign_activities')
      .insert({
        campaign_id: input.campaignId,
        member_id: input.memberId,
        activity_type: input.activityType,
        message_content: input.messageContent,
        outcome: input.outcome || 'sent',
        performed_by: ctx.userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Also update member's last_contacted_at
    await ctx.supabase
      .from('campaign_members')
      .update({
        last_contacted_at: new Date().toISOString(),
        status: 'contacted',
      })
      .eq('id', input.memberId)
      .eq('status', 'pending'); // Only update if still pending

    return {
      success: true,
      activity: data,
      message: `Logged ${input.activityType} activity`,
    };
  },

  rest: { method: 'POST', path: '/crm/campaigns/:campaignId/activities' },
});

// =============================================================================
// CONVERSION
// =============================================================================

export const convertMemberToOpportunity = defineTool({
  name: 'crm_convert_member_to_opportunity',
  description:
    'Convert a responding campaign member into a CRM opportunity. Creates the opportunity and updates member status.',
  platform: 'guyforthat',
  category: 'crm',

  input: z.object({
    memberId: z.string().describe('Campaign member ID'),
    opportunityName: z.string().describe('Name for the new opportunity'),
    expectedValue: z.number().optional().describe('Expected deal value'),
    stageId: z.string().optional().describe('Pipeline stage ID'),
  }),

  handler: async (ctx, input) => {
    const { data, error } = await ctx.supabase.rpc('crm.convert_member_to_opportunity', {
      p_member_id: input.memberId,
      p_opportunity_name: input.opportunityName,
      p_expected_value: input.expectedValue || null,
      p_stage_id: input.stageId || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      opportunityId: data,
      message: `Created opportunity: ${input.opportunityName}`,
    };
  },

  rest: { method: 'POST', path: '/crm/campaign-members/:memberId/convert' },
});
