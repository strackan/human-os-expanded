/**
 * Slack Service
 *
 * Wrapper for Slack API operations using OAuth tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #4
 */

import { OAuthService } from './OAuthService';
import { createServiceRoleClient } from '@/lib/supabase-server';

const SLACK_API_BASE = 'https://slack.com/api';

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[]; // Block Kit blocks
  thread_ts?: string; // Reply to thread
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_member: boolean;
  is_private: boolean;
  created: number;
  creator: string;
  num_members?: number;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
  };
}

/**
 * Slack Service
 */
export class SlackService {
  /**
   * Get user's Slack integration ID
   */
  private static async getUserIntegrationId(userId: string): Promise<string> {
    const supabase = createServiceRoleClient();

    const { data: integration } = await supabase
      .from('mcp_integrations')
      .select('id')
      .eq('slug', 'slack')
      .single();

    if (!integration) {
      throw new Error('Slack integration not found');
    }

    const { data: userIntegration, error } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('integration_id', integration.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    if (error || !userIntegration) {
      throw new Error('Slack not connected for this user');
    }

    return userIntegration.id;
  }

  /**
   * Get valid access token for user
   */
  private static async getAccessToken(userId: string): Promise<string> {
    const userIntegrationId = await this.getUserIntegrationId(userId);

    return await OAuthService.getValidAccessToken(
      userIntegrationId,
      'slack',
      'slack'
    );
  }

  /**
   * Make authenticated request to Slack API
   */
  private static async apiRequest(
    userId: string,
    method: string,
    data?: any
  ): Promise<any> {
    const accessToken = await this.getAccessToken(userId);

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

    const result = await response.json();

    // Slack returns ok: false for API errors
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Post a message to a Slack channel
   *
   * @param userId - User ID
   * @param message - Message details
   * @returns Message response with timestamp
   */
  static async postMessage(
    userId: string,
    message: SlackMessage
  ): Promise<{ ts: string; channel: string }> {
    const result = await this.apiRequest(userId, 'chat.postMessage', message);

    return {
      ts: result.ts,
      channel: result.channel,
    };
  }

  /**
   * Update an existing message
   *
   * @param userId - User ID
   * @param channel - Channel ID
   * @param ts - Message timestamp
   * @param text - New message text
   * @param blocks - New blocks (optional)
   */
  static async updateMessage(
    userId: string,
    channel: string,
    ts: string,
    text: string,
    blocks?: any[]
  ): Promise<void> {
    await this.apiRequest(userId, 'chat.update', {
      channel,
      ts,
      text,
      blocks,
    });
  }

  /**
   * Delete a message
   *
   * @param userId - User ID
   * @param channel - Channel ID
   * @param ts - Message timestamp
   */
  static async deleteMessage(
    userId: string,
    channel: string,
    ts: string
  ): Promise<void> {
    await this.apiRequest(userId, 'chat.delete', {
      channel,
      ts,
    });
  }

  /**
   * List channels the bot/user has access to
   *
   * @param userId - User ID
   * @param types - Channel types (e.g., 'public_channel,private_channel')
   * @param limit - Max number of channels (default: 100)
   */
  static async listChannels(
    userId: string,
    types: string = 'public_channel,private_channel',
    limit: number = 100
  ): Promise<SlackChannel[]> {
    const result = await this.apiRequest(userId, 'conversations.list', {
      types,
      limit,
    });

    return result.channels || [];
  }

  /**
   * Get channel info
   *
   * @param userId - User ID
   * @param channel - Channel ID
   */
  static async getChannelInfo(
    userId: string,
    channel: string
  ): Promise<SlackChannel> {
    const result = await this.apiRequest(userId, 'conversations.info', {
      channel,
    });

    return result.channel;
  }

  /**
   * Join a channel
   *
   * @param userId - User ID
   * @param channel - Channel ID
   */
  static async joinChannel(
    userId: string,
    channel: string
  ): Promise<SlackChannel> {
    const result = await this.apiRequest(userId, 'conversations.join', {
      channel,
    });

    return result.channel;
  }

  /**
   * List users in workspace
   *
   * @param userId - User ID
   * @param limit - Max number of users (default: 100)
   */
  static async listUsers(userId: string, limit: number = 100): Promise<SlackUser[]> {
    const result = await this.apiRequest(userId, 'users.list', {
      limit,
    });

    return result.members || [];
  }

  /**
   * Get user info
   *
   * @param userId - User ID
   * @param slackUserId - Slack user ID
   */
  static async getUserInfo(
    userId: string,
    slackUserId: string
  ): Promise<SlackUser> {
    const result = await this.apiRequest(userId, 'users.info', {
      user: slackUserId,
    });

    return result.user;
  }

  /**
   * Get authenticated bot/user info
   *
   * @param userId - User ID
   */
  static async getAuthInfo(userId: string): Promise<{
    user_id: string;
    team_id: string;
    team: string;
    url: string;
  }> {
    return await this.apiRequest(userId, 'auth.test');
  }

  /**
   * Send a direct message to a user
   *
   * @param userId - User ID
   * @param slackUserId - Slack user ID to send DM to
   * @param text - Message text
   */
  static async sendDirectMessage(
    userId: string,
    slackUserId: string,
    text: string
  ): Promise<{ ts: string; channel: string }> {
    // Open DM channel
    const dmResult = await this.apiRequest(userId, 'conversations.open', {
      users: slackUserId,
    });

    const channel = dmResult.channel.id;

    // Send message
    return await this.postMessage(userId, {
      channel,
      text,
    });
  }

  /**
   * Add reaction to a message
   *
   * @param userId - User ID
   * @param channel - Channel ID
   * @param timestamp - Message timestamp
   * @param name - Emoji name (without colons, e.g., 'thumbsup')
   */
  static async addReaction(
    userId: string,
    channel: string,
    timestamp: string,
    name: string
  ): Promise<void> {
    await this.apiRequest(userId, 'reactions.add', {
      channel,
      timestamp,
      name,
    });
  }

  /**
   * Check if user has Slack connected
   *
   * @param userId - User ID
   * @returns True if connected and active
   */
  static async isConnected(userId: string): Promise<boolean> {
    try {
      await this.getUserIntegrationId(userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test connection to Slack
   *
   * @param userId - User ID
   * @returns Workspace info if connected
   */
  static async testConnection(userId: string): Promise<{
    team_id: string;
    team: string;
    user_id: string;
  }> {
    return await this.getAuthInfo(userId);
  }
}
