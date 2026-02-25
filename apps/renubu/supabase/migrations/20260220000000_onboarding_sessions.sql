-- Onboarding sessions table for First Contact onboarding conversation
-- Stores conversation state + raw transcript. Private to the individual user.

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  opener_used TEXT,
  opener_depth INTEGER DEFAULT 0,
  transition_trigger TEXT,
  option_selected TEXT CHECK (option_selected IN ('A', 'B', 'C', 'D')),
  conversation_log JSONB DEFAULT '[]'::jsonb,
  skip_requested BOOLEAN DEFAULT FALSE,
  current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one in-progress session per user at a time
CREATE UNIQUE INDEX idx_onboarding_one_active_per_user
  ON onboarding_sessions(user_id) WHERE status = 'in_progress';

-- Lookup by user
CREATE INDEX idx_onboarding_sessions_user_id
  ON onboarding_sessions(user_id);

-- RLS: strictly user-only. No admin/manager policies.
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding sessions"
  ON onboarding_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding sessions"
  ON onboarding_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding sessions"
  ON onboarding_sessions FOR UPDATE
  USING (auth.uid() = user_id);
