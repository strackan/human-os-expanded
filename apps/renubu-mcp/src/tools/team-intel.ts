/**
 * Team Intel Tools
 *
 * Intra-team intel requests for Renubu workflows.
 * CSMs can request customer intel from AEs, other CSMs, etc.
 *
 * Uses the same intel_requests table as Founder OS, but scoped to tenant.
 * Default is 1:1 communication (no sanitization).
 *
 * PERMISSION BOUNDARY:
 * - Operates within the tenant's permission scope
 * - Intel stays within the team unless explicitly published
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const teamIntelTools: Tool[] = [
  {
    name: 'request_team_intel',
    description:
      'Request intel about a customer/contact from a teammate. ' +
      'Example: CSM asks AE about a prospect before renewal call.',
    inputSchema: {
      type: 'object',
      properties: {
        target_user_id: {
          type: 'string',
          description: 'UUID of the teammate to ask',
        },
        target_user_name: {
          type: 'string',
          description: 'Name of the teammate (for display)',
        },
        contact_entity_id: {
          type: 'string',
          description: 'UUID of the customer/contact entity',
        },
        contact_name: {
          type: 'string',
          description: 'Name of the customer/contact (for display)',
        },
        context: {
          type: 'string',
          description: 'Why you need this intel (e.g., "Renewal prep", "Escalation context")',
        },
        urgency: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          description: 'How urgent is this request',
        },
      },
      required: ['target_user_id', 'contact_entity_id'],
    },
  },
  {
    name: 'list_team_intel_requests',
    description: 'List intel requests sent TO you from teammates.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'fulfilled', 'declined', 'all'],
          description: 'Filter by request status',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of requests to return',
        },
      },
    },
  },
  {
    name: 'fulfill_team_intel_request',
    description:
      'Respond to a teammate\'s intel request. ' +
      'Content goes directly to requester (1:1, no sanitization by default).',
    inputSchema: {
      type: 'object',
      properties: {
        request_id: {
          type: 'string',
          description: 'UUID of the intel request to fulfill',
        },
        content: {
          type: 'string',
          description: 'Your intel about the customer/contact',
        },
        also_save_as_opinion: {
          type: 'boolean',
          description: 'Also save this as a relationship_context opinion for future reference',
        },
        opinion_type: {
          type: 'string',
          enum: [
            'general',
            'work_style',
            'communication',
            'trust',
            'negotiation',
            'decision_making',
            'responsiveness',
            'relationship_history',
          ],
          description: 'Opinion type if saving as opinion (default: general)',
        },
      },
      required: ['request_id', 'content'],
    },
  },
  {
    name: 'decline_team_intel_request',
    description: 'Decline an intel request from a teammate.',
    inputSchema: {
      type: 'object',
      properties: {
        request_id: {
          type: 'string',
          description: 'UUID of the intel request to decline',
        },
        reason: {
          type: 'string',
          description: 'Optional reason for declining',
        },
      },
      required: ['request_id'],
    },
  },
  {
    name: 'my_team_intel_requests',
    description: 'List intel requests YOU have sent to teammates.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'fulfilled', 'declined', 'all'],
          description: 'Filter by request status',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of requests to return',
        },
      },
    },
  },
  {
    name: 'search_team_opinions',
    description:
      'Search opinions about customers within your team\'s layer. ' +
      'Finds what teammates have noted about a customer.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: {
          type: 'string',
          description: 'Filter to specific customer',
        },
        contact_name: {
          type: 'string',
          description: 'Search by customer name',
        },
        keywords: {
          type: 'string',
          description: 'Full-text search keywords',
        },
        layer: {
          type: 'string',
          description: 'Tenant layer to search (e.g., renubu:tenant-acme)',
        },
        opinion_type: {
          type: 'string',
          enum: [
            'general',
            'work_style',
            'communication',
            'trust',
            'negotiation',
            'decision_making',
            'responsiveness',
            'relationship_history',
          ],
        },
        limit: {
          type: 'number',
        },
      },
      required: ['layer'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleTeamIntelTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'request_team_intel':
      return handleRequestTeamIntel(ctx, args as unknown as RequestTeamIntelInput);

    case 'list_team_intel_requests':
      return handleListTeamIntelRequests(ctx, args as unknown as ListTeamIntelRequestsInput);

    case 'fulfill_team_intel_request':
      return handleFulfillTeamIntelRequest(ctx, args as unknown as FulfillTeamIntelRequestInput);

    case 'decline_team_intel_request':
      return handleDeclineTeamIntelRequest(ctx, args as unknown as DeclineTeamIntelRequestInput);

    case 'my_team_intel_requests':
      return handleMyTeamIntelRequests(ctx, args as unknown as MyTeamIntelRequestsInput);

    case 'search_team_opinions':
      return handleSearchTeamOpinions(ctx, args as unknown as SearchTeamOpinionsInput);

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface RequestTeamIntelInput {
  target_user_id: string;
  target_user_name?: string;
  contact_entity_id: string;
  contact_name?: string;
  context?: string;
  urgency?: 'low' | 'normal' | 'high';
}

interface ListTeamIntelRequestsInput {
  status?: 'pending' | 'fulfilled' | 'declined' | 'all';
  limit?: number;
}

interface FulfillTeamIntelRequestInput {
  request_id: string;
  content: string;
  also_save_as_opinion?: boolean;
  opinion_type?: string;
}

interface DeclineTeamIntelRequestInput {
  request_id: string;
  reason?: string;
}

interface MyTeamIntelRequestsInput {
  status?: 'pending' | 'fulfilled' | 'declined' | 'all';
  limit?: number;
}

interface SearchTeamOpinionsInput {
  contact_entity_id?: string;
  contact_name?: string;
  keywords?: string;
  layer: string;
  opinion_type?: string;
  limit?: number;
}

interface IntelRequest {
  id: string;
  requester_id: string;
  requester_name?: string;
  contact_entity_id: string;
  contact_name?: string;
  context?: string;
  urgency: string;
  status: string;
  created_at: string;
  expires_at: string;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Request intel from a teammate
 */
