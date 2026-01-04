/**
 * Gmail Service
 *
 * Wrapper for Gmail API operations using OAuth tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #5
 */

import { OAuthService } from './OAuthService';
import { createServiceRoleClient } from '@/lib/supabase-server';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

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
  html?: boolean; // If true, body is HTML; if false, plain text
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
export class GmailService {
  /**
   * Get user's Gmail integration ID
   */
  private static async getUserIntegrationId(userId: string): Promise<string> {
    const supabase = createServiceRoleClient();

    const { data: integration } = await supabase
      .from('mcp_integrations')
      .select('id')
      .eq('slug', 'gmail')
      .single();

    if (!integration) {
      throw new Error('Gmail integration not found');
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
      throw new Error('Gmail not connected for this user');
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
      'google',
      'gmail'
    );
  }

  /**
   * Make authenticated request to Gmail API
   */
  private static async apiRequest(
    userId: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const accessToken = await this.getAccessToken(userId);

    const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gmail API error: ${response.status} ${error}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  /**
   * Send an email
   *
   * @param userId - User ID
   * @param params - Email parameters
   * @returns Sent message object
   */
  static async sendEmail(userId: string, params: SendEmailParams): Promise<GmailMessage> {
    // Build email headers
    const headers: string[] = [];

    // To addresses
    const toAddresses = Array.isArray(params.to) ? params.to.join(', ') : params.to;
    headers.push(`To: ${toAddresses}`);

    // Subject
    headers.push(`Subject: ${params.subject}`);

    // CC
    if (params.cc) {
      const ccAddresses = Array.isArray(params.cc) ? params.cc.join(', ') : params.cc;
      headers.push(`Cc: ${ccAddresses}`);
    }

    // BCC
    if (params.bcc) {
      const bccAddresses = Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc;
      headers.push(`Bcc: ${bccAddresses}`);
    }

    // Reply-To
    if (params.replyTo) {
      headers.push(`Reply-To: ${params.replyTo}`);
    }

    // Content-Type
    const contentType = params.html
      ? 'text/html; charset=utf-8'
      : 'text/plain; charset=utf-8';
    headers.push(`Content-Type: ${contentType}`);

    // Build raw email
    const email = [
      ...headers,
      '', // Empty line between headers and body
      params.body,
    ].join('\r\n');

    // Base64url encode
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    return await this.apiRequest(userId, '/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });
  }

  /**
   * List messages
   *
   * @param userId - User ID
   * @param query - Gmail search query (e.g., 'is:unread', 'from:example@gmail.com')
   * @param maxResults - Max number of results (default: 10)
   * @param pageToken - Page token for pagination
   */
  static async listMessages(
    userId: string,
    query?: string,
    maxResults: number = 10,
    pageToken?: string
  ): Promise<ListMessagesResponse> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
    });

    if (query) params.append('q', query);
    if (pageToken) params.append('pageToken', pageToken);

    return await this.apiRequest(
      userId,
      `/users/me/messages?${params.toString()}`
    );
  }

  /**
   * Get a specific message
   *
   * @param userId - User ID
   * @param messageId - Message ID
   * @param format - Response format ('full', 'metadata', 'minimal', 'raw')
   */
  static async getMessage(
    userId: string,
    messageId: string,
    format: 'full' | 'metadata' | 'minimal' | 'raw' = 'full'
  ): Promise<GmailMessage> {
    const params = new URLSearchParams({
      format,
    });

    return await this.apiRequest(
      userId,
      `/users/me/messages/${messageId}?${params.toString()}`
    );
  }

  /**
   * Delete a message (move to trash)
   *
   * @param userId - User ID
   * @param messageId - Message ID
   */
  static async trashMessage(userId: string, messageId: string): Promise<GmailMessage> {
    return await this.apiRequest(
      userId,
      `/users/me/messages/${messageId}/trash`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Permanently delete a message
   *
   * @param userId - User ID
   * @param messageId - Message ID
   */
  static async deleteMessage(userId: string, messageId: string): Promise<void> {
    await this.apiRequest(
      userId,
      `/users/me/messages/${messageId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Modify message labels (e.g., mark as read/unread)
   *
   * @param userId - User ID
   * @param messageId - Message ID
   * @param addLabelIds - Labels to add (e.g., ['UNREAD'])
   * @param removeLabelIds - Labels to remove (e.g., ['UNREAD'])
   */
  static async modifyLabels(
    userId: string,
    messageId: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<GmailMessage> {
    return await this.apiRequest(
      userId,
      `/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        body: JSON.stringify({
          addLabelIds,
          removeLabelIds,
        }),
      }
    );
  }

  /**
   * Mark message as read
   *
   * @param userId - User ID
   * @param messageId - Message ID
   */
  static async markAsRead(userId: string, messageId: string): Promise<GmailMessage> {
    return await this.modifyLabels(userId, messageId, undefined, ['UNREAD']);
  }

  /**
   * Mark message as unread
   *
   * @param userId - User ID
   * @param messageId - Message ID
   */
  static async markAsUnread(userId: string, messageId: string): Promise<GmailMessage> {
    return await this.modifyLabels(userId, messageId, ['UNREAD'], undefined);
  }

  /**
   * Get user's Gmail profile
   *
   * @param userId - User ID
   */
  static async getProfile(userId: string): Promise<{
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
  }> {
    return await this.apiRequest(userId, '/users/me/profile');
  }

  /**
   * Check if user has Gmail connected
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
   * Get unread message count
   *
   * @param userId - User ID
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const response = await this.listMessages(userId, 'is:unread', 1);
    return response.resultSizeEstimate || 0;
  }
}
