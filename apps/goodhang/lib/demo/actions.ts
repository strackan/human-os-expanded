/**
 * Good Hang Network Actions
 *
 * Tool actions that can be taken on search results:
 * - draft_intro: Generate intro request message
 * - schedule_meeting: Suggest meeting based on context
 * - save_to_list: Save person to a named list
 * - request_intro: Send intro request through network
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// TYPES
// =============================================================================

export interface ActionContext {
  userId: string;
  userName: string;
  userCompany?: string;
  searchQuery?: string;
  searchMode?: string;
}

export interface DraftIntroRequest {
  targetId: string;
  targetName: string;
  targetTitle?: string;
  targetCompany?: string;
  introducerName: string;
  context?: string;
}

export interface DraftIntroResponse {
  message: string;
  subject?: string;
  targetName: string;
  introducerName: string;
}

export interface ScheduleMeetingRequest {
  targetId: string;
  targetName: string;
  sharedInterests?: string[];
  suggestedActivity?: string;
}

export interface ScheduleMeetingResponse {
  suggestion: string;
  activity: string;
  timeframe: string;
  message: string;
}

export interface SaveToListRequest {
  entityId: string;
  name: string;
  listName: string;
  notes?: string;
}

export interface SaveToListResponse {
  listId: string;
  listName: string;
  itemCount: number;
}

export interface RequestIntroRequest {
  targetId: string;
  targetName: string;
  reason: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface RequestIntroResponse {
  requestId: string;
  status: 'sent' | 'pending' | 'failed';
  potentialIntroducers: string[];
}

// =============================================================================
// ACTION ENGINE
// =============================================================================

export class ActionEngine {
  private supabase: SupabaseClient;
  private anthropic: Anthropic;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    anthropicKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
  }

  // ---------------------------------------------------------------------------
  // DRAFT INTRO
  // ---------------------------------------------------------------------------

  async draftIntro(
    request: DraftIntroRequest,
    context: ActionContext
  ): Promise<DraftIntroResponse> {
    const prompt = `Generate a brief, warm introduction request message.

Situation:
- ${context.userName} (${context.userCompany || 'independent'}) wants an intro to ${request.targetName}
- ${request.targetName} is a ${request.targetTitle || 'professional'} at ${request.targetCompany || 'their company'}
- The mutual connection is ${request.introducerName}
${request.context ? `- Context: ${request.context}` : ''}
${context.searchQuery ? `- Original search: "${context.searchQuery}"` : ''}

Write a casual, professional message (2-3 sentences) that ${context.userName} would send to ${request.introducerName} asking for an intro. Don't be overly formal. Be specific about why they want to connect.

Just output the message text, nothing else.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : `Hey ${request.introducerName}, would you be open to introducing me to ${request.targetName}? Would love to connect about potential collaboration.`;

    return {
      message,
      subject: `Intro request: ${request.targetName}`,
      targetName: request.targetName,
      introducerName: request.introducerName,
    };
  }

  // ---------------------------------------------------------------------------
  // SCHEDULE MEETING
  // ---------------------------------------------------------------------------

  async scheduleMeeting(
    request: ScheduleMeetingRequest,
    context: ActionContext
  ): Promise<ScheduleMeetingResponse> {
    const prompt = `Suggest a casual hangout for two professionals who want to connect.

Context:
- ${context.userName} wants to meet ${request.targetName}
${request.sharedInterests?.length ? `- Shared interests: ${request.sharedInterests.join(', ')}` : ''}
${request.suggestedActivity ? `- Suggested activity: ${request.suggestedActivity}` : ''}

Provide a JSON response:
{
  "suggestion": "Brief description of the suggested hangout",
  "activity": "coffee | drinks | meal | outdoor | event | virtual",
  "timeframe": "this week | next week | flexible",
  "message": "A brief, casual message to send suggesting this hangout (2-3 sentences)"
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestion: parsed.suggestion || 'Grab coffee and chat',
          activity: parsed.activity || 'coffee',
          timeframe: parsed.timeframe || 'flexible',
          message: parsed.message || `Hey ${request.targetName}, would love to grab coffee sometime and connect!`,
        };
      } catch {
        // Fall through to default
      }
    }

    return {
      suggestion: 'Grab coffee and chat about shared interests',
      activity: 'coffee',
      timeframe: 'next week',
      message: `Hey ${request.targetName}, I came across your profile and think we'd have a lot to talk about. Would you be up for grabbing coffee sometime?`,
    };
  }

  // ---------------------------------------------------------------------------
  // SAVE TO LIST
  // ---------------------------------------------------------------------------

  async saveToList(
    request: SaveToListRequest,
    context: ActionContext
  ): Promise<SaveToListResponse> {
    // Get or create list
    const { data: existingList } = await this.supabase
      .from('user_preferences')
      .select('id, value')
      .eq('user_id', context.userId)
      .eq('key', `list:${request.listName}`)
      .single();

    let listId: string;
    let items: Array<{ entityId: string; name: string; notes?: string; addedAt: string }>;

    if (existingList) {
      listId = existingList.id;
      items = (existingList.value as { items: typeof items })?.items || [];
    } else {
      // Create new list
      const { data: newList, error } = await this.supabase
        .from('user_preferences')
        .insert({
          user_id: context.userId,
          key: `list:${request.listName}`,
          value: { items: [] },
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create list: ${error.message}`);
      listId = newList.id;
      items = [];
    }

    // Add item if not already present
    if (!items.find(i => i.entityId === request.entityId)) {
      items.push({
        entityId: request.entityId,
        name: request.name,
        ...(request.notes ? { notes: request.notes } : {}),
        addedAt: new Date().toISOString(),
      });

      await this.supabase
        .from('user_preferences')
        .update({ value: { items } })
        .eq('id', listId);
    }

    return {
      listId,
      listName: request.listName,
      itemCount: items.length,
    };
  }

  // ---------------------------------------------------------------------------
  // REQUEST INTRO
  // ---------------------------------------------------------------------------

  async requestIntro(
    request: RequestIntroRequest,
    context: ActionContext
  ): Promise<RequestIntroResponse> {
    // Find potential introducers (people connected to both user and target)
    const { data: userConnections } = await this.supabase
      .from('entity_links')
      .select('source_entity_id, target_entity_id')
      .or(`source_entity_id.eq.${context.userId},target_entity_id.eq.${context.userId}`);

    const { data: targetConnections } = await this.supabase
      .from('entity_links')
      .select('source_entity_id, target_entity_id')
      .or(`source_entity_id.eq.${request.targetId},target_entity_id.eq.${request.targetId}`);

    const userConnectionIds = new Set(
      (userConnections || []).flatMap(c => [c.source_entity_id, c.target_entity_id])
    );
    const targetConnectionIds = new Set(
      (targetConnections || []).flatMap(c => [c.source_entity_id, c.target_entity_id])
    );

    const mutualIds = [...userConnectionIds].filter(id =>
      targetConnectionIds.has(id) && id !== context.userId && id !== request.targetId
    );

    // Get names of potential introducers
    let introducerNames: string[] = [];
    if (mutualIds.length > 0) {
      const { data: introducers } = await this.supabase
        .schema('global')
        .from('entities')
        .select('name')
        .in('id', mutualIds.slice(0, 3));

      introducerNames = (introducers || []).map(i => i.name);
    }

    // Log the intro request (would be stored in activities table)
    const requestId = crypto.randomUUID();

    try {
      await this.supabase
        .schema('gft')
        .from('activities')
        .insert({
          id: requestId,
          owner_id: context.userId,
          contact_id: request.targetId,
          activity_type: 'intro_request',
          notes: JSON.stringify({
            reason: request.reason,
            urgency: request.urgency,
            potentialIntroducers: introducerNames,
          }),
          result: 'pending',
        });
    } catch {
      // GFT schema might not exist or structure different
    }

    return {
      requestId,
      status: introducerNames.length > 0 ? 'sent' : 'pending',
      potentialIntroducers: introducerNames,
    };
  }

  // ---------------------------------------------------------------------------
  // GET USER LISTS
  // ---------------------------------------------------------------------------

  async getUserLists(userId: string): Promise<Array<{ name: string; count: number }>> {
    const { data: prefs } = await this.supabase
      .from('user_preferences')
      .select('key, value')
      .eq('user_id', userId)
      .like('key', 'list:%');

    return (prefs || []).map(p => ({
      name: p.key.replace('list:', ''),
      count: (p.value as { items: unknown[] })?.items?.length || 0,
    }));
  }

  // ---------------------------------------------------------------------------
  // GET LIST ITEMS
  // ---------------------------------------------------------------------------

  async getListItems(
    userId: string,
    listName: string
  ): Promise<Array<{ entityId: string; name: string; notes?: string; addedAt: string }>> {
    const { data: pref } = await this.supabase
      .from('user_preferences')
      .select('value')
      .eq('user_id', userId)
      .eq('key', `list:${listName}`)
      .single();

    return (pref?.value as { items: Array<{ entityId: string; name: string; notes?: string; addedAt: string }> })?.items || [];
  }
}

// =============================================================================
// EXPORT FACTORY
// =============================================================================

export function createActionEngine(
  supabaseUrl: string,
  supabaseKey: string,
  anthropicKey: string
): ActionEngine {
  return new ActionEngine(supabaseUrl, supabaseKey, anthropicKey);
}
