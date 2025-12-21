/**
 * Community Intel Tools
 *
 * Tools for the "write once, share smart" relationship intelligence system.
 * Enables private notes, AI-powered sanitization, and community sharing.
 *
 * Key tools:
 * - sanitize_note: Transform raw notes into PG-rated community intel
 * - publish_note: Publish sanitized notes to the community
 * - request_note: Request intel from other users
 * - query_community_intel: Search published notes across the network
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const communityIntelTools: Tool[] = [
  {
    name: 'sanitize_note',
    description:
      'Transform a raw note into a PG-rated, professional version suitable for community sharing. ' +
      'Removes profanity, PII, emotional language, and sensitive details while preserving actionable intel. ' +
      'Returns a draft for user approval before publishing.',
    inputSchema: {
      type: 'object',
      properties: {
        raw_content: {
          type: 'string',
          description: 'The original, unfiltered note content',
        },
        contact_name: {
          type: 'string',
          description: 'Name of the person this note is about (for context)',
        },
        contact_entity_id: {
          type: 'string',
          description: 'Entity ID of the contact (for linking)',
        },
      },
      required: ['raw_content'],
    },
  },
  {
    name: 'publish_note',
    description:
      'Publish a sanitized note to the community. Use after reviewing the output from sanitize_note. ' +
      'The note will be visible to other Founder OS members unless marked private.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: {
          type: 'string',
          description: 'UUID of the entity this note is about',
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
          description: 'Category of the note',
        },
        private_content: {
          type: 'string',
          description: 'The raw, private version of the note (only visible to you)',
        },
        community_content: {
          type: 'string',
          description: 'The sanitized, community-visible version',
        },
        visibility: {
          type: 'string',
          enum: ['private', 'community', 'public'],
          description: 'Who can see this note: private (you), community (Founder OS), public (all)',
        },
        publish_anonymously: {
          type: 'boolean',
          description: 'If true, your name will not be shown on community queries',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative', 'mixed'],
          description: 'Overall sentiment of the note',
        },
        existing_note_id: {
          type: 'string',
          description: 'If updating an existing note, provide its UUID',
        },
      },
      required: ['contact_entity_id', 'opinion_type', 'community_content', 'visibility'],
    },
  },
  {
    name: 'request_note',
    description:
      'Request intel about a contact from another Founder OS user. ' +
      'Example: "Ask Scott if he knows anything about ABC Corp"',
    inputSchema: {
      type: 'object',
      properties: {
        target_user_id: {
          type: 'string',
          description: 'UUID of the user to ask',
        },
        target_user_name: {
          type: 'string',
          description: 'Name of the user (for display purposes)',
        },
        contact_entity_id: {
          type: 'string',
          description: 'UUID of the contact/entity you want intel on',
        },
        contact_name: {
          type: 'string',
          description: 'Name of the contact (for display purposes)',
        },
        context: {
          type: 'string',
          description: 'Why you need this intel (e.g., "Prepping for sales call")',
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
    name: 'list_intel_requests',
    description: 'List intel requests sent TO you from other users. Shows pending requests you can fulfill.',
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
    name: 'fulfill_intel_request',
    description:
      'Respond to an intel request with a note about the contact. ' +
      'By default, the response goes directly to the requester (1:1, no sanitization). ' +
      'Set publish_to_community=true to also share with the broader network.',
    inputSchema: {
      type: 'object',
      properties: {
        request_id: {
          type: 'string',
          description: 'UUID of the intel request to fulfill',
        },
        content: {
          type: 'string',
          description: 'Your intel/note about the contact',
        },
        publish_to_community: {
          type: 'boolean',
          description: 'Also publish this note to the community (will trigger sanitization). Default: false',
        },
        auto_sanitize: {
          type: 'boolean',
          description: 'Run through sanitization (only applies if publish_to_community=true). Default: false',
        },
        publish_anonymously: {
          type: 'boolean',
          description: 'Hide your identity if publishing to community',
        },
      },
      required: ['request_id', 'content'],
    },
  },
  {
    name: 'decline_intel_request',
    description: 'Decline an intel request if you cannot or prefer not to provide intel.',
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
    name: 'query_community_intel',
    description:
      'Search published notes across the Founder OS community. ' +
      'Use before meetings, negotiations, or outreach to see what others know.',
    inputSchema: {
      type: 'object',
      properties: {
        contact_entity_id: {
          type: 'string',
          description: 'Filter to notes about a specific person/entity',
        },
        contact_name: {
          type: 'string',
          description: 'Search by contact name (if entity ID unknown)',
        },
        company_name: {
          type: 'string',
          description: 'Filter by company name',
        },
        keywords: {
          type: 'string',
          description: 'Full-text search keywords',
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
          description: 'Filter by note category',
        },
        include_anonymous: {
          type: 'boolean',
          description: 'Include anonymous notes in results (default: true)',
        },
        aggregate_mode: {
          type: 'boolean',
          description: 'Return aggregated summary instead of individual notes (like a 360 review)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
        },
      },
    },
  },
  {
    name: 'my_intel_requests',
    description: 'List intel requests YOU have sent to others. Track pending, fulfilled, or declined requests.',
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
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle community intel tool calls
 * Returns result if handled, null if not a community intel tool
 */
