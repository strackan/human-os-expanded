/**
 * Google Calendar MCP Operations
 * Operations for managing calendar events and finding available time slots
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getValidAccessToken } from '../utils/oauth.js';

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

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
  }>;
}

export interface FindNextOpeningOptions {
  workingHours?: {
    start: string; // HH:MM format (e.g., '09:00')
    end: string;   // HH:MM format (e.g., '17:00')
  };
  businessDaysOnly?: boolean;
  returnMultipleOptions?: number; // Return N options (default: 1)
  calendarId?: string;
}

export interface TimeSlot {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

/**
 * Helper: Get valid access token for Google Calendar
 * Uses the shared OAuth utility that handles decryption and automatic refresh
 */
async function getAccessToken(supabase: SupabaseClient, userId: string): Promise<string> {
  return await getValidAccessToken(supabase, userId, 'google-calendar');
}

/**
 * Helper: Make authenticated request to Google Calendar API
 */
async function apiRequest(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getAccessToken(supabase, userId);

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
 * List calendar events for a date range
 */
export async function listCalendarEvents(
  supabase: SupabaseClient,
  userId: string,
  startDate?: string,
  endDate?: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  if (startDate) params.append('timeMin', startDate);
  if (endDate) params.append('timeMax', endDate);

  const response = await apiRequest(
    supabase,
    userId,
    `/calendars/primary/events?${params.toString()}`
  );

  return response.items || [];
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  supabase: SupabaseClient,
  userId: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  return await apiRequest(
    supabase,
    userId,
    `/calendars/primary/events`,
    {
      method: 'POST',
      body: JSON.stringify(event),
    }
  );
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  return await apiRequest(
    supabase,
    userId,
    `/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string
): Promise<void> {
  await apiRequest(
    supabase,
    userId,
    `/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Find next available time slot(s) in calendar
 *
 * Algorithm:
 * 1. Fetch calendar events for next 7 days (or until we find enough slots)
 * 2. Build "busy slots" array from events
 * 3. Iterate through business hours in 15-min increments
 * 4. Find slots where [slot_start, slot_start + duration] has no overlap
 * 5. Return requested number of available slots
 */
export async function findNextOpening(
  supabase: SupabaseClient,
  userId: string,
  durationMinutes: number,
  afterDate: string,
  options: FindNextOpeningOptions = {}
): Promise<TimeSlot[]> {
  const {
    workingHours = { start: '09:00', end: '17:00' },
    businessDaysOnly = true,
    returnMultipleOptions = 1,
    calendarId = 'primary'
  } = options;

  // Validate inputs
  if (durationMinutes <= 0 || durationMinutes > 480) {
    throw new Error('Duration must be between 1 and 480 minutes (8 hours)');
  }

  // Parse working hours
  const [startHour, startMin] = workingHours.start.split(':').map(Number);
  const [endHour, endMin] = workingHours.end.split(':').map(Number);

  // Fetch events for next 7 days
  const searchStartDate = new Date(afterDate);
  const searchEndDate = new Date(searchStartDate);
  searchEndDate.setDate(searchEndDate.getDate() + 7);

  const params = new URLSearchParams({
    maxResults: '100',
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: searchStartDate.toISOString(),
    timeMax: searchEndDate.toISOString(),
  });

  const response = await apiRequest(
    supabase,
    userId,
    `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
  );

  // Build busy slots array
  interface BusySlot {
    start: Date;
    end: Date;
  }

  const events = response.items || [];
  const busySlots: BusySlot[] = events
    .filter((event: any) => event.start?.dateTime && event.end?.dateTime)
    .map((event: any) => ({
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime)
    }))
    .sort((a: BusySlot, b: BusySlot) => a.start.getTime() - b.start.getTime());

  // Helper: Check if a slot overlaps with any busy slot
  const hasOverlap = (slotStart: Date, slotEnd: Date): boolean => {
    return busySlots.some(busy => {
      // Overlap occurs if:
      // - slot starts before busy ends AND
      // - slot ends after busy starts
      return slotStart < busy.end && slotEnd > busy.start;
    });
  };

  // Helper: Check if date is a business day (Mon-Fri)
  const isBusinessDay = (date: Date): boolean => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday = 1, Friday = 5
  };

  // Find available slots
  const availableSlots: TimeSlot[] = [];
  const currentDate = new Date(afterDate);
  const INCREMENT_MINUTES = 15; // Check every 15 minutes

  // Search up to 7 days ahead
  while (availableSlots.length < returnMultipleOptions && currentDate <= searchEndDate) {
    // Skip weekends if business days only
    if (businessDaysOnly && !isBusinessDay(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(startHour, startMin, 0, 0);
      continue;
    }

    // Set to start of working hours if before
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;

    if (currentTimeInMinutes < startTimeInMinutes) {
      currentDate.setHours(startHour, startMin, 0, 0);
    }

    // If past working hours, move to next day
    if (currentTimeInMinutes >= endTimeInMinutes) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(startHour, startMin, 0, 0);
      continue;
    }

    // Check if slot fits duration and doesn't overlap
    const slotStart = new Date(currentDate);
    const slotEnd = new Date(currentDate);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

    // Check if slot extends past working hours
    const slotEndHour = slotEnd.getHours();
    const slotEndMinute = slotEnd.getMinutes();
    const slotEndTimeInMinutes = slotEndHour * 60 + slotEndMinute;

    if (slotEndTimeInMinutes > endTimeInMinutes) {
      // Slot extends past working hours, move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(startHour, startMin, 0, 0);
      continue;
    }

    // Check for overlaps with busy slots
    if (!hasOverlap(slotStart, slotEnd)) {
      // Found an available slot!
      availableSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      });
    }

    // Move to next increment
    currentDate.setMinutes(currentDate.getMinutes() + INCREMENT_MINUTES);
  }

  if (availableSlots.length === 0) {
    throw new Error(`No available ${durationMinutes}-minute slots found in the next 7 days`);
  }

  return availableSlots;
}

/**
 * Get upcoming events (next N events starting from now)
 */
export async function getUpcomingEvents(
  supabase: SupabaseClient,
  userId: string,
  count: number = 5
): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString();

  const params = new URLSearchParams({
    maxResults: count.toString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin,
  });

  const response = await apiRequest(
    supabase,
    userId,
    `/calendars/primary/events?${params.toString()}`
  );

  return response.items || [];
}
