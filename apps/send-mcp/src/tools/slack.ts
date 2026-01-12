/**
 * Slack communication tools
 *
 * Send messages to Slack channels and users.
 * Uses Slack Web API with bot token authentication.
 *
 * Required bot scopes: chat:write, channels:read, users:read
 *
 * Tools:
 * - slack_send: Send a message to a channel or user
 * - slack_channels: List available channels
 * - slack_thread: Reply to a thread
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WebClient } from '@slack/web-api';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const slackTools: Tool[] = [
  {
    name: 'slack_send',
    description: `Send a message to a Slack channel or user.

Supports Slack markdown formatting (bold, italic, code blocks, etc.)

Example: slack_send({ channel: "#general", message: "Hello team!" })
Example: slack_send({ channel: "@username", message: "Hey, quick question..." })`,
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Channel name (#channel) or user (@username) or channel ID (C1234567)',
        },
        message: {
          type: 'string',
          description: 'Message text (supports Slack markdown)',
        },
        blocks: {
          type: 'array',
          description: 'Optional Slack Block Kit blocks for rich formatting',
        },
      },
      required: ['channel', 'message'],
    },
  },
  {
    name: 'slack_channels',
    description: `List available Slack channels the bot can post to.

Returns channel names, IDs, and member counts.

Example: slack_channels({})
Example: slack_channels({ limit: 20 })`,
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of channels to return (default: 50)',
        },
        includePrivate: {
          type: 'boolean',
          description: 'Include private channels (default: false)',
        },
      },
      required: [],
    },
  },
  {
    name: 'slack_thread',
    description: `Reply to a Slack thread.

Used for follow-up messages in an existing conversation.

Example: slack_thread({ channel: "C1234567", threadTs: "1234567890.123456", message: "Follow-up on this..." })`,
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Channel ID where the thread exists',
        },
        threadTs: {
          type: 'string',
          description: 'Timestamp of the parent message (thread_ts)',
        },
        message: {
          type: 'string',
          description: 'Reply message text',
        },
        broadcast: {
          type: 'boolean',
          description: 'Also post to the channel (not just thread)',
        },
      },
      required: ['channel', 'threadTs', 'message'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleSlackTools(
  name: string,
  args: Record<string, unknown>,
  client: WebClient
): Promise<unknown | null> {
  switch (name) {
    case 'slack_send': {
      const { channel, message, blocks } = args as {
        channel: string;
        message: string;
        blocks?: unknown[];
      };
      return slackSend(client, channel, message, blocks);
    }

    case 'slack_channels': {
      const { limit, includePrivate } = args as {
        limit?: number;
        includePrivate?: boolean;
      };
      return slackChannels(client, limit, includePrivate);
    }

    case 'slack_thread': {
      const { channel, threadTs, message, broadcast } = args as {
        channel: string;
        threadTs: string;
        message: string;
        broadcast?: boolean;
      };
      return slackThread(client, channel, threadTs, message, broadcast);
    }

    default:
      return null;
  }
}

// =============================================================================
// IMPLEMENTATIONS
// =============================================================================

/**
 * Resolve channel string to channel ID
 */
async function resolveChannel(
  client: WebClient,
  channel: string
): Promise<{ id: string; type: 'channel' | 'user' } | null> {
  // Already a channel ID
  if (channel.match(/^[A-Z][A-Z0-9]{8,}$/)) {
    return { id: channel, type: 'channel' };
  }

  // User mention (@username)
  if (channel.startsWith('@')) {
    const username = channel.slice(1);
    try {
      const result = await client.users.list({ limit: 500 });
      const user = result.members?.find(
        m => m.name === username || m.profile?.display_name === username
      );
      if (user?.id) {
        // Open DM channel
        const dm = await client.conversations.open({ users: user.id });
        if (dm.channel?.id) {
          return { id: dm.channel.id, type: 'user' };
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  // Channel name (#channel)
  const channelName = channel.startsWith('#') ? channel.slice(1) : channel;
  try {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 500,
    });
    const found = result.channels?.find(c => c.name === channelName);
    if (found?.id) {
      return { id: found.id, type: 'channel' };
    }
  } catch {
    return null;
  }

  return null;
}

async function slackSend(
  client: WebClient,
  channel: string,
  message: string,
  blocks?: unknown[]
): Promise<{
  success: boolean;
  messageTs?: string;
  channel?: string;
  message: string;
  error?: string;
}> {
  try {
    const resolved = await resolveChannel(client, channel);
    if (!resolved) {
      return {
        success: false,
        message: '',
        error: `Could not resolve channel: ${channel}`,
      };
    }

    const result = await client.chat.postMessage({
      channel: resolved.id,
      text: message,
      blocks: blocks as never,
    });

    return {
      success: true,
      messageTs: result.ts,
      channel: resolved.id,
      message: `Message sent to ${channel}`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function slackChannels(
  client: WebClient,
  limit: number = 50,
  includePrivate: boolean = false
): Promise<{
  success: boolean;
  channels?: Array<{
    id: string;
    name: string;
    memberCount?: number;
    isPrivate: boolean;
  }>;
  message: string;
  error?: string;
}> {
  try {
    const types = includePrivate
      ? 'public_channel,private_channel'
      : 'public_channel';

    const result = await client.conversations.list({
      types,
      limit: Math.min(limit, 200),
      exclude_archived: true,
    });

    const channels = (result.channels || []).map(c => ({
      id: c.id || '',
      name: c.name || '',
      memberCount: c.num_members,
      isPrivate: c.is_private || false,
    }));

    return {
      success: true,
      channels,
      message: `Found ${channels.length} channels`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function slackThread(
  client: WebClient,
  channel: string,
  threadTs: string,
  message: string,
  broadcast: boolean = false
): Promise<{
  success: boolean;
  messageTs?: string;
  message: string;
  error?: string;
}> {
  try {
    const result = await client.chat.postMessage({
      channel,
      text: message,
      thread_ts: threadTs,
      reply_broadcast: broadcast,
    });

    return {
      success: true,
      messageTs: result.ts,
      message: `Reply posted to thread`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
