/**
 * String-Tie Types
 *
 * Type definitions for the String-Tie standalone reminder system.
 * "Tie a string around your finger" - voice-first lightweight reminders.
 *
 * Phase 1.4: String-Tie Foundation
 */

// =====================================================
// Core String-Tie Types
// =====================================================

/**
 * How a string-tie reminder was created
 */
export type StringTieSource = 'manual' | 'chat_magic_snippet' | 'voice';

/**
 * Complete string-tie record from database
 */
export interface StringTie {
  id: string;
  user_id: string;

  // Content
  content: string;              // Original user input
  reminder_text: string;        // LLM-parsed reminder description

  // Timing
  remind_at: string;            // ISO 8601 timestamp when to surface reminder
  reminded: boolean;            // Has it been shown to user?
  dismissed_at: string | null;  // When user dismissed it (null if active)

  // Metadata
  source: StringTieSource;
  default_offset_minutes: number | null;  // Snapshot of user's default at creation

  // Timestamps
  created_at: string;
}

// =====================================================
// Input Types
// =====================================================

/**
 * Input for creating a new string-tie reminder
 */
export interface CreateStringTieInput {
  content: string;              // Original user input
  reminder_text: string;        // LLM-parsed reminder text
  remind_at: string;            // ISO 8601 timestamp
  source: StringTieSource;
  default_offset_minutes?: number;  // Optional snapshot
}

/**
 * Input for updating a string-tie reminder
 */
export interface UpdateStringTieInput {
  reminded?: boolean;
  dismissed_at?: string;
  reminder_text?: string;
  remind_at?: string;
}

// =====================================================
// LLM Parser Types
// =====================================================

/**
 * Result from LLM parsing user input into a reminder
 */
export interface ParsedReminder {
  reminderText: string;         // Cleaned up reminder description
  remindAt: string;             // ISO 8601 timestamp
  confidence: number;           // Confidence score 0-1 (for future use)
  detectedTime?: string;        // Human-readable time detected (e.g., "in 30 minutes")
}

/**
 * Input to LLM parser
 */
export interface ParseReminderInput {
  content: string;              // User's raw input
  defaultOffsetMinutes: number; // Fallback if no time specified
  currentTime?: string;         // Current time for relative parsing (ISO 8601)
  timezone?: string;            // User's timezone (IANA format)
}

// =====================================================
// User Settings Types
// =====================================================

/**
 * User settings for string-tie reminders
 */
export interface UserSettings {
  id: string;
  user_id: string;
  string_tie_default_offset_minutes: number;
  created_at: string;
  updated_at: string;
}

/**
 * Input for updating user settings
 */
export interface UpdateUserSettingsInput {
  string_tie_default_offset_minutes?: number;
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request body for POST /api/string-ties
 */
export interface CreateStringTieRequest {
  content: string;              // User's original input
  source: StringTieSource;
  // Optional: if client wants to parse locally
  reminderText?: string;
  remindAt?: string;
}

/**
 * Response from POST /api/string-ties
 */
export interface CreateStringTieResponse {
  success: boolean;
  message: string;
  stringTie: StringTie;
  parsedReminder: ParsedReminder;
}

/**
 * Request body for PATCH /api/string-ties/:id
 */
export interface UpdateStringTieRequest {
  reminded?: boolean;
  dismissed?: boolean;
  reminderText?: string;
  remindAt?: string;
}

/**
 * Response from PATCH /api/string-ties/:id
 */
export interface UpdateStringTieResponse {
  success: boolean;
  message: string;
  stringTie: StringTie;
}

/**
 * Response from GET /api/string-ties
 */
export interface GetStringTiesResponse {
  stringTies: StringTie[];
  count: number;
  activeCount: number;        // Count of active (not reminded/dismissed) reminders
}

/**
 * Response from DELETE /api/string-ties/:id
 */
export interface DeleteStringTieResponse {
  success: boolean;
  message: string;
}

/**
 * Request body for POST /api/string-ties/parse
 */
export interface ParseStringTieRequest {
  content: string;
  defaultOffsetMinutes?: number;
  timezone?: string;
}

/**
 * Response from POST /api/string-ties/parse
 */
export interface ParseStringTieResponse {
  success: boolean;
  parsedReminder: ParsedReminder;
}

// =====================================================
// Query Filter Types
// =====================================================

/**
 * Filters for querying string-tie reminders
 */
export interface StringTieFilters {
  reminded?: boolean;
  dismissed?: boolean;
  source?: StringTieSource;
  remindAfter?: string;         // ISO 8601 timestamp
  remindBefore?: string;        // ISO 8601 timestamp
  limit?: number;
  offset?: number;
}

// =====================================================
// Helper Type Guards
// =====================================================

/**
 * Type guard to check if source is valid
 */
export function isValidStringTieSource(source: unknown): source is StringTieSource {
  return (
    typeof source === 'string' &&
    ['manual', 'chat_magic_snippet', 'voice'].includes(source)
  );
}

/**
 * Type guard to check if string tie is active (not reminded or dismissed)
 */
export function isActiveStringTie(stringTie: StringTie): boolean {
  return !stringTie.reminded && stringTie.dismissed_at === null;
}

/**
 * Type guard to check if string tie is due (remind_at has passed)
 */
export function isStringTieDue(stringTie: StringTie): boolean {
  return new Date(stringTie.remind_at) <= new Date();
}

/**
 * Type guard to check if string tie should be surfaced
 * (active, due, and not dismissed)
 */
export function shouldSurfaceStringTie(stringTie: StringTie): boolean {
  return (
    isActiveStringTie(stringTie) &&
    isStringTieDue(stringTie)
  );
}

// =====================================================
// Human-OS Enrichment Types (0.2.0)
// =====================================================

/**
 * Contact enrichment data from Human-OS
 */
export interface ContactEnrichment {
  name: string;
  headline?: string;
  linkedinUrl?: string;
  recentPosts?: Array<{
    content: string;
    date: string;
  }>;
  lastEnrichedAt: string;
}

/**
 * String-tie with Human-OS enrichment data
 * Used when surfacing reminders to provide context
 */
export interface EnrichedStringTie extends StringTie {
  enrichment?: {
    contacts: ContactEnrichment[];
    customerInsights?: string[];
    suggestedApproach?: string;
    enrichedAt: string;
    humanOSAvailable: boolean;
  };
}

/**
 * Result from enriching a reminder
 */
export interface EnrichReminderResult {
  stringTie: StringTie;
  enrichment: EnrichedStringTie['enrichment'];
  success: boolean;
  error?: string;
}
