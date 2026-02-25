/**
 * Gmail MCP Operations
 * Operations for sending and managing emails via Gmail API
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getValidAccessToken } from '../utils/oauth.js';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  html?: boolean;
}

export interface GmailMessage {
  id?: string;
  threadId?: string;
}

/**
 * Helper: Get valid access token for Gmail
 * Uses the shared OAuth utility that handles decryption and automatic refresh
 */
async function getAccessToken(supabase: SupabaseClient, userId: string): Promise<string> {
  return await getValidAccessToken(supabase, userId, 'gmail');
}

/**
 * Helper: Make authenticated request to Gmail API
 */
async function apiRequest(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getAccessToken(supabase, userId);

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

  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

/**
 * Send an email via Gmail
 */
export async function sendEmail(
  supabase: SupabaseClient,
  userId: string,
  params: SendEmailParams
): Promise<GmailMessage> {
  const headers: string[] = [];

  const toAddresses = Array.isArray(params.to) ? params.to.join(', ') : params.to;
  headers.push(`To: ${toAddresses}`);
  headers.push(`Subject: ${params.subject}`);

  if (params.cc) {
    const ccAddresses = Array.isArray(params.cc) ? params.cc.join(', ') : params.cc;
    headers.push(`Cc: ${ccAddresses}`);
  }

  if (params.bcc) {
    const bccAddresses = Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc;
    headers.push(`Bcc: ${bccAddresses}`);
  }

  if (params.replyTo) {
    headers.push(`Reply-To: ${params.replyTo}`);
  }

  const contentType = params.html
    ? 'text/html; charset=utf-8'
    : 'text/plain; charset=utf-8';
  headers.push(`Content-Type: ${contentType}`);

  const email = [
    ...headers,
    '',
    params.body,
  ].join('\r\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return await apiRequest(supabase, userId, '/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });
}

/**
 * List/search messages in Gmail
 */
export async function listMessages(
  supabase: SupabaseClient,
  userId: string,
  query?: string,
  maxResults: number = 10
): Promise<{ messages: Array<{ id: string; threadId: string }>; resultSizeEstimate: number }> {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
  });

  if (query) params.append('q', query);

  const response = await apiRequest(
    supabase,
    userId,
    `/users/me/messages?${params.toString()}`
  );

  return {
    messages: response.messages || [],
    resultSizeEstimate: response.resultSizeEstimate || 0
  };
}

/**
 * Get a specific email message
 */
export async function getMessage(
  supabase: SupabaseClient,
  userId: string,
  messageId: string,
  format: 'full' | 'metadata' | 'minimal' | 'raw' = 'full'
): Promise<GmailMessage> {
  const params = new URLSearchParams({ format });

  return await apiRequest(
    supabase,
    userId,
    `/users/me/messages/${messageId}?${params.toString()}`
  );
}

/**
 * Get unread email count
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ count: number }> {
  const response = await listMessages(supabase, userId, 'is:unread', 1);
  return { count: response.resultSizeEstimate };
}

/**
 * Mark message as read
 */
export async function markAsRead(
  supabase: SupabaseClient,
  userId: string,
  messageId: string
): Promise<GmailMessage> {
  return await apiRequest(
    supabase,
    userId,
    `/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    }
  );
}

/**
 * Mark message as unread
 */
export async function markAsUnread(
  supabase: SupabaseClient,
  userId: string,
  messageId: string
): Promise<GmailMessage> {
  return await apiRequest(
    supabase,
    userId,
    `/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: ['UNREAD'],
      }),
    }
  );
}

/**
 * Get Gmail profile info
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}> {
  return await apiRequest(supabase, userId, '/users/me/profile');
}