async function handleRequestTeamIntel(
  ctx: ToolContext,
  input: RequestTeamIntelInput
): Promise<{ success: boolean; request_id: string; message: string }> {
  const supabase = ctx.getClient();

  // Get contact name if not provided
  let contactName = input.contact_name;
  if (!contactName && input.contact_entity_id) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', input.contact_entity_id)
      .single();
    contactName = entity?.name;
  }

  // Get requester name
  const { data: requester } = await supabase
    .from('human_os.users')
    .select('full_name')
    .eq('id', ctx.ownerId)
    .single();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from('intel_requests')
    .insert({
      requester_id: ctx.ownerId,
      requester_name: requester?.full_name,
      target_user_id: input.target_user_id,
      contact_entity_id: input.contact_entity_id,
      contact_name: contactName,
      context: input.context,
      urgency: input.urgency || 'normal',
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create intel request: ${error.message}`);
  }

  return {
    success: true,
    request_id: data.id,
    message: `Intel request sent to ${input.target_user_name || 'teammate'} about ${contactName || 'contact'}`,
  };
}

/**
 * List intel requests sent TO the current user
 */
async function handleListTeamIntelRequests(
  ctx: ToolContext,
  input: ListTeamIntelRequestsInput
): Promise<{ requests: IntelRequest[]; count: number }> {
  const supabase = ctx.getClient();

  let query = supabase
    .from('intel_requests')
    .select('*', { count: 'exact' })
    .eq('target_user_id', ctx.ownerId)
    .order('created_at', { ascending: false });

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status);
  }

  if (input.limit) {
    query = query.limit(input.limit);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list intel requests: ${error.message}`);
  }

  return {
    requests: data || [],
    count: count || 0,
  };
}

/**
 * Fulfill an intel request from a teammate
 * Default is 1:1 (no sanitization, no community publish)
 */
