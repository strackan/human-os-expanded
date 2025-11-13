/**
 * Google Calendar Service
 *
 * Wrapper for Google Calendar API operations using OAuth tokens
 *
 * Phase: 0.2 - MCP Registry & Integrations
 * Issue: #3
 */
export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
        dateTime: string;
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
export declare class GoogleCalendarService {
    /**
     * Get user's calendar integration ID
     */
    private static getUserIntegrationId;
    /**
     * Get valid access token for user
     */
    private static getAccessToken;
    /**
     * Make authenticated request to Google Calendar API
     */
    private static apiRequest;
    /**
     * List user's calendars
     */
    static listCalendars(userId: string): Promise<CalendarListResponse>;
    /**
     * Get primary calendar ID
     */
    static getPrimaryCalendarId(userId: string): Promise<string>;
    /**
     * List events from a calendar
     *
     * @param userId - User ID
     * @param calendarId - Calendar ID (default: 'primary')
     * @param timeMin - Start time (ISO 8601)
     * @param timeMax - End time (ISO 8601)
     * @param maxResults - Max number of results (default: 10)
     */
    static listEvents(userId: string, calendarId?: string, timeMin?: string, timeMax?: string, maxResults?: number): Promise<EventListResponse>;
    /**
     * Create a new calendar event
     *
     * @param userId - User ID
     * @param event - Event details
     * @param calendarId - Calendar ID (default: 'primary')
     * @param sendUpdates - Send email notifications? (default: 'none')
     */
    static createEvent(userId: string, event: CalendarEvent, calendarId?: string, sendUpdates?: 'all' | 'externalOnly' | 'none'): Promise<CalendarEvent>;
    /**
     * Update an existing calendar event
     *
     * @param userId - User ID
     * @param eventId - Event ID
     * @param event - Updated event details
     * @param calendarId - Calendar ID (default: 'primary')
     * @param sendUpdates - Send email notifications? (default: 'none')
     */
    static updateEvent(userId: string, eventId: string, event: Partial<CalendarEvent>, calendarId?: string, sendUpdates?: 'all' | 'externalOnly' | 'none'): Promise<CalendarEvent>;
    /**
     * Delete a calendar event
     *
     * @param userId - User ID
     * @param eventId - Event ID
     * @param calendarId - Calendar ID (default: 'primary')
     * @param sendUpdates - Send email notifications? (default: 'none')
     */
    static deleteEvent(userId: string, eventId: string, calendarId?: string, sendUpdates?: 'all' | 'externalOnly' | 'none'): Promise<void>;
    /**
     * Get a specific event
     *
     * @param userId - User ID
     * @param eventId - Event ID
     * @param calendarId - Calendar ID (default: 'primary')
     */
    static getEvent(userId: string, eventId: string, calendarId?: string): Promise<CalendarEvent>;
    /**
     * Get upcoming events (next N events starting from now)
     *
     * @param userId - User ID
     * @param count - Number of events to retrieve (default: 5)
     * @param calendarId - Calendar ID (default: 'primary')
     */
    static getUpcomingEvents(userId: string, count?: number, calendarId?: string): Promise<CalendarEvent[]>;
    /**
     * Check if user has Google Calendar connected
     *
     * @param userId - User ID
     * @returns True if connected and active
     */
    static isConnected(userId: string): Promise<boolean>;
}
//# sourceMappingURL=GoogleCalendarService.d.ts.map