export async function handleCommunityIntelTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'sanitize_note':
      return handleSanitizeNote(ctx, args as unknown as SanitizeNoteInput);

    case 'publish_note':
      return handlePublishNote(ctx, args as unknown as PublishNoteInput);

    case 'request_note':
      return handleRequestNote(ctx, args as unknown as RequestNoteInput);

    case 'list_intel_requests':
      return handleListIntelRequests(ctx, args as unknown as ListIntelRequestsInput);

    case 'fulfill_intel_request':
      return handleFulfillIntelRequest(ctx, args as unknown as FulfillIntelRequestInput);

    case 'decline_intel_request':
      return handleDeclineIntelRequest(ctx, args as unknown as DeclineIntelRequestInput);

    case 'query_community_intel':
      return handleQueryCommunityIntel(ctx, args as unknown as QueryCommunityIntelInput);

    case 'my_intel_requests':
      return handleMyIntelRequests(ctx, args as unknown as MyIntelRequestsInput);

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface SanitizeNoteInput {
  raw_content: string;
  contact_name?: string;
  contact_entity_id?: string;
}

interface SanitizeNoteResult {
  action: 'sanitize_draft';
  instructions: string;
  raw_content: string;
  contact_name?: string;
  contact_entity_id?: string;
  user_prompt: string;
}

interface PublishNoteInput {
  contact_entity_id: string;
  opinion_type: string;
  private_content?: string;
  community_content: string;
  visibility: 'private' | 'community' | 'public';
  publish_anonymously?: boolean;
  sentiment?: string;
  existing_note_id?: string;
}

interface PublishNoteResult {
  success: boolean;
  id: string;
  visibility: string;
  action: 'created' | 'updated';
}

interface RequestNoteInput {
  target_user_id: string;
  target_user_name?: string;
  contact_entity_id: string;
  contact_name?: string;
  context?: string;
  urgency?: 'low' | 'normal' | 'high';
}

interface RequestNoteResult {
  success: boolean;
  request_id: string;
  target_user_name?: string;
  contact_name?: string;
  expires_at: string;
}

