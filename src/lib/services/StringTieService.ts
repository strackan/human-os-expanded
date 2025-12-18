/**
 * String-Tie Service
 *
 * Service layer for the String-Tie standalone reminder system.
 * Handles CRUD operations, LLM parsing, reminder evaluation, and notifications.
 *
 * Phase 1.4: String-Tie Foundation - Service Layer
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { StringTieParser } from './StringTieParser';
import { StringTie, StringTieFilters, EnrichedStringTie, EnrichReminderResult, ContactEnrichment } from '@/types/string-ties';
import { DB_TABLES } from '@/lib/constants/database';
import { HumanOSClient } from '@/lib/mcp/clients/HumanOSClient';

// =====================================================
// Types
// =====================================================

/**
 * Result of evaluating all due reminders
 */
export interface EvaluationResults {
  evaluated: number;
  surfaced: number;
  errors: number;
  errorDetails?: Array<{ stringTieId: string; error: string }>;
}

/**
 * Input for creating a string tie via service
 */
export interface CreateStringTieServiceInput {
  content: string;
  source: 'manual' | 'chat_magic_snippet' | 'voice';
}

// =====================================================
// StringTieService
// =====================================================

export class StringTieService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Create a new string tie reminder
   *
   * @param userId - User ID creating the reminder
   * @param input - Reminder content and source
   * @returns Created string tie
   */
  async create(
    userId: string,
    input: CreateStringTieServiceInput
  ): Promise<StringTie> {
    try {
      console.log(`[StringTieService] Creating string tie for user ${userId}`);
      console.log(`[StringTieService] Input:`, input);

      // Get user's default offset
      const defaultOffset = await this.getUserDefaultOffset(userId);

      console.log(`[StringTieService] Using default offset: ${defaultOffset} minutes`);

      // Parse with LLM
      const parsed = await StringTieParser.parse(input.content, defaultOffset);

      console.log(`[StringTieService] Parsed result:`, parsed);

      // Calculate remind_at timestamp
      const remindAt = new Date(Date.now() + parsed.offsetMinutes * 60 * 1000);

      // Insert into database
      const { data, error } = await this.supabase
        .from(DB_TABLES.STRING_TIES)
        .insert({
          user_id: userId,
          content: input.content,
          reminder_text: parsed.reminderText,
          remind_at: remindAt.toISOString(),
          source: input.source,
          default_offset_minutes: defaultOffset,
          reminded: false,
          dismissed_at: null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create string tie: ${error.message}`);
      }

      console.log(`[StringTieService] Created string tie:`, data);

      return data as StringTie;
    } catch (error) {
      console.error('[StringTieService] Error creating string tie:', error);
      throw error;
    }
  }

  /**
   * List user's string ties with optional filters
   *
   * @param userId - User ID to filter by
   * @param filters - Optional filters
   * @returns Array of string ties
   */
  async list(
    userId: string,
    filters?: StringTieFilters
  ): Promise<StringTie[]> {
    try {
      console.log(`[StringTieService] Listing string ties for user ${userId}`);

      let query = this.supabase
        .from(DB_TABLES.STRING_TIES)
        .select('*')
        .eq('user_id', userId)
        .order('remind_at', { ascending: true });

      // Apply filters
      if (filters) {
        if (filters.reminded !== undefined) {
          query = query.eq('reminded', filters.reminded);
        }

        if (filters.dismissed !== undefined) {
          if (filters.dismissed) {
            query = query.not('dismissed_at', 'is', null);
          } else {
            query = query.is('dismissed_at', null);
          }
        }

        if (filters.source) {
          query = query.eq('source', filters.source);
        }

        if (filters.remindAfter) {
          query = query.gte('remind_at', filters.remindAfter);
        }

        if (filters.remindBefore) {
          query = query.lte('remind_at', filters.remindBefore);
        }

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list string ties: ${error.message}`);
      }

      console.log(`[StringTieService] Found ${data?.length || 0} string ties`);

      return data as StringTie[];
    } catch (error) {
      console.error('[StringTieService] Error listing string ties:', error);
      throw error;
    }
  }

  /**
   * Get a specific string tie by ID
   *
   * @param stringTieId - String tie ID
   * @param userId - User ID (for security check)
   * @returns String tie or null if not found
   */
  async get(stringTieId: string, userId: string): Promise<StringTie | null> {
    try {
      const { data, error } = await this.supabase
        .from(DB_TABLES.STRING_TIES)
        .select('*')
        .eq('id', stringTieId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw new Error(`Failed to get string tie: ${error.message}`);
      }

      return data as StringTie;
    } catch (error) {
      console.error('[StringTieService] Error getting string tie:', error);
      throw error;
    }
  }

  /**
   * Dismiss a string tie reminder
   *
   * @param stringTieId - String tie ID to dismiss
   * @param userId - User ID (for security check)
   */
  async dismiss(stringTieId: string, userId: string): Promise<void> {
    try {
      console.log(`[StringTieService] Dismissing string tie ${stringTieId}`);

      const now = new Date().toISOString();

      const { error } = await this.supabase
        .from(DB_TABLES.STRING_TIES)
        .update({
          dismissed_at: now
        })
        .eq('id', stringTieId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to dismiss string tie: ${error.message}`);
      }

      console.log(`[StringTieService] Dismissed string tie ${stringTieId}`);
    } catch (error) {
      console.error('[StringTieService] Error dismissing string tie:', error);
      throw error;
    }
  }

  /**
   * Snooze a string tie reminder by extending its remind_at time
   *
   * @param stringTieId - String tie ID to snooze
   * @param userId - User ID (for security check)
   * @param additionalMinutes - Minutes to add to current remind_at
   * @returns Updated string tie
   */
  async snooze(
    stringTieId: string,
    userId: string,
    additionalMinutes: number
  ): Promise<StringTie> {
    try {
      console.log(`[StringTieService] Snoozing string tie ${stringTieId} by ${additionalMinutes} minutes`);

      // Get current string tie
      const stringTie = await this.get(stringTieId, userId);

      if (!stringTie) {
        throw new Error('String tie not found');
      }

      // Calculate new remind_at
      const currentRemindAt = new Date(stringTie.remind_at);
      const newRemindAt = new Date(currentRemindAt.getTime() + additionalMinutes * 60 * 1000);

      // Update in database
      const { data, error } = await this.supabase
        .from(DB_TABLES.STRING_TIES)
        .update({
          remind_at: newRemindAt.toISOString(),
          reminded: false // Reset reminded flag so it surfaces again
        })
        .eq('id', stringTieId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to snooze string tie: ${error.message}`);
      }

      console.log(`[StringTieService] Snoozed string tie to ${newRemindAt.toISOString()}`);

      return data as StringTie;
    } catch (error) {
      console.error('[StringTieService] Error snoozing string tie:', error);
      throw error;
    }
  }

  /**
   * Evaluate all due reminders and surface them
   * Called by the cron job
   *
   * @returns Evaluation statistics
   */
  async evaluateDueReminders(): Promise<EvaluationResults> {
    const startTime = Date.now();
    let evaluated = 0;
    let surfaced = 0;
    let errors = 0;
    const errorDetails: Array<{ stringTieId: string; error: string }> = [];

    try {
      console.log('[StringTieService] Starting evaluation of due reminders...');

      // Get reminders that need to be surfaced
      const { data: reminders, error } = await this.supabase
        .rpc('get_string_ties_for_reminder', {
          p_evaluation_interval_minutes: 5
        });

      if (error) {
        throw new Error(`Failed to get reminders for evaluation: ${error.message}`);
      }

      if (!reminders || reminders.length === 0) {
        console.log('[StringTieService] No reminders to evaluate');
        return { evaluated: 0, surfaced: 0, errors: 0 };
      }

      console.log(`[StringTieService] Evaluating ${reminders.length} reminders`);

      // Process each reminder
      const results = await Promise.allSettled(
        reminders.map((reminder: any) => this.surfaceReminder(reminder))
      );

      // Collect results
      results.forEach((result, index) => {
        const reminder = reminders[index];
        evaluated++;

        if (result.status === 'fulfilled') {
          surfaced++;
        } else {
          errors++;
          errorDetails.push({
            stringTieId: reminder.string_tie_id,
            error: result.reason?.message || 'Unknown error'
          });
          console.error(
            `[StringTieService] Error surfacing reminder ${reminder.string_tie_id}:`,
            result.reason
          );
        }
      });

      const duration = Date.now() - startTime;
      console.log(
        `[StringTieService] Evaluation complete: ${evaluated} evaluated, ${surfaced} surfaced, ${errors} errors in ${duration}ms`
      );

      return {
        evaluated,
        surfaced,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined
      };
    } catch (error) {
      console.error('[StringTieService] Error evaluating due reminders:', error);
      throw error;
    }
  }

  /**
   * Surface a reminder to the user
   * Marks as reminded and sends notifications
   *
   * @param reminder - Reminder data from database
   */
  private async surfaceReminder(reminder: any): Promise<void> {
    try {
      const stringTieId = reminder.string_tie_id;
      const userId = reminder.user_id;

      console.log(`[StringTieService] Surfacing reminder ${stringTieId} for user ${userId}`);

      // Mark as reminded
      const { error: updateError } = await this.supabase
        .from(DB_TABLES.STRING_TIES)
        .update({
          reminded: true
        })
        .eq('id', stringTieId);

      if (updateError) {
        throw new Error(`Failed to mark reminder as surfaced: ${updateError.message}`);
      }

      // Create in-product notification
      await this.createReminderNotification(userId, stringTieId, reminder.reminder_text);

      console.log(`[StringTieService] Successfully surfaced reminder ${stringTieId}`);
    } catch (error) {
      console.error('[StringTieService] Error surfacing reminder:', error);
      throw error;
    }
  }

  /**
   * Create in-product notification for a reminder
   *
   * @param userId - User ID to notify
   * @param stringTieId - String tie ID
   * @param reminderText - Reminder text to display
   */
  private async createReminderNotification(
    userId: string,
    stringTieId: string,
    reminderText: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(DB_TABLES.IN_PRODUCT_NOTIFICATIONS)
        .insert({
          user_id: userId,
          notification_type: 'string_tie_reminder',
          message: reminderText,
          link_url: `/string-ties/${stringTieId}`,
          link_text: 'View Reminder',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[StringTieService] Error creating notification:', error);
        // Don't throw - notification failures shouldn't break reminder surfacing
      } else {
        console.log(`[StringTieService] Created notification for user ${userId}`);
      }
    } catch (error) {
      console.error('[StringTieService] Error creating reminder notification:', error);
      // Don't throw - notification failures shouldn't break reminder surfacing
    }
  }

  /**
   * Get user's default offset setting
   *
   * @param userId - User ID
   * @returns Default offset in minutes (default: 60)
   */
  async getUserDefaultOffset(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from(DB_TABLES.USER_SETTINGS)
        .select('string_tie_default_offset_minutes')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings record exists, return default
          console.log(`[StringTieService] No settings found for user ${userId}, using default`);
          return 60;
        }
        throw new Error(`Failed to get user default offset: ${error.message}`);
      }

      return data.string_tie_default_offset_minutes || 60;
    } catch (error) {
      console.error('[StringTieService] Error getting user default offset:', error);
      // Return default on error
      return 60;
    }
  }

  /**
   * Set user's default offset setting
   *
   * @param userId - User ID
   * @param minutes - Default offset in minutes
   */
  async setUserDefaultOffset(userId: string, minutes: number): Promise<void> {
    try {
      console.log(`[StringTieService] Setting default offset for user ${userId}: ${minutes} minutes`);

      // Try to update existing settings
      const { data: existingSettings } = await this.supabase
        .from(DB_TABLES.USER_SETTINGS)
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingSettings) {
        // Update existing
        const { error } = await this.supabase
          .from(DB_TABLES.USER_SETTINGS)
          .update({
            string_tie_default_offset_minutes: minutes
          })
          .eq('user_id', userId);

        if (error) {
          throw new Error(`Failed to update user settings: ${error.message}`);
        }
      } else {
        // Create new settings record
        const { error } = await this.supabase
          .from(DB_TABLES.USER_SETTINGS)
          .insert({
            user_id: userId,
            string_tie_default_offset_minutes: minutes
          });

        if (error) {
          throw new Error(`Failed to create user settings: ${error.message}`);
        }
      }

      console.log(`[StringTieService] Successfully set default offset for user ${userId}`);
    } catch (error) {
      console.error('[StringTieService] Error setting user default offset:', error);
      throw error;
    }
  }

  /**
   * Create a string tie from already-parsed reminder data
   * Used when caller has already run LLM parsing
   *
   * @param userId - User ID creating the reminder
   * @param parsed - Pre-parsed reminder data
   * @returns Created string tie
   */
  async createFromParsed(
    userId: string,
    parsed: {
      reminderText: string;
      offsetMinutes: number;
      priority?: 'low' | 'medium' | 'high';
    }
  ): Promise<StringTie> {
    try {
      console.log(`[StringTieService] Creating string tie from parsed data for user ${userId}`);
      console.log(`[StringTieService] Parsed:`, parsed);

      // Calculate remind_at timestamp
      const remindAt = new Date(Date.now() + parsed.offsetMinutes * 60 * 1000);

      // Insert into database
      const { data, error } = await this.supabase
        .from(DB_TABLES.STRING_TIES)
        .insert({
          user_id: userId,
          content: parsed.reminderText, // Use reminder text as content
          reminder_text: parsed.reminderText,
          remind_at: remindAt.toISOString(),
          source: 'manual', // Assume manual for pre-parsed reminders
          default_offset_minutes: parsed.offsetMinutes,
          reminded: false,
          dismissed_at: null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create string tie: ${error.message}`);
      }

      console.log(`[StringTieService] Created string tie:`, data);

      return data as StringTie;
    } catch (error) {
      console.error('[StringTieService] Error creating string tie from parsed:', error);
      throw error;
    }
  }

  // =====================================================
  // Human-OS Enrichment (0.2.0)
  // =====================================================

  /**
   * Enrich a reminder with Human-OS contact data
   * Called when surfacing a reminder to provide additional context
   *
   * @param stringTie - String tie to enrich
   * @param contactNames - Names of contacts mentioned in the reminder
   * @param companyName - Optional company name for context
   * @returns Enriched string tie with contact data
   */
  async enrichReminder(
    stringTie: StringTie,
    contactNames: string[],
    companyName?: string
  ): Promise<EnrichReminderResult> {
    const startTime = Date.now();

    try {
      console.log(`[StringTieService] Enriching reminder ${stringTie.id} with ${contactNames.length} contacts`);

      const humanOS = new HumanOSClient();

      // Check if Human-OS is available
      if (!humanOS.isEnabled()) {
        console.log('[StringTieService] Human-OS not available, returning unenriched');
        return {
          stringTie,
          enrichment: {
            contacts: [],
            enrichedAt: new Date().toISOString(),
            humanOSAvailable: false,
          },
          success: true,
        };
      }

      // Enrich each contact
      const contactEnrichments: ContactEnrichment[] = [];

      for (const contactName of contactNames.slice(0, 3)) { // Limit to 3 contacts for performance
        try {
          const enrichment = await humanOS.enrichContact({
            contact_name: contactName,
            company_name: companyName,
          });

          if (enrichment.found && enrichment.contact) {
            contactEnrichments.push({
              name: contactName,
              headline: enrichment.contact.headline,
              linkedinUrl: enrichment.contact.linkedin_url,
              recentPosts: enrichment.contact.recent_posts?.slice(0, 2).map((post) => ({
                content: post.content.slice(0, 200),
                date: post.posted_at,
              })),
              lastEnrichedAt: new Date().toISOString(),
            });
          }
        } catch (contactError) {
          console.warn(`[StringTieService] Failed to enrich contact ${contactName}:`, contactError);
          // Continue with other contacts
        }
      }

      // Generate suggested approach based on enrichment
      const suggestedApproach = this.generateSuggestedApproach(contactEnrichments);

      const enrichment: EnrichedStringTie['enrichment'] = {
        contacts: contactEnrichments,
        suggestedApproach,
        enrichedAt: new Date().toISOString(),
        humanOSAvailable: true,
      };

      const duration = Date.now() - startTime;
      console.log(`[StringTieService] Enriched reminder in ${duration}ms with ${contactEnrichments.length} contacts`);

      return {
        stringTie,
        enrichment,
        success: true,
      };
    } catch (error) {
      console.error('[StringTieService] Error enriching reminder:', error);
      return {
        stringTie,
        enrichment: {
          contacts: [],
          enrichedAt: new Date().toISOString(),
          humanOSAvailable: false,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a suggested approach based on contact enrichment
   */
  private generateSuggestedApproach(
    contacts: ContactEnrichment[]
  ): string | undefined {
    if (contacts.length === 0) {
      return undefined;
    }

    const suggestions: string[] = [];

    for (const contact of contacts) {
      // Check for recent LinkedIn activity
      if (contact.recentPosts && contact.recentPosts.length > 0) {
        suggestions.push(`${contact.name} recently posted on LinkedIn - good time for outreach`);
      }

      // Check for job title/headline
      if (contact.headline) {
        const lowerHeadline = contact.headline.toLowerCase();
        if (lowerHeadline.includes('vp') || lowerHeadline.includes('director') || lowerHeadline.includes('head of')) {
          suggestions.push(`${contact.name} is a senior stakeholder (${contact.headline})`);
        }
      }
    }

    if (suggestions.length === 0) {
      return undefined;
    }

    return suggestions.join('. ') + '.';
  }

  /**
   * Get enriched string ties for a user
   * Combines string ties with Human-OS enrichment
   *
   * @param userId - User ID
   * @param filters - Optional filters
   * @returns Array of enriched string ties
   */
  async listEnriched(
    userId: string,
    filters?: StringTieFilters
  ): Promise<EnrichedStringTie[]> {
    try {
      // Get base string ties
      const stringTies = await this.list(userId, filters);

      // For now, return without enrichment (enrichment is done on-demand when surfacing)
      // Full enrichment would be too expensive for list operations
      return stringTies.map((st) => ({
        ...st,
        enrichment: undefined,
      }));
    } catch (error) {
      console.error('[StringTieService] Error listing enriched string ties:', error);
      throw error;
    }
  }
}
