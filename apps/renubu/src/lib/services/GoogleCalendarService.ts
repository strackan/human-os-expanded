/**
 * Google Calendar Service
 *
 * Wrapper for Google Calendar API operations using OAuth tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #3
 */

import { OAuthService } from './OAuthService';
import { createServiceRoleClient } from '@/lib/supabase-server';

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string; // ISO 8601 format
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
}

export interface CalendarListResponse {
  items: Array<{
    id: string;
    summary: string;
    description?: string;
    timeZone?: string;
    primary?: boolean;
  }>;
}

export interface EventListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

/**
 * Google Calendar Service
 */
export class GoogleCalendarService {
  /**
   * Get user's calendar integration ID
   */
  private static async getUserIntegrationId(userId: string): Promise<string> {
    const supabase = createServiceRoleClient();

    const { data: integration } = await supabase
      .from('mcp_integrations')
      .select('id')
      .eq('slug', 'google-calendar')
      .single();

    if (!integration) {
      throw new Error('Google Calendar integration not found');
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
      throw new Error('Google Calendar not connected for this user');
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
      'google-calendar'
    );
  }

  /**
   * Make authenticated request to Google Calendar API
   */
  private static async apiRequest(
    userId: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const accessToken = await this.getAccessToken(userId);

    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * List user's calendars
   */
  static async listCalendars(userId: string): Promise<CalendarListResponse> {
    return await this.apiRequest(userId, '/users/me/calendarList');
  }

  /**
   * Get primary calendar ID
   */
  static async getPrimaryCalendarId(userId: string): Promise<string> {
    const calendars = await this.listCalendars(userId);
    const primary = calendars.items.find((cal) => cal.primary);
    return primary?.id || 'primary';
  }

  /**
   * List events from a calendar
   *
   * @param userId - User ID
   * @param calendarId - Calendar ID (default: 'primary')
   * @param timeMin - Start time (ISO 8601)
   * @param timeMax - End time (ISO 8601)
   * @param maxResults - Max number of results (default: 10)
   */
  static async listEvents(
    userId: string,
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10
  ): Promise<EventListResponse> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    return await this.apiRequest(
      userId,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );
  }

  /**
   * Create a new calendar event
   *
   * @param userId - User ID
   * @param event - Event details
   * @param calendarId - Calendar ID (default: 'primary')
   * @param sendUpdates - Send email notifications? (default: 'none')
   */
  static async createEvent(
    userId: string,
    event: CalendarEvent,
    calendarId: string = 'primary',
    sendUpdates: 'all' | 'externalOnly' | 'none' = 'none'
  ): Promise<CalendarEvent> {
    const params = new URLSearchParams({
      sendUpdates,
    });

    // Add conferenceDataVersion if requesting meet link
    if (event.conferenceData) {
      params.append('conferenceDataVersion', '1');
    }

    return await this.apiRequest(
      userId,
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );
  }

  /**
   * Update an existing calendar event
   *
   * @param userId - User ID
   * @param eventId - Event ID
   * @param event - Updated event details
   * @param calendarId - Calendar ID (default: 'primary')
   * @param sendUpdates - Send email notifications? (default: 'none')
   */
  static async updateEvent(
    userId: string,
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = 'primary',
    sendUpdates: 'all' | 'externalOnly' | 'none' = 'none'
  ): Promise<CalendarEvent> {
    const params = new URLSearchParams({
      sendUpdates,
    });

    return await this.apiRequest(
      userId,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?${params.toString()}`,
      {
        method: 'PATCH',
        body: JSON.stringify(event),
      }
    );
  }

  /**
   * Delete a calendar event
   *
   * @param userId - User ID
   * @param eventId - Event ID
   * @param calendarId - Calendar ID (default: 'primary')
   * @param sendUpdates - Send email notifications? (default: 'none')
   */
  static async deleteEvent(
    userId: string,
    eventId: string,
    calendarId: string = 'primary',
    sendUpdates: 'all' | 'externalOnly' | 'none' = 'none'
  ): Promise<void> {
    const params = new URLSearchParams({
      sendUpdates,
    });

    await this.apiRequest(
      userId,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?${params.toString()}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Get a specific event
   *
   * @param userId - User ID
   * @param eventId - Event ID
   * @param calendarId - Calendar ID (default: 'primary')
   */
  static async getEvent(
    userId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    return await this.apiRequest(
      userId,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
    );
  }

  /**
   * Get upcoming events (next N events starting from now)
   *
   * @param userId - User ID
   * @param count - Number of events to retrieve (default: 5)
   * @param calendarId - Calendar ID (default: 'primary')
   */
  static async getUpcomingEvents(
    userId: string,
    count: number = 5,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent[]> {
    const timeMin = new Date().toISOString();

    const response = await this.listEvents(
      userId,
      calendarId,
      timeMin,
      undefined,
      count
    );

    return response.items;
  }

  /**
   * Check if user has Google Calendar connected
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
}