interface ListIntelRequestsInput {
  status?: 'pending' | 'fulfilled' | 'declined' | 'all';
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

interface FulfillIntelRequestInput {
  request_id: string;
  content: string;
  publish_to_community?: boolean;
  auto_sanitize?: boolean;
  publish_anonymously?: boolean;
}

interface DeclineIntelRequestInput {
  request_id: string;
  reason?: string;
}

interface QueryCommunityIntelInput {
  contact_entity_id?: string;
  contact_name?: string;
  company_name?: string;
  keywords?: string;
  opinion_type?: string;
  include_anonymous?: boolean;
  aggregate_mode?: boolean;
  limit?: number;
}

interface CommunityIntelResult {
  id: string;
  contact_entity_id: string;
  contact_name?: string;
  opinion_type: string;
  community_content: string;
  sentiment?: string;
  author_id?: string;
  author_name?: string;
  published_at: string;
  is_anonymous: boolean;
}

interface MyIntelRequestsInput {
  status?: 'pending' | 'fulfilled' | 'declined' | 'all';
  limit?: number;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

/**
 * Load the sanitization prompt from the prompts layer
 */
async function loadSanitizationPrompt(ctx: ToolContext): Promise<string> {
  try {
    // Try to load from context engine (prompts:system layer)
    const promptContext = await ctx.contextEngine.getContext('prompts:system' as any, 'prompts/system', 'sanitize-note');
    if (promptContext?.content) {
      return promptContext.content;
    }
  } catch {
    // Fall back to embedded prompt
  }

  // Fallback prompt if file not found
  return `
You are a note sanitizer for a professional network. Transform raw notes into clean, actionable intel.

Rules:
1. Remove ALL profanity and vulgar language
2. Remove ALL personally identifiable information (emails, phone numbers, addresses)
3. Remove emotional language - replace with neutral observations
4. Remove company-internal details that shouldn't be public
5. Keep actionable insights about communication style, decision-making, preferences
6. Make it professional and PG-rated
7. Preserve factual observations about behavior patterns

Output format:
<sanitized>
[The cleaned-up, professional version - 1-3 sentences max]
</sanitized>

<changes>
- [List each category of change made]
</changes>

<warnings>
- [Any remaining concerns the user should review before publishing]
</warnings>
  `.trim();
}

/**
 * Handle sanitize_note tool
 *
 * Returns the sanitization prompt and instructions for Claude to perform the transformation.
 * The actual sanitization is done by the LLM processing this tool's response.
 */
async function handleSanitizeNote(ctx: ToolContext, input: SanitizeNoteInput): Promise<SanitizeNoteResult> {
  const instructions = await loadSanitizationPrompt(ctx);

  return {
    action: 'sanitize_draft',
    instructions,
    raw_content: input.raw_content,
    contact_name: input.contact_name,
    contact_entity_id: input.contact_entity_id,
    user_prompt:
      'Please sanitize this note according to the instructions. ' +
      'Return the sanitized version, list of changes made, and any warnings. ' +
      'Then ask the user to approve before publishing.',
  };
}

/**
 * Handle publish_note tool
 *
 * Writes/updates a relationship_context entry with both private and community content.
 */
async function handlePublishNote(ctx: ToolContext, input: PublishNoteInput): Promise<PublishNoteResult> {
  const supabase = ctx.getClient();

  const now = new Date().toISOString();
  const isPublishing = input.visibility !== 'private';

  const noteData = {
    owner_id: ctx.userId,
    contact_entity_id: input.contact_entity_id,
    opinion_type: input.opinion_type,
    content: input.private_content || input.community_content,
    community_content: isPublishing ? input.community_content : null,
    visibility: input.visibility,
    published_at: isPublishing ? now : null,
    published_anonymously: input.publish_anonymously || false,
    sanitized_by: isPublishing ? 'ai' : null,
    sentiment: input.sentiment || null,
    layer: ctx.layer,
    source_system: 'founder-os',
    updated_at: now,
  };

  let result;
  let action: 'created' | 'updated';

  if (input.existing_note_id) {
    // Update existing note
    const { data, error } = await supabase
      .from('relationship_context')
      .update(noteData)
      .eq('id', input.existing_note_id)
      .eq('owner_id', ctx.userId)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to update note: ${error.message}`);
    }
    result = data;
    action = 'updated';
  } else {
    // Create new note (upsert on owner + contact + opinion_type)
    const { data, error } = await supabase
      .from('relationship_context')
      .upsert(noteData, {
        onConflict: 'owner_id,contact_entity_id,opinion_type',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to publish note: ${error.message}`);
    }
    result = data;

    // Check if it was created or updated
    const { data: checkData } = await supabase
      .from('relationship_context')
      .select('created_at, updated_at')
      .eq('id', result.id)
      .single();

    action = checkData?.created_at === checkData?.updated_at ? 'created' : 'updated';
  }

  return {
    success: true,
    id: result.id,
    visibility: input.visibility,
    action,
  };
}

/**
 * Handle request_note tool
 *
 * Creates an intel request for another user to provide info about a contact.
 */
