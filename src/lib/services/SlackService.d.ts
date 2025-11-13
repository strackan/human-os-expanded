/**
 * Slack Service
 *
 * Wrapper for Slack API operations using OAuth tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #4
 */
export interface SlackMessage {
    channel: string;
    text: string;
    blocks?: any[];
    thread_ts?: string;
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
export declare class SlackService {
    /**
     * Get user's Slack integration ID
     */
    private static getUserIntegrationId;
    /**
     * Get valid access token for user
     */
    private static getAccessToken;
    /**
     * Make authenticated request to Slack API
     */
    private static apiRequest;
    /**
     * Post a message to a Slack channel
     *
     * @param userId - User ID
     * @param message - Message details
     * @returns Message response with timestamp
     */
    static postMessage(userId: string, message: SlackMessage): Promise<{
        ts: string;
        channel: string;
    }>;
    /**
     * Update an existing message
     *
     * @param userId - User ID
     * @param channel - Channel ID
     * @param ts - Message timestamp
     * @param text - New message text
     * @param blocks - New blocks (optional)
     */
    static updateMessage(userId: string, channel: string, ts: string, text: string, blocks?: any[]): Promise<void>;
    /**
     * Delete a message
     *
     * @param userId - User ID
     * @param channel - Channel ID
     * @param ts - Message timestamp
     */
    static deleteMessage(userId: string, channel: string, ts: string): Promise<void>;
    /**
     * List channels the bot/user has access to
     *
     * @param userId - User ID
     * @param types - Channel types (e.g., 'public_channel,private_channel')
     * @param limit - Max number of channels (default: 100)
     */
    static listChannels(userId: string, types?: string, limit?: number): Promise<SlackChannel[]>;
    /**
     * Get channel info
     *
     * @param userId - User ID
     * @param channel - Channel ID
     */
    static getChannelInfo(userId: string, channel: string): Promise<SlackChannel>;
    /**
     * Join a channel
     *
     * @param userId - User ID
     * @param channel - Channel ID
     */
    static joinChannel(userId: string, channel: string): Promise<SlackChannel>;
    /**
     * List users in workspace
     *
     * @param userId - User ID
     * @param limit - Max number of users (default: 100)
     */
    static listUsers(userId: string, limit?: number): Promise<SlackUser[]>;
    /**
     * Get user info
     *
     * @param userId - User ID
     * @param slackUserId - Slack user ID
     */
    static getUserInfo(userId: string, slackUserId: string): Promise<SlackUser>;
    /**
     * Get authenticated bot/user info
     *
     * @param userId - User ID
     */
    static getAuthInfo(userId: string): Promise<{
        user_id: string;
        team_id: string;
        team: string;
        url: string;
    }>;
    /**
     * Send a direct message to a user
     *
     * @param userId - User ID
     * @param slackUserId - Slack user ID to send DM to
     * @param text - Message text
     */
    static sendDirectMessage(userId: string, slackUserId: string, text: string): Promise<{
        ts: string;
        channel: string;
    }>;
    /**
     * Add reaction to a message
     *
     * @param userId - User ID
     * @param channel - Channel ID
     * @param timestamp - Message timestamp
     * @param name - Emoji name (without colons, e.g., 'thumbsup')
     */
    static addReaction(userId: string, channel: string, timestamp: string, name: string): Promise<void>;
    /**
     * Check if user has Slack connected
     *
     * @param userId - User ID
     * @returns True if connected and active
     */
    static isConnected(userId: string): Promise<boolean>;
    /**
     * Test connection to Slack
     *
     * @param userId - User ID
     * @returns Workspace info if connected
     */
    static testConnection(userId: string): Promise<{
        team_id: string;
        team: string;
        user_id: string;
    }>;
}
//# sourceMappingURL=SlackService.d.ts.map