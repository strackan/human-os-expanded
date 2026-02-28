/**
 * Fathom → TranscriptInput Transform
 *
 * Pure data mapping from Fathom meeting API/webhook payloads
 * to the TranscriptInput format used by TranscriptService.
 *
 * No I/O — just shape conversion. Used by both the webhook handler
 * and the MCP sync tool.
 */

import type { TranscriptInput, Participant, ActionItem, NotableQuote } from './transcript-service.js';

// =============================================================================
// FATHOM TYPES
// =============================================================================

export interface FathomTranscriptEntry {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface FathomInvitee {
  name?: string;
  email?: string;
  is_internal?: boolean;
}

export interface FathomActionItemAssignee {
  name?: string;
  email?: string;
}

export interface FathomActionItem {
  description: string;
  completed?: boolean;
  assignee?: FathomActionItemAssignee;
}

export interface FathomSummary {
  markdown_formatted?: string;
  text?: string;
}

export interface FathomMeeting {
  recording_id?: number | string;
  title?: string;
  meeting_title?: string;
  transcript?: FathomTranscriptEntry[];
  recording_start_time?: string;
  recording_end_time?: string;
  calendar_invitees_domains_type?: string;
  share_url?: string;
  url?: string;
  calendar_invitees?: FathomInvitee[];
  default_summary?: FathomSummary;
  action_items?: FathomActionItem[];
}

// =============================================================================
// TRANSFORM
// =============================================================================

/**
 * Format transcript entries as markdown
 */
function formatTranscript(entries: FathomTranscriptEntry[]): string {
  return entries
    .map((entry) => {
      const ts = entry.timestamp ? ` [${entry.timestamp}]` : '';
      return `**${entry.speaker}**${ts}\n${entry.text}`;
    })
    .join('\n\n');
}

/**
 * Compute duration in minutes from start/end ISO timestamps
 */
function computeDuration(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined;
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diffMs) || diffMs <= 0) return undefined;
  return Math.round(diffMs / 60000);
}

/**
 * Map Fathom invitees to TranscriptInput participants
 */
function mapParticipants(invitees?: FathomInvitee[]): Participant[] | undefined {
  if (!invitees || invitees.length === 0) return undefined;
  return invitees
    .filter((inv) => inv.name || inv.email)
    .map((inv) => ({
      name: inv.name || inv.email || 'Unknown',
      email: inv.email,
      is_internal: inv.is_internal ?? false,
    }));
}

/**
 * Map Fathom action items to TranscriptInput action items
 */
function mapActionItems(items?: FathomActionItem[]): ActionItem[] | undefined {
  if (!items || items.length === 0) return undefined;
  return items.map((item) => ({
    description: item.description,
    completed: item.completed ?? false,
    owner: item.assignee?.name,
  }));
}

/**
 * Extract notable quotes from transcript lines > 120 chars (max 5)
 */
function extractNotableQuotes(entries?: FathomTranscriptEntry[]): NotableQuote[] | undefined {
  if (!entries || entries.length === 0) return undefined;

  const quotes = entries
    .filter((entry) => entry.text.length > 120)
    .slice(0, 5)
    .map((entry) => ({
      speaker: entry.speaker,
      quote: entry.text,
      timestamp: entry.timestamp,
    }));

  return quotes.length > 0 ? quotes : undefined;
}

/**
 * Transform a Fathom meeting payload into a TranscriptInput
 *
 * Works with both webhook payloads and API responses — field names
 * may differ slightly between the two, so we check alternatives.
 */
export function fathomMeetingToTranscriptInput(meeting: FathomMeeting): TranscriptInput {
  const title = meeting.title || meeting.meeting_title || 'Untitled Fathom Meeting';

  const rawContent = meeting.transcript && meeting.transcript.length > 0
    ? formatTranscript(meeting.transcript)
    : `[No transcript available for: ${title}]`;

  const callDate = meeting.recording_start_time
    ? meeting.recording_start_time.split('T')[0]
    : undefined;

  const callType = meeting.calendar_invitees_domains_type === 'only_internal'
    ? 'internal' as const
    : 'other' as const;

  const duration = computeDuration(meeting.recording_start_time, meeting.recording_end_time);

  const sourceUrl = meeting.share_url || meeting.url;

  const summary = meeting.default_summary?.markdown_formatted
    || meeting.default_summary?.text;

  const recordingId = meeting.recording_id != null
    ? String(meeting.recording_id)
    : undefined;

  return {
    title,
    raw_content: rawContent,
    call_date: callDate,
    call_type: callType,
    duration_minutes: duration,
    source_url: sourceUrl,
    source: 'fathom',
    participants: mapParticipants(meeting.calendar_invitees),
    summary,
    action_items: mapActionItems(meeting.action_items),
    notable_quotes: extractNotableQuotes(meeting.transcript),
    labels: recordingId ? { fathom_recording_id: recordingId } : {},
    context_tags: ['fathom'],
  };
}