async function handleRequestNote(ctx: ToolContext, input: RequestNoteInput): Promise<RequestNoteResult> {
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
    .eq('id', ctx.userId)
    .single();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

  const { data, error } = await supabase
    .from('intel_requests')
    .insert({
      requester_id: ctx.userId,
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
    target_user_name: input.target_user_name,
    contact_name: contactName,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Handle list_intel_requests tool
 *
 * Lists requests sent TO the current user.
 */
async function handleListIntelRequests(
  ctx: ToolContext,
  input: ListIntelRequestsInput
): Promise<{ requests: IntelRequest[]; count: number }> {
  const supabase = ctx.getClient();

  let query = supabase
    .from('intel_requests')
    .select('*', { count: 'exact' })
    .eq('target_user_id', ctx.userId)
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
 * Handle fulfill_intel_request tool
 *
 * Respond to an intel request with a note.
 * Default is 1:1 (private to requester only, no sanitization).
 * If publish_to_community=true, the note is also published to the network.
 */
async function handleFulfillIntelRequest(
  ctx: ToolContext,
  input: FulfillIntelRequestInput
): Promise<{ success: boolean; note_id?: string; request_id: string; visibility: string; message: string }> {
  const supabase = ctx.getClient();

  // Get the request
  const { data: request, error: requestError } = await supabase
    .from('intel_requests')
    .select('*')
    .eq('id', input.request_id)
    .eq('target_user_id', ctx.userId)
    .single();

  if (requestError || !request) {
    throw new Error('Intel request not found or you are not the target');
  }

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}`);
  }

  // Determine visibility based on publish_to_community flag
  const visibility = input.publish_to_community ? 'community' : 'private';

  // If publishing to community AND auto_sanitize requested, trigger sanitization flow
  if (input.publish_to_community && input.auto_sanitize) {
    const sanitizeResult = await handleSanitizeNote(ctx, {
      raw_content: input.content,
      contact_entity_id: request.contact_entity_id,
      contact_name: request.contact_name,
    });

    return {
      success: false,
      request_id: input.request_id,
      visibility,
      message: 'Sanitization required before community publishing. Review the draft below.',
      ...sanitizeResult,
    } as any;
  }

  // Create the note (private by default, community if publish_to_community=true)
  const noteResult = await handlePublishNote(ctx, {
    contact_entity_id: request.contact_entity_id,
    opinion_type: 'general',
    private_content: input.content,
    community_content: input.publish_to_community ? input.content : '',
    visibility,
    publish_anonymously: input.publish_anonymously,
  });

  // Update the request with the fulfilled note
  const { error: updateError } = await supabase
    .from('intel_requests')
    .update({
      status: 'fulfilled',
      fulfilled_note_id: noteResult.id,
      responded_at: new Date().toISOString(),
    })
    .eq('id', input.request_id);

  if (updateError) {
    throw new Error(`Failed to update request status: ${updateError.message}`);
  }

  const message = input.publish_to_community
    ? 'Intel shared with requester and published to community.'
    : 'Intel shared directly with requester (1:1, not published to community).';

  return {
    success: true,
    note_id: noteResult.id,
    request_id: input.request_id,
    visibility,
    message,
  };
}

/**
 * Handle decline_intel_request tool
 */
async function handleDeclineIntelRequest(
  ctx: ToolContext,
  input: DeclineIntelRequestInput
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
    .eq('target_user_id', ctx.userId);

  if (error) {
    throw new Error(`Failed to decline request: ${error.message}`);
  }

  return {
    success: true,
    request_id: input.request_id,
  };
}

/**
 * Handle query_community_intel tool
 *
 * Search published notes across the community.
 */
async function handleQueryCommunityIntel(
  ctx: ToolContext,
  input: QueryCommunityIntelInput
): Promise<{ results: CommunityIntelResult[]; count: number; aggregate?: any }> {
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

  // Use the RPC function for community search
  const { data, error } = await supabase.rpc('search_community_intel', {
    p_query: input.keywords || null,
    p_contact_entity_id: contactEntityId || null,
    p_company_name: input.company_name || null,
    p_opinion_type: input.opinion_type || null,
    p_include_anonymous: input.include_anonymous !== false,
    p_limit: input.limit || 20,
  });

  if (error) {
    throw new Error(`Failed to query community intel: ${error.message}`);
  }

  const results: CommunityIntelResult[] = (data || []).map((r: any) => ({
    id: r.id,
    contact_entity_id: r.contact_entity_id,
    contact_name: r.contact_name,
    opinion_type: r.opinion_type,
    community_content: r.community_content,
    sentiment: r.sentiment,
    author_id: r.author_id,
    author_name: r.author_name,
    published_at: r.published_at,
    is_anonymous: r.is_anonymous,
  }));

  // If aggregate mode, summarize the results
  if (input.aggregate_mode && results.length > 0) {
    const aggregate = {
      total_notes: results.length,
      opinion_types: [...new Set(results.map(r => r.opinion_type))],
      sentiment_summary: results.reduce(
        (acc, r) => {
          if (r.sentiment) acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      contributors: results.filter(r => !r.is_anonymous).length,
      anonymous_count: results.filter(r => r.is_anonymous).length,
    };

    return { results, count: results.length, aggregate };
  }

  return { results, count: results.length };
}

/**
 * Handle my_intel_requests tool
 *
 * Lists requests sent BY the current user.
 */
async function handleMyIntelRequests(
  ctx: ToolContext,
  input: MyIntelRequestsInput
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
    .eq('requester_id', ctx.userId)
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
