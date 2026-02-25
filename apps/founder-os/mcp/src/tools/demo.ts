/**
 * Demo Tools for 12/18 Scott Presentation
 *
 * Calendar tools (simulated) and cross-forest messaging (real DB storage)
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { buildFounderLayer, DB_SCHEMAS } from '@human-os/core';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Map userId to display name for messaging */
const KNOWN_USERS: Record<string, string> = {
  'justin-strackany': 'Justin Strackany',
  'scott-leese': 'Scott Leese',
};

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const demoTools: Tool[] = [
  {
    name: 'show_meetings',
    description: 'Show meetings for today or a specific date. Use when user asks about their calendar or schedule.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today.',
        },
      },
      required: [],
    },
  },
  {
    name: 'schedule_time',
    description: 'Schedule a time block for a task. Finds an available slot and creates a calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'What to schedule (e.g., "invoicing", "deep work")' },
        duration_minutes: {
          type: 'number',
          description: 'How long in minutes. Defaults to 30.',
          default: 30,
        },
        target_date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to tomorrow.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'lookup_contacts',
    description: `Search contacts by name, location, tier, or labels. Use this to find contacts before messaging.
Returns matches with delivery method info (can_message via Founder OS, can_email via email).
If multiple matches found, present options to user for disambiguation.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Name to search (partial match supported)',
        },
        location: {
          type: 'string',
          description: 'Location/region filter (e.g., "DC", "Research Triangle", "SF")',
        },
        tier: {
          type: 'string',
          enum: ['inner_5', 'key_50', 'network_500', 'outer'],
          description: 'Contact tier filter',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom labels to filter by',
        },
        limit: {
          type: 'number',
          description: 'Max results to return. Defaults to 10.',
        },
      },
      required: [],
    },
  },
  {
    name: 'ping_person',
    description: `Send a message to another person. Supports Founder OS forest messaging and email fallback.
If person_name matches multiple contacts, returns disambiguation options.
If contact is not on Founder OS but has email, suggests email fallback.`,
    inputSchema: {
      type: 'object',
      properties: {
        person_name: {
          type: 'string',
          description: 'Name of the person (e.g., "Scott", "Scott Leese")',
        },
        contact_id: {
          type: 'string',
          description: 'Contact UUID from lookup_contacts (use this after disambiguation)',
        },
        message: {
          type: 'string',
          description: 'The message content to send',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'send_group_message',
    description: `Send a message to multiple contacts at once. Filter by location, tier, or labels.
Splits recipients into Founder OS (direct) vs email-only delivery.
Returns summary of who received messages and who needs email follow-up.`,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message content to send to all recipients',
        },
        location: {
          type: 'string',
          description: 'Send to everyone in this location (e.g., "DC", "Research Triangle")',
        },
        tier: {
          type: 'string',
          enum: ['inner_5', 'key_50', 'network_500'],
          description: 'Send to all contacts in this tier',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Send to contacts with these labels',
        },
        contact_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific contact UUIDs to message',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'grab_messages',
    description: 'Check for pending messages from other Founder OS users. Call this at session start to see if anyone has messaged.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'reply_message',
    description: 'Reply to someone who messaged you. Use when user wants to respond to a message.',
    inputSchema: {
      type: 'object',
      properties: {
        to_name: {
          type: 'string',
          description: 'Name of the person to reply to',
        },
        message: {
          type: 'string',
          description: 'The reply message content',
        },
      },
      required: ['to_name', 'message'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle demo tool calls
 * Returns result if handled, null if not a demo tool
 */
export async function handleDemoTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'show_meetings': {
      const { date } = args as { date?: string };
      return showMeetings(date);
    }

    case 'schedule_time': {
      const { title, duration_minutes, target_date } = args as {
        title: string;
        duration_minutes?: number;
        target_date?: string;
      };
      return scheduleTime(title, duration_minutes ?? 30, target_date);
    }

    case 'lookup_contacts': {
      const { query, location, tier, labels, limit } = args as {
        query?: string;
        location?: string;
        tier?: string;
        labels?: string[];
        limit?: number;
      };
      return lookupContacts(ctx, { query, location, tier, labels, limit: limit ?? 10 });
    }

    case 'ping_person': {
      const { person_name, contact_id, message } = args as {
        person_name?: string;
        contact_id?: string;
        message: string;
      };
      return handlePingPerson(ctx, { person_name, contact_id, message });
    }

    case 'send_group_message': {
      const { message, location, tier, labels, contact_ids } = args as {
        message: string;
        location?: string;
        tier?: string;
        labels?: string[];
        contact_ids?: string[];
      };
      return sendGroupMessage(ctx, { message, location, tier, labels, contact_ids });
    }

    case 'grab_messages': {
      return grabMessages(ctx);
    }

    case 'reply_message': {
      const { to_name, message } = args as { to_name: string; message: string };
      const fromName = await getSenderName(ctx);
      return quickReply(ctx, fromName, to_name, message);
    }

    default:
      return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
  location?: string;
  notes?: string;
}

interface ScheduleResult {
  success: boolean;
  scheduled_time: string;
  title: string;
  message: string;
}

interface Message {
  id: string;
  from_forest: string;
  from_name: string;
  to_forest: string;
  to_name: string;
  subject?: string;
  content: string;
  status: 'pending' | 'delivered' | 'read' | 'replied';
  reply_to_id?: string;
  created_at: string;
  read_at?: string;
  replied_at?: string;
}

interface SendMessageResult {
  success: boolean;
  message_id: string;
  to: string;
  content: string;
  status: string;
}

/** Resolved contact from database lookup */
interface ResolvedContact {
  id: string;
  name: string;
  company: string | null;
  location: string | null;
  email: string | null;
  forest: string | null;
  can_message: boolean;
  can_email: boolean;
}

/** Contact lookup result */
interface ContactLookupResult {
  success: boolean;
  action_required?: 'disambiguation' | 'email_fallback' | 'no_delivery_method';
  message?: string;
  matches?: ResolvedContact[];
  contact?: ResolvedContact;
  next_step?: string;
}

/** Group message result */
interface GroupMessageResult {
  success: boolean;
  summary: string;
  details: {
    via_forest: number;
    via_email_needed: number;
    forest_recipients: string[];
    email_recipients: string[];
  };
  email_follow_up?: string;
  errors?: string[];
}

// =============================================================================
// SIMULATED CALENDAR
// =============================================================================

function getSimulatedMeetings(date: Date): Meeting[] {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  const baseMeetings: Meeting[] = [
    {
      id: 'mtg-001',
      title: 'Renubu Engineering Sync',
      start_time: `${dateStr}T09:00:00`,
      end_time: `${dateStr}T09:30:00`,
      attendees: ['Grace Chen', 'Dev Team'],
      location: 'Zoom',
    },
    {
      id: 'mtg-002',
      title: 'Customer Success Review',
      start_time: `${dateStr}T11:00:00`,
      end_time: `${dateStr}T12:00:00`,
      attendees: ['Lisa Martinez'],
      notes: 'Review expansion pipeline',
    },
    {
      id: 'mtg-003',
      title: 'Founder OS Demo Prep',
      start_time: `${dateStr}T14:00:00`,
      end_time: `${dateStr}T15:00:00`,
      notes: 'Prep for Scott meeting',
    },
  ];

  if (dayOfWeek === 3) {
    baseMeetings.push({
      id: 'mtg-004',
      title: 'Good Hang Planning',
      start_time: `${dateStr}T16:00:00`,
      end_time: `${dateStr}T16:30:00`,
      attendees: ['Marcus', 'Sarah'],
      location: 'Coffee shop',
    });
  }

  if (dayOfWeek === 4) {
    baseMeetings.push({
      id: 'mtg-005',
      title: 'Investor Update Call',
      start_time: `${dateStr}T10:00:00`,
      end_time: `${dateStr}T10:30:00`,
      location: 'Phone',
    });
  }

  return baseMeetings;
}

function findAvailableSlot(date: Date, durationMinutes: number): { start: string; end: string } {
  const meetings = getSimulatedMeetings(date);
  const dateStr = date.toISOString().split('T')[0];

  const preferredTimes = ['15:00', '13:00', '16:00', '10:00', '08:30'];

  for (const time of preferredTimes) {
    const slotStart = new Date(`${dateStr}T${time}:00`);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    const hasConflict = meetings.some(mtg => {
      const mtgStart = new Date(mtg.start_time);
      const mtgEnd = new Date(mtg.end_time);
      return slotStart < mtgEnd && slotEnd > mtgStart;
    });

    if (!hasConflict) {
      return {
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      };
    }
  }

  return {
    start: `${dateStr}T17:00:00`,
    end: `${dateStr}T17:${durationMinutes}:00`,
  };
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

async function showMeetings(date?: string): Promise<{ date: string; meetings: Meeting[]; summary: string }> {
  const targetDate = date ? new Date(date) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0] as string;

  const meetings = getSimulatedMeetings(targetDate);

  const meetingCount = meetings.length;
  const summary =
    meetingCount === 0
      ? `You have no meetings scheduled for ${dateStr}.`
      : `You have ${meetingCount} meeting${meetingCount > 1 ? 's' : ''} today: ${meetings.map(m => m.title).join(', ')}.`;

  return {
    date: dateStr,
    meetings,
    summary,
  };
}

async function scheduleTime(
  title: string,
  durationMinutes: number = 30,
  targetDate?: string
): Promise<ScheduleResult> {
  const date = targetDate ? new Date(targetDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const slot = findAvailableSlot(date, durationMinutes);
  const scheduledTime = new Date(slot.start);

  const timeStr = scheduledTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dayStr = scheduledTime.toLocaleDateString('en-US', { weekday: 'long' });

  return {
    success: true,
    scheduled_time: slot.start,
    title,
    message: `Scheduled "${title}" for ${timeStr} on ${dayStr}. Will that work?`,
  };
}

async function pingPerson(
  ctx: ToolContext,
  fromName: string,
  toForest: string,
  toName: string,
  content: string,
  subject?: string
): Promise<SendMessageResult> {
  const { data, error } = await ctx.getClient()
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('messages')
    .insert({
      from_forest: ctx.layer,
      from_name: fromName,
      to_forest: toForest,
      to_name: toName,
      subject: subject || null,
      content,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message_id: '',
      to: toName,
      content,
      status: `failed: ${error.message} (code: ${error.code})`,
    };
  }

  return {
    success: true,
    message_id: data.id,
    to: toName,
    content,
    status: 'pending',
  };
}

async function grabMessages(ctx: ToolContext): Promise<{ messages: Message[]; summary: string }> {
  const supabase = ctx.getClient();

  const { data, error } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('messages')
    .select('*')
    .eq('to_forest', ctx.layer)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return {
      messages: [],
      summary: `Failed to fetch messages: ${error.message} (code: ${error.code})`,
    };
  }

  const messages = data as Message[];

  if (messages.length > 0) {
    const messageIds = messages.map(m => m.id);
    await supabase.schema(DB_SCHEMAS.FOUNDER_OS).from('messages').update({ status: 'delivered' }).in('id', messageIds);
  }

  const summary =
    messages.length === 0
      ? 'No pending messages.'
      : `You have ${messages.length} message${messages.length > 1 ? 's' : ''} waiting: ${messages.map(m => `from ${m.from_name}`).join(', ')}.`;

  return { messages, summary };
}

async function quickReply(
  ctx: ToolContext,
  fromName: string,
  toName: string,
  content: string
): Promise<SendMessageResult> {
  const supabase = ctx.getClient();

  const { data: recentMessages, error: fetchError } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('messages')
    .select('*')
    .eq('from_name', toName)
    .eq('to_forest', ctx.layer)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError && fetchError.code !== '42P01') {
    throw new Error(`Failed to find conversation: ${fetchError.message}`);
  }

  const original = recentMessages?.[0];
  const toForest = original?.from_forest || buildFounderLayer(toName.toLowerCase().replace(' ', '-'));

  const { data: reply, error: insertError } = await supabase
    .schema(DB_SCHEMAS.FOUNDER_OS)
    .from('messages')
    .insert({
      from_forest: ctx.layer,
      from_name: fromName,
      to_forest: toForest,
      to_name: toName,
      content,
      status: 'pending',
      reply_to_id: original?.id || null,
    })
    .select()
    .single();

  if (insertError) {
    return {
      success: false,
      message_id: '',
      to: toName,
      content,
      status: `failed: ${insertError.message} (code: ${insertError.code})`,
    };
  }

  if (original) {
    await supabase
      .schema(DB_SCHEMAS.FOUNDER_OS)
      .from('messages')
      .update({ status: 'replied', replied_at: new Date().toISOString() })
      .eq('id', original.id);
  }

  return {
    success: true,
    message_id: reply?.id || `demo-${Date.now()}`,
    to: toName,
    content,
    status: 'pending',
  };
}

// =============================================================================
// CONTACT LOOKUP (Database-based)
// =============================================================================

/**
 * Get sender name for the current user
 */
async function getSenderName(ctx: ToolContext): Promise<string> {
  const supabase = ctx.getClient();

  // Try to get from human_os.users
  const { data: user } = await supabase
    .schema('human_os')
    .from('users')
    .select('display_name')
    .eq('slug', ctx.userId)
    .single();

  if (user?.display_name) {
    return user.display_name;
  }

  // Fallback to KNOWN_USERS or userId
  return KNOWN_USERS[ctx.userId] || ctx.userId;
}

/**
 * Resolve contacts matching location query
 * Tries regions first, then falls back to text search
 */
async function resolveContactIdsByLocation(
  ctx: ToolContext,
  locationQuery: string
): Promise<string[]> {
  const supabase = ctx.getClient();

  // 1. Try region match first (name, display_name, or state_code)
  const { data: regions } = await supabase
    .schema('gft')
    .from('regions')
    .select('id, name, display_name')
    .or(
      `name.ilike.%${locationQuery}%,display_name.ilike.%${locationQuery}%,state_code.eq.${locationQuery.toUpperCase()}`
    );

  if (regions && regions.length > 0) {
    // Get contacts by region_id
    const regionIds = regions.map(r => r.id);
    const { data: contacts } = await supabase
      .schema('gft')
      .from('contacts')
      .select('id')
      .eq('owner_id', ctx.userUUID)
      .in('region_id', regionIds);

    if (contacts && contacts.length > 0) {
      return contacts.map(c => c.id);
    }
  }

  // 2. Fallback to text search on location fields
  const { data: contacts } = await supabase
    .schema('gft')
    .from('contacts')
    .select('id')
    .eq('owner_id', ctx.userUUID)
    .or(`location.ilike.%${locationQuery}%,location_raw.ilike.%${locationQuery}%`);

  return contacts?.map(c => c.id) || [];
}

/**
 * Resolve a contact to its forest (if Founder OS user) or email
 */
async function resolveContactDelivery(
  ctx: ToolContext,
  contactId: string
): Promise<{ forest: string | null; email: string | null; name: string }> {
  const supabase = ctx.getClient();

  // Get contact with linked user
  const { data: contact } = await supabase
    .schema('gft')
    .from('contacts')
    .select('name, email, linked_user_id')
    .eq('id', contactId)
    .single();

  if (!contact) {
    throw new Error('Contact not found');
  }

  let forest: string | null = null;

  if (contact.linked_user_id) {
    // Get user slug for forest
    const { data: user } = await supabase
      .schema('human_os')
      .from('users')
      .select('slug')
      .eq('id', contact.linked_user_id)
      .single();

    if (user?.slug) {
      forest = buildFounderLayer(user.slug);
    }
  }

  return { forest, email: contact.email, name: contact.name };
}

/**
 * Lookup contacts from database with filters
 */
async function lookupContacts(
  ctx: ToolContext,
  options: {
    query?: string;
    location?: string;
    tier?: string;
    labels?: string[];
    limit: number;
  }
): Promise<{ success: boolean; contacts: ResolvedContact[]; count: number }> {
  const supabase = ctx.getClient();
  const { query, location, tier, labels, limit } = options;

  // Build the query
  let dbQuery = supabase
    .schema('gft')
    .from('contacts')
    .select(
      `
      id,
      name,
      company,
      location,
      location_raw,
      email,
      linked_user_id,
      tier
    `
    )
    .eq('owner_id', ctx.userUUID)
    .limit(limit);

  // Apply name filter
  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`);
  }

  // Apply tier filter
  if (tier) {
    dbQuery = dbQuery.eq('tier', tier);
  }

  // Apply labels filter (using contains for array)
  if (labels && labels.length > 0) {
    dbQuery = dbQuery.contains('custom_labels', labels);
  }

  // Get initial results
  let { data: contacts, error } = await dbQuery;

  if (error) {
    console.error('Contact lookup error:', error);
    return { success: false, contacts: [], count: 0 };
  }

  // Apply location filter (more complex - requires separate lookup)
  if (location && contacts) {
    const locationContactIds = await resolveContactIdsByLocation(ctx, location);
    contacts = contacts.filter(c => locationContactIds.includes(c.id));
  }

  if (!contacts || contacts.length === 0) {
    return { success: true, contacts: [], count: 0 };
  }

  // Resolve forest for each contact
  const resolvedContacts: ResolvedContact[] = await Promise.all(
    contacts.map(async contact => {
      let forest: string | null = null;

      if (contact.linked_user_id) {
        const { data: user } = await supabase
          .schema('human_os')
          .from('users')
          .select('slug')
          .eq('id', contact.linked_user_id)
          .single();

        if (user?.slug) {
          forest = buildFounderLayer(user.slug);
        }
      }

      return {
        id: contact.id,
        name: contact.name,
        company: contact.company,
        location: contact.location || contact.location_raw,
        email: contact.email,
        forest,
        can_message: !!forest,
        can_email: !!contact.email,
      };
    })
  );

  return {
    success: true,
    contacts: resolvedContacts,
    count: resolvedContacts.length,
  };
}

