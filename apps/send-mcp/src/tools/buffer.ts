/**
 * Buffer communication tools
 *
 * Create and schedule social media posts via Buffer's GraphQL API.
 * Retrieve post performance stats via Buffer's v1 REST API.
 *
 * Required: BUFFER_API_KEY environment variable
 *
 * Tools:
 * - buffer_post: Create/schedule a post
 * - buffer_channels: List connected channels
 * - buffer_ideas: Save a draft idea to Buffer
 * - buffer_sync_stats: Sync post performance stats from Buffer
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const bufferTools: Tool[] = [
  {
    name: 'buffer_post',
    description: `Create or schedule a social media post via Buffer.

Supports queue, immediate, or scheduled posting to any connected channel.

Example: buffer_post({ text: "Great article on AI...", channelId: "abc123", scheduling: "queue" })
Example: buffer_post({ text: "Breaking news...", channelId: "abc123", scheduling: "now" })
Example: buffer_post({ text: "Upcoming event...", channelId: "abc123", scheduling: "schedule", scheduledAt: "2026-03-15T10:00:00Z" })`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The post text content',
        },
        channelId: {
          type: 'string',
          description: 'Buffer channel ID to post to (get from buffer_channels)',
        },
        scheduling: {
          type: 'string',
          enum: ['queue', 'now', 'schedule'],
          description: 'Scheduling mode: queue (add to Buffer queue), now (publish immediately), schedule (at specific time). Default: queue',
        },
        scheduledAt: {
          type: 'string',
          description: 'ISO datetime for scheduled posts (required when scheduling=schedule)',
        },
        imageUrl: {
          type: 'string',
          description: 'Optional image URL to attach to the post',
        },
      },
      required: ['text', 'channelId'],
    },
  },
  {
    name: 'buffer_channels',
    description: `List connected Buffer channels.

Returns channel IDs, names, service type, and queue status.

Example: buffer_channels({})
Example: buffer_channels({ organizationId: "org123" })`,
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: {
          type: 'string',
          description: 'Buffer organization ID (auto-detected if not provided)',
        },
      },
      required: [],
    },
  },
  {
    name: 'buffer_ideas',
    description: `Save a draft idea to Buffer's content library.

Ideas can be developed into posts later via Buffer's UI.

Example: buffer_ideas({ title: "LinkedIn post about hiring", text: "Draft content here..." })`,
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: {
          type: 'string',
          description: 'Buffer organization ID (auto-detected if not provided)',
        },
        title: {
          type: 'string',
          description: 'Idea title',
        },
        text: {
          type: 'string',
          description: 'Idea content/draft text',
        },
      },
      required: ['title', 'text'],
    },
  },
  {
    name: 'buffer_sync_stats',
    description: `Sync post performance stats from Buffer v1 API.

Fetches recent sent posts with engagement metrics (impressions, clicks, reactions, etc.)
and returns them for updating the social_posts tracking table.

Example: buffer_sync_stats({ profileId: "prof123" })
Example: buffer_sync_stats({ profileId: "prof123", count: 25 })`,
    inputSchema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Buffer profile ID (v1 API) to fetch stats for',
        },
        count: {
          type: 'number',
          description: 'Number of recent posts to fetch (default: 50, max: 100)',
        },
      },
      required: ['profileId'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleBufferTools(
  name: string,
  args: Record<string, unknown>,
  apiKey: string
): Promise<unknown | null> {
  switch (name) {
    case 'buffer_post': {
      const { text, channelId, scheduling, scheduledAt, imageUrl } = args as {
        text: string;
        channelId: string;
        scheduling?: string;
        scheduledAt?: string;
        imageUrl?: string;
      };
      return bufferPost(apiKey, text, channelId, scheduling, scheduledAt, imageUrl);
    }

    case 'buffer_channels': {
      const { organizationId } = args as { organizationId?: string };
      return bufferChannels(apiKey, organizationId);
    }

    case 'buffer_ideas': {
      const { organizationId, title, text } = args as {
        organizationId?: string;
        title: string;
        text: string;
      };
      return bufferIdeas(apiKey, organizationId, title, text);
    }

    case 'buffer_sync_stats': {
      const { profileId, count } = args as {
        profileId: string;
        count?: number;
      };
      return bufferSyncStats(apiKey, profileId, count);
    }

    default:
      return null;
  }
}

// =============================================================================
// SHARED HELPER
// =============================================================================

async function bufferGraphQL(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: unknown; errors?: Array<{ message: string }> }> {
  const body: Record<string, unknown> = { query };
  if (variables) {
    body.variables = variables;
  }

  const res = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Buffer API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Auto-detect the first organization ID from the account
 */
