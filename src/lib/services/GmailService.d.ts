/**
 * Gmail Service
 *
 * Wrapper for Gmail API operations using OAuth tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #5
 */
export interface GmailMessage {
    id?: string;
    threadId?: string;
    labelIds?: string[];
    snippet?: string;
    payload?: {
        headers?: Array<{
            name: string;
            value: string;
        }>;
        body?: {
            data?: string;
        };
    };
}
export interface SendEmailParams {
    to: string | string[];
    subject: string;
    body: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    html?: boolean;
}
export interface ListMessagesResponse {
    messages?: Array<{
        id: string;
        threadId: string;
    }>;
    nextPageToken?: string;
    resultSizeEstimate?: number;
}
/**
 * Gmail Service
 */
export declare class GmailService {
    /**
     * Get user's Gmail integration ID
     */
    private static getUserIntegrationId;
    /**
     * Get valid access token for user
     */
    private static getAccessToken;
    /**
     * Make authenticated request to Gmail API
     */
    private static apiRequest;
    /**
     * Send an email
     *
     * @param userId - User ID
     * @param params - Email parameters
     * @returns Sent message object
     */
    static sendEmail(userId: string, params: SendEmailParams): Promise<GmailMessage>;
    /**
     * List messages
     *
     * @param userId - User ID
     * @param query - Gmail search query (e.g., 'is:unread', 'from:example@gmail.com')
     * @param maxResults - Max number of results (default: 10)
     * @param pageToken - Page token for pagination
     */
    static listMessages(userId: string, query?: string, maxResults?: number, pageToken?: string): Promise<ListMessagesResponse>;
    /**
     * Get a specific message
     *
     * @param userId - User ID
     * @param messageId - Message ID
     * @param format - Response format ('full', 'metadata', 'minimal', 'raw')
     */
    static getMessage(userId: string, messageId: string, format?: 'full' | 'metadata' | 'minimal' | 'raw'): Promise<GmailMessage>;
    /**
     * Delete a message (move to trash)
     *
     * @param userId - User ID
     * @param messageId - Message ID
     */
    static trashMessage(userId: string, messageId: string): Promise<GmailMessage>;
    /**
     * Permanently delete a message
     *
     * @param userId - User ID
     * @param messageId - Message ID
     */
    static deleteMessage(userId: string, messageId: string): Promise<void>;
    /**
     * Modify message labels (e.g., mark as read/unread)
     *
     * @param userId - User ID
     * @param messageId - Message ID
     * @param addLabelIds - Labels to add (e.g., ['UNREAD'])
     * @param removeLabelIds - Labels to remove (e.g., ['UNREAD'])
     */
    static modifyLabels(userId: string, messageId: string, addLabelIds?: string[], removeLabelIds?: string[]): Promise<GmailMessage>;
    /**
     * Mark message as read
     *
     * @param userId - User ID
     * @param messageId - Message ID
     */
    static markAsRead(userId: string, messageId: string): Promise<GmailMessage>;
    /**
     * Mark message as unread
     *
     * @param userId - User ID
     * @param messageId - Message ID
     */
    static markAsUnread(userId: string, messageId: string): Promise<GmailMessage>;
    /**
     * Get user's Gmail profile
     *
     * @param userId - User ID
     */
    static getProfile(userId: string): Promise<{
        emailAddress: string;
        messagesTotal: number;
        threadsTotal: number;
        historyId: string;
    }>;
    /**
     * Check if user has Gmail connected
     *
     * @param userId - User ID
     * @returns True if connected and active
     */
    static isConnected(userId: string): Promise<boolean>;
    /**
     * Get unread message count
     *
     * @param userId - User ID
     */
    static getUnreadCount(userId: string): Promise<number>;
}
//# sourceMappingURL=GmailService.d.ts.map