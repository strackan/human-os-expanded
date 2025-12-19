/**
 * Demo Tools for 12/18 Scott Presentation
 *
 * Calendar tools (simulated) and cross-forest messaging (real DB storage)
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { buildFounderLayer } from '@human-os/core';

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
    name: 'ping_person',
    description: 'Send a message to another person in the Founder OS network. Use when user wants to message, ping, or ask someone something.',
    inputSchema: {
      type: 'object',
      properties: {
        person_name: {
          type: 'string',
          description: 'Name or alias of the person (e.g., "Scott", "Scott Leese")',
        },
        message: {
          type: 'string',
          description: 'The message content to send',
        },
      },
      required: ['person_name', 'message'],
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

    case 'ping_person': {
      const { person_name, message } = args as { person_name: string; message: string };
      const contact = resolveContact(person_name);
      const toForest = contact?.forest || buildFounderLayer(person_name.toLowerCase().replace(/\s+/g, '-'));
      const toName = contact?.fullName || person_name;
      // Get sender name from known users or use userId
      const fromName = KNOWN_USERS[ctx.userId] || ctx.userId;
      return pingPerson(ctx, fromName, toForest, toName, message);
    }

    case 'grab_messages': {
      return grabMessages(ctx);
    }

    case 'reply_message': {
      const { to_name, message } = args as { to_name: string; message: string };
      const fromName = KNOWN_USERS[ctx.userId] || ctx.userId;
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
    if (error.code === '42P01') {
      return {
        success: true,
        message_id: `demo-${Date.now()}`,
        to: toName,
        content,
        status: 'pending (simulated - table not yet created)',
      };
    }
    throw new Error(`Failed to send message: ${error.message}`);
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
    .from('messages')
    .select('*')
    .eq('to_forest', ctx.layer)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return {
        messages: [],
        summary: 'No pending messages (messaging table not yet created).',
      };
    }
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  const messages = data as Message[];

  if (messages.length > 0) {
    const messageIds = messages.map(m => m.id);
    await supabase.from('messages').update({ status: 'delivered' }).in('id', messageIds);
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
    if (insertError.code === '42P01') {
      return {
        success: true,
        message_id: `demo-reply-${Date.now()}`,
        to: toName,
        content,
        status: 'pending (simulated)',
      };
    }
    throw new Error(`Failed to send reply: ${insertError.message}`);
  }

  if (original) {
    await supabase
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
// CONTACT LOOKUP
// =============================================================================

const DEMO_CONTACTS: Record<string, { forest: string; fullName: string }> = {
  scott: { forest: buildFounderLayer('scott-leese'), fullName: 'Scott Leese' },
  'scott leese': { forest: buildFounderLayer('scott-leese'), fullName: 'Scott Leese' },
  grace: { forest: buildFounderLayer('grace-chen'), fullName: 'Grace Chen' },
  ruth: { forest: buildFounderLayer('ruth'), fullName: 'Ruth' },
  lisa: { forest: buildFounderLayer('lisa'), fullName: 'Lisa Martinez' },
};

export function resolveContact(nameOrAlias: string): { forest: string; fullName: string } | null {
  const key = nameOrAlias.toLowerCase().trim();
  return DEMO_CONTACTS[key] || null;
}
