-- ============================================================================
-- String-Tie Standalone Reminder System - Phase 1.4
-- Foundation: Voice-First Lightweight Reminder System
-- ============================================================================
--
-- This migration creates the String-Tie reminder system - a voice-first,
-- lightweight reminder system completely separate from workflows.
-- "Tie a string around your finger" for quick personal reminders.
--
-- Key Features:
-- - Voice-first capture with LLM parsing
-- - Simple time-offset based reminders
-- - Personal reminders (not workflow-related)
-- - Minimal cognitive overhead
--
-- Deliverables:
-- 1. Create string_ties table for storing reminders
-- 2. Create user_settings table for user preferences
-- 3. Add indexes for efficient reminder evaluation
-- 4. Add RLS policies for user data isolation
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE user_settings TABLE
-- ============================================================================

-- Create user_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- String-Tie settings
  string_tie_default_offset_minutes INTEGER DEFAULT 60,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.user_settings IS
'User preferences and settings. Currently contains String-Tie reminder defaults.';

COMMENT ON COLUMN public.user_settings.string_tie_default_offset_minutes IS
'Default time offset in minutes for String-Tie reminders when no specific time is provided. Default: 60 minutes (1 hour).';

-- ============================================================================
-- SECTION 2: CREATE string_ties TABLE
-- ============================================================================

-- Create string_ties table for storing lightweight reminders
CREATE TABLE IF NOT EXISTS public.string_ties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  reminder_text TEXT NOT NULL,

  -- Timing
  remind_at TIMESTAMPTZ NOT NULL,
  reminded BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,

  -- Metadata
  source TEXT CHECK (source IN ('manual', 'chat_magic_snippet', 'voice')),
  default_offset_minutes INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.string_ties IS
'String-Tie standalone reminder system. Voice-first lightweight reminders completely separate from workflows.';

COMMENT ON COLUMN public.string_ties.content IS
'Original user input (voice transcript, chat message, or manual text)';

COMMENT ON COLUMN public.string_ties.reminder_text IS
'LLM-parsed reminder description (cleaned up and formatted for display)';

COMMENT ON COLUMN public.string_ties.remind_at IS
'When to surface this reminder to the user';

COMMENT ON COLUMN public.string_ties.reminded IS
'Whether this reminder has been shown to the user';

COMMENT ON COLUMN public.string_ties.dismissed_at IS
'When the user dismissed this reminder (null if not dismissed)';

COMMENT ON COLUMN public.string_ties.source IS
'How this reminder was created: manual (UI), chat_magic_snippet (chat detection), or voice (voice capture)';

COMMENT ON COLUMN public.string_ties.default_offset_minutes IS
'Snapshot of user default offset at creation time (for debugging/audit trail)';

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- Index for finding user's reminders efficiently
CREATE INDEX IF NOT EXISTS idx_string_ties_user_id
  ON public.string_ties(user_id);

-- Index for cron job to find reminders that need to be surfaced
-- Only index active (not yet reminded) reminders
CREATE INDEX IF NOT EXISTS idx_string_ties_remind_at
  ON public.string_ties(remind_at)
  WHERE NOT reminded;

-- Composite index for finding user's active reminders
CREATE INDEX IF NOT EXISTS idx_string_ties_user_active
  ON public.string_ties(user_id, reminded)
  WHERE NOT reminded;

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.string_ties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES
-- ============================================================================

-- User Settings Policies
-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own settings
CREATE POLICY "Users can create their own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (user_id = auth.uid());

-- String-Ties Policies
-- Users can view their own string ties
CREATE POLICY "Users can view their own string ties"
  ON public.string_ties
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own string ties
CREATE POLICY "Users can create their own string ties"
  ON public.string_ties
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own string ties
CREATE POLICY "Users can update their own string ties"
  ON public.string_ties
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own string ties
CREATE POLICY "Users can delete their own string ties"
  ON public.string_ties
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp for user_settings
CREATE OR REPLACE FUNCTION public.update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_settings_timestamp();

-- ============================================================================
-- SECTION 7: CREATE HELPER FUNCTIONS FOR REMINDER EVALUATION
-- ============================================================================

-- Function to get all string ties that need to be surfaced
-- This is called by the reminder evaluation cron job
CREATE OR REPLACE FUNCTION public.get_string_ties_for_reminder(
  p_evaluation_interval_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  string_tie_id UUID,
  user_id UUID,
  reminder_text TEXT,
  remind_at TIMESTAMPTZ,
  content TEXT,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.user_id,
    st.reminder_text,
    st.remind_at,
    st.content,
    st.source
  FROM public.string_ties st
  WHERE st.reminded = false
    AND st.dismissed_at IS NULL
    AND st.remind_at <= NOW()
  ORDER BY st.remind_at ASC
  LIMIT 100; -- Process 100 reminders per cron run
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_string_ties_for_reminder IS
'Returns string-tie reminders that are ready to be surfaced to users. Called by reminder evaluation cron job.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
