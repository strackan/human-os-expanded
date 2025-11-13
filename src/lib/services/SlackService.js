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
/**
 * Slack Service
 */
export class SlackService {
    /**
     * Get user's Slack integration ID
     */
    static async getUserIntegrationId(userId) {
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
    static async getAccessToken(userId) {
        const userIntegrationId = await this.getUserIntegrationId(userId);
        return await OAuthService.getValidAccessToken(userIntegrationId, 'slack', 'slack');
    }
    /**
     * Make authenticated request to Slack API
     */
    static async apiRequest(userId, method, data) {
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
    static async postMessage(userId, message) {
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
    static async updateMessage(userId, channel, ts, text, blocks) {
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
    static async deleteMessage(userId, channel, ts) {
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
    static async listChannels(userId, types = 'public_channel,private_channel', limit = 100) {
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
    static async getChannelInfo(userId, channel) {
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
    static async joinChannel(userId, channel) {
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
    static async listUsers(userId, limit = 100) {
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
    static async getUserInfo(userId, slackUserId) {
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
    static async getAuthInfo(userId) {
        return await this.apiRequest(userId, 'auth.test');
    }
    /**
     * Send a direct message to a user
     *
     * @param userId - User ID
     * @param slackUserId - Slack user ID to send DM to
     * @param text - Message text
     */
    static async sendDirectMessage(userId, slackUserId, text) {
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
    static async addReaction(userId, channel, timestamp, name) {
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
    static async isConnected(userId) {
        try {
            await this.getUserIntegrationId(userId);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Test connection to Slack
     *
     * @param userId - User ID
     * @returns Workspace info if connected
     */
    static async testConnection(userId) {
        return await this.getAuthInfo(userId);
    }
}
//# sourceMappingURL=SlackService.js.map