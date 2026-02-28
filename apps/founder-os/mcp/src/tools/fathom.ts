/**
 * Fathom Meeting Integration Tools
 *
 * Two tools for interacting with the Fathom API:
 * - sync_fathom_meetings: Backfill/catch-up sync of recent meetings
 * - list_fathom_meetings: Browse meetings without ingesting
 *
 * Both use native fetch against Fathom's REST API and read
 * FATHOM_API_KEY from process.env.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { TranscriptService } from '@human-os/services';
import { fathomMeetingToTranscriptInput } from '@human-os/services';
import type { FathomMeeting } from '@human-os/services';
import { z } from 'zod';

// =============================================================================
// CONSTANTS
// =============================================================================

const FATHOM_API_BASE = 'https://api.fathom.video/v2';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const fathomTools: Tool[] = [
  {
    name: 'sync_fathom_meetings',
    description:
      'Sync recent Fathom meetings into the transcript store. ' +
      'Fetches meetings from the Fathom API, deduplicates against existing transcripts, ' +
      'and ingests new ones via TranscriptService.',
    inputSchema: {
      type: 'object',
      properties: {
        days_back: {
          type: 'number',
          description: 'How many days back to sync (default 7)',
        },
        limit: {
          type: 'number',
          description: 'Max meetings to sync (default 20)',
        },
        force_reingest: {
          type: 'boolean',
          description: 'Re-ingest even if already stored (default false)',
        },
      },
    },
  },
  {
    name: 'list_fathom_meetings',
    description:
      'Browse recent Fathom meetings without ingesting them. ' +
      'Returns a lightweight list with title, date, duration, and participant count.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max meetings to return (default 10)',
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor from a previous call',
        },
        after: {
          type: 'string',
          description: 'Only meetings after this ISO date',
        },
        before: {
          type: 'string',
          description: 'Only meetings before this ISO date',
        },
      },
    },
  },
];

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const SyncSchema = z.object({
  days_back: z.number().optional().default(7),
  limit: z.number().optional().default(20),
  force_reingest: z.boolean().optional().default(false),
});

const ListSchema = z.object({
  limit: z.number().optional().default(10),
  cursor: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
});

// =============================================================================
// FATHOM API HELPERS
// =============================================================================

interface FathomListResponse {
  results: FathomMeeting[];
  next_cursor?: string | null;
}

async function fathomFetch(
  path: string,
  apiKey: string
): Promise<FathomListResponse> {
  const res = await fetch(`${FATHOM_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fathom API ${res.status}: ${text}`);
  }

  return res.json() as Promise<FathomListResponse>;
}

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleFathomTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'sync_fathom_meetings':
      return handleSync(args, ctx);
    case 'list_fathom_meetings':
      return handleList(args);
    default:
      return null;
  }
}

// =============================================================================
// SYNC HANDLER
// =============================================================================

async function handleSync(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  const apiKey = process.env['FATHOM_API_KEY'];
  if (!apiKey) {
    return { error: 'FATHOM_API_KEY is not set. Add it to your environment variables.' };
  }

  const params = SyncSchema.parse(args);
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - params.days_back);
  const createdAfter = afterDate.toISOString();

  const service = new TranscriptService(ctx.getClient(), ctx.layer, ctx.userUUID);

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];
  let cursor: string | undefined;
  let fetched = 0;

  // Paginate through Fathom API
  while (fetched < params.limit) {
    const pageSize = Math.min(params.limit - fetched, 20);
    let path = `/meetings?include_transcript=true&include_summary=true&include_action_items=true&created_after=${encodeURIComponent(createdAfter)}&limit=${pageSize}`;
    if (cursor) {
      path += `&cursor=${encodeURIComponent(cursor)}`;
    }

    let response: FathomListResponse;
    try {
      response = await fathomFetch(path, apiKey);
    } catch (err) {
      errors.push(`API fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    if (!response.results || response.results.length === 0) break;

    for (const meeting of response.results) {
      if (fetched >= params.limit) break;
      fetched++;

      const recordingId = meeting.recording_id != null
        ? String(meeting.recording_id)
        : null;

      // Dedup check
      if (recordingId && !params.force_reingest) {
        const { data: existing } = await ctx.getClient()
          .schema('human_os')
          .from('transcripts')
          .select('id')
          .eq('labels->>fathom_recording_id', recordingId)
          .limit(1)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }
      }

      // Transform and ingest
      try {
        const input = fathomMeetingToTranscriptInput(meeting);
        const result = await service.ingest(input);
        if (result.success) {
          synced++;
        } else {
          errors.push(`Ingest failed for "${meeting.title || recordingId}": ${result.error}`);
        }
      } catch (err) {
        errors.push(
          `Error ingesting "${meeting.title || recordingId}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    cursor = response.next_cursor || undefined;
    if (!cursor) break;
  }

  return {
    synced,
    skipped,
    total_fetched: fetched,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// =============================================================================
// LIST HANDLER
// =============================================================================

async function handleList(
  args: Record<string, unknown>
): Promise<unknown> {
  const apiKey = process.env['FATHOM_API_KEY'];
  if (!apiKey) {
    return { error: 'FATHOM_API_KEY is not set. Add it to your environment variables.' };
  }

  const params = ListSchema.parse(args);

  let path = `/meetings?limit=${params.limit}`;
  if (params.cursor) {
    path += `&cursor=${encodeURIComponent(params.cursor)}`;
  }
  if (params.after) {
    path += `&created_after=${encodeURIComponent(params.after)}`;
  }
  if (params.before) {
    path += `&created_before=${encodeURIComponent(params.before)}`;
  }

  const response = await fathomFetch(path, apiKey);

  const meetings = (response.results || []).map((m) => ({
    recording_id: m.recording_id,
    title: m.title || m.meeting_title || 'Untitled',
    date: m.recording_start_time ? m.recording_start_time.split('T')[0] : null,
    duration_minutes:
      m.recording_start_time && m.recording_end_time
        ? Math.round(
            (new Date(m.recording_end_time).getTime() -
              new Date(m.recording_start_time).getTime()) /
              60000
          )
        : null,
    participant_count: m.calendar_invitees?.length || 0,
    share_url: m.share_url || m.url || null,
  }));

  return {
    meetings,
    next_cursor: response.next_cursor || null,
  };
}
