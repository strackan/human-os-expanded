/**
 * Slack MCP Operations
 * Operations for sending messages and interacting with Slack workspaces
 */

import { SupabaseClient } from '@supabase/supabase-js';

const SLACK_API_BASE = 'https://slack.com/api';

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile?: {
    email?: string;
  };
}

/**
 * Helper: Get valid access token for Slack
 */
async function getAccessToken(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: integration } = await supabase
    .from('mcp_integrations')
    .select('id')
    .eq('slug', 'slack')
    .single();

  if (!integration) {
    throw new Error('Slack integration not found');
  }

  const { data: userIntegration } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('integration_id', integration.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  if (!userIntegration) {
    throw new Error('Slack not connected for this user');
  }

  const { data: tokenData } = await supabase
    .rpc('decrypt_oauth_token', {
      p_user_integration_id: userIntegration.id
    });

  if (!tokenData || !tokenData.access_token) {
    throw new Error('No valid access token found');
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const buffer = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() < buffer) {
    throw new Error('Access token expired - please re-authenticate');
  }

  return tokenData.access_token;
}

/**
 * Helper: Make authenticated request to Slack API
 */
async function apiRequest(
  supabase: SupabaseClient,
  userId: string,
  method: string,
  data?: any
): Promise<any> {
  const accessToken = await getAccessToken(supabase, userId);

  const response = await fetch(`${SLACK_API_BASE}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Slack API error: ${response.status} ${error}`);
  }

  const result: any = await response.json();

  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
  }

  return result;
}

/**
 * Post a message to a Slack channel
 */
export async function postMessage(
  supabase: SupabaseClient,
  userId: string,
  message: SlackMessage
): Promise<{ ts: string; channel: string }> {
  const result = await apiRequest(supabase, userId, 'chat.postMessage', message);

  return {
    ts: result.ts,
    channel: result.channel,
  };
}

/**
 * Update an existing Slack message
 */
export async function updateMessage(
  supabase: SupabaseClient,
  userId: string,
  channel: string,
  ts: string,
  text: string,
  blocks?: any[]
): Promise<void> {
  await apiRequest(supabase, userId, 'chat.update', {
    channel,
    ts,
    text,
    blocks,
  });
}

/**
 * Delete a Slack message
 */
export async function deleteMessage(
  supabase: SupabaseClient,
  userId: string,
  channel: string,
  ts: string
): Promise<void> {
  await apiRequest(supabase, userId, 'chat.delete', {
    channel,
    ts,
  });
}

/**
 * List channels in the workspace
 */
export async function listChannels(
  supabase: SupabaseClient,
  userId: string,
  types: string = 'public_channel,private_channel',
  limit: number = 100
): Promise<SlackChannel[]> {
  const result = await apiRequest(supabase, userId, 'conversations.list', {
    types,
    limit,
  });

  return result.channels || [];
}

/**
 * Get channel information
 */
export async function getChannelInfo(
  supabase: SupabaseClient,
  userId: string,
  channel: string
): Promise<SlackChannel> {
  const result = await apiRequest(supabase, userId, 'conversations.info', {
    channel,
  });

  return result.channel;
}

/**
 * Send a direct message to a user
 */
export async function sendDirectMessage(
  supabase: SupabaseClient,
  userId: string,
  slackUserId: string,
  text: string
): Promise<{ ts: string; channel: string }> {
  const dmResult = await apiRequest(supabase, userId, 'conversations.open', {
    users: slackUserId,
  });

  const channel = dmResult.channel.id;

  return await postMessage(supabase, userId, {
    channel,
    text,
  });
}

/**
 * List users in the workspace
 */
export async function listUsers(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 100
): Promise<SlackUser[]> {
  const result = await apiRequest(supabase, userId, 'users.list', {
    limit,
  });

  return result.members || [];
}

/**
 * Get user information
 */
export async function getUserInfo(
  supabase: SupabaseClient,
  userId: string,
  slackUserId: string
): Promise<SlackUser> {
  const result = await apiRequest(supabase, userId, 'users.info', {
    user: slackUserId,
  });

  return result.user;
}

/**
 * Add reaction to a message
 */
export async function addReaction(
  supabase: SupabaseClient,
  userId: string,
  channel: string,
  timestamp: string,
  emoji: string
): Promise<void> {
  await apiRequest(supabase, userId, 'reactions.add', {
    channel,
    timestamp,
    name: emoji,
  });
}

/**
 * Get authenticated workspace info
 */
export async function getWorkspaceInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  user_id: string;
  team_id: string;
  team: string;
  url: string;
}> {
  return await apiRequest(supabase, userId, 'auth.test');
}