/**
 * Handle ping_person with disambiguation support
 */
async function handlePingPerson(
  ctx: ToolContext,
  options: { person_name?: string; contact_id?: string; message: string }
): Promise<ContactLookupResult | SendMessageResult> {
  const { person_name, contact_id, message } = options;
  const fromName = await getSenderName(ctx);

  // If contact_id provided, use it directly
  if (contact_id) {
    try {
      const delivery = await resolveContactDelivery(ctx, contact_id);

      if (delivery.forest) {
        return pingPerson(ctx, fromName, delivery.forest, delivery.name, message);
      } else if (delivery.email) {
        return {
          success: false,
          action_required: 'email_fallback',
          message: `${delivery.name} is not on Founder OS but has an email address. Use email to reach them.`,
          contact: {
            id: contact_id,
            name: delivery.name,
            company: null,
            location: null,
            email: delivery.email,
            forest: null,
            can_message: false,
            can_email: true,
          },
          next_step: `Use prepare_email tool with contact='${contact_id}' to send via email`,
        };
      } else {
        return {
          success: false,
          action_required: 'no_delivery_method',
          message: `Cannot reach ${delivery.name} - no Founder OS account or email on file.`,
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `Contact not found: ${contact_id}`,
      };
    }
  }

  // If person_name provided, look up contacts
  if (person_name) {
    const lookup = await lookupContacts(ctx, { query: person_name, limit: 5 });

    if (!lookup.success || lookup.contacts.length === 0) {
      // Fallback to legacy behavior for demo contacts
      const legacyContact = resolveLegacyContact(person_name);
      if (legacyContact) {
        return pingPerson(ctx, fromName, legacyContact.forest, legacyContact.fullName, message);
      }

      return {
        success: false,
        message: `No contact found matching "${person_name}". Try using their full name or add them to your contacts.`,
      };
    }

    if (lookup.contacts.length === 1) {
      const contact = lookup.contacts[0]!;

      if (contact.can_message && contact.forest) {
        return pingPerson(ctx, fromName, contact.forest, contact.name, message);
      } else if (contact.can_email) {
        return {
          success: false,
          action_required: 'email_fallback',
          message: `${contact.name} is not on Founder OS but has an email address. Would you like to send via email instead?`,
          contact,
          next_step: `Use prepare_email tool with contact='${contact.id}' to send via email`,
        };
      } else {
        return {
          success: false,
          action_required: 'no_delivery_method',
          message: `Cannot reach ${contact.name} - no Founder OS account or email on file.`,
        };
      }
    }

    // Multiple matches - return disambiguation
    return {
      success: false,
      action_required: 'disambiguation',
      message: `I found ${lookup.contacts.length} contacts matching "${person_name}". Which one did you mean?`,
      matches: lookup.contacts,
    };
  }

  return {
    success: false,
    message: 'Either person_name or contact_id is required.',
  };
}

/**
 * Send message to multiple contacts
 */
async function sendGroupMessage(
  ctx: ToolContext,
  options: {
    message: string;
    location?: string;
    tier?: string;
    labels?: string[];
    contact_ids?: string[];
  }
): Promise<GroupMessageResult> {
  const { message, location, tier, labels, contact_ids } = options;
  const fromName = await getSenderName(ctx);

  // Collect contacts from various sources
  let allContactIds: string[] = [];

  // Add specific contact_ids
  if (contact_ids && contact_ids.length > 0) {
    allContactIds.push(...contact_ids);
  }

  // Lookup by location
  if (location) {
    const locationIds = await resolveContactIdsByLocation(ctx, location);
    allContactIds.push(...locationIds);
  }

  // Lookup by tier/labels
  if (tier || (labels && labels.length > 0)) {
    const lookup = await lookupContacts(ctx, { tier, labels, limit: 100 });
    allContactIds.push(...lookup.contacts.map(c => c.id));
  }

  // Deduplicate
  allContactIds = [...new Set(allContactIds)];

  if (allContactIds.length === 0) {
    return {
      success: false,
      summary: 'No contacts found matching the criteria.',
      details: {
        via_forest: 0,
        via_email_needed: 0,
        forest_recipients: [],
        email_recipients: [],
      },
    };
  }

  // Resolve each contact and categorize by delivery method
  const forestRecipients: { id: string; name: string; forest: string }[] = [];
  const emailRecipients: { id: string; name: string; email: string }[] = [];
  const errors: string[] = [];

  for (const contactId of allContactIds) {
    try {
      const delivery = await resolveContactDelivery(ctx, contactId);

      if (delivery.forest) {
        forestRecipients.push({ id: contactId, name: delivery.name, forest: delivery.forest });
      } else if (delivery.email) {
        emailRecipients.push({ id: contactId, name: delivery.name, email: delivery.email });
      }
    } catch (err) {
      errors.push(`Contact ${contactId}: ${err}`);
    }
  }

  // Send to all forest recipients
  for (const recipient of forestRecipients) {
    try {
      await pingPerson(ctx, fromName, recipient.forest, recipient.name, message);
    } catch (err) {
      errors.push(`Failed to message ${recipient.name}: ${err}`);
    }
  }

  const locationLabel = location ? ` in ${location}` : '';
  const tierLabel = tier ? ` (${tier})` : '';

  return {
    success: true,
    summary: `Sent message to ${forestRecipients.length + emailRecipients.length} contacts${locationLabel}${tierLabel}`,
    details: {
      via_forest: forestRecipients.length,
      via_email_needed: emailRecipients.length,
      forest_recipients: forestRecipients.map(r => r.name),
      email_recipients: emailRecipients.map(r => r.name),
    },
    email_follow_up:
      emailRecipients.length > 0
        ? `Call prepare_email for each email recipient: ${emailRecipients.map(r => r.name).join(', ')}`
        : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Legacy contact resolution for demo contacts (fallback)
 */
const LEGACY_CONTACTS: Record<string, { forest: string; fullName: string }> = {
  scott: { forest: buildFounderLayer('scott-leese'), fullName: 'Scott Leese' },
  'scott leese': { forest: buildFounderLayer('scott-leese'), fullName: 'Scott Leese' },
  grace: { forest: buildFounderLayer('grace-chen'), fullName: 'Grace Chen' },
  ruth: { forest: buildFounderLayer('ruth'), fullName: 'Ruth' },
  lisa: { forest: buildFounderLayer('lisa'), fullName: 'Lisa Martinez' },
};

function resolveLegacyContact(nameOrAlias: string): { forest: string; fullName: string } | null {
  const key = nameOrAlias.toLowerCase().trim();
  return LEGACY_CONTACTS[key] || null;
}

/** @deprecated Use lookupContacts instead */
export function resolveContact(nameOrAlias: string): { forest: string; fullName: string } | null {
  return resolveLegacyContact(nameOrAlias);
}