async function handleFulfillTeamIntelRequest(
  ctx: ToolContext,
  input: FulfillTeamIntelRequestInput
): Promise<{ success: boolean; request_id: string; saved_opinion?: boolean; message: string }> {
  const supabase = ctx.getClient();

  // Get the request
  const { data: request, error: requestError } = await supabase
    .from('intel_requests')
    .select('*')
    .eq('id', input.request_id)
    .eq('target_user_id', ctx.ownerId)
    .single();

  if (requestError || !request) {
    throw new Error('Intel request not found or you are not the target');
  }

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}`);
  }

  let savedOpinionId: string | undefined;

  // Optionally save as a relationship_context opinion
  if (input.also_save_as_opinion) {
    const layer = ctx.tenantId ? `renubu:tenant-${ctx.tenantId}` : `founder:${ctx.ownerId}`;

    const { data: opinion, error: opinionError } = await supabase
      .from('relationship_context')
      .upsert({
        owner_id: ctx.ownerId,
        contact_entity_id: request.contact_entity_id,
        opinion_type: input.opinion_type || 'general',
        content: input.content,
        layer,
        source_system: 'renubu',
        source_context: `Intel request from ${request.requester_name || request.requester_id}`,
        visibility: 'private',  // Team intel stays private by default
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'owner_id,contact_entity_id,opinion_type',
      })
      .select('id')
      .single();

    if (!opinionError && opinion) {
      savedOpinionId = opinion.id;
    }
  }

  // Update the request as fulfilled
  const { error: updateError } = await supabase
    .from('intel_requests')
    .update({
      status: 'fulfilled',
      fulfilled_note_id: savedOpinionId || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', input.request_id);

  if (updateError) {
    throw new Error(`Failed to update request status: ${updateError.message}`);
  }

  return {
    success: true,
    request_id: input.request_id,
    saved_opinion: !!savedOpinionId,
    message: `Intel shared with ${request.requester_name || 'requester'}${savedOpinionId ? ' and saved as opinion' : ''}`,
  };
}

/**
 * Decline an intel request
 */
async function handleDeclineTeamIntelRequest(
  ctx: ToolContext,
  input: DeclineTeamIntelRequestInput
): Promise<{ success: boolean; request_id: string }> {
  const supabase = ctx.getClient();

  const { error } = await supabase
    .from('intel_requests')
    .update({
      status: 'declined',
      decline_reason: input.reason,
      responded_at: new Date().toISOString(),
    })
    .eq('id', input.request_id)
    .eq('target_user_id', ctx.ownerId);

  if (error) {
    throw new Error(`Failed to decline request: ${error.message}`);
  }

  return {
    success: true,
    request_id: input.request_id,
  };
}

/**
 * List intel requests sent BY the current user
 */
async function handleMyTeamIntelRequests(
  ctx: ToolContext,
  input: MyTeamIntelRequestsInput
): Promise<{ requests: any[]; count: number }> {
  const supabase = ctx.getClient();

  let query = supabase
    .from('intel_requests')
    .select(
      `
      id,
      target_user_id,
      contact_entity_id,
      contact_name,
      context,
      urgency,
      status,
      decline_reason,
      created_at,
      responded_at,
      expires_at
    `,
      { count: 'exact' }
    )
    .eq('requester_id', ctx.ownerId)
    .order('created_at', { ascending: false });

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status);
  }

  if (input.limit) {
    query = query.limit(input.limit);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list your intel requests: ${error.message}`);
  }

  return {
    requests: data || [],
    count: count || 0,
  };
}

/**
 * Search team opinions about customers
 */
async function handleSearchTeamOpinions(
  ctx: ToolContext,
  input: SearchTeamOpinionsInput
): Promise<{ results: any[]; count: number }> {
  const supabase = ctx.getClient();

  // If contact_name provided but not entity_id, try to find the entity
  let contactEntityId = input.contact_entity_id;
  if (!contactEntityId && input.contact_name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('id')
      .eq('entity_type', 'person')
      .ilike('name', `%${input.contact_name}%`)
      .limit(1)
      .single();
    contactEntityId = entity?.id;
  }

  let query = supabase
    .from('relationship_context')
    .select(
      `
      id,
      owner_id,
      contact_entity_id,
      opinion_type,
      content,
      sentiment,
      confidence,
      source_context,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    )
    .eq('layer', input.layer)
    .order('updated_at', { ascending: false });

  if (contactEntityId) {
    query = query.eq('contact_entity_id', contactEntityId);
  }

  if (input.opinion_type) {
    query = query.eq('opinion_type', input.opinion_type);
  }

  if (input.keywords) {
    query = query.ilike('content', `%${input.keywords}%`);
  }

  if (input.limit) {
    query = query.limit(input.limit);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to search team opinions: ${error.message}`);
  }

  return {
    results: data || [],
    count: count || 0,
  };
}