async function getOrganizationId(apiKey: string): Promise<string> {
  const result = await bufferGraphQL(apiKey, `{
    account {
      organizations {
        id
        name
      }
    }
  }`);

  const orgs = (result.data as any)?.account?.organizations;
  if (!orgs || orgs.length === 0) {
    throw new Error('No Buffer organizations found');
  }
  return orgs[0].id;
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

async function bufferPost(
  apiKey: string,
  text: string,
  channelId: string,
  scheduling: string = 'queue',
  scheduledAt?: string,
  imageUrl?: string
): Promise<{
  success: boolean;
  postId?: string;
  message: string;
  error?: string;
}> {
  try {
    // Map scheduling mode to Buffer's schedulingType and mode
    let schedulingType: string;
    let mode: string;
    if (scheduling === 'now') {
      schedulingType = 'now';
      mode = 'share';
    } else if (scheduling === 'schedule') {
      if (!scheduledAt) {
        return { success: false, message: '', error: 'scheduledAt is required when scheduling=schedule' };
      }
      schedulingType = 'schedule';
      mode = 'share';
    } else {
      schedulingType = 'queue';
      mode = 'share';
    }

    let assetsInput = '';
    if (imageUrl) {
      assetsInput = `, assets: [{ url: "${imageUrl}", type: IMAGE }]`;
    }

    const dueAtInput = scheduledAt ? `, dueAt: "${scheduledAt}"` : '';

    const query = `mutation {
      createPost(input: {
        text: ${JSON.stringify(text)},
        channelId: "${channelId}",
        schedulingType: ${schedulingType},
        mode: ${mode}
        ${dueAtInput}
        ${assetsInput}
      }) {
        id
        text
        status
        dueAt
      }
    }`;

    const result = await bufferGraphQL(apiKey, query);

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        message: '',
        error: result.errors.map(e => e.message).join('; '),
      };
    }

    const post = (result.data as any)?.createPost;
    return {
      success: true,
      postId: post?.id,
      message: `Post ${scheduling === 'now' ? 'published' : scheduling === 'schedule' ? 'scheduled' : 'queued'} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function bufferChannels(
  apiKey: string,
  organizationId?: string
): Promise<{
  success: boolean;
  channels?: Array<{
    id: string;
    name: string;
    service: string;
    isQueuePaused: boolean;
  }>;
  organizationId?: string;
  message: string;
  error?: string;
}> {
  try {
    const orgId = organizationId || await getOrganizationId(apiKey);

    const query = `{
      channels(input: { organizationId: "${orgId}" }) {
        id
        name
        service
        isQueuePaused
      }
    }`;

    const result = await bufferGraphQL(apiKey, query);

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        message: '',
        error: result.errors.map(e => e.message).join('; '),
      };
    }

    const channels = (result.data as any)?.channels || [];
    return {
      success: true,
      channels,
      organizationId: orgId,
      message: `Found ${channels.length} connected channels`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function bufferIdeas(
  apiKey: string,
  organizationId: string | undefined,
  title: string,
  text: string
): Promise<{
  success: boolean;
  ideaId?: string;
  message: string;
  error?: string;
}> {
  try {
    const orgId = organizationId || await getOrganizationId(apiKey);

    const query = `mutation {
      createIdea(input: {
        organizationId: "${orgId}",
        content: {
          title: ${JSON.stringify(title)},
          text: ${JSON.stringify(text)}
        }
      }) {
        id
        content {
          title
          text
        }
      }
    }`;

    const result = await bufferGraphQL(apiKey, query);

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        message: '',
        error: result.errors.map(e => e.message).join('; '),
      };
    }

    const idea = (result.data as any)?.createIdea;
    return {
      success: true,
      ideaId: idea?.id,
      message: 'Idea saved to Buffer',
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function bufferSyncStats(
  apiKey: string,
  profileId: string,
  count: number = 50
): Promise<{
  success: boolean;
  posts?: Array<{
    buffer_post_id: string;
    text: string;
    sent_at: string;
    statistics: {
      reach: number;
      clicks: number;
      retweets: number;
      favorites: number;
      mentions: number;
    };
  }>;
  message: string;
  error?: string;
}> {
  try {
    const actualCount = Math.min(count, 100);
    const url = `https://api.bufferapp.com/1/profiles/${profileId}/updates/sent.json?access_token=${apiKey}&count=${actualCount}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Buffer v1 API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const updates = data.updates || [];

    const posts = updates.map((u: any) => ({
      buffer_post_id: u.id,
      text: u.text || '',
      sent_at: u.sent_at ? new Date(u.sent_at * 1000).toISOString() : null,
      statistics: u.statistics || { reach: 0, clicks: 0, retweets: 0, favorites: 0, mentions: 0 },
    }));

    return {
      success: true,
      posts,
      message: `Fetched stats for ${posts.length} posts`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
