import { createClient } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, addMinutes, format, isWithinInterval, parseISO, startOfDay } from 'date-fns';

/**
 * CalendarService
 *
 * Manages calendar integrations (Google Calendar, Microsoft Outlook) with OAuth authentication.
 * Provides intelligent scheduling via the findNextOpening() algorithm.
 *
 * Key Features:
 * - OAuth token management with refresh
 * - Fetch/create calendar events
 * - findNextOpening() - AI-powered slot finder
 * - Energy-aware scheduling
 * - Buffer time and task type awareness
 * - Pattern learning integration
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CalendarProvider = 'google' | 'microsoft';
export type TaskType = 'deep' | 'admin' | 'meeting' | 'personal' | 'customer';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
  isAllDay?: boolean;
  provider: CalendarProvider;
  externalId: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
  score: number; // 0-100, higher is better
  reasoning?: string; // Why this slot is good
}

export interface FindOpeningOptions {
  userId: string;
  durationMinutes: number;
  windowDays?: number; // Default 14
  taskType?: TaskType;
  preferences?: {
    preferredHours?: [number, number]; // [9, 17] = 9am-5pm
    avoidDays?: string[]; // ['friday-afternoon', 'monday-morning']
    minBufferBefore?: number; // Minutes
    minBufferAfter?: number; // Minutes
    requireFocusBlock?: boolean; // Must be in a designated focus block
  };
  supabaseClient?: SupabaseClient;
}

export interface AvailabilityWindow {
  date: Date;
  totalMinutes: number;
  availableMinutes: number;
  scheduledMinutes: number;
  slots: TimeSlot[];
  meetingCount: number;
  focusBlocks: TimeSlot[];
}

export interface WorkHours {
  [key: string]: { start: string; end: string } | null; // 'monday': { start: '09:00', end: '17:00' }
}

export interface CalendarIntegration {
  id: string;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  calendarId?: string;
  isActive: boolean;
}

// ============================================================================
// CALENDAR SERVICE
// ============================================================================

export class CalendarService {
  /**
   * Connect a calendar provider via OAuth
   * Returns the OAuth authorization URL for user to visit
   */
  static async initiateOAuth(
    provider: CalendarProvider,
    userId: string,
    redirectUri: string,
    supabaseClient?: SupabaseClient
  ): Promise<string> {
    // This will be implemented with actual OAuth libraries
    // For now, return placeholder URL
    const authUrl = provider === 'google'
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/calendar.events`
      : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${redirectUri}&response_type=code&scope=Calendars.ReadWrite`;

    return authUrl;
  }

  /**
   * Exchange OAuth code for tokens and store in database
   */
  static async handleOAuthCallback(
    provider: CalendarProvider,
    code: string,
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<CalendarIntegration> {
    const supabase = supabaseClient || createClient();

    // TODO: Exchange code for tokens with provider API
    // For now, create placeholder integration
    const { data, error } = await supabase
      .from('user_calendar_integrations')
      .insert({
        user_id: userId,
        provider,
        access_token: 'placeholder_token',
        refresh_token: 'placeholder_refresh',
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        sync_enabled: true,
        write_enabled: true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store calendar integration: ${error.message}`);
    }

    return {
      id: data.id,
      provider: data.provider,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.token_expires_at),
      calendarId: data.calendar_id,
      isActive: data.is_active,
    };
  }

  /**
   * Get active calendar integrations for user
   */
  static async getIntegrations(
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<CalendarIntegration[]> {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('user_calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch calendar integrations: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      provider: item.provider,
      accessToken: item.access_token,
      refreshToken: item.refresh_token,
      expiresAt: new Date(item.token_expires_at),
      calendarId: item.calendar_id,
      isActive: item.is_active,
    }));
  }

  /**
   * Fetch calendar events for a date range
   * Combines events from all active integrations
   */
  static async getEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
    supabaseClient?: SupabaseClient
  ): Promise<CalendarEvent[]> {
    const integrations = await this.getIntegrations(userId, supabaseClient);

    // TODO: Fetch from actual calendar APIs
    // For now, return mock events
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Team Standup',
        start: addDays(startDate, 1),
        end: addMinutes(addDays(startDate, 1), 30),
        provider: 'google',
        externalId: 'google_event_1',
      },
      {
        id: '2',
        title: 'Client Call - Acme Corp',
        start: addDays(startDate, 2),
        end: addMinutes(addDays(startDate, 2), 60),
        provider: 'google',
        externalId: 'google_event_2',
      },
    ];

    return mockEvents;
  }

  /**
   * Create a calendar event
   */
  static async createEvent(
    userId: string,
    event: Omit<CalendarEvent, 'id' | 'externalId'>,
    supabaseClient?: SupabaseClient
  ): Promise<CalendarEvent> {
    const integrations = await this.getIntegrations(userId, supabaseClient);

    if (integrations.length === 0) {
      throw new Error('No active calendar integrations');
    }

    // Use first active integration
    const integration = integrations[0];

    // TODO: Create event via API
    // For now, return mock created event
    const createdEvent: CalendarEvent = {
      ...event,
      id: `evt_${Date.now()}`,
      externalId: `${integration.provider}_${Date.now()}`,
    };

    return createdEvent;
  }

  /**
   * Get user's work hours preferences
   */
  static async getWorkHours(
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<WorkHours> {
    const supabase = supabaseClient || createClient();

    const { data, error } = await supabase
      .from('user_calendar_preferences')
      .select('preference_data')
      .eq('user_id', userId)
      .eq('preference_type', 'work_hours')
      .single();

    if (error || !data) {
      // Return default work hours
      return {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null,
      };
    }

    return data.preference_data as WorkHours;
  }

  /**
   * Get user's focus blocks (best times for deep work)
   */
  static async getFocusBlocks(
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<{ [day: string]: string[] }> {
    const supabase = supabaseClient || createClient();

    const { data } = await supabase
      .from('user_calendar_preferences')
      .select('preference_data')
      .eq('user_id', userId)
      .eq('preference_type', 'focus_blocks')
      .single();

    if (!data) {
      return {
        monday: ['09:00-12:00'],
        tuesday: ['09:00-12:00'],
        wednesday: ['09:00-12:00'],
        thursday: ['09:00-12:00'],
        friday: ['09:00-12:00'],
      };
    }

    return data.preference_data as { [day: string]: string[] };
  }

  /**
   * Get buffer time preferences
   */
  static async getBufferTimePreferences(
    userId: string,
    supabaseClient?: SupabaseClient
  ): Promise<{ before_meetings: number; after_meetings: number; between_tasks: number }> {
    const supabase = supabaseClient || createClient();

    const { data } = await supabase
      .from('user_calendar_preferences')
      .select('preference_data')
      .eq('user_id', userId)
      .eq('preference_type', 'buffer_time')
      .single();

    if (!data) {
      return { before_meetings: 5, after_meetings: 10, between_tasks: 15 };
    }

    return data.preference_data as { before_meetings: number; after_meetings: number; between_tasks: number };
  }

  /**
   * findNextOpening() - THE MAGIC ALGORITHM
   *
   * Finds the next available calendar slot with intelligent scoring based on:
   * - Work hours and availability
   * - Energy levels (morning vs afternoon)
   * - Task type alignment (deep work needs longer, uninterrupted blocks)
   * - Focus block preferences
   * - Buffer time around meetings
   * - Context switching minimization
   */
  static async findNextOpening(
    options: FindOpeningOptions
  ): Promise<TimeSlot | null> {
    const {
      userId,
      durationMinutes,
      windowDays = 14,
      taskType = 'admin',
      preferences = {},
      supabaseClient,
    } = options;

    try {
      // 1. Get user preferences
      const workHours = await this.getWorkHours(userId, supabaseClient);
      const focusBlocks = await this.getFocusBlocks(userId, supabaseClient);
      const bufferPrefs = await this.getBufferTimePreferences(userId, supabaseClient);

      // 2. Get existing calendar events
      const startDate = startOfDay(new Date());
      const endDate = addDays(startDate, windowDays);
      const events = await this.getEvents(userId, startDate, endDate, supabaseClient);

      // 3. Generate all potential slots
      const potentialSlots: TimeSlot[] = [];

      for (let day = 0; day < windowDays; day++) {
        const currentDate = addDays(startDate, day);
        const dayName = format(currentDate, 'EEEE').toLowerCase();

        // Skip if no work hours for this day
        const dayWorkHours = workHours[dayName];
        if (!dayWorkHours) continue;

        // Parse work hours
        const [startHour, startMinute] = dayWorkHours.start.split(':').map(Number);
        const [endHour, endMinute] = dayWorkHours.end.split(':').map(Number);

        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Find gaps in the schedule
        const daySlots = this.findSlotsInDay(
          dayStart,
          dayEnd,
          events,
          durationMinutes,
          bufferPrefs
        );

        potentialSlots.push(...daySlots);
      }

      if (potentialSlots.length === 0) {
        return null;
      }

      // 4. Score each slot based on multiple factors
      const scoredSlots = potentialSlots.map(slot => {
        const score = this.scoreSlot(slot, {
          taskType,
          focusBlocks,
          preferences,
          events,
        });

        return {
          ...slot,
          score,
          reasoning: this.generateSlotReasoning(slot, score, taskType),
        };
      });

      // 5. Sort by score and return best slot
      scoredSlots.sort((a, b) => b.score - a.score);

      return scoredSlots[0];
    } catch (error) {
      console.error('CalendarService.findNextOpening error:', error);
      return null;
    }
  }

  /**
   * Find available time slots within a single day
   */
  private static findSlotsInDay(
    dayStart: Date,
    dayEnd: Date,
    events: CalendarEvent[],
    durationMinutes: number,
    bufferPrefs: { before_meetings: number; after_meetings: number; between_tasks: number }
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Filter events for this day
    const dayEvents = events.filter(event =>
      isWithinInterval(event.start, { start: dayStart, end: dayEnd })
    ).sort((a, b) => a.start.getTime() - b.start.getTime());

    let currentTime = dayStart;

    for (const event of dayEvents) {
      // Add buffer before meeting
      const eventStartWithBuffer = addMinutes(event.start, -bufferPrefs.before_meetings);

      // Check if there's a gap before this event
      const gapMinutes = (eventStartWithBuffer.getTime() - currentTime.getTime()) / (1000 * 60);

      if (gapMinutes >= durationMinutes) {
        slots.push({
          start: currentTime,
          end: addMinutes(currentTime, durationMinutes),
          durationMinutes,
          score: 50, // Base score, will be adjusted later
        });
      }

      // Move current time to after this event (with buffer)
      currentTime = addMinutes(event.end, bufferPrefs.after_meetings);
    }

    // Check for slot at end of day
    const remainingMinutes = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    if (remainingMinutes >= durationMinutes) {
      slots.push({
        start: currentTime,
        end: addMinutes(currentTime, durationMinutes),
        durationMinutes,
        score: 50,
      });
    }

    return slots;
  }

  /**
   * Score a time slot based on multiple factors
   */
  private static scoreSlot(
    slot: TimeSlot,
    context: {
      taskType: TaskType;
      focusBlocks: { [day: string]: string[] };
      preferences: FindOpeningOptions['preferences'];
      events: CalendarEvent[];
    }
  ): number {
    let score = 50; // Base score

    const hour = slot.start.getHours();
    const dayName = format(slot.start, 'EEEE').toLowerCase();

    // 1. Task type alignment (+30 points max)
    if (context.taskType === 'deep') {
      // Deep work prefers morning focus blocks
      if (hour >= 9 && hour < 12) {
        score += 30;
      } else if (hour >= 14 && hour < 16) {
        score += 15; // Afternoon is okay but not ideal
      }

      // Bonus for focus blocks
      const dayFocusBlocks = context.focusBlocks[dayName] || [];
      const inFocusBlock = this.isInFocusBlock(slot, dayFocusBlocks);
      if (inFocusBlock) {
        score += 20;
      }
    } else if (context.taskType === 'meeting' || context.taskType === 'customer') {
      // Meetings prefer afternoon
      if (hour >= 14 && hour < 17) {
        score += 20;
      }
    } else if (context.taskType === 'admin') {
      // Admin tasks flexible, slight preference for afternoon
      if (hour >= 14 && hour < 16) {
        score += 10;
      }
    }

    // 2. Energy level bonus (+20 points max)
    // Morning = high energy
    if (hour >= 9 && hour < 11) {
      score += 20;
    } else if (hour >= 11 && hour < 13) {
      score += 10; // Late morning still good
    } else if (hour >= 15 && hour < 17) {
      score += 5; // Mid-afternoon okay
    }

    // 3. Avoid edge cases (-10 to -20 points)
    if (hour < 9 || hour >= 17) {
      score -= 20; // Outside typical work hours
    }

    if (hour >= 12 && hour < 14) {
      score -= 10; // Lunch time
    }

    // 4. Context switching penalty (-15 points)
    // If there's a meeting right before or after, penalize
    const hasNearbyMeeting = context.events.some(event => {
      const timeDiff = Math.abs(event.start.getTime() - slot.start.getTime()) / (1000 * 60);
      return timeDiff < 30;
    });

    if (hasNearbyMeeting && context.taskType === 'deep') {
      score -= 15;
    }

    // 5. Preferred hours bonus (+15 points)
    if (context.preferences?.preferredHours) {
      const [prefStart, prefEnd] = context.preferences.preferredHours;
      if (hour >= prefStart && hour < prefEnd) {
        score += 15;
      }
    }

    // 6. Avoid specified days/times
    if (context.preferences?.avoidDays) {
      const dayPart = hour < 12 ? 'morning' : 'afternoon';
      const avoidKey = `${dayName}-${dayPart}`;
      if (context.preferences.avoidDays.includes(avoidKey)) {
        score -= 30;
      }
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if a slot is within a focus block
   */
  private static isInFocusBlock(slot: TimeSlot, focusBlocks: string[]): boolean {
    const slotHour = slot.start.getHours();
    const slotMinute = slot.start.getMinutes();

    return focusBlocks.some(block => {
      const [start, end] = block.split('-');
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      const slotMinutes = slotHour * 60 + slotMinute;
      const blockStart = startHour * 60 + startMinute;
      const blockEnd = endHour * 60 + endMinute;

      return slotMinutes >= blockStart && slotMinutes < blockEnd;
    });
  }

  /**
   * Generate human-readable reasoning for why a slot is good
   */
  private static generateSlotReasoning(
    slot: TimeSlot,
    score: number,
    taskType: TaskType
  ): string {
    const hour = slot.start.getHours();
    const dayName = format(slot.start, 'EEEE');

    let reasoning = '';

    if (score >= 80) {
      reasoning = `Excellent time - `;
    } else if (score >= 60) {
      reasoning = `Good time - `;
    } else {
      reasoning = `Available - `;
    }

    if (taskType === 'deep') {
      if (hour >= 9 && hour < 12) {
        reasoning += 'morning focus block, high energy';
      } else {
        reasoning += 'quiet time for focused work';
      }
    } else if (taskType === 'meeting' || taskType === 'customer') {
      if (hour >= 14 && hour < 17) {
        reasoning += 'afternoon slot, good for meetings';
      } else {
        reasoning += `${dayName} ${format(slot.start, 'h:mma')} available`;
      }
    } else {
      reasoning += `${dayName} ${format(slot.start, 'h:mma')}`;
    }

    return reasoning;
  }

  /**
   * Get availability analysis for a week
   */
  static async getWeeklyAvailability(
    userId: string,
    weekStart: Date,
    supabaseClient?: SupabaseClient
  ): Promise<AvailabilityWindow[]> {
    const windows: AvailabilityWindow[] = [];

    for (let day = 0; day < 7; day++) {
      const date = addDays(weekStart, day);
      const dayEnd = addDays(date, 1);

      const events = await this.getEvents(userId, date, dayEnd, supabaseClient);
      const workHours = await this.getWorkHours(userId, supabaseClient);
      const focusBlocks = await this.getFocusBlocks(userId, supabaseClient);

      const dayName = format(date, 'EEEE').toLowerCase();
      const dayWorkHours = workHours[dayName];

      if (!dayWorkHours) {
        windows.push({
          date,
          totalMinutes: 0,
          availableMinutes: 0,
          scheduledMinutes: 0,
          slots: [],
          meetingCount: 0,
          focusBlocks: [],
        });
        continue;
      }

      // Calculate total work minutes
      const [startHour, startMinute] = dayWorkHours.start.split(':').map(Number);
      const [endHour, endMinute] = dayWorkHours.end.split(':').map(Number);
      const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

      // Calculate scheduled minutes
      const scheduledMinutes = events.reduce((sum, event) => {
        const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
        return sum + duration;
      }, 0);

      const availableMinutes = totalMinutes - scheduledMinutes;

      windows.push({
        date,
        totalMinutes,
        availableMinutes,
        scheduledMinutes,
        slots: [],
        meetingCount: events.length,
        focusBlocks: [],
      });
    }

    return windows;
  }
}